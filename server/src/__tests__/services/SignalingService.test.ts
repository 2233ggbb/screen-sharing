/**
 * SignalingService单元测试
 */

import { SignalingService } from '../../services/SignalingService';
import { RoomModel } from '../../models/Room';
import { UserModel } from '../../models/User';
import { SourceType } from '@screen-sharing/shared';

describe('SignalingService', () => {
  let signalingService: SignalingService;
  let roomModel: RoomModel;
  let userModel: UserModel;

  beforeEach(() => {
    roomModel = new RoomModel();
    userModel = new UserModel();
    signalingService = new SignalingService(roomModel, userModel);

    // 创建测试房间和用户
    roomModel.create({
      id: 'room-1',
      name: '测试房间',
      ownerId: 'user-1',
      password: 'test123',
      maxMembers: 10,
    });

    userModel.create({
      id: 'user-1',
      nickname: '用户1',
      socketId: 'socket-1',
      roomId: 'room-1',
      isHost: true,
    });

    userModel.create({
      id: 'user-2',
      nickname: '用户2',
      socketId: 'socket-2',
      roomId: 'room-1',
      isHost: false,
    });
  });

  describe('startSharing', () => {
    it('应该成功开始共享', async () => {
      const result = await signalingService.startSharing('user-1', {
        sourceId: 'screen-123',
        sourceName: '主屏幕',
        sourceType: 'screen',
        config: {
          width: 1920,
          height: 1080,
          frameRate: 30,
        },
      });

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId', 'user-1');
      expect(result).toHaveProperty('sourceType', 'screen');
      expect(result).toHaveProperty('resolution', '1920x1080');
      expect(result).toHaveProperty('fps', 30);
    });

    it('应该返回null当用户不存在', async () => {
      const result = await signalingService.startSharing('nonexistent', {
        sourceId: 'screen-123',
        sourceName: '主屏幕',
        sourceType: 'screen',
        config: {
          width: 1920,
          height: 1080,
          frameRate: 30,
        },
      });

      expect(result).toBeNull();
    });

    it('应该支持窗口共享', async () => {
      const result = await signalingService.startSharing('user-2', {
        sourceId: 'window-456',
        sourceName: 'Chrome浏览器',
        sourceType: 'window',
        config: {
          width: 1280,
          height: 720,
          frameRate: 25,
        },
      });

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('sourceType', 'window');
      expect(result).toHaveProperty('sourceName', 'Chrome浏览器');
    });
  });

  describe('stopSharing', () => {
    it('应该成功停止共享', async () => {
      // 先开始共享
      await signalingService.startSharing('user-1', {
        sourceId: 'screen-123',
        sourceName: '主屏幕',
        sourceType: 'screen',
        config: {
          width: 1920,
          height: 1080,
          frameRate: 30,
        },
      });

      const result = await signalingService.stopSharing('user-1');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('streamId');
      expect(result).toHaveProperty('roomId', 'room-1');
    });

    it('应该返回null当用户不存在', async () => {
      const result = await signalingService.stopSharing('nonexistent');
      expect(result).toBeNull();
    });

    it('应该返回null当用户未在共享', async () => {
      const result = await signalingService.stopSharing('user-1');
      expect(result).toBeNull();
    });
  });

  describe('forwardOffer', () => {
    it('应该成功转发Offer', async () => {
      const offer = {
        type: 'offer' as const,
        sdp: 'test-sdp',
      };

      const result = await signalingService.forwardOffer('user-1', 'user-2', offer);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('targetSocketId', 'socket-2');
    });

    it('应该返回null当发送者不存在', async () => {
      const offer = {
        type: 'offer' as const,
        sdp: 'test-sdp',
      };

      const result = await signalingService.forwardOffer('nonexistent', 'user-2', offer);
      expect(result).toBeNull();
    });

    it('应该返回null当接收者不存在', async () => {
      const offer = {
        type: 'offer' as const,
        sdp: 'test-sdp',
      };

      const result = await signalingService.forwardOffer('user-1', 'nonexistent', offer);
      expect(result).toBeNull();
    });

    it('应该返回null当用户不在同一房间', async () => {
      // 创建另一个房间的用户
      roomModel.create({
        id: 'room-2',
        name: '另一个房间',
        ownerId: 'user-3',
        password: 'test456',
        maxMembers: 10,
      });

      userModel.create({
        id: 'user-3',
        nickname: '用户3',
        socketId: 'socket-3',
        roomId: 'room-2',
        isHost: true,
      });

      const offer = {
        type: 'offer' as const,
        sdp: 'test-sdp',
      };

      const result = await signalingService.forwardOffer('user-1', 'user-3', offer);
      expect(result).toBeNull();
    });
  });

  describe('forwardAnswer', () => {
    it('应该成功转发Answer', async () => {
      const answer = {
        type: 'answer' as const,
        sdp: 'test-sdp',
      };

      const result = await signalingService.forwardAnswer('user-2', 'user-1', answer);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('targetSocketId', 'socket-1');
    });

    it('应该返回null当用户不存在', async () => {
      const answer = {
        type: 'answer' as const,
        sdp: 'test-sdp',
      };

      const result = await signalingService.forwardAnswer('nonexistent', 'user-1', answer);
      expect(result).toBeNull();
    });

    it('应该返回null当用户不在同一房间', async () => {
      roomModel.create({
        id: 'room-2',
        name: '另一个房间',
        ownerId: 'user-3',
        password: 'test456',
        maxMembers: 10,
      });

      userModel.create({
        id: 'user-3',
        nickname: '用户3',
        socketId: 'socket-3',
        roomId: 'room-2',
        isHost: true,
      });

      const answer = {
        type: 'answer' as const,
        sdp: 'test-sdp',
      };

      const result = await signalingService.forwardAnswer('user-1', 'user-3', answer);
      expect(result).toBeNull();
    });
  });

  describe('forwardIceCandidate', () => {
    it('应该成功转发ICE候选', async () => {
      const candidate = {
        candidate: 'candidate:test',
        sdpMid: 'audio',
        sdpMLineIndex: 0,
      };

      const result = await signalingService.forwardIceCandidate('user-1', 'user-2', candidate);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('targetSocketId', 'socket-2');
    });

    it('应该返回null当用户不存在', async () => {
      const candidate = {
        candidate: 'candidate:test',
        sdpMid: 'audio',
        sdpMLineIndex: 0,
      };

      const result = await signalingService.forwardIceCandidate('nonexistent', 'user-2', candidate);
      expect(result).toBeNull();
    });

    it('应该返回null当用户不在同一房间', async () => {
      roomModel.create({
        id: 'room-2',
        name: '另一个房间',
        ownerId: 'user-3',
        password: 'test456',
        maxMembers: 10,
      });

      userModel.create({
        id: 'user-3',
        nickname: '用户3',
        socketId: 'socket-3',
        roomId: 'room-2',
        isHost: true,
      });

      const candidate = {
        candidate: 'candidate:test',
        sdpMid: 'audio',
        sdpMLineIndex: 0,
      };

      const result = await signalingService.forwardIceCandidate('user-1', 'user-3', candidate);
      expect(result).toBeNull();
    });
  });

  describe('getRoomStreams', () => {
    it('应该获取房间内的所有流', async () => {
      // 开始两个流
      await signalingService.startSharing('user-1', {
        sourceId: 'screen-123',
        sourceName: '主屏幕',
        sourceType: 'screen',
        config: {
          width: 1920,
          height: 1080,
          frameRate: 30,
        },
      });

      await signalingService.startSharing('user-2', {
        sourceId: 'window-456',
        sourceName: 'Chrome',
        sourceType: 'window',
        config: {
          width: 1280,
          height: 720,
          frameRate: 25,
        },
      });

      const streams = signalingService.getRoomStreams('room-1');

      expect(streams).toHaveLength(2);
      expect(streams[0].userId).toBe('user-1');
      expect(streams[1].userId).toBe('user-2');
    });

    it('应该返回空数组当房间不存在', () => {
      const streams = signalingService.getRoomStreams('nonexistent');
      expect(streams).toHaveLength(0);
    });

    it('应该返回空数组当房间没有流', () => {
      const streams = signalingService.getRoomStreams('room-1');
      expect(streams).toHaveLength(0);
    });
  });
});
