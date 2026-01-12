/**
 * Socket.io 服务
 * 负责与信令服务器的实时通信
 */

import { io, Socket } from 'socket.io-client';
import {
  ClientEvents,
  ServerEvents,
  CreateRoomRequest,
  JoinRoomRequest,
  Room,
  User,
  StreamInfo,
  RTCSessionDescriptionData,
  IceCandidate,
  ErrorResponse,
} from '@screen-sharing/shared';
import { logger } from '../../utils/logger';
import { SERVER_URL, SOCKET_TIMEOUT, ROOM_CONFIG } from '../../utils/constants';

const socketLogger = logger.createNamespacedLogger('Socket');

// 服务端事件回调类型
export interface SocketEventCallbacks {
  onConnected?: (userId: string) => void;
  onDisconnected?: (reason: string) => void;
  onRoomCreated?: (room: Room, userId: string) => void;
  onRoomJoined?: (room: Room, userId: string) => void;
  onUserJoined?: (user: User, roomId: string) => void;
  onUserLeft?: (userId: string, roomId: string) => void;
  onUserStartedSharing?: (userId: string, streamInfo: StreamInfo) => void;
  onUserStoppedSharing?: (userId: string, streamId: string) => void;
  onReceiveOffer?: (fromUserId: string, offer: RTCSessionDescriptionData) => void;
  onReceiveAnswer?: (fromUserId: string, answer: RTCSessionDescriptionData) => void;
  onReceiveIceCandidate?: (fromUserId: string, candidate: IceCandidate) => void;
  onError?: (error: ErrorResponse) => void;
}

