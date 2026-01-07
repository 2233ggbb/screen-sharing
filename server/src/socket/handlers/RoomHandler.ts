/**
 * 房间事件处理器
 */

import { Socket } from 'socket.io';
import {
  ClientEvents,
  ServerEvents,
  ClientEventParams,
  ErrorCode,
} from '@screen-sharing/shared';
import { RoomService } from '../../services/RoomService';
import { Logger } from '../../utils/logger';

/**
 * 房间处理器类
 */
export class RoomHandler {
  private logger: Logger;
  private roomService: RoomService;

  constructor(roomService: RoomService) {
    this.logger = new Logger('RoomHandler');
    this.roomService = roomService;
  }

  /**
   * 注册房间相关事件
   */
  register(socket: Socket): void {
    socket.on(
      ClientEvents.CREATE_ROOM,
      this.handleCreateRoom.bind(this, socket)
    );
    socket.on(
      ClientEvents.JOIN_ROOM,
      this.handleJoinRoom.bind(this, socket)
    );
    socket.on(
      ClientEvents.LEAVE_ROOM,
      this.handleLeaveRoom.bind(this, socket)
    );
    socket.on(
      ClientEvents.GET_ROOMS,
      this.handleGetRooms.bind(this, socket)
    );
    socket.on(
      ClientEvents.GET_ROOM_INFO,
      this.handleGetRoomInfo.bind(this, socket)
    );
  }

  /**
   * 处理创建房间
   */
  private async handleCreateRoom(
    socket: Socket,
    data: ClientEventParams[ClientEvents.CREATE_ROOM],
    callback?: (response: any) => void
  ): Promise<void> {
    this.logger.info('创建房间', { socketId: socket.id, data });

    const result = await this.roomService.createRoom(data, socket.id);

    // 检查是否是错误响应
    if ('code' in result) {
      this.logger.warn('创建房间失败', { error: result });
      socket.emit(ServerEvents.ERROR, result);
      if (callback) {
        callback({ success: false, error: result });
      }
      return;
    }

    // 加入Socket.io房间
    socket.join(result.room.id);

    // 发送成功响应
    socket.emit(ServerEvents.ROOM_CREATED, {
      room: result.room,
      userId: result.userId,
    });

    if (callback) {
      callback({
        success: true,
        data: {
          room: result.room,
          userId: result.userId,
        },
      });
    }

    this.logger.info('房间创建成功', {
      roomId: result.room.id,
      userId: result.userId,
    });
  }

  /**
   * 处理加入房间
   */
  private async handleJoinRoom(
    socket: Socket,
    data: ClientEventParams[ClientEvents.JOIN_ROOM],
    callback?: (response: any) => void
  ): Promise<void> {
    this.logger.info('加入房间', { socketId: socket.id, data });

    const result = await this.roomService.joinRoom(data, socket.id);

    // 检查是否是错误响应
    if ('code' in result) {
      this.logger.warn('加入房间失败', { error: result });
      socket.emit(ServerEvents.ERROR, result);
      if (callback) {
        callback({ success: false, error: result });
      }
      return;
    }

    // 加入Socket.io房间
    socket.join(result.room.id);

    // 通知房间内其他成员有新用户加入
    const newUser = this.roomService.getUserById(result.userId);
    if (newUser) {
      socket.to(result.room.id).emit(ServerEvents.USER_JOINED, {
        user: {
          id: newUser.id,
          nickname: newUser.nickname,
          avatar: newUser.avatar,
          isSharing: newUser.isSharing,
          joinedAt: newUser.joinedAt,
        },
        roomId: result.room.id,
      });
    }

    // 发送成功响应给新用户
    socket.emit(ServerEvents.ROOM_JOINED, {
      room: result.room,
      userId: result.userId,
    });

    if (callback) {
      callback({
        success: true,
        data: {
          room: result.room,
          userId: result.userId,
        },
      });
    }

    this.logger.info('加入房间成功', {
      roomId: result.room.id,
      userId: result.userId,
    });
  }

  /**
   * 处理离开房间
   */
  private async handleLeaveRoom(
    socket: Socket,
    _data: ClientEventParams[ClientEvents.LEAVE_ROOM],
    callback?: (response: any) => void
  ): Promise<void> {
    this.logger.info('离开房间', { socketId: socket.id });

    const user = this.roomService.getUserBySocketId(socket.id);
    if (!user) {
      const error = {
        code: ErrorCode.USER_NOT_FOUND,
        message: '用户不存在',
      };
      socket.emit(ServerEvents.ERROR, error);
      if (callback) {
        callback({ success: false, error });
      }
      return;
    }

    const result = await this.roomService.leaveRoom(user.id);
    if (!result) {
      const error = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: '离开房间失败',
      };
      socket.emit(ServerEvents.ERROR, error);
      if (callback) {
        callback({ success: false, error });
      }
      return;
    }

    // 离开Socket.io房间
    socket.leave(result.roomId);

    // 通知房间内其他成员
    socket.to(result.roomId).emit(ServerEvents.USER_LEFT, {
      userId: user.id,
      roomId: result.roomId,
    });

    if (callback) {
      callback({ success: true });
    }

    this.logger.info('离开房间成功', {
      userId: user.id,
      roomId: result.roomId,
    });
  }

  /**
   * 处理获取房间列表
   */
  private handleGetRooms(
    socket: Socket,
    _data: ClientEventParams[ClientEvents.GET_ROOMS],
    callback?: (response: any) => void
  ): void {
    this.logger.debug('获取房间列表', { socketId: socket.id });

    const rooms = this.roomService.getRoomsList();

    socket.emit(ServerEvents.ROOMS_LIST, { rooms });

    if (callback) {
      callback({ success: true, data: { rooms } });
    }
  }

  /**
   * 处理获取房间信息
   */
  private handleGetRoomInfo(
    socket: Socket,
    data: ClientEventParams[ClientEvents.GET_ROOM_INFO],
    callback?: (response: any) => void
  ): void {
    this.logger.debug('获取房间信息', { socketId: socket.id, data });

    const room = this.roomService.getRoomInfo(data.roomId);

    if (!room) {
      const error = {
        code: ErrorCode.ROOM_NOT_FOUND,
        message: '房间不存在',
      };
      socket.emit(ServerEvents.ERROR, error);
      if (callback) {
        callback({ success: false, error });
      }
      return;
    }

    socket.emit(ServerEvents.ROOM_INFO, { room });

    if (callback) {
      callback({ success: true, data: { room } });
    }
  }
}
