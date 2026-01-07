import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@shared/events';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  WebRTCSignalPayload,
  RoomCreatedPayload,
  RoomJoinedPayload,
  UserJoinedPayload,
  UserLeftPayload,
  UserStartSharingPayload,
  UserStopSharingPayload,
} from '@shared/types';
import { logger } from '../../utils/logger';
import { DEFAULT_SERVER_URL } from '../../utils/constants';

export type SocketEventHandlers = {
  onRoomCreated?: (data: RoomCreatedPayload) => void;
  onRoomJoined?: (data: RoomJoinedPayload) => void;
  onUserJoined?: (data: UserJoinedPayload) => void;
  onUserLeft?: (data: UserLeftPayload) => void;
  onUserStartSharing?: (data: UserStartSharingPayload) => void;
  onUserStopSharing?: (data: UserStopSharingPayload) => void;
  onWebRTCOffer?: (data: WebRTCSignalPayload) => void;
  onWebRTCAnswer?: (data: WebRTCSignalPayload) => void;
  onWebRTCIceCandidate?: (data: WebRTCSignalPayload) => void;
  onError?: (error: { message: string; code?: string }) => void;
  onDisconnect?: () => void;
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
        // 如果已经连接，直接返回
        if (this.socket?.connected) {
          logger.info('Socket已连接，跳过重复连接');
          resolve();
          return;
        }

        this.socket = io(this.serverUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
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

    // 房间事件
    this.socket.on(SocketEvents.ROOM_CREATED, (data: RoomCreatedPayload) => {
      logger.info('房间已创建:', data);
      this.handlers.onRoomCreated?.(data);
    });

    this.socket.on(SocketEvents.ROOM_JOINED, (data: RoomJoinedPayload) => {
      logger.info('加入房间成功:', data);
      this.handlers.onRoomJoined?.(data);
    });

    this.socket.on(SocketEvents.USER_JOINED, (data: UserJoinedPayload) => {
      logger.info('用户加入:', data);
      this.handlers.onUserJoined?.(data);
    });

    this.socket.on(SocketEvents.USER_LEFT, (data: UserLeftPayload) => {
      logger.info('用户离开:', data);
      this.handlers.onUserLeft?.(data);
    });

    this.socket.on(SocketEvents.USER_START_SHARING, (data: UserStartSharingPayload) => {
      logger.info('用户开始共享:', data);
      this.handlers.onUserStartSharing?.(data);
    });

    this.socket.on(SocketEvents.USER_STOP_SHARING, (data: UserStopSharingPayload) => {
      logger.info('用户停止共享:', data);
      this.handlers.onUserStopSharing?.(data);
    });

    // WebRTC信令事件
    this.socket.on(SocketEvents.WEBRTC_OFFER, (data: WebRTCSignalPayload) => {
      logger.info('收到Offer:', data.from);
      this.handlers.onWebRTCOffer?.(data);
    });

    this.socket.on(SocketEvents.WEBRTC_ANSWER, (data: WebRTCSignalPayload) => {
      logger.info('收到Answer:', data.from);
      this.handlers.onWebRTCAnswer?.(data);
    });

    this.socket.on(SocketEvents.WEBRTC_ICE_CANDIDATE, (data: WebRTCSignalPayload) => {
      logger.debug('收到ICE候选:', data.from);
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
   * 发送WebRTC Offer
   */
  sendOffer(payload: WebRTCSignalPayload): Promise<void> {
    return this.emit(SocketEvents.SEND_OFFER, payload);
  }

  /**
   * 发送WebRTC Answer
   */
  sendAnswer(payload: WebRTCSignalPayload): Promise<void> {
    return this.emit(SocketEvents.SEND_ANSWER, payload);
  }

  /**
   * 发送ICE候选
   */
  sendIceCandidate(payload: WebRTCSignalPayload): Promise<void> {
    return this.emit(SocketEvents.SEND_ICE_CANDIDATE, payload);
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
}

// 导出单例
export const socketService = new SocketService();
