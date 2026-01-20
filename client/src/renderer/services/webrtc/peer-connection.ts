import { RTC_CONFIG } from '../../utils/constants';
import { logger } from '../../utils/logger';

export type PeerConnectionEventHandler = {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  /** ICE 重启时的回调，需要将新的 Offer 发送给对方 */
  onIceRestart?: (offer: RTCSessionDescriptionInit) => void;
  /** 连接类型变化回调（用于显示是直连还是中继） */
  onConnectionTypeChange?: (type: 'direct' | 'relay' | 'unknown') => void;
  /** ICE 收集完成回调（用于通知服务器协调） */
  onIceGatheringComplete?: (targetUserId: string, connectionId: string) => void;
};

/**
 * ICE 候选信息类型（用于连接类型检测）
 */
interface CandidateInfo {
  candidateType?: string;
  address?: string;
  protocol?: string;
}

/**
 * 连接状态信息
 */
interface ConnectionState {
  hasRemoteDescription: boolean;
  pendingCandidates: RTCIceCandidateInit[];
  retryCount: number;
  handlers: PeerConnectionEventHandler;
  iceRestartTimer: NodeJS.Timeout | null;
  /** 连接类型：direct(P2P直连) / relay(TURN中继) / unknown */
  connectionType: 'direct' | 'relay' | 'unknown';
  /** 收集到的本地候选数量（用于诊断） */
  localCandidateCount: number;
  /** 收集到的远程候选数量（用于诊断） */
  remoteCandidateCount: number;
}

/**
 * WebRTC P2P连接管理器（针对端口限制型 NAT 优化版）
 * 
 * 优化策略：
 * 1. Trickle ICE - 边收集边发送，不等待完成
 * 2. ICE 候选缓存 - 在 remote description 设置前收到的候选会被缓存
 * 3. ICE 重启 - 连接失败时自动重试
 * 4. 更激进的超时和重试策略
 */
