/**
 * WebRTC 服务
 * 负责 P2P 连接管理和媒体流处理
 */

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';
import { RTCSessionDescriptionData, IceCandidate } from '@screen-sharing/shared';
import { logger } from '../../utils/logger';
import { RTC_CONFIG, ICE_BATCH_CONFIG, STORAGE_KEYS } from '../../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const webrtcLogger = logger.createNamespacedLogger('WebRTC');

// 连接事件回调类型
export interface PeerConnectionCallbacks {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: string) => void;
}

// 待处理的 ICE 候选
interface PendingIceCandidate {
  remoteUserId: string;
  candidate: RTCIceCandidate;
}

export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private pendingIceCandidates: PendingIceCandidate[] = [];
  private iceBatchTimer: NodeJS.Timeout | null = null;
  private enableIPv6: boolean = true;

  constructor() {
    // 从存储加载 IPv6 配置
    this.loadIPv6Setting();
  }

  /**
   * 加载 IPv6 设置
   */
  private async loadIPv6Setting(): Promise<void> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ENABLE_IPV6);
      this.enableIPv6 = value !== 'false'; // 默认为 true
    } catch (error) {
      webrtcLogger.error('加载 IPv6 设置失败:', error);
      this.enableIPv6 = true;
    }
  }

  /**
   * 更新 IPv6 设置
   */
  async updateIPv6Setting(enabled: boolean): Promise<void> {
    this.enableIPv6 = enabled;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ENABLE_IPV6, String(enabled));
    } catch (error) {
      webrtcLogger.error('保存 IPv6 设置失败:', error);
    }
  }

  /**
   * 创建 P2P 连接
   */
  createPeerConnection(
    remoteUserId: string,
    callbacks: PeerConnectionCallbacks = {}
  ): RTCPeerConnection {
    // 如果已存在连接，先关闭
    if (this.peerConnections.has(remoteUserId)) {
      this.closePeerConnection(remoteUserId);
    }

    webrtcLogger.info('创建 P2P 连接:', remoteUserId);

    const pc = new RTCPeerConnection(RTC_CONFIG as any);

    // ICE 候选事件 - 使用 addEventListener 兼容 react-native-webrtc
    (pc as any).addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        // 检测是否为 IPv6 候选
        // IPv6 地址包含多个冒号，IPv4 地址最多只有一个冒号（端口号）
        const candidateStr = event.candidate.candidate || '';
        const address = event.candidate.address || '';
        const isIPv6 = address ? (address.split(':').length > 2) : false;

        // IPv6 过滤逻辑
        if (isIPv6 && !this.enableIPv6) {
          webrtcLogger.warn('[ICE] IPv6 已禁用：丢弃 IPv6 候选', address);
          return;
        }

        if (isIPv6) {
          webrtcLogger.info('[ICE] IPv6 候选:', {
            remoteUserId,
            address,
            type: event.candidate.type,
          });
        }

        if (callbacks.onIceCandidate) {
          callbacks.onIceCandidate(event.candidate);
        }
      }
    });

    // 接收远程流
    (pc as any).addEventListener('track', (event: any) => {
      webrtcLogger.info('接收到远程流:', remoteUserId);
      if (event.streams && event.streams[0] && callbacks.onTrack) {
        callbacks.onTrack(event.streams[0]);
      }
    });

    // 连接状态变化
    (pc as any).addEventListener('connectionstatechange', () => {
      const state = (pc as any).connectionState;
      webrtcLogger.info(`连接状态变化 [${remoteUserId}]:`, state);

      if (callbacks.onConnectionStateChange) {
        callbacks.onConnectionStateChange(state);
      }

      // 连接失败或关闭时清理
      if (state === 'failed' || state === 'closed') {
        this.closePeerConnection(remoteUserId);
      }
    });

    this.peerConnections.set(remoteUserId, pc);
    return pc;
  }

  /**
   * 添加本地流到连接
   */
  addLocalStream(remoteUserId: string, stream: MediaStream): void {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      webrtcLogger.error('连接不存在:', remoteUserId);
      return;
    }

    stream.getTracks().forEach((track: any) => {
      (pc as any).addTrack(track, stream);
      webrtcLogger.debug('添加 track 到连接:', {
        remoteUserId,
        trackKind: track.kind,
      });
    });
  }

  /**
   * 创建 Offer
   */
  async createOffer(remoteUserId: string): Promise<RTCSessionDescriptionData> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      throw new Error(`连接不存在: ${remoteUserId}`);
    }

    const offer = await (pc as any).createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: true,
    });

    await pc.setLocalDescription(offer);
    webrtcLogger.info('创建 Offer:', remoteUserId);

    return {
      type: 'offer',
      sdp: offer.sdp,
    };
  }

  /**
   * 创建 Answer
   */
  async createAnswer(remoteUserId: string): Promise<RTCSessionDescriptionData> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      throw new Error(`连接不存在: ${remoteUserId}`);
    }

    const answer = await (pc as any).createAnswer();
    await pc.setLocalDescription(answer);
    webrtcLogger.info('创建 Answer:', remoteUserId);

    return {
      type: 'answer',
      sdp: answer.sdp,
    };
  }

  /**
   * 设置远程描述
   */
  async setRemoteDescription(
    remoteUserId: string,
    description: RTCSessionDescriptionData
  ): Promise<void> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      throw new Error(`连接不存在: ${remoteUserId}`);
    }

    const rtcDescription = new RTCSessionDescription(description as any);
    await pc.setRemoteDescription(rtcDescription as any);
    webrtcLogger.info('设置远程描述:', {
      remoteUserId,
      type: description.type,
    });
  }

  /**
   * 添加 ICE 候选（批量处理优化）
   */
  async addIceCandidate(
    remoteUserId: string,
    candidate: IceCandidate
  ): Promise<void> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      webrtcLogger.warn('连接不存在，忽略 ICE 候选:', remoteUserId);
      return;
    }

    const rtcCandidate = new RTCIceCandidate(candidate as any);

    // 加入批量队列
    this.pendingIceCandidates.push({ remoteUserId, candidate: rtcCandidate });

    // 达到批量大小，立即处理
    if (this.pendingIceCandidates.length >= ICE_BATCH_CONFIG.SIZE) {
      if (this.iceBatchTimer) {
        clearTimeout(this.iceBatchTimer);
      }
      await this.processBatchIceCandidates();
    } else if (!this.iceBatchTimer) {
      // 否则等待延迟批量处理
      this.iceBatchTimer = setTimeout(() => {
        this.processBatchIceCandidates();
      }, ICE_BATCH_CONFIG.DELAY);
    }
  }

  /**
   * 批量处理 ICE 候选
   */
  private async processBatchIceCandidates(): Promise<void> {
    if (this.pendingIceCandidates.length === 0) {
      return;
    }

    const items = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    this.iceBatchTimer = null;

    // 按用户分组
    const groupedByUser = items.reduce((acc, item) => {
      if (!acc[item.remoteUserId]) {
        acc[item.remoteUserId] = [];
      }
      acc[item.remoteUserId].push(item.candidate);
      return acc;
    }, {} as Record<string, RTCIceCandidate[]>);

    // 批量添加
    for (const [userId, candidates] of Object.entries(groupedByUser)) {
      const pc = this.peerConnections.get(userId);
      if (!pc) {
        webrtcLogger.warn('连接不存在，忽略批量 ICE 候选:', userId);
        continue;
      }

      for (const candidate of candidates) {
        try {
          await (pc as any).addIceCandidate(candidate);
        } catch (error) {
          webrtcLogger.error('添加 ICE 候选失败:', error);
        }
      }

      webrtcLogger.debug(`批量添加 ${candidates.length} 个 ICE 候选:`, userId);
    }
  }

  /**
   * 获取连接
   */
  getPeerConnection(remoteUserId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(remoteUserId);
  }

  /**
   * 获取所有连接
   */
  getAllPeerConnections(): Map<string, RTCPeerConnection> {
    return this.peerConnections;
  }

  /**
   * 关闭指定连接
   */
  closePeerConnection(remoteUserId: string): void {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
      webrtcLogger.info('关闭 P2P 连接:', remoteUserId);
    }
  }

  /**
   * 关闭所有连接
   */
  closeAllConnections(): void {
    this.peerConnections.forEach((pc, userId) => {
      pc.close();
      webrtcLogger.info('关闭 P2P 连接:', userId);
    });
    this.peerConnections.clear();
  }

  /**
   * 设置本地流
   */
  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
  }

  /**
   * 获取本地流
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * 停止本地流
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => track.stop());
      this.localStream = null;
      webrtcLogger.info('本地流已停止');
    }
  }

  /**
   * 销毁服务，清理所有资源
   */
  destroy(): void {
    // 清理 ICE 批量处理定时器
    if (this.iceBatchTimer) {
      clearTimeout(this.iceBatchTimer);
      this.iceBatchTimer = null;
    }

    // 清理待处理的 ICE 候选
    this.pendingIceCandidates = [];

    // 停止本地流
    this.stopLocalStream();

    // 关闭所有连接
    this.closeAllConnections();

    webrtcLogger.info('WebRTCService 已销毁');
  }
}

// 导出单例
export const webrtcService = new WebRTCService();
