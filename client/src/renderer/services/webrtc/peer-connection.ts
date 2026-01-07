import { RTC_CONFIG } from '../../utils/constants';
import { logger } from '../../utils/logger';
import { batchExecute } from '../../utils/performance';

export type PeerConnectionEventHandler = {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
};

interface PendingIceCandidate {
  remoteUserId: string;
  candidate: RTCIceCandidateInit;
}

/**
 * WebRTC P2P连接管理器（优化版）
 */
export class PeerConnectionManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private config: RTCConfiguration;
  private pendingIceCandidates: PendingIceCandidate[] = [];
  private iceBatchTimer: NodeJS.Timeout | null = null;
  private readonly ICE_BATCH_DELAY = 100; // 100ms批量延迟
  private readonly ICE_BATCH_SIZE = 5; // 批量大小

  constructor(config: RTCConfiguration = RTC_CONFIG) {
    this.config = config;
  }

  /**
   * 批量处理ICE候选
   */
  private async processBatchIceCandidates(): Promise<void> {
    if (this.pendingIceCandidates.length === 0) {
      return;
    }

    const items = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    this.iceBatchTimer = null;

    const groupedByUser = items.reduce((acc, item) => {
      if (!acc[item.remoteUserId]) {
        acc[item.remoteUserId] = [];
      }
      acc[item.remoteUserId].push(item.candidate);
      return acc;
    }, {} as Record<string, RTCIceCandidateInit[]>);

    for (const [remoteUserId, candidates] of Object.entries(groupedByUser)) {
      const pc = this.peerConnections.get(remoteUserId);
      if (!pc) {
        logger.warn('连接不存在，忽略批量ICE候选:', remoteUserId);
        continue;
      }

      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (error) {
          logger.error('添加ICE候选失败:', error);
        }
      }
      logger.debug(`批量添加${candidates.length}个ICE候选:`, remoteUserId);
    }
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

    // ICE候选事件
    pc.onicecandidate = (event) => {
      if (event.candidate && handlers.onIceCandidate) {
        handlers.onIceCandidate(event.candidate);
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

      // 连接失败或关闭时清理
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closeConnection(remoteUserId);
      }
    };

    this.peerConnections.set(remoteUserId, pc);
    logger.info('创建P2P连接:', remoteUserId);
    return pc;
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
      offerToReceiveAudio: false,
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
  }

  /**
   * 添加ICE候选（优化版：批量处理）
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

    // 加入批量队列
    this.pendingIceCandidates.push({ remoteUserId, candidate });

    // 达到批量大小，立即处理
    if (this.pendingIceCandidates.length >= this.ICE_BATCH_SIZE) {
      if (this.iceBatchTimer) {
        clearTimeout(this.iceBatchTimer);
      }
      await this.processBatchIceCandidates();
    } else if (!this.iceBatchTimer) {
      // 否则等待延迟批量处理
      this.iceBatchTimer = setTimeout(() => {
        this.processBatchIceCandidates();
      }, this.ICE_BATCH_DELAY);
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
}
