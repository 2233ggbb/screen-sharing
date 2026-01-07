/**
 * 连接事件处理器
 */

import { Socket } from 'socket.io';
import { ServerEvents } from '@screen-sharing/shared';
import { RoomService } from '../../services/RoomService';
import { Logger } from '../../utils/logger';

/**
 * 连接处理器类
 */
export class ConnectionHandler {
  private logger: Logger;
  private roomService: RoomService;

  constructor(roomService: RoomService) {
    this.logger = new Logger('ConnectionHandler');
    this.roomService = roomService;
  }

  /**
   * 处理客户端连接
   */
  async handleConnection(socket: Socket): Promise<void> {
    this.logger.info('客户端已连接', { socketId: socket.id });

    // 发送连接成功事件
    socket.emit(ServerEvents.CONNECTED, {
      userId: '', // 在加入房间后会设置
      serverTime: new Date(),
    });
  }

  /**
   * 处理客户端断开连接
   */
  async handleDisconnect(socket: Socket, reason: string): Promise<void> {
    this.logger.info('客户端断开连接', { socketId: socket.id, reason });

    // 查找用户
    const user = this.roomService.getUserBySocketId(socket.id);
    if (!user) {
      this.logger.debug('未找到关联用户', { socketId: socket.id });
      return;
    }

    // 用户离开房间
    const result = await this.roomService.leaveRoom(user.id);
    if (!result) {
      return;
    }

    // 通知房间内其他成员
    socket.to(result.roomId).emit(ServerEvents.USER_LEFT, {
      userId: user.id,
      roomId: result.roomId,
    });

    // 如果有新房主，通知新房主
    if (result.newOwnerId) {
      const newOwner = this.roomService.getUserById(result.newOwnerId);
      if (newOwner) {
        socket.to(newOwner.socketId).emit(ServerEvents.ROOM_INFO, {
          room: this.roomService.getRoomInfo(result.roomId)!,
        });
      }
    }

    this.logger.info('用户已断开并离开房间', {
      userId: user.id,
      roomId: result.roomId,
    });
  }

  /**
   * 处理连接错误
   */
  handleError(socket: Socket, error: Error): void {
    this.logger.error('Socket连接错误', error, { socketId: socket.id });
  }
}
