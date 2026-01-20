/**
 * Socket.io服务初始化
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config';
import { RoomModel } from '../models/Room';
import { UserModel } from '../models/User';
import { RoomService } from '../services/RoomService';
import { SignalingService } from '../services/SignalingService';
import { ConnectionHandler } from './handlers/ConnectionHandler';
import { RoomHandler } from './handlers/RoomHandler';
import { WebRTCHandlerEnhanced } from './handlers/WebRTCHandlerEnhanced';
import { Logger } from '../utils/logger';

/**
 * 初始化Socket.io服务
 */
export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  const logger = new Logger('SocketIO');

  // 创建Socket.io服务器
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    },
    pingTimeout: config.socket.pingTimeout,
    pingInterval: config.socket.pingInterval,
    maxHttpBufferSize: config.socket.maxHttpBufferSize,
  });

  // 创建数据模型
  const roomModel = new RoomModel();
  const userModel = new UserModel();

  // 创建服务
  const roomService = new RoomService(roomModel, userModel);
  const signalingService = new SignalingService(roomModel, userModel);

  // 创建处理器
  const connectionHandler = new ConnectionHandler(roomService);
  const roomHandler = new RoomHandler(roomService);
  const webrtcHandler = new WebRTCHandlerEnhanced(roomService, signalingService, io);

  // 处理连接
  io.on('connection', async (socket: Socket) => {
    logger.info('新的Socket连接', { socketId: socket.id });

    // 处理连接成功
    await connectionHandler.handleConnection(socket);

    // 注册事件处理器
    roomHandler.register(socket);
    webrtcHandler.register(socket);

    // 处理断开连接
    socket.on('disconnect', (reason: string) => {
      connectionHandler.handleDisconnect(socket, reason);
      // 清理 NAT 信息
      const user = roomService.getUserBySocketId(socket.id);
      if (user) {
        webrtcHandler.cleanupUser(user.id);
      }
    });

    // 处理错误
    socket.on('error', (error: Error) => {
      connectionHandler.handleError(socket, error);
    });
  });

  // 定期清理空房间
  setInterval(() => {
    const cleanedCount = roomService.cleanupEmptyRooms();
    if (cleanedCount > 0) {
      logger.info(`清理了 ${cleanedCount} 个空房间`);
    }
  }, config.room.autoCleanupInterval);

  logger.info('Socket.io服务已初始化');

  return io;
}