export class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private reconnectAttempts: number = 0;
  private callbacks: SocketEventCallbacks = {};
  private isConnecting: boolean = false;

  constructor(serverUrl: string = SERVER_URL) {
    this.serverUrl = serverUrl;
  }

  /**
   * 连接到服务器
   */
  connect(): Promise<void> {
    if (this.socket?.connected) {
      socketLogger.info('已连接到服务器');
      return Promise.resolve();
    }

    if (this.isConnecting) {
      socketLogger.info('正在连接中...');
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      socketLogger.info('正在连接到服务器:', this.serverUrl);

      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: ROOM_CONFIG.RECONNECT_ATTEMPTS,
        reconnectionDelay: ROOM_CONFIG.RECONNECT_DELAY,
        reconnectionDelayMax: 5000,
        timeout: SOCKET_TIMEOUT,
      });

      // 连接成功
      this.socket.on('connect', () => {
        socketLogger.info('连接成功');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        resolve();
      });

      // 连接错误
      this.socket.on('connect_error', (error) => {
        socketLogger.error('连接错误:', error.message);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= ROOM_CONFIG.RECONNECT_ATTEMPTS) {
          this.isConnecting = false;
          reject(new Error('无法连接到服务器'));
        }
      });

      // 断开连接
      this.socket.on('disconnect', (reason) => {
        socketLogger.warn('连接断开:', reason);
        this.callbacks.onDisconnected?.(reason);
      });

      // 注册服务端事件监听
      this.registerServerEvents();
    });
  }

  /**
   * 注册服务端事件监听
   */
  private registerServerEvents(): void {
    if (!this.socket) return;

    // 服务端确认连接
    this.socket.on(ServerEvents.CONNECTED, (data: { userId: string }) => {
      socketLogger.info('服务端确认连接, userId:', data.userId);
      this.callbacks.onConnected?.(data.userId);
    });

    // 房间创建成功
    this.socket.on(
      ServerEvents.ROOM_CREATED,
      (data: { room: Room; userId: string }) => {
        socketLogger.info('房间创建成功:', data.room.id);
        this.callbacks.onRoomCreated?.(data.room, data.userId);
      }
    );

    // 加入房间成功
    this.socket.on(
      ServerEvents.ROOM_JOINED,
      (data: { room: Room; userId: string }) => {
        socketLogger.info('加入房间成功:', data.room.id);
        this.callbacks.onRoomJoined?.(data.room, data.userId);
      }
    );

    // 用户加入
    this.socket.on(
      ServerEvents.USER_JOINED,
      (data: { user: User; roomId: string }) => {
        socketLogger.info('用户加入房间:', data.user.nickname);
        this.callbacks.onUserJoined?.(data.user, data.roomId);
      }
    );

    // 用户离开
    this.socket.on(
      ServerEvents.USER_LEFT,
      (data: { userId: string; roomId: string }) => {
        socketLogger.info('用户离开房间:', data.userId);
        this.callbacks.onUserLeft?.(data.userId, data.roomId);
      }
    );

    // 用户开始共享
    this.socket.on(
      ServerEvents.USER_STARTED_SHARING,
      (data: { userId: string; streamInfo: StreamInfo }) => {
        socketLogger.info('用户开始共享:', data.userId);
        this.callbacks.onUserStartedSharing?.(data.userId, data.streamInfo);
      }
    );

    // 用户停止共享
    this.socket.on(
      ServerEvents.USER_STOPPED_SHARING,
      (data: { userId: string; streamId: string }) => {
        socketLogger.info('用户停止共享:', data.userId);
        this.callbacks.onUserStoppedSharing?.(data.userId, data.streamId);
      }
    );

    // 收到 Offer
    this.socket.on(
      ServerEvents.RECEIVE_OFFER,
      (data: { fromUserId: string; offer: RTCSessionDescriptionData }) => {
        socketLogger.debug('收到 Offer:', data.fromUserId);
        this.callbacks.onReceiveOffer?.(data.fromUserId, data.offer);
      }
    );

    // 收到 Answer
    this.socket.on(
      ServerEvents.RECEIVE_ANSWER,
      (data: { fromUserId: string; answer: RTCSessionDescriptionData }) => {
        socketLogger.debug('收到 Answer:', data.fromUserId);
        this.callbacks.onReceiveAnswer?.(data.fromUserId, data.answer);
      }
    );

    // 收到 ICE 候选
    this.socket.on(
      ServerEvents.RECEIVE_ICE_CANDIDATE,
      (data: { fromUserId: string; candidate: IceCandidate }) => {
        socketLogger.debug('收到 ICE 候选:', data.fromUserId);
        this.callbacks.onReceiveIceCandidate?.(data.fromUserId, data.candidate);
      }
    );

    // 错误
    this.socket.on(ServerEvents.ERROR, (error: ErrorResponse) => {
      socketLogger.error('服务端错误:', error.message);
      this.callbacks.onError?.(error);
    });
  }

  /**
   * 设置事件回调
   */
  setCallbacks(callbacks: SocketEventCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 创建房间
   */
  createRoom(request: CreateRoomRequest): void {
    socketLogger.info('创建房间:', request.roomName);
    this.socket?.emit(ClientEvents.CREATE_ROOM, request);
  }

  /**
   * 加入房间
   */
  joinRoom(request: JoinRoomRequest): void {
    socketLogger.info('加入房间:', request.roomId);
    this.socket?.emit(ClientEvents.JOIN_ROOM, request);
  }

  /**
   * 离开房间
   */
  leaveRoom(): void {
    socketLogger.info('离开房间');
    this.socket?.emit(ClientEvents.LEAVE_ROOM);
  }

  /**
   * 开始共享
   */
  startSharing(data: {
    sourceId: string;
    sourceName: string;
    sourceType: 'screen' | 'window';
    config: { width: number; height: number; frameRate: number };
  }): void {
    socketLogger.info('开始共享:', data.sourceName);
    this.socket?.emit(ClientEvents.START_SHARING, data);
  }

  /**
   * 停止共享
   */
  stopSharing(): void {
    socketLogger.info('停止共享');
    this.socket?.emit(ClientEvents.STOP_SHARING);
  }

  /**
   * 发送 Offer
   */
  sendOffer(targetUserId: string, offer: RTCSessionDescriptionData): void {
    socketLogger.debug('发送 Offer:', targetUserId);
    this.socket?.emit(ClientEvents.SEND_OFFER, { targetUserId, offer });
  }

  /**
   * 发送 Answer
   */
  sendAnswer(targetUserId: string, answer: RTCSessionDescriptionData): void {
    socketLogger.debug('发送 Answer:', targetUserId);
    this.socket?.emit(ClientEvents.SEND_ANSWER, { targetUserId, answer });
  }

  /**
   * 发送 ICE 候选
   */
  sendIceCandidate(targetUserId: string, candidate: IceCandidate): void {
    socketLogger.debug('发送 ICE 候选:', targetUserId);
    this.socket?.emit(ClientEvents.SEND_ICE_CANDIDATE, { targetUserId, candidate });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    socketLogger.info('断开连接');
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * 获取 Socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// 导出单例
export const socketService = new SocketService();
