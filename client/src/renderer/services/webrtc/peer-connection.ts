import { RTC_CONFIG, STORAGE_KEYS } from '../../utils/constants';
import { logger } from '../../utils/logger';

export type WebRTCConnectionStage =
  | 'createOffer'
  | 'createAnswer'
  | 'setLocalDescription'
  | 'setRemoteDescription'
  | 'addIceCandidate'
  | 'iceConnection'
  | 'connection'
  | 'iceRestart'
  | 'unknown';

export interface WebRTCConnectionError {
  remoteUserId: string;
  stage: WebRTCConnectionStage;
  /** 面向用户/诊断的错误信息（尽量可读、可检索） */
  message: string;
  name?: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export type PeerConnectionEventHandler = {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  /** 连接失败/异常的详细原因（用于 UI 提示与诊断） */
  onConnectionError?: (error: WebRTCConnectionError) => void;
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

  /** 最近一次上报给 UI 的错误（用于避免刷屏） */
  lastError: WebRTCConnectionError | null;
  lastErrorReportedAt: number;

  /** Perfect Negotiation: 本端是否正在创建 Offer（用于处理 glare） */
  makingOffer: boolean;
  /** Perfect Negotiation: 本端是否在 glare 时忽略对端 Offer（impolite 端） */
  ignoreOffer: boolean;
  /** Perfect Negotiation: 本端在 glare 时是否允许回滚并接受对端 Offer（polite 端） */
  isPolite: boolean;

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
  // 激进重试策略：增加重试次数，缩短间隔，模拟"狂发包"模式
  private readonly MAX_RETRY_COUNT = 10;
  private readonly ICE_RESTART_DELAY = 1000; // 1秒后重试
  private localUserId: string = ''; // 本地用户 ID
  private enableIPv6: boolean = true;

  constructor(config: RTCConfiguration = RTC_CONFIG) {
    this.config = config;
    // 从本地存储获取用户 ID
    this.localUserId = localStorage.getItem(STORAGE_KEYS.USER_ID) || '';
    // 获取 IPv6 配置
    this.enableIPv6 = localStorage.getItem(STORAGE_KEYS.ENABLE_IPV6) !== 'false';
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
   * Perfect Negotiation: 计算本端在该连接中的 polite/impolite 角色（双方必须一致）
   *
   * 规则：对同一对 userId，字典序更小的一方为 polite。
   * 这样可在 glare（双方同时发 offer）时，保证只有一方回滚并接受对端 offer。
   */
  private isPolitePeer(remoteUserId: string): boolean {
    if (!this.localUserId) {
      // localUserId 未初始化时，Perfect Negotiation 的一致性无法保证（极端时序下可能双方都 polite）
      logger.warn('localUserId 未初始化，Perfect Negotiation 可能失效', { remoteUserId });
      return true;
    }
    return this.localUserId.localeCompare(remoteUserId) < 0;
  }

  private reportConnectionError(
    remoteUserId: string,
    stage: WebRTCConnectionStage,
    error: unknown,
    details: Record<string, unknown> = {}
  ): void {
    const connState = this.connectionStates.get(remoteUserId);
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : undefined;
    const timestamp = Date.now();

    const payload: WebRTCConnectionError = {
      remoteUserId,
      stage,
      message,
      name,
      details,
      timestamp,
    };

    if (connState) {
      // 防止刷屏：同 stage 2s 内只上报一次
      if (
        connState.lastError &&
        connState.lastError.stage === stage &&
        timestamp - connState.lastErrorReportedAt < 2000
      ) {
        return;
      }
      connState.lastError = payload;
      connState.lastErrorReportedAt = timestamp;
    }

    logger.error('WebRTC连接失败诊断', payload);
    connState?.handlers.onConnectionError?.(payload);
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

      lastError: null,
      lastErrorReportedAt: 0,

      // Perfect Negotiation
      makingOffer: false,
      ignoreOffer: false,
      isPolite: this.isPolitePeer(remoteUserId),

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
        // 说明：不同浏览器/环境下 address 可能为空；这里使用更稳健的判定（包含 ::1 / IPv4-mapped IPv6）
        const candidateAddress = event.candidate.address ?? '';
        const isIPv6 = Boolean(candidateAddress) && candidateAddress.includes(':');
        
        // IPv6 过滤逻辑
        if (isIPv6 && !this.enableIPv6) {
          console.warn('[ICE] 🚫 IPv6 已禁用：丢弃 IPv6 候选', candidateAddress);
          return;
        }

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

        // 调试开关：模拟非局域网环境时可禁用 host 候选（避免误操作，使用开关而非注释代码）
        const disableHostCandidates =
          (typeof process !== 'undefined' &&
            typeof process.env !== 'undefined' &&
            process.env.DEBUG_DISABLE_HOST_CANDIDATES === 'true') ||
          localStorage.getItem('debug_disable_host_candidates') === 'true';

        if (disableHostCandidates && candidateType === 'host') {
          console.warn('[ICE] 🚫 调试模式：丢弃 host 候选', event.candidate.address);
          return;
        }

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
        this.reportConnectionError(remoteUserId, 'iceConnection', new Error('ICE connection failed'), {
          iceConnectionState: pc.iceConnectionState,
          iceGatheringState: pc.iceGatheringState,
          connectionState: pc.connectionState,
          signalingState: pc.signalingState,
          localCandidateCount: this.connectionStates.get(remoteUserId)?.localCandidateCount ?? 0,
          remoteCandidateCount: this.connectionStates.get(remoteUserId)?.remoteCandidateCount ?? 0,
          retryCount: this.connectionStates.get(remoteUserId)?.retryCount ?? 0,
        });

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
          this.reportConnectionError(remoteUserId, 'connection', new Error('PeerConnection connectionState failed'), {
            iceConnectionState: pc.iceConnectionState,
            iceGatheringState: pc.iceGatheringState,
            connectionState: pc.connectionState,
            signalingState: pc.signalingState,
          });
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
      this.reportConnectionError(remoteUserId, 'iceRestart', new Error('ICE restart reached max retries'), {
        retryCount: connState.retryCount,
        maxRetryCount: this.MAX_RETRY_COUNT,
      });
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
        this.reportConnectionError(remoteUserId, 'iceRestart', error, {
          retryCount: connState.retryCount,
        });
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

    // 重要：多人共享/重复协商场景下，addStream 可能会被多次调用。
    // 需要保证幂等，否则会触发：
    // - InvalidAccessError: A sender already exists for the track
    // - m-line 顺序错乱（如果不断 addTrack 产生新 transceiver）
    stream.getTracks().forEach((track) => {
      const senders = pc.getSenders();
      const transceivers = pc.getTransceivers();

      // 1) 同一个 track 已经被 addTrack/replaceTrack 过：直接跳过
      if (senders.some((s) => s.track?.id === track.id)) {
        logger.debug('track 已存在，跳过重复 addTrack:', { remoteUserId, trackKind: track.kind });
        return;
      }

      // 2) 优先复用既有 sender/transceiver（避免新增 m-line）
      // - sender.track.kind 匹配：说明之前已经发送过该 kind，直接 replaceTrack
      // - 某些情况下（之前 createOffer 使用了 offerToReceive* 或远端先发 offer），本端可能存在 receiver.kind 对应的 transceiver，
      //   但 sender.track 为空（recvonly/inactive）。此时也应该复用它，否则 addTrack 会新建 transceiver 导致 m-line 顺序变化。
      const sameKindSender = senders.find((s) => s.track?.kind === track.kind);
      const transceiverWithSameKind =
        !sameKindSender
          ? transceivers.find(
              (t) => t.receiver?.track?.kind === track.kind && !t.sender.track
            )
          : undefined;

      const reusableSender = sameKindSender ?? transceiverWithSameKind?.sender;
      if (reusableSender) {
        // 如果该 transceiver 之前是 recvonly/inactive，需要切到 sendrecv 才能真正发出 track
        if (
          transceiverWithSameKind &&
          (transceiverWithSameKind.direction === 'recvonly' ||
            transceiverWithSameKind.direction === 'inactive')
        ) {
          transceiverWithSameKind.direction = 'sendrecv';
        }

        void reusableSender
          .replaceTrack(track)
          .then(() => {
            logger.debug('replaceTrack 成功:', {
              remoteUserId,
              trackKind: track.kind,
              reused: transceiverWithSameKind ? 'transceiver' : 'sender',
            });
          })
          .catch((error) => {
            logger.warn('replaceTrack 失败，将尝试 addTrack 兜底:', {
              remoteUserId,
              trackKind: track.kind,
              error,
            });
            try {
              pc.addTrack(track, stream);
              logger.debug('addTrack 兜底成功:', { remoteUserId, trackKind: track.kind });
            } catch (e) {
              logger.error('addTrack 兜底失败:', {
                remoteUserId,
                trackKind: track.kind,
                error: e,
              });
            }
          });
        return;
      }

      // 3) 首次发送该 kind：正常 addTrack
      try {
        pc.addTrack(track, stream);
        logger.debug('添加track到连接:', { remoteUserId, trackKind: track.kind });
      } catch (error) {
        // 避免未捕获异常打断协商流程
        logger.error('添加track到连接失败:', { remoteUserId, trackKind: track.kind, error });
      }
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

    const connState = this.connectionStates.get(remoteUserId);

    try {
      // Perfect Negotiation：标记正在创建 Offer，用于 glare 冲突判断
      if (connState) {
        connState.makingOffer = true;
      }

      // 不要使用 offerToReceiveAudio/offerToReceiveVideo：
      // 这些 legacy 选项可能会隐式创建 recvonly transceiver，导致后续 m-line 顺序发生变化，
      // 从而触发 "The order of m-lines... doesn't match"（停止共享后再次共享的典型问题）。
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      logger.info('创建Offer:', remoteUserId);
      return offer;
    } finally {
      if (connState) {
        connState.makingOffer = false;
      }
    }
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

    const connState = this.connectionStates.get(remoteUserId);

    // 检查 signaling state
    logger.debug(
      `[setRemoteDescription] 当前 signaling state: ${pc.signalingState}, 类型: ${description.type}`
    );

    // Perfect Negotiation：处理 glare（双方同时发 Offer）
    const offerCollision =
      description.type === 'offer' &&
      (pc.signalingState !== 'stable' || Boolean(connState?.makingOffer));

    const isPolite = connState?.isPolite ?? this.isPolitePeer(remoteUserId);
    if (connState) {
      connState.isPolite = isPolite;
      // 参考实现：ignoreOffer 应随每次收到 description 重新计算（answer 时会自动归零）
      connState.ignoreOffer = !isPolite && offerCollision;
    }

    // impolite 端在 glare 时忽略对端 offer
    if (offerCollision && !isPolite) {
      logger.warn(
        `[PerfectNegotiation] glare 冲突：本端为 impolite，忽略对端 offer。state=${pc.signalingState}`
      );
      return;
    }

    try {
      if (offerCollision && isPolite) {
        logger.warn(
          `[PerfectNegotiation] glare 冲突：本端为 polite，执行 rollback 并接受对端 offer。state=${pc.signalingState}`
        );

        await Promise.all([
          pc.setLocalDescription({ type: 'rollback' }),
          pc.setRemoteDescription(description),
        ]);
      } else {
        await pc.setRemoteDescription(description);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorName =
        typeof error === 'object' && error !== null && 'name' in error
          ? String((error as { name?: unknown }).name)
          : '';

      // 仅在可预期的时序/状态错误时降级忽略；其它错误应升级为 error 并让上层感知
      const isTimingIssue =
        errorName === 'InvalidStateError' ||
        errorMsg.includes('InvalidStateError') ||
        errorMsg.includes('signaling state') ||
        errorMsg.includes('stable') ||
        errorMsg.includes('have-local-offer') ||
        errorMsg.includes('have-remote-offer');

      if (isTimingIssue) {
        logger.warn('设置远程描述失败（时序/状态冲突，已忽略）', {
          remoteUserId,
          type: description.type,
          signalingState: pc.signalingState,
          errorName,
          errorMsg,
        });
        return;
      }

      logger.error('设置远程描述失败（非时序问题）', {
        remoteUserId,
        type: description.type,
        signalingState: pc.signalingState,
        errorName,
        errorMsg,
        error,
      });

      this.reportConnectionError(remoteUserId, 'setRemoteDescription', error, {
        type: description.type,
        signalingState: pc.signalingState,
        errorName,
        errorMsg,
      });

      // 让上层有机会展示错误/触发重试（例如 m-line mismatch 时重建连接）
      connState?.handlers.onConnectionStateChange?.('failed');

      // 重要：非时序错误需要抛出，让上层能感知并做兜底处理。
      throw error;
    }

    logger.info('设置远程描述:', { remoteUserId, type: description.type });

    // 标记已设置远程描述
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

    // Perfect Negotiation：若当前正处于 ignoreOffer 状态，则忽略与被拒绝 offer 关联的候选
    if (connState?.ignoreOffer) {
      logger.debug('忽略与被拒绝 offer 关联的 ICE 候选（ignoreOffer=true）', {
        remoteUserId,
      });
      return;
    }

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
      // Perfect Negotiation：若处于 ignoreOffer 状态导致候选不可用，按参考实现降级忽略
      if (connState?.ignoreOffer) {
        logger.debug('忽略ICE候选（ignoreOffer=true）', { remoteUserId });
        return;
      }

      this.reportConnectionError(remoteUserId, 'addIceCandidate', error, {
        candidate: candidate.candidate?.slice(0, 160),
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      });

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
