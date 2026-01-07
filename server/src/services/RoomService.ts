/**
 * 房间管理服务
 */

import {
  CreateRoomRequest,
  JoinRoomRequest,
  ErrorCode,
  ErrorResponse,
  Room,
} from '@screen-sharing/shared';
import { RoomModel } from '../models/Room';
import { UserModel, ServerUser } from '../models/User';
import { Logger } from '../utils/logger';
import { createRoomId, createUserId } from '../utils/id-generator';
import {
  validateRoomName,
  validateRoomPassword,
  validateNickname,
  validateMaxMembers,
} from '../utils/validation';
import { config } from '../config';

/**
 * 房间服务类
 */
export class RoomService {
  private logger: Logger;
  private roomModel: RoomModel;
  private userModel: UserModel;

  constructor(roomModel: RoomModel, userModel: UserModel) {
    this.logger = new Logger('RoomService');
    this.roomModel = roomModel;
    this.userModel = userModel;
  }

  /**
   * 创建房间
   */
  async createRoom(
    request: CreateRoomRequest,
    socketId: string
  ): Promise<{ room: Room; userId: string } | ErrorResponse> {
    this.logger.info('创建房间请求', { request, socketId });

    // 验证房间名称
    const nameValidation = validateRoomName(request.roomName);
    if (!nameValidation.valid) {
      return this.createError(ErrorCode.UNKNOWN_ERROR, nameValidation.error!);
    }

    // 验证昵称
    const nicknameValidation = validateNickname(request.nickname);
    if (!nicknameValidation.valid) {
      return this.createError(ErrorCode.UNKNOWN_ERROR, nicknameValidation.error!);
    }

    // 验证密码
    const passwordValidation = validateRoomPassword(request.password);
    if (!passwordValidation.valid) {
      return this.createError(ErrorCode.UNKNOWN_ERROR, passwordValidation.error!);
    }

    // 验证最大成员数
    const maxMembersValidation = validateMaxMembers(request.maxMembers);
    if (!maxMembersValidation.valid) {
      return this.createError(ErrorCode.UNKNOWN_ERROR, maxMembersValidation.error!);
    }

    // 生成房间ID和用户ID
    const roomId = createRoomId();
    const userId = createUserId();

    // 创建房间
    this.roomModel.create({
      id: roomId,
      name: request.roomName,
      ownerId: userId,
      password: request.password,
      maxMembers: request.maxMembers || config.room.maxMembers,
    });

    // 创建用户（房主）
    const user = this.userModel.create({
      id: userId,
      nickname: request.nickname,
      socketId: socketId,
      roomId: roomId,
      isHost: true,
    });

    this.logger.info('房间创建成功', { roomId, userId });

    // 转换为客户端格式
    const room = this.roomModel.toSharedRoom(roomId, [user])!;

    return { room, userId };
  }

  /**
   * 加入房间
   */
  async joinRoom(
    request: JoinRoomRequest,
    socketId: string
  ): Promise<{ room: Room; userId: string } | ErrorResponse> {
    this.logger.info('加入房间请求', { request, socketId });

    // 验证昵称
    const nicknameValidation = validateNickname(request.nickname);
    if (!nicknameValidation.valid) {
      return this.createError(ErrorCode.UNKNOWN_ERROR, nicknameValidation.error!);
    }

    // 检查房间是否存在
    const serverRoom = this.roomModel.getById(request.roomId);
    if (!serverRoom) {
      return this.createError(ErrorCode.ROOM_NOT_FOUND, '房间不存在');
    }

    // 验证密码
    if (!this.roomModel.validatePassword(request.roomId, request.password)) {
      return this.createError(ErrorCode.WRONG_PASSWORD, '密码错误');
    }

    // 检查房间是否已满
    if (serverRoom.memberIds.size >= serverRoom.maxMembers) {
      return this.createError(ErrorCode.ROOM_FULL, '房间已满');
    }

    // 生成用户ID
    const userId = createUserId();

    // 添加用户到房间
    const added = this.roomModel.addMember(request.roomId, userId);
    if (!added) {
      return this.createError(ErrorCode.ROOM_FULL, '房间已满');
    }

    // 创建用户
    this.userModel.create({
      id: userId,
      nickname: request.nickname,
      socketId: socketId,
      roomId: request.roomId,
      isHost: false,
    });

    this.logger.info('用户加入房间成功', { roomId: request.roomId, userId });

    // 获取房间内所有用户
    const roomUsers = this.userModel.getByRoomId(request.roomId);
    const room = this.roomModel.toSharedRoom(request.roomId, roomUsers)!;

    return { room, userId };
  }

