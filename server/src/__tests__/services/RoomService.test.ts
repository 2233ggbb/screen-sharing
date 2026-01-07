/**
 * RoomService单元测试
 */

import { ErrorCode } from '@screen-sharing/shared';
import { RoomService } from '../../services/RoomService';
import { RoomModel } from '../../models/Room';
import { UserModel } from '../../models/User';

describe('RoomService', () => {
  let roomService: RoomService;
  let roomModel: RoomModel;
  let userModel: UserModel;

  beforeEach(() => {
    roomModel = new RoomModel();
    userModel = new UserModel();
    roomService = new RoomService(roomModel, userModel);
  });

  describe('createRoom', () => {
    it('应该成功创建房间', async () => {
      const request = {
        roomName: '测试房间',
        nickname: '测试用户',
        password: 'test123',
        maxMembers: 10,
      };

      const result = await roomService.createRoom(request, 'socket-123');

      expect(result).toHaveProperty('room');
      expect(result).toHaveProperty('userId');
      
      if ('room' in result) {
        expect(result.room.name).toBe('测试房间');
        expect(result.room.members).toHaveLength(1);
        expect(result.room.members[0].nickname).toBe('测试用户');
      }
    });

    it('应该拒绝无效的房间名称', async () => {
      const request = {
        roomName: '',
        nickname: '测试用户',
        password: 'test123',
        maxMembers: 10,
      };

      const result = await roomService.createRoom(request, 'socket-123');

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('message');
    });

    it('应该拒绝无效的昵称', async () => {
      const request = {
        roomName: '测试房间',
        nickname: 'a',
        password: 'test123',
        maxMembers: 10,
      };

      const result = await roomService.createRoom(request, 'socket-123');

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('message');
    });

    it('应该拒绝过长的密码', async () => {
      const request = {
        roomName: '测试房间',
        nickname: '测试用户',
        password: 'a'.repeat(30),
        maxMembers: 10,
      };

      const result = await roomService.createRoom(request, 'socket-123');

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('message');
    });
  });

  describe('joinRoom', () => {
    it('应该成功加入房间', async () => {
      // 先创建房间
      const createResult = await roomService.createRoom({
        roomName: '测试房间',
        nickname: '房主',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-1');

      if ('room' in createResult) {
        const joinResult = await roomService.joinRoom({
          roomId: createResult.room.id,
          nickname: '新成员',
          password: 'test123',
        }, 'socket-2');

        expect(joinResult).toHaveProperty('room');
        expect(joinResult).toHaveProperty('userId');
        
        if ('room' in joinResult) {
          expect(joinResult.room.members).toHaveLength(2);
        }
      }
    });

    it('应该拒绝加入不存在的房间', async () => {
      const result = await roomService.joinRoom({
        roomId: 'nonexistent',
        nickname: '测试用户',
        password: 'test123',
      }, 'socket-123');

      expect(result).toHaveProperty('code', ErrorCode.ROOM_NOT_FOUND);
    });

    it('应该拒绝错误的密码', async () => {
      const createResult = await roomService.createRoom({
        roomName: '测试房间',
        nickname: '房主',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-1');

      if ('room' in createResult) {
        const joinResult = await roomService.joinRoom({
          roomId: createResult.room.id,
          nickname: '新成员',
          password: 'wrongpassword',
        }, 'socket-2');

        expect(joinResult).toHaveProperty('code', ErrorCode.WRONG_PASSWORD);
      }
    });
  });

  describe('leaveRoom', () => {
    it('应该成功离开房间', async () => {
      const createResult = await roomService.createRoom({
        roomName: '测试房间',
        nickname: '房主',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-1');

      if ('room' in createResult) {
        const leaveResult = await roomService.leaveRoom(createResult.userId);

        expect(leaveResult).not.toBeNull();
        expect(leaveResult).toHaveProperty('roomId');
      }
    });

    it('应该返回null当用户不存在', async () => {
      const result = await roomService.leaveRoom('nonexistent-user');
      expect(result).toBeNull();
    });

    it('应该转移房主权限', async () => {
      const createResult = await roomService.createRoom({
        roomName: '测试房间',
        nickname: '房主',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-1');

      if ('room' in createResult) {
        const joinResult = await roomService.joinRoom({
          roomId: createResult.room.id,
          nickname: '新成员',
          password: 'test123',
        }, 'socket-2');

        if ('room' in joinResult) {
          const leaveResult = await roomService.leaveRoom(createResult.userId);
          expect(leaveResult).toHaveProperty('newOwnerId');
        }
      }
    });
  });

  describe('getRoomInfo', () => {
    it('应该返回房间信息', async () => {
      const createResult = await roomService.createRoom({
        roomName: '测试房间',
        nickname: '房主',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-1');

      if ('room' in createResult) {
        const roomInfo = roomService.getRoomInfo(createResult.room.id);
        expect(roomInfo).not.toBeNull();
        expect(roomInfo?.name).toBe('测试房间');
      }
    });

    it('应该返回null当房间不存在', () => {
      const roomInfo = roomService.getRoomInfo('nonexistent');
      expect(roomInfo).toBeNull();
    });
  });

  describe('getUserBySocketId', () => {
    it('应该根据socketId获取用户', async () => {
      const createResult = await roomService.createRoom({
        roomName: '测试房间',
        nickname: '房主',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-123');

      const user = roomService.getUserBySocketId('socket-123');
      expect(user).toBeDefined();
      expect(user?.nickname).toBe('房主');
    });
  });

  describe('getUserById', () => {
    it('应该根据userId获取用户', async () => {
      const createResult = await roomService.createRoom({
        roomName: '测试房间',
        nickname: '房主',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-1');

      if ('room' in createResult) {
        const user = roomService.getUserById(createResult.userId);
        expect(user).toBeDefined();
        expect(user?.nickname).toBe('房主');
      }
    });
  });

  describe('getRoomUsers', () => {
    it('应该获取房间内所有用户', async () => {
      const createResult = await roomService.createRoom({
        roomName: '测试房间',
        nickname: '房主',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-1');

      if ('room' in createResult) {
        const users = roomService.getRoomUsers(createResult.room.id);
        expect(users).toHaveLength(1);
        expect(users[0].nickname).toBe('房主');
      }
    });
  });

  describe('getRoomsList', () => {
    it('应该获取所有房间列表', async () => {
      await roomService.createRoom({
        roomName: '房间1',
        nickname: '用户1',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-1');

      await roomService.createRoom({
        roomName: '房间2',
        nickname: '用户2',
        password: 'test456',
        maxMembers: 5,
      }, 'socket-2');

      const rooms = roomService.getRoomsList();
      expect(rooms).toHaveLength(2);
      expect(rooms[0].name).toBe('房间1');
      expect(rooms[1].name).toBe('房间2');
    });
  });

  describe('cleanupEmptyRooms', () => {
    it('应该清理空房间', async () => {
      const createResult = await roomService.createRoom({
        roomName: '测试房间',
        nickname: '房主',
        password: 'test123',
        maxMembers: 10,
      }, 'socket-1');

      if ('room' in createResult) {
        await roomService.leaveRoom(createResult.userId);
        const cleaned = roomService.cleanupEmptyRooms();
        expect(cleaned).toBe(0); // 已经在leaveRoom时清理了
      }
    });
  });
});
