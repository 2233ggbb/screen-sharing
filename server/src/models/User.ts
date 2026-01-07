/**
 * 用户模型
 */

import { User as SharedUser } from '@screen-sharing/shared';

/**
 * 服务端用户模型（扩展共享User类型）
 */
export interface ServerUser extends SharedUser {
  /** Socket连接ID */
  socketId: string;
  /** 所在房间ID */
  roomId: string;
  /** 是否是房主 */
  isHost: boolean;
  /** 共享流ID（如果正在共享） */
  streamId?: string;
  /** 最后活跃时间 */
  lastActiveAt: Date;
}

/**
 * 用户管理类
 */
export class UserModel {
  private users: Map<string, ServerUser>;

  constructor() {
    this.users = new Map();
  }

  /**
   * 创建用户
   */
  create(data: {
    id: string;
    nickname: string;
    socketId: string;
    roomId: string;
    isHost: boolean;
    avatar?: string;
  }): ServerUser {
    const user: ServerUser = {
      id: data.id,
      nickname: data.nickname,
      avatar: data.avatar,
      socketId: data.socketId,
      roomId: data.roomId,
      isHost: data.isHost,
      isSharing: false,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  /**
   * 根据ID获取用户
   */
  getById(userId: string): ServerUser | undefined {
    return this.users.get(userId);
  }

  /**
   * 根据SocketID获取用户
   */
  getBySocketId(socketId: string): ServerUser | undefined {
    return Array.from(this.users.values()).find(
      (user) => user.socketId === socketId
    );
  }

  /**
   * 获取房间内的所有用户
   */
  getByRoomId(roomId: string): ServerUser[] {
    return Array.from(this.users.values()).filter(
      (user) => user.roomId === roomId
    );
  }

  /**
   * 更新用户
   */
  update(userId: string, data: Partial<ServerUser>): ServerUser | undefined {
    const user = this.users.get(userId);
    if (!user) {
      return undefined;
    }

    const updatedUser = {
      ...user,
      ...data,
      lastActiveAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  /**
   * 删除用户
   */
  delete(userId: string): boolean {
    return this.users.delete(userId);
  }

  /**
   * 获取所有用户
   */
  getAll(): ServerUser[] {
    return Array.from(this.users.values());
  }

  /**
   * 清空所有用户
   */
  clear(): void {
    this.users.clear();
  }

  /**
   * 获取用户数量
   */
  count(): number {
    return this.users.size;
  }
}