export class PeerConnectionManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private connectionStates: Map<string, ConnectionState> = new Map();
  private config: RTCConfiguration;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly ICE_RESTART_DELAY = 2000; // 2秒后重试
  private localUserId: string = ''; // 本地用户 ID

  constructor(config: RTCConfiguration = RTC_CONFIG) {
    this.config = config;
    // 从本地存储获取用户 ID
    this.localUserId = localStorage.getItem('user_id') || '';
  }

  /**
   * 设置本地用户 ID
   */
  setLocalUserId(userId: string): void {
    this.localUserId = userId;
  }

  /**
   * 生成连接 ID（双方用户 ID 排序后拼接）
   */
  private getConnectionId(userA: string, userB: string): string {
    return [userA, userB].sort().join('-');
  }

  /**
   * 创建P2P连接
   */
  createConnection(
    remoteUserId: string,
    handlers: PeerConnectionEventHandler = {}
  ): RTCPeerConnection {
    // 如果已存在连接，先关闭
    if (this.peerConnections.has(remoteUserId)) {
      this.closeConnection(remoteUserId);
    }

    const pc = new RTCPeerConnection(this.config);

    // 初始化连接状态
    this.connectionStates.set(remoteUserId, {
      hasRemoteDescription: false,
      pendingCandidates: [],
      retryCount: 0,
      handlers,
      iceRestartTimer: null,
      connectionType: 'unknown',
      localCandidateCount: 0,
      remoteCandidateCount: 0,
    });

    // ICE候选事件 - Trickle ICE：边收集边发送
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateType = event.candidate.type;
        const connState = this.connectionStates.get(remoteUserId);
        if (connState) {
          connState.localCandidateCount++;
        }
        
        // 根据候选类型使用不同颜色和标签
        let color = 'color: green; font-weight: bold;';
        let label = '本地(host)';
        if (candidateType === 'relay') {
          color = 'color: red; font-weight: bold; font-size: 14px;';
          label = 'TURN中继(relay)';
        } else if (candidateType === 'srflx') {
          color = 'color: orange; font-weight: bold;';
          label = 'STUN反射(srflx)';
        } else if (candidateType === 'prflx') {
          color = 'color: cyan; font-weight: bold;';
          label = '对等反射(prflx)';
        }

        // 检测是否为 IPv6 候选
        const isIPv6 = event.candidate.address?.includes(':');
        if (isIPv6) {
          console.log(`%c[ICE] ★ IPv6 候选 ★ ${label}`, 'color: purple; font-weight: bold;', {
            remoteUserId,
            address: event.candidate.address,
          });
        }
        
        console.log(`%c[ICE] ★★★ ${label}候选生成 ★★★`, color, {
          remoteUserId,
          type: candidateType,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port,
          relatedAddress: event.candidate.relatedAddress,
          relatedPort: event.candidate.relatedPort,
          isIPv6,
        });
        console.log('[ICE] 候选字符串:', event.candidate.candidate);
        
        logger.info('本地ICE候选:', {
          remoteUserId,
          type: candidateType,
          address: event.candidate.address,
        });
        
        if (handlers.onIceCandidate) {
          console.log('[ICE] 调用 onIceCandidate 回调发送候选...');
          handlers.onIceCandidate(event.candidate);
        } else {
          console.error('[ICE] ✗ onIceCandidate 回调未设置！');
        }
      } else {
        const connState = this.connectionStates.get(remoteUserId);
        console.log('%c[ICE] ★★★ ICE候选收集完成 ★★★', 'color: blue; font-weight: bold;', {
          remoteUserId,
          localCandidateCount: connState?.localCandidateCount ?? 0,
          remoteCandidateCount: connState?.remoteCandidateCount ?? 0,
        });
        logger.info('ICE候选收集完成:', remoteUserId);
      }
    };

    // ICE 收集状态变化
    pc.onicegatheringstatechange = () => {
      const state = pc.iceGatheringState;
      logger.info(`ICE收集状态 [${remoteUserId}]:`, state);

      // ICE 收集完成时通知服务器
      if (state === 'complete') {
        console.log(`%c[ICE] ✅ ICE 收集完成 [${remoteUserId}]`, 'color: blue; font-weight: bold;');

        // 如果设置了回调，通知服务器
        if (handlers.onIceGatheringComplete && this.localUserId) {
          const connectionId = this.getConnectionId(this.localUserId, remoteUserId);
          console.log('[ICE] 通知服务器 ICE 收集完成', {
            localUserId: this.localUserId,
            remoteUserId,
            connectionId,
          });

          handlers.onIceGatheringComplete(remoteUserId, connectionId);
        } else {
          console.warn('[ICE] 未设置 onIceGatheringComplete 回调或 localUserId 未设置');
        }
      }
    };

    // ICE 连接状态变化 - 关键：用于触发 ICE 重启
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      logger.info(`ICE连接状态 [${remoteUserId}]:`, state);
      
      // 打印更详细的连接信息
      console.log(`[ICE] 连接状态变化 [${remoteUserId}]:`, {
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState,
        connectionState: pc.connectionState,
        signalingState: pc.signalingState,
      });
      
      if (handlers.onIceConnectionStateChange) {
        handlers.onIceConnectionStateChange(state);
      }

      // ICE 连接失败时尝试重启
      if (state === 'failed') {
        console.error(`[ICE] 连接失败 [${remoteUserId}]，可能原因：`);
        console.error('1. 双方都是对称型/端口限制型 NAT，无法直接打洞');
        console.error('2. 防火墙阻止了 UDP 流量');
        console.error('3. ICE 候选没有正确交换');
        this.handleIceFailure(remoteUserId, pc);
      } else if (state === 'disconnected') {
        // disconnected 状态可能是临时的，等待一段时间看是否恢复
        console.warn(`[ICE] 连接断开 [${remoteUserId}]，等待恢复...`);
      } else if (state === 'connected' || state === 'completed') {
        // 连接成功，重置重试计数并检测连接类型
        const connState = this.connectionStates.get(remoteUserId);
        if (connState) {
          connState.retryCount = 0;
          if (connState.iceRestartTimer) {
            clearTimeout(connState.iceRestartTimer);
            connState.iceRestartTimer = null;
          }
        }
        logger.info(`P2P连接成功 [${remoteUserId}]`);
        console.log(`%c[ICE] ✓ 连接成功！ [${remoteUserId}]`, 'color: green; font-weight: bold; font-size: 16px;');
        
        // 异步检测连接类型（直连 vs 中继）
        this.detectConnectionType(remoteUserId);
      }
    };

    // 接收远程流
    pc.ontrack = (event) => {
      logger.info('接收到远程流:', remoteUserId);
      if (handlers.onTrack && event.streams[0]) {
        handlers.onTrack(event.streams[0]);
      }
    };

    // 连接状态变化 - 同时监听 connectionState（某些浏览器只触发这个）
    pc.onconnectionstatechange = () => {
      const connState = pc.connectionState;
      logger.info(`连接状态变化 [${remoteUserId}]:`, connState);
      
      console.log(`[P2P] 连接状态变化 [${remoteUserId}]:`, {
        connectionState: connState,
        iceConnectionState: pc.iceConnectionState,
      });
      
      if (handlers.onConnectionStateChange) {
        handlers.onConnectionStateChange(connState);
      }

      // 连接失败时触发 ICE 重启（某些浏览器 iceConnectionState 不会变成 failed）
      if (connState === 'failed') {
        console.error(`[P2P] connectionState 变为 failed [${remoteUserId}]`);
        // 如果 iceConnectionState 没有触发 handleIceFailure，这里触发
        if (pc.iceConnectionState !== 'failed') {
          console.log('[P2P] iceConnectionState 未 failed，在此触发 ICE 重启');
          this.handleIceFailure(remoteUserId, pc);
        }
      } else if (connState === 'closed') {
        this.closeConnection(remoteUserId);
      }
    };

    this.peerConnections.set(remoteUserId, pc);
    logger.info('创建P2P连接:', remoteUserId);
    return pc;
  }

  /**
   * 处理 ICE 连接失败 - 尝试 ICE 重启
   */
  private handleIceFailure(remoteUserId: string, pc: RTCPeerConnection): void {
    const connState = this.connectionStates.get(remoteUserId);
    if (!connState) return;

    if (connState.retryCount >= this.MAX_RETRY_COUNT) {
      console.error(`[ICE] ✗ 重试次数已达上限 [${remoteUserId}]，放弃连接`);
      logger.error(`ICE重试次数已达上限 [${remoteUserId}]，放弃重试`);
      // 最终放弃时才关闭连接
      this.closeConnection(remoteUserId);
      return;
    }

    connState.retryCount++;
    console.log(`%c[ICE] 🔄 ICE重启 第${connState.retryCount}/${this.MAX_RETRY_COUNT}次 [${remoteUserId}]`,
      'color: purple; font-weight: bold;');
    logger.warn(`ICE连接失败 [${remoteUserId}]，准备第 ${connState.retryCount} 次重试...`);

    // 延迟后执行 ICE 重启
    connState.iceRestartTimer = setTimeout(async () => {
      try {
        // ICE 重启：创建新的 offer 并设置 iceRestart: true
        console.log(`[ICE] 创建 ICE 重启 Offer...`);
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        
        console.log(`[ICE] ICE 重启 Offer 已创建，发送给对方...`);
        logger.info(`ICE重启已发起 [${remoteUserId}]`);
        
        // 通过 onIceRestart 回调发送新的 offer 给对方
        if (connState.handlers.onIceRestart) {
          connState.handlers.onIceRestart(offer);
        } else {
          console.warn('[ICE] onIceRestart 回调未设置，无法发送重启 Offer');
        }
      } catch (error) {
        console.error(`[ICE] ICE重启失败:`, error);
        logger.error(`ICE重启失败 [${remoteUserId}]:`, error);
      }
    }, this.ICE_RESTART_DELAY);
  }

  /**
   * 添加本地流到连接
   */
  addStream(remoteUserId: string, stream: MediaStream): void {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      logger.error('连接不存在:', remoteUserId);
      return;
    }

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
      logger.debug('添加track到连接:', { remoteUserId, trackKind: track.kind });
    });
  }

  /**
   * 创建Offer
   */
  async createOffer(remoteUserId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      throw new Error(`连接不存在: ${remoteUserId}`);
    }

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);
    logger.info('创建Offer:', remoteUserId);
    return offer;
  }

  /**
   * 创建Answer
   */
  async createAnswer(remoteUserId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      throw new Error(`连接不存在: ${remoteUserId}`);
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    logger.info('创建Answer:', remoteUserId);
    return answer;
  }

  /**
   * 设置远程描述
   * 设置后会自动处理之前缓存的 ICE 候选
   */
  async setRemoteDescription(
    remoteUserId: string,
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      throw new Error(`连接不存在: ${remoteUserId}`);
    }

    await pc.setRemoteDescription(description);
    logger.info('设置远程描述:', { remoteUserId, type: description.type });

    // 标记已设置远程描述
    const connState = this.connectionStates.get(remoteUserId);
    if (connState) {
      connState.hasRemoteDescription = true;

      // 处理之前缓存的 ICE 候选
      if (connState.pendingCandidates.length > 0) {
        logger.info(`处理缓存的 ${connState.pendingCandidates.length} 个ICE候选:`, remoteUserId);
        for (const candidate of connState.pendingCandidates) {
          try {
            await pc.addIceCandidate(candidate);
          } catch (error) {
            logger.error('添加缓存ICE候选失败:', error);
          }
        }
        connState.pendingCandidates = [];
      }
    }
  }

  /**
   * 添加ICE候选
   * 如果远程描述还未设置，会先缓存候选
   */
  async addIceCandidate(
    remoteUserId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      logger.warn('连接不存在，忽略ICE候选:', remoteUserId);
      return;
    }

    const connState = this.connectionStates.get(remoteUserId);

    // 如果远程描述还未设置，缓存候选
    if (!connState?.hasRemoteDescription) {
      logger.info('远程描述未设置，缓存ICE候选:', remoteUserId);
      if (connState) {
        connState.pendingCandidates.push(candidate);
      }
      return;
    }

    // 直接添加候选
    try {
      await pc.addIceCandidate(candidate);
      // 统计远程候选数量
      if (connState) {
        connState.remoteCandidateCount++;
      }
      // 解析候选类型用于日志
      const candidateStr = candidate.candidate || '';
      const candidateType = candidateStr.includes('typ relay') ? 'relay' :
                           candidateStr.includes('typ srflx') ? 'srflx' :
                           candidateStr.includes('typ prflx') ? 'prflx' : 'host';
      console.log(`[ICE] 添加远程候选成功 [${remoteUserId}]:`, {
        type: candidateType,
        count: connState?.remoteCandidateCount ?? 0,
      });
      logger.debug('添加ICE候选成功:', remoteUserId);
    } catch (error) {
      logger.error('添加ICE候选失败:', error);
    }
  }

  /**
   * 获取连接
   */
  getConnection(remoteUserId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(remoteUserId);
  }

  /**
   * 关闭指定连接
   */
  closeConnection(remoteUserId: string): void {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
      logger.info('关闭P2P连接:', remoteUserId);
    }

    // 清理连接状态
    const connState = this.connectionStates.get(remoteUserId);
    if (connState) {
      if (connState.iceRestartTimer) {
        clearTimeout(connState.iceRestartTimer);
      }
      this.connectionStates.delete(remoteUserId);
    }
  }

  /**
   * 关闭所有连接
   */
  closeAllConnections(): void {
    this.peerConnections.forEach((pc, userId) => {
      pc.close();
      logger.info('关闭P2P连接:', userId);
    });
    this.peerConnections.clear();

    // 清理所有连接状态
    this.connectionStates.forEach((state) => {
      if (state.iceRestartTimer) {
        clearTimeout(state.iceRestartTimer);
      }
    });
    this.connectionStates.clear();
  }

  /**
   * 销毁管理器，清理所有资源
   */
  destroy(): void {
    this.closeAllConnections();
    logger.info('PeerConnectionManager 已销毁');
  }

  /**
   * 检测连接类型（直连 vs TURN中继）
   * 通过分析 ICE candidate pair 统计信息来判断
   */
  private async detectConnectionType(remoteUserId: string): Promise<void> {
    const pc = this.peerConnections.get(remoteUserId);
    const connState = this.connectionStates.get(remoteUserId);
    if (!pc || !connState) return;

    try {
      const stats = await pc.getStats();
      let connectionType: 'direct' | 'relay' | 'unknown' = 'unknown';
      
      // 使用对象包装以避免 TypeScript 闭包类型问题
      const candidateIds: { local: string | null; remote: string | null } = {
        local: null,
        remote: null,
      };
      const candidateInfos: { local: CandidateInfo | null; remote: CandidateInfo | null } = {
        local: null,
        remote: null,
      };

      // 第一轮：找到选中的候选对
      stats.forEach((report) => {
        if (report.type === 'candidate-pair') {
          const pair = report as RTCIceCandidatePairStats;
          if (pair.state === 'succeeded' && pair.nominated) {
            candidateIds.local = pair.localCandidateId;
            candidateIds.remote = pair.remoteCandidateId;
          }
        }
      });

      // 第二轮：获取候选详情
      if (candidateIds.local || candidateIds.remote) {
        stats.forEach((report) => {
          // 使用 Record 类型来访问候选属性，因为 TypeScript 定义不完整
          const reportAny = report as Record<string, unknown>;
          
          if (report.type === 'local-candidate' && report.id === candidateIds.local) {
            candidateInfos.local = {
              candidateType: reportAny.candidateType as string | undefined,
              address: reportAny.address as string | undefined,
              protocol: reportAny.protocol as string | undefined,
            };
          }
          if (report.type === 'remote-candidate' && report.id === candidateIds.remote) {
            candidateInfos.remote = {
              candidateType: reportAny.candidateType as string | undefined,
              address: reportAny.address as string | undefined,
              protocol: reportAny.protocol as string | undefined,
            };
          }
        });
      }

      // 根据候选类型判断连接类型
      if (candidateInfos.local?.candidateType) {
        if (candidateInfos.local.candidateType === 'relay') {
          connectionType = 'relay';
        } else {
          connectionType = 'direct';
        }
      }

      // 更新连接状态
      connState.connectionType = connectionType;

      // 打印连接详情
      const typeLabel = connectionType === 'relay' ? '🔀 TURN中继' :
                       connectionType === 'direct' ? '🎯 P2P直连' : '❓ 未知';
      const typeColor = connectionType === 'relay' ? 'color: orange; font-weight: bold;' :
                       connectionType === 'direct' ? 'color: green; font-weight: bold;' : 'color: gray;';
      
      console.log(`%c[ICE] 连接类型: ${typeLabel} [${remoteUserId}]`, typeColor);
      if (candidateInfos.local && candidateInfos.remote) {
        console.log('[ICE] 连接详情:', {
          localType: candidateInfos.local.candidateType,
          localAddress: candidateInfos.local.address,
          localProtocol: candidateInfos.local.protocol,
          remoteType: candidateInfos.remote.candidateType,
          remoteAddress: candidateInfos.remote.address,
          remoteProtocol: candidateInfos.remote.protocol,
        });
      }

      // 触发回调
      if (connState.handlers.onConnectionTypeChange) {
        connState.handlers.onConnectionTypeChange(connectionType);
      }

      logger.info(`连接类型检测完成 [${remoteUserId}]:`, connectionType);
    } catch (error) {
      logger.error('检测连接类型失败:', error);
    }
  }

  /**
   * 获取连接统计信息
   */
  async getStats(remoteUserId: string): Promise<RTCStatsReport | null> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      return null;
    }
    return await pc.getStats();
  }

  /**
   * 获取连接类型
   */
  getConnectionType(remoteUserId: string): 'direct' | 'relay' | 'unknown' {
    const connState = this.connectionStates.get(remoteUserId);
    return connState?.connectionType ?? 'unknown';
  }

  /**
   * 获取连接诊断信息
   */
  getConnectionDiagnostics(remoteUserId: string): {
    connectionType: 'direct' | 'relay' | 'unknown';
    localCandidateCount: number;
    remoteCandidateCount: number;
    retryCount: number;
  } | null {
    const connState = this.connectionStates.get(remoteUserId);
    if (!connState) return null;
    
    return {
      connectionType: connState.connectionType,
      localCandidateCount: connState.localCandidateCount,
      remoteCandidateCount: connState.remoteCandidateCount,
      retryCount: connState.retryCount,
    };
  }

  /**
   * 手动触发 ICE 重启
   */
  async restartIce(remoteUserId: string): Promise<RTCSessionDescriptionInit | null> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      logger.error('连接不存在，无法重启ICE:', remoteUserId);
      return null;
    }

    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      logger.info('手动ICE重启成功:', remoteUserId);
      return offer;
    } catch (error) {
      logger.error('手动ICE重启失败:', error);
      return null;
    }
  }

  /**
   * 打印所有连接的诊断信息（用于调试）
   */
  printDiagnostics(): void {
    console.log('%c[WebRTC] ===== 连接诊断信息 =====', 'color: blue; font-weight: bold; font-size: 14px;');
    
    this.peerConnections.forEach((pc, remoteUserId) => {
      const connState = this.connectionStates.get(remoteUserId);
      const diagnostics = this.getConnectionDiagnostics(remoteUserId);
      
      console.log(`[WebRTC] 连接 [${remoteUserId}]:`, {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState,
        signalingState: pc.signalingState,
        ...diagnostics,
      });
    });
    
    console.log('%c[WebRTC] ===== 诊断结束 =====', 'color: blue; font-weight: bold;');
  }
}
