import { io, Socket } from 'socket.io-client';
import { SocketEvents, ServerEventParams, ServerEvents } from '@shared/events';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  RoomCreatedPayload,
  RoomJoinedPayload,
  UserJoinedPayload,
  UserLeftPayload,
  UserStartSharingPayload,
  UserStopSharingPayload,
  RTCSessionDescriptionData,
  IceCandidate,
} from '@shared/types';
import { logger } from '../../utils/logger';
import { DEFAULT_SERVER_URL, STORAGE_KEYS } from '../../utils/constants';

/**
 * WebRTC Offer 数据类型
 */
export interface WebRTCOfferData {
  fromUserId: string;
  offer: RTCSessionDescriptionData;
}

/**
 * WebRTC Answer 数据类型
 */
export interface WebRTCAnswerData {
  fromUserId: string;
  answer: RTCSessionDescriptionData;
}

/**
 * WebRTC ICE 候选数据类型
 */
export interface WebRTCIceCandidateData {
  fromUserId: string;
  candidate: IceCandidate;
}

export type SocketEventHandlers = {
  onRoomCreated?: (data: RoomCreatedPayload) => void;
  onRoomJoined?: (data: RoomJoinedPayload) => void;
  onUserJoined?: (data: UserJoinedPayload) => void;
  onUserLeft?: (data: UserLeftPayload) => void;
  onUserStartSharing?: (data: UserStartSharingPayload) => void;
  onUserStopSharing?: (data: UserStopSharingPayload) => void;
  onWebRTCOffer?: (data: WebRTCOfferData) => void;
  onWebRTCAnswer?: (data: WebRTCAnswerData) => void;
  onWebRTCIceCandidate?: (data: WebRTCIceCandidateData) => void;
  onError?: (error: { message: string; code?: string }) => void;
  onDisconnect?: () => void;
  onReconnecting?: (attempt: number) => void;
};

/**
 * Socket.io客户端服务
 */