  /**
   * 离开房间
   */
  async leaveRoom(userId: string): Promise<{ roomId: string; newOwnerId?: string } | null> {
    this.logger.info('离开房间请求', { userId });

    const user = this.userModel.getById(userId);
    if (!user) {
      this.logger.warn('用户不存在', { userId });
      return null;
    }

    const roomId = user.roomId;
    const serverRoom = this.roomModel.getById(roomId);
    if (!serverRoom) {
      this.logger.warn('房间不存在', { roomId });
      return null;
    }

    // 从房间移除用户
    this.roomModel.removeMember(roomId, userId);
    
    // 移除用户的所有流
    this.roomModel.removeUserStreams(roomId, userId);
    
    // 删除用户
    this.userModel.delete(userId);

    let newOwnerId: string | undefined;

    // 如果房间为空，删除房间
    if (this.roomModel.isEmpty(roomId)) {
      this.roomModel.delete(roomId);
      this.logger.info('房间已删除（无成员）', { roomId });
    } else if (serverRoom.ownerId === userId) {
      // 如果离开的是房主，转移房主权限给第一个成员
      const remainingUsers = this.userModel.getByRoomId(roomId);
      if (remainingUsers.length > 0) {
        newOwnerId = remainingUsers[0].id;
        this.roomModel.transferOwnership(roomId, newOwnerId);
        this.userModel.update(newOwnerId, { isHost: true });
        this.logger.info('房主权限已转移', { roomId, newOwnerId });
      }
    }

    this.logger.info('用户离开房间成功', { roomId, userId });

    return { roomId, newOwnerId };
  }

  /**
   * 获取房间信息
   */
  getRoomInfo(roomId: string): Room | null {
    const serverRoom = this.roomModel.getById(roomId);
    if (!serverRoom) {
      return null;
    }

    const roomUsers = this.userModel.getByRoomId(roomId);
    return this.roomModel.toSharedRoom(roomId, roomUsers) || null;
  }

  /**
   * 获取所有房间列表（简化信息）
   */
  getRoomsList(): Array<{
    id: string;
    name: string;
    memberCount: number;
    maxMembers: number;
    hasPassword: boolean;
  }> {
    const rooms = this.roomModel.getAll();
    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      memberCount: room.memberIds.size,
      maxMembers: room.maxMembers,
      hasPassword: room.hasPassword,
    }));
  }

  /**
   * 根据SocketID获取用户
   */
  getUserBySocketId(socketId: string): ServerUser | undefined {
    return this.userModel.getBySocketId(socketId);
  }

  /**
   * 根据用户ID获取用户
   */
  getUserById(userId: string): ServerUser | undefined {
    return this.userModel.getById(userId);
  }

  /**
   * 获取房间内的所有用户
   */
  getRoomUsers(roomId: string): ServerUser[] {
    return this.userModel.getByRoomId(roomId);
  }

  /**
   * 清理空房间
   */
  cleanupEmptyRooms(): number {
    const rooms = this.roomModel.getAll();
    let cleanedCount = 0;

    rooms.forEach((room) => {
      if (this.roomModel.isEmpty(room.id)) {
        this.roomModel.delete(room.id);
        cleanedCount++;
        this.logger.info('清理空房间', { roomId: room.id });
      }
    });

    return cleanedCount;
  }

  /**
   * 创建错误响应
   */
  private createError(code: ErrorCode, message: string): ErrorResponse {
    return {
      code,
      message,
    };
  }
}
