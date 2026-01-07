/**
 * 房间模型单元测试
 */

import { RoomModel } from '../../models/Room';
import { ServerUser } from '../../models/User';
import { SourceType } from '@screen-sharing/shared';

describe('RoomModel', () => {
  let roomModel: RoomModel;

  beforeEach(() => {
    roomModel = new RoomModel();
  });

  describe('create', () => {
    it('应该成功创建房间', () => {
      const room = roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });

      expect(room).toBeDefined();
      expect(room.id).toBe('ROOM123');
      expect(room.name).toBe('测试房间');
      expect(room.ownerId).toBe('user1');
      expect(room.hasPassword).toBe(false);
      expect(room.memberIds.size).toBe(1);
      expect(room.memberIds.has('user1')).toBe(true);
      expect(room.streams.size).toBe(0);
      expect(room.maxMembers).toBe(10);
    });

    it('应该创建带密码的房间', () => {
      const room = roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        password: 'abc123',
        maxMembers: 10,
      });

      expect(room.hasPassword).toBe(true);
      expect(room.password).toBe('abc123');
    });
  });

  describe('getById', () => {
    it('应该通过ID获取房间', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });

      const room = roomModel.getById('ROOM123');
      expect(room).toBeDefined();
      expect(room?.id).toBe('ROOM123');
    });

    it('当房间不存在时应返回undefined', () => {
      const room = roomModel.getById('NONEXISTENT');
      expect(room).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('应该获取所有房间', () => {
      roomModel.create({
        id: 'ROOM1',
        name: '房间1',
        ownerId: 'user1',
        maxMembers: 10,
      });
      roomModel.create({
        id: 'ROOM2',
        name: '房间2',
        ownerId: 'user2',
        maxMembers: 10,
      });

      const rooms = roomModel.getAll();
      expect(rooms.length).toBe(2);
    });

    it('当没有房间时应返回空数组', () => {
      const rooms = roomModel.getAll();
      expect(rooms).toEqual([]);
    });
  });

  describe('addMember', () => {
    beforeEach(() => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 3,
      });
    });

    it('应该成功添加成员', () => {
      const result = roomModel.addMember('ROOM123', 'user2');
      expect(result).toBe(true);

      const room = roomModel.getById('ROOM123');
      expect(room?.memberIds.size).toBe(2);
      expect(room?.memberIds.has('user2')).toBe(true);
    });

    it('当房间已满时应返回false', () => {
      roomModel.addMember('ROOM123', 'user2');
      roomModel.addMember('ROOM123', 'user3');
      
      const result = roomModel.addMember('ROOM123', 'user4');
      expect(result).toBe(false);
    });

    it('当房间不存在时应返回false', () => {
      const result = roomModel.addMember('NONEXISTENT', 'user2');
      expect(result).toBe(false);
    });
  });

  describe('removeMember', () => {
    beforeEach(() => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });
      roomModel.addMember('ROOM123', 'user2');
    });

    it('应该成功移除成员', () => {
      const result = roomModel.removeMember('ROOM123', 'user2');
      expect(result).toBe(true);

      const room = roomModel.getById('ROOM123');
      expect(room?.memberIds.has('user2')).toBe(false);
    });

    it('当房间不存在时应返回false', () => {
      const result = roomModel.removeMember('NONEXISTENT', 'user2');
      expect(result).toBe(false);
    });
  });

  describe('addStream', () => {
    beforeEach(() => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });
    });

    it('应该成功添加流', () => {
      const stream = {
        id: 'stream1',
        userId: 'user1',
        nickname: '用户1',
        sourceType: SourceType.SCREEN,
        sourceName: '整个屏幕',
        resolution: '1920x1080',
        fps: 30,
        startedAt: new Date(),
      };

      const result = roomModel.addStream('ROOM123', stream);
      expect(result).toBe(true);

      const room = roomModel.getById('ROOM123');
      expect(room?.streams.size).toBe(1);
      expect(room?.streams.get('stream1')).toEqual(stream);
    });

    it('当房间不存在时应返回false', () => {
      const stream = {
        id: 'stream1',
        userId: 'user1',
        nickname: '用户1',
        sourceType: SourceType.SCREEN,
        sourceName: '整个屏幕',
        resolution: '1920x1080',
        fps: 30,
        startedAt: new Date(),
      };

      const result = roomModel.addStream('NONEXISTENT', stream);
      expect(result).toBe(false);
    });
  });

  describe('removeStream', () => {
    beforeEach(() => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });
      roomModel.addStream('ROOM123', {
        id: 'stream1',
        userId: 'user1',
        nickname: '用户1',
        sourceType: SourceType.SCREEN,
        sourceName: '整个屏幕',
        resolution: '1920x1080',
        fps: 30,
        startedAt: new Date(),
      });
    });

    it('应该成功移除流', () => {
      const result = roomModel.removeStream('ROOM123', 'stream1');
      expect(result).toBe(true);

      const room = roomModel.getById('ROOM123');
      expect(room?.streams.size).toBe(0);
    });

    it('当房间不存在时应返回false', () => {
      const result = roomModel.removeStream('NONEXISTENT', 'stream1');
      expect(result).toBe(false);
    });

    it('当流不存在时应返回false', () => {
      const result = roomModel.removeStream('ROOM123', 'nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('removeUserStreams', () => {
    beforeEach(() => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });
      roomModel.addStream('ROOM123', {
        id: 'stream1',
        userId: 'user1',
        nickname: '用户1',
        sourceType: SourceType.SCREEN,
        sourceName: '整个屏幕',
        resolution: '1920x1080',
        fps: 30,
        startedAt: new Date(),
      });
      roomModel.addStream('ROOM123', {
        id: 'stream2',
        userId: 'user1',
        nickname: '用户1',
        sourceType: SourceType.WINDOW,
        sourceName: '应用窗口',
        resolution: '1280x720',
        fps: 24,
        startedAt: new Date(),
      });
      roomModel.addStream('ROOM123', {
        id: 'stream3',
        userId: 'user2',
        nickname: '用户2',
        sourceType: SourceType.SCREEN,
        sourceName: '整个屏幕',
        resolution: '1920x1080',
        fps: 30,
        startedAt: new Date(),
      });
    });

    it('应该移除指定用户的所有流', () => {
      const removedIds = roomModel.removeUserStreams('ROOM123', 'user1');
      
      expect(removedIds.length).toBe(2);
      expect(removedIds).toContain('stream1');
      expect(removedIds).toContain('stream2');

      const room = roomModel.getById('ROOM123');
      expect(room?.streams.size).toBe(1);
      expect(room?.streams.has('stream3')).toBe(true);
    });

    it('当房间不存在时应返回空数组', () => {
      const removedIds = roomModel.removeUserStreams('NONEXISTENT', 'user1');
      expect(removedIds).toEqual([]);
    });

    it('当用户没有流时应返回空数组', () => {
      const removedIds = roomModel.removeUserStreams('ROOM123', 'user3');
      expect(removedIds).toEqual([]);
    });
  });

  describe('transferOwnership', () => {
    beforeEach(() => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });
      roomModel.addMember('ROOM123', 'user2');
    });

    it('应该成功转移房主权限', () => {
      const result = roomModel.transferOwnership('ROOM123', 'user2');
      expect(result).toBe(true);

      const room = roomModel.getById('ROOM123');
      expect(room?.ownerId).toBe('user2');
    });

    it('当新房主不在房间内时应返回false', () => {
      const result = roomModel.transferOwnership('ROOM123', 'user3');
      expect(result).toBe(false);
    });

    it('当房间不存在时应返回false', () => {
      const result = roomModel.transferOwnership('NONEXISTENT', 'user2');
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('应该成功删除房间', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });

      const result = roomModel.delete('ROOM123');
      expect(result).toBe(true);
      expect(roomModel.getById('ROOM123')).toBeUndefined();
    });

    it('当房间不存在时应返回false', () => {
      const result = roomModel.delete('NONEXISTENT');
      expect(result).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('当房间为空时应返回true', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });
      roomModel.removeMember('ROOM123', 'user1');

      const result = roomModel.isEmpty('ROOM123');
      expect(result).toBe(true);
    });

    it('当房间有成员时应返回false', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });

      const result = roomModel.isEmpty('ROOM123');
      expect(result).toBe(false);
    });

    it('当房间不存在时应返回true', () => {
      const result = roomModel.isEmpty('NONEXISTENT');
      expect(result).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('对于无密码房间应返回true', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });

      const result = roomModel.validatePassword('ROOM123');
      expect(result).toBe(true);
    });

    it('密码正确时应返回true', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        password: 'abc123',
        maxMembers: 10,
      });

      const result = roomModel.validatePassword('ROOM123', 'abc123');
      expect(result).toBe(true);
    });

    it('密码错误时应返回false', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        password: 'abc123',
        maxMembers: 10,
      });

      const result = roomModel.validatePassword('ROOM123', 'wrong');
      expect(result).toBe(false);
    });

    it('当房间不存在时应返回false', () => {
      const result = roomModel.validatePassword('NONEXISTENT', 'abc123');
      expect(result).toBe(false);
    });
  });

  describe('getMemberCount', () => {
    it('应该返回正确的成员数量', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });
      roomModel.addMember('ROOM123', 'user2');

      const count = roomModel.getMemberCount('ROOM123');
      expect(count).toBe(2);
    });

    it('当房间不存在时应返回0', () => {
      const count = roomModel.getMemberCount('NONEXISTENT');
      expect(count).toBe(0);
    });
  });

  describe('count', () => {
    it('应该返回正确的房间数量', () => {
      roomModel.create({
        id: 'ROOM1',
        name: '房间1',
        ownerId: 'user1',
        maxMembers: 10,
      });
      roomModel.create({
        id: 'ROOM2',
        name: '房间2',
        ownerId: 'user2',
        maxMembers: 10,
      });

      const count = roomModel.count();
      expect(count).toBe(2);
    });
  });

  describe('clear', () => {
    it('应该清空所有房间', () => {
      roomModel.create({
        id: 'ROOM1',
        name: '房间1',
        ownerId: 'user1',
        maxMembers: 10,
      });
      roomModel.create({
        id: 'ROOM2',
        name: '房间2',
        ownerId: 'user2',
        maxMembers: 10,
      });

      roomModel.clear();
      expect(roomModel.count()).toBe(0);
    });
  });

  describe('toSharedRoom', () => {
    it('应该转换为共享房间格式', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });

      const users: ServerUser[] = [
        {
          id: 'user1',
          nickname: '用户1',
          socketId: 'socket1',
          roomId: 'ROOM123',
          isHost: true,
          isSharing: false,
          joinedAt: new Date(),
          lastActiveAt: new Date(),
        },
      ];

      const sharedRoom = roomModel.toSharedRoom('ROOM123', users);
      expect(sharedRoom).toBeDefined();
      expect(sharedRoom?.id).toBe('ROOM123');
      expect(sharedRoom?.name).toBe('测试房间');
      expect(sharedRoom?.members.length).toBe(1);
      expect(sharedRoom?.members[0].nickname).toBe('用户1');
    });

    it('当房间不存在时应返回undefined', () => {
      const users: ServerUser[] = [];
      const sharedRoom = roomModel.toSharedRoom('NONEXISTENT', users);
      expect(sharedRoom).toBeUndefined();
    });

    it('应该只包含房间内的用户', () => {
      roomModel.create({
        id: 'ROOM123',
        name: '测试房间',
        ownerId: 'user1',
        maxMembers: 10,
      });

      const users: ServerUser[] = [
        {
          id: 'user1',
          nickname: '用户1',
          socketId: 'socket1',
          roomId: 'ROOM123',
          isHost: true,
          isSharing: false,
          joinedAt: new Date(),
          lastActiveAt: new Date(),
        },
        {
          id: 'user2',
          nickname: '用户2',
          socketId: 'socket2',
          roomId: 'OTHER_ROOM',
          isHost: false,
          isSharing: false,
          joinedAt: new Date(),
          lastActiveAt: new Date(),
        },
      ];

      const sharedRoom = roomModel.toSharedRoom('ROOM123', users);
      expect(sharedRoom?.members.length).toBe(1);
      expect(sharedRoom?.members[0].id).toBe('user1');
    });
  });
});
