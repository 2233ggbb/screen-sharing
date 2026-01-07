/**
 * 用户模型单元测试
 */

import { UserModel } from '../../models/User';

describe('UserModel', () => {
  let userModel: UserModel;

  beforeEach(() => {
    userModel = new UserModel();
  });

  describe('create', () => {
    it('应该成功创建用户', () => {
      const user = userModel.create({
        id: 'user1',
        nickname: '测试用户',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: true,
      });

      expect(user).toBeDefined();
      expect(user.id).toBe('user1');
      expect(user.nickname).toBe('测试用户');
      expect(user.socketId).toBe('socket1');
      expect(user.roomId).toBe('ROOM123');
      expect(user.isHost).toBe(true);
      expect(user.isSharing).toBe(false);
      expect(user.joinedAt).toBeInstanceOf(Date);
      expect(user.lastActiveAt).toBeInstanceOf(Date);
    });

    it('应该创建带头像的用户', () => {
      const user = userModel.create({
        id: 'user1',
        nickname: '测试用户',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: false,
        avatar: 'https://example.com/avatar.png',
      });

      expect(user.avatar).toBe('https://example.com/avatar.png');
    });
  });

  describe('getById', () => {
    it('应该通过ID获取用户', () => {
      userModel.create({
        id: 'user1',
        nickname: '测试用户',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: true,
      });

      const user = userModel.getById('user1');
      expect(user).toBeDefined();
      expect(user?.id).toBe('user1');
    });

    it('当用户不存在时应返回undefined', () => {
      const user = userModel.getById('nonexistent');
      expect(user).toBeUndefined();
    });
  });

  describe('getBySocketId', () => {
    it('应该通过SocketID获取用户', () => {
      userModel.create({
        id: 'user1',
        nickname: '测试用户',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: true,
      });

      const user = userModel.getBySocketId('socket1');
      expect(user).toBeDefined();
      expect(user?.socketId).toBe('socket1');
    });

    it('当用户不存在时应返回undefined', () => {
      const user = userModel.getBySocketId('nonexistent');
      expect(user).toBeUndefined();
    });
  });

  describe('getByRoomId', () => {
    beforeEach(() => {
      userModel.create({
        id: 'user1',
        nickname: '用户1',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: true,
      });
      userModel.create({
        id: 'user2',
        nickname: '用户2',
        socketId: 'socket2',
        roomId: 'ROOM123',
        isHost: false,
      });
      userModel.create({
        id: 'user3',
        nickname: '用户3',
        socketId: 'socket3',
        roomId: 'ROOM456',
        isHost: true,
      });
    });

    it('应该获取指定房间的所有用户', () => {
      const users = userModel.getByRoomId('ROOM123');
      expect(users.length).toBe(2);
      expect(users.map(u => u.id)).toContain('user1');
      expect(users.map(u => u.id)).toContain('user2');
    });

    it('当房间没有用户时应返回空数组', () => {
      const users = userModel.getByRoomId('EMPTY_ROOM');
      expect(users).toEqual([]);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      userModel.create({
        id: 'user1',
        nickname: '测试用户',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: false,
      });
    });

    it('应该成功更新用户信息', () => {
      const updatedUser = userModel.update('user1', {
        nickname: '新昵称',
        isSharing: true,
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.nickname).toBe('新昵称');
      expect(updatedUser?.isSharing).toBe(true);
    });

    it('应该更新lastActiveAt时间', () => {
      const beforeUpdate = new Date();
      const updatedUser = userModel.update('user1', { isSharing: true });
      
      expect(updatedUser?.lastActiveAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });

    it('当用户不存在时应返回undefined', () => {
      const updatedUser = userModel.update('nonexistent', { nickname: '新昵称' });
      expect(updatedUser).toBeUndefined();
    });

    it('应该保留未更新的字段', () => {
      const updatedUser = userModel.update('user1', { isSharing: true });
      
      expect(updatedUser?.id).toBe('user1');
      expect(updatedUser?.socketId).toBe('socket1');
      expect(updatedUser?.roomId).toBe('ROOM123');
    });
  });

  describe('delete', () => {
    it('应该成功删除用户', () => {
      userModel.create({
        id: 'user1',
        nickname: '测试用户',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: true,
      });

      const result = userModel.delete('user1');
      expect(result).toBe(true);
      expect(userModel.getById('user1')).toBeUndefined();
    });

    it('当用户不存在时应返回false', () => {
      const result = userModel.delete('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getAll', () => {
    it('应该获取所有用户', () => {
      userModel.create({
        id: 'user1',
        nickname: '用户1',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: true,
      });
      userModel.create({
        id: 'user2',
        nickname: '用户2',
        socketId: 'socket2',
        roomId: 'ROOM123',
        isHost: false,
      });

      const users = userModel.getAll();
      expect(users.length).toBe(2);
    });

    it('当没有用户时应返回空数组', () => {
      const users = userModel.getAll();
      expect(users).toEqual([]);
    });
  });

  describe('clear', () => {
    it('应该清空所有用户', () => {
      userModel.create({
        id: 'user1',
        nickname: '用户1',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: true,
      });
      userModel.create({
        id: 'user2',
        nickname: '用户2',
        socketId: 'socket2',
        roomId: 'ROOM123',
        isHost: false,
      });

      userModel.clear();
      expect(userModel.count()).toBe(0);
    });
  });

  describe('count', () => {
    it('应该返回正确的用户数量', () => {
      userModel.create({
        id: 'user1',
        nickname: '用户1',
        socketId: 'socket1',
        roomId: 'ROOM123',
        isHost: true,
      });
      userModel.create({
        id: 'user2',
        nickname: '用户2',
        socketId: 'socket2',
        roomId: 'ROOM123',
        isHost: false,
      });

      const count = userModel.count();
      expect(count).toBe(2);
    });

    it('当没有用户时应返回0', () => {
      const count = userModel.count();
      expect(count).toBe(0);
    });
  });
});