export class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private handlers: SocketEventHandlers = {};

  constructor(serverUrl: string = DEFAULT_SERVER_URL) {
    this.serverUrl = serverUrl;
  }

  /**
   * 连接服务器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 从 localStorage 读取服务器地址（如果有的话）
        const savedServerUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL);
        if (savedServerUrl && savedServerUrl !== this.serverUrl) {
          logger.info('使用保存的服务器地址:', savedServerUrl);
          this.serverUrl = savedServerUrl;
        }

        // 如果已经连接，检查是否需要重新连接（服务器地址变化）
        if (this.socket?.connected) {
          logger.info('Socket已连接，跳过重复连接');
          resolve();
          return;
        }

        // 断开旧连接（如果存在）
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }

        logger.info('正在连接到服务器:', this.serverUrl);
        this.socket = io(this.serverUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: Infinity,
        });

        // 添加重连事件监听
        this.socket.io.on('reconnect_attempt', (attempt) => {
          logger.info(`正在尝试重连... 第${attempt}次`);
          this.handlers.onReconnecting?.(attempt);
        });

        this.socket.io.on('reconnect', () => {
          logger.info('重连成功');
        });

        this.socket.io.on('reconnect_failed', () => {
          logger.error('重连失败');
        });

        this.socket.on('connect', () => {
          logger.info('Socket连接成功');
          this.setupEventListeners();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          logger.error('Socket连接失败:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          logger.warn('Socket断开连接');
          this.handlers.onDisconnect?.();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    console.log('[Socket] 设置事件监听器');

    // 房间事件
    this.socket.on(SocketEvents.ROOM_CREATED, (data: RoomCreatedPayload) => {
      logger.info('房间已创建:', data);
      console.log('[Socket] 事件: ROOM_CREATED', data);
      this.handlers.onRoomCreated?.(data);
    });

    this.socket.on(SocketEvents.ROOM_JOINED, (data: RoomJoinedPayload) => {
      logger.info('加入房间成功:', data);
      console.log('[Socket] 事件: ROOM_JOINED', data);
      this.handlers.onRoomJoined?.(data);
    });

    this.socket.on(SocketEvents.USER_JOINED, (data: UserJoinedPayload) => {
      logger.info('用户加入:', data);
      console.log('[Socket] 事件: USER_JOINED', data);
      this.handlers.onUserJoined?.(data);
    });

    this.socket.on(SocketEvents.USER_LEFT, (data: UserLeftPayload) => {
      logger.info('用户离开:', data);
      console.log('[Socket] 事件: USER_LEFT', data);
      this.handlers.onUserLeft?.(data);
    });

    this.socket.on(SocketEvents.USER_START_SHARING, (data: UserStartSharingPayload) => {
      logger.info('用户开始共享:', data);
      console.log('[Socket] 事件: USER_START_SHARING', data);
      this.handlers.onUserStartSharing?.(data);
    });

    this.socket.on(SocketEvents.USER_STOP_SHARING, (data: UserStopSharingPayload) => {
      logger.info('用户停止共享:', data);
      console.log('[Socket] 事件: USER_STOP_SHARING', data);
      this.handlers.onUserStopSharing?.(data);
    });

    // WebRTC信令事件 - 详细日志
    this.socket.on(SocketEvents.WEBRTC_OFFER, (data: WebRTCOfferData) => {
      logger.info('收到Offer:', data.fromUserId);
      console.log('[Socket] 事件: WEBRTC_OFFER', {
        fromUserId: data.fromUserId,
        sdpType: data.offer?.type,
        sdpLength: data.offer?.sdp?.length,
      });
      this.handlers.onWebRTCOffer?.(data);
    });

    this.socket.on(SocketEvents.WEBRTC_ANSWER, (data: WebRTCAnswerData) => {
      logger.info('收到Answer:', data.fromUserId);
      console.log('[Socket] 事件: WEBRTC_ANSWER', {
        fromUserId: data.fromUserId,
        sdpType: data.answer?.type,
        sdpLength: data.answer?.sdp?.length,
      });
      this.handlers.onWebRTCAnswer?.(data);
    });

    this.socket.on(SocketEvents.WEBRTC_ICE_CANDIDATE, (data: WebRTCIceCandidateData) => {
      // 解析ICE候选类型
      const candidateStr = data.candidate?.candidate || '';
      const parts = candidateStr.split(' ');
      const candidateType = parts[7] || 'unknown'; // typ 后面的值
      
      logger.info('收到远程ICE候选:', {
        fromUserId: data.fromUserId,
        type: candidateType,
      });
      console.log('[Socket] 事件: WEBRTC_ICE_CANDIDATE', {
        fromUserId: data.fromUserId,
        type: candidateType,
        protocol: parts[2], // udp/tcp
        address: parts[4],  // IP地址
        port: parts[5],     // 端口
        candidate: candidateStr.substring(0, 80) + '...',
      });
      this.handlers.onWebRTCIceCandidate?.(data);
    });

    // 错误事件
    this.socket.on(SocketEvents.ERROR, (error: { message: string; code?: string }) => {
      logger.error('Socket错误:', error);
      this.handlers.onError?.(error);
    });
  }

  /**
   * 设置事件处理器
   */
  setHandlers(handlers: SocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * 创建房间
   */
  createRoom(payload: CreateRoomPayload): Promise<void> {
    return this.emit(SocketEvents.CREATE_ROOM, payload);
  }

  /**
   * 加入房间
   */
  joinRoom(payload: JoinRoomPayload): Promise<void> {
    return this.emit(SocketEvents.JOIN_ROOM, payload);
  }

  /**
   * 离开房间
   */
  leaveRoom(payload: LeaveRoomPayload): Promise<void> {
    return this.emit(SocketEvents.LEAVE_ROOM, payload);
  }

  /**
   * 开始共享
   */
  startSharing(data: {
    sourceId: string;
    sourceName: string;
    sourceType: 'screen' | 'window';
    config: {
      width: number;
      height: number;
      frameRate: number;
    };
  }): Promise<void> {
    return this.emit(SocketEvents.START_SHARING, data);
  }

  /**
   * 停止共享
   */
  stopSharing(): Promise<void> {
    return this.emit(SocketEvents.STOP_SHARING, {});
  }

  /**
   * 发送 Offer
   */
  sendOffer(payload: {
    roomId: string;
    from: string;
    to: string;
    targetUserId: string;
    offer: RTCSessionDescriptionData;
  }): Promise<void> {
    console.log('[Socket] 发送: SEND_OFFER', {
      to: payload.targetUserId,
      sdpType: payload.offer?.type,
      sdpLength: payload.offer?.sdp?.length,
    });
    return this.emit(SocketEvents.SEND_OFFER, payload);
  }

  /**
   * 发送 Answer
   */
  sendAnswer(payload: {
    roomId: string;
    from: string;
    to: string;
    targetUserId: string;
    answer: RTCSessionDescriptionData;
  }): Promise<void> {
    console.log('[Socket] 发送: SEND_ANSWER', {
      to: payload.targetUserId,
      sdpType: payload.answer?.type,
      sdpLength: payload.answer?.sdp?.length,
    });
    return this.emit(SocketEvents.SEND_ANSWER, payload);
  }

  /**
   * 发送ICE候选
   */
  sendIceCandidate(payload: {
    roomId: string;
    from: string;
    to: string;
    targetUserId: string;
    candidate: RTCIceCandidate;
  }): Promise<void> {
    const candidateStr = payload.candidate?.candidate || '';
    const parts = candidateStr.split(' ');
    const candidateType = parts[7] || 'unknown';

    console.log('[Socket] 发送: SEND_ICE_CANDIDATE', {
      to: payload.targetUserId,
      type: candidateType,
      protocol: parts[2],
      address: parts[4],
      port: parts[5],
    });
    return this.emit(SocketEvents.SEND_ICE_CANDIDATE, payload);
  }

  /**
   * 通知 ICE 收集完成（用于连接协调）
   */
  notifyIceGatheringComplete(targetUserId: string, connectionId: string): Promise<void> {
    console.log('[Socket] 发送: ICE_GATHERING_COMPLETE', {
      targetUserId,
      connectionId,
    });
    return this.emit('ice_gathering_complete', {
      targetUserId,
      connectionId,
    });
  }

  /**
   * 获取 Socket 实例（用于 NAT 检测）
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * 发送事件
   */
  private emit(event: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket未连接'));
        return;
      }

      this.socket.emit(event, data, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      logger.info('Socket已断开');
    }
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * 更新服务器地址
   * 如果当前已连接，会断开并使用新地址重新连接
   */
  updateServerUrl(newUrl: string): void {
    if (this.serverUrl === newUrl) {
      return;
    }

    logger.info('更新服务器地址:', newUrl);
    this.serverUrl = newUrl;

    // 如果当前已连接，断开连接
    if (this.socket?.connected) {
      logger.info('断开当前连接以使用新地址');
      this.disconnect();
    }
  }

  /**
   * 获取当前服务器地址
   */
  getServerUrl(): string {
    return this.serverUrl;
  }
}

// 导出单例
export const socketService = new SocketService();
