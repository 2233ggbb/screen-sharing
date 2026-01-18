import { RTC_CONFIG } from '../../utils/constants';
import { logger } from '../../utils/logger';

export type PeerConnectionEventHandler = {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  /** ICE 重启时的回调，需要将新的 Offer 发送给对方 */
  onIceRestart?: (offer: RTCSessionDescriptionInit) => void;
};

/**
 * 连接状态信息
 */
interface ConnectionState {
  hasRemoteDescription: boolean;
  pendingCandidates: RTCIceCandidateInit[];
  retryCount: number;
  handlers: PeerConnectionEventHandler;
  iceRestartTimer: NodeJS.Timeout | null;
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

  constructor(config: RTCConfiguration = RTC_CONFIG) {
    this.config = config;
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
    });

    // ICE候选事件 - Trickle ICE：边收集边发送
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateType = event.candidate.type;
        
        // 根据候选类型使用不同颜色
        let color = 'color: green; font-weight: bold;';
        let label = '本地';
        if (candidateType === 'relay') {
          color = 'color: red; font-weight: bold; font-size: 14px;';
          label = 'TURN中继';
        } else if (candidateType === 'srflx') {
          color = 'color: orange; font-weight: bold;';
          label = 'STUN反射';
        }
        
        console.log(`%c[ICE] ★★★ ${label}候选生成 ★★★`, color, {
          remoteUserId,
          type: candidateType,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port,
          relatedAddress: event.candidate.relatedAddress,
          relatedPort: event.candidate.relatedPort,
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
        console.log('%c[ICE] ★★★ ICE候选收集完成 ★★★', 'color: blue; font-weight: bold;', remoteUserId);
        logger.info('ICE候选收集完成:', remoteUserId);
      }
    };

    // ICE 收集状态变化
    pc.onicegatheringstatechange = () => {
      logger.info(`ICE收集状态 [${remoteUserId}]:`, pc.iceGatheringState);
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
        // 连接成功，重置重试计数
        const connState = this.connectionStates.get(remoteUserId);
        if (connState) {
          connState.retryCount = 0;
          if (connState.iceRestartTimer) {
            clearTimeout(connState.iceRestartTimer);
            connState.iceRestartTimer = null;
          }
        }
        logger.info(`P2P连接成功 [${remoteUserId}]`);
        console.log(`[ICE] ✓ P2P直连成功！ [${remoteUserId}]`);
      }
    };

    // 接收远程流
    pc.ontrack = (event) => {
      logger.info('接收到远程流:', remoteUserId);
      if (handlers.onTrack && event.streams[0]) {
        handlers.onTrack(event.streams[0]);
      }
    };

    // 连接状态变化
    pc.onconnectionstatechange = () => {
      logger.info(`连接状态变化 [${remoteUserId}]:`, pc.connectionState);
      if (handlers.onConnectionStateChange) {
        handlers.onConnectionStateChange(pc.connectionState);
      }

      // 只在连接关闭时清理，失败时让 ICE 重启机制处理
      if (pc.connectionState === 'closed') {
        this.closeConnection(remoteUserId);
      }
      // 注意：不再在 failed 时立即关闭，让 handleIceFailure 有机会尝试 ICE 重启
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
}
