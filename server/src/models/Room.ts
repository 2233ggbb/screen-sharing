/**
 * 房间模型
 */

import { Room as SharedRoom, StreamInfo } from '@screen-sharing/shared';
import { ServerUser } from './User';

/**
 * 服务端房间模型
 */
export interface ServerRoom {
  /** 房间ID */
  id: string;
  /** 房间名称 */
  name: string;
  /** 房主ID */
  ownerId: string;
  /** 房间密码（如果有） */
  password?: string;
  /** 是否有密码 */
  hasPassword: boolean;
  /** 房间成员ID列表 */
  memberIds: Set<string>;
  /** 共享流信息 */
  streams: Map<string, StreamInfo>;
  /** 创建时间 */
  createdAt: Date;
  /** 最大成员数 */
  maxMembers: number;
}

/**
 * 房间管理类
 */
export class RoomModel {
  private rooms: Map<string, ServerRoom>;

  constructor() {
    this.rooms = new Map();
  }

  /**
   * 创建房间
   */
  create(data: {
    id: string;
    name: string;
    ownerId: string;
    password?: string;
    maxMembers: number;
  }): ServerRoom {
    const room: ServerRoom = {
      id: data.id,
      name: data.name,
      ownerId: data.ownerId,
      password: data.password,
      hasPassword: !!data.password,
      memberIds: new Set([data.ownerId]),
      streams: new Map(),
      createdAt: new Date(),
      maxMembers: data.maxMembers,
    };

    this.rooms.set(room.id, room);
    return room;
  }

  /**
   * 根据ID获取房间
   */
  getById(roomId: string): ServerRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 获取所有房间
   */
  getAll(): ServerRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 添加成员到房间
   */
  addMember(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // 检查房间是否已满
    if (room.memberIds.size >= room.maxMembers) {
      return false;
    }

    room.memberIds.add(userId);
    return true;
  }

  /**
   * 从房间移除成员
   */
  removeMember(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    room.memberIds.delete(userId);
    return true;
  }

  /**
   * 添加流到房间
   */
  addStream(roomId: string, stream: StreamInfo): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    room.streams.set(stream.id, stream);
    return true;
  }

  /**
   * 从房间移除流
   */
  removeStream(roomId: string, streamId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    return room.streams.delete(streamId);
  }

  /**
   * 移除用户的所有流
   */
  removeUserStreams(roomId: string, userId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) {
      return [];
    }

    const removedStreamIds: string[] = [];
    room.streams.forEach((stream, streamId) => {
      if (stream.userId === userId) {
        room.streams.delete(streamId);
        removedStreamIds.push(streamId);
      }
    });

    return removedStreamIds;
  }

  /**
   * 转移房主
   */
  transferOwnership(roomId: string, newOwnerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // 检查新房主是否在房间内
    if (!room.memberIds.has(newOwnerId)) {
      return false;
    }

    room.ownerId = newOwnerId;
    return true;
  }

  /**
   * 删除房间
   */
  delete(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  /**
   * 检查房间是否为空
   */
  isEmpty(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.memberIds.size === 0 : true;
  }

  /**
   * 验证密码
   */
  validatePassword(roomId: string, password?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // 没有密码的房间
    if (!room.hasPassword) {
      return true;
    }

    // 有密码的房间需要验证
    return room.password === password;
  }

  /**
   * 获取房间成员数量
   */
  getMemberCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room ? room.memberIds.size : 0;
  }

  /**
   * 获取房间数量
   */
  count(): number {
    return this.rooms.size;
  }

  /**
   * 清空所有房间
   */
  clear(): void {
    this.rooms.clear();
  }

  /**
   * 转换为共享房间格式（用于客户端）
   */
  toSharedRoom(roomId: string, users: ServerUser[]): SharedRoom | undefined {
    const room = this.rooms.get(roomId);
    if (!room) {
      return undefined;
    }

    // 过滤出房间内的用户
    const members = users.filter((user) => room.memberIds.has(user.id));

    return {
      id: room.id,
      name: room.name,
      ownerId: room.ownerId,
      hasPassword: room.hasPassword,
      members: members.map((user) => ({
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        isSharing: user.isSharing,
        joinedAt: user.joinedAt,
      })),
      createdAt: room.createdAt,
      maxMembers: room.maxMembers,
    };
  }
}
