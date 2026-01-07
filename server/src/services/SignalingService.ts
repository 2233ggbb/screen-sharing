/**
 * 信令服务
 * 处理WebRTC信令转发
 */

import {
  RTCSessionDescriptionData,
  IceCandidate,
  StreamInfo,
  SourceType,
} from '@screen-sharing/shared';
import { RoomModel } from '../models/Room';
import { UserModel } from '../models/User';
import { Logger } from '../utils/logger';
import { createStreamId } from '../utils/id-generator';

/**
 * 信令服务类
 */
export class SignalingService {
  private logger: Logger;
  private roomModel: RoomModel;
  private userModel: UserModel;

  constructor(roomModel: RoomModel, userModel: UserModel) {
    this.logger = new Logger('SignalingService');
    this.roomModel = roomModel;
    this.userModel = userModel;
  }

  /**
   * 开始共享
   */
  async startSharing(
    userId: string,
    data: {
      sourceId: string;
      sourceName: string;
      sourceType: 'screen' | 'window';
      config: {
        width: number;
        height: number;
        frameRate: number;
      };
    }
  ): Promise<StreamInfo | null> {
    this.logger.info('开始共享', { userId, data });

    const user = this.userModel.getById(userId);
    if (!user) {
      this.logger.warn('用户不存在', { userId });
      return null;
    }

    // 生成流ID
    const streamId = createStreamId();

    // 创建流信息
    const streamInfo: StreamInfo = {
      id: streamId,
      userId: userId,
      nickname: user.nickname,
      sourceType: data.sourceType as SourceType,
      sourceName: data.sourceName,
      resolution: `${data.config.width}x${data.config.height}`,
      fps: data.config.frameRate,
      startedAt: new Date(),
    };

    // 添加流到房间
    this.roomModel.addStream(user.roomId, streamInfo);

    // 更新用户状态
    this.userModel.update(userId, {
      isSharing: true,
      streamId: streamId,
    });

    this.logger.info('共享已启动', { userId, streamId });

    return streamInfo;
  }

  /**
   * 停止共享
   */
  async stopSharing(userId: string): Promise<{ streamId: string; roomId: string } | null> {
    this.logger.info('停止共享', { userId });

    const user = this.userModel.getById(userId);
    if (!user) {
      this.logger.warn('用户不存在', { userId });
      return null;
    }

    const streamId = user.streamId;
    if (!streamId) {
      this.logger.warn('用户未在共享', { userId });
      return null;
    }

    // 从房间移除流
    this.roomModel.removeStream(user.roomId, streamId);

    // 更新用户状态
    this.userModel.update(userId, {
      isSharing: false,
      streamId: undefined,
    });

    this.logger.info('共享已停止', { userId, streamId });

    return { streamId, roomId: user.roomId };
  }

  /**
   * 转发Offer
   */
  async forwardOffer(
    fromUserId: string,
    targetUserId: string,
    _offer: RTCSessionDescriptionData
  ): Promise<{ targetSocketId: string } | null> {
    this.logger.debug('转发Offer', { fromUserId, targetUserId });

    const fromUser = this.userModel.getById(fromUserId);
    const targetUser = this.userModel.getById(targetUserId);

    if (!fromUser || !targetUser) {
      this.logger.warn('用户不存在', { fromUserId, targetUserId });
      return null;
    }

    // 验证两个用户在同一个房间
    if (fromUser.roomId !== targetUser.roomId) {
      this.logger.warn('用户不在同一房间', {
        fromUserId,
        targetUserId,
        fromRoomId: fromUser.roomId,
        targetRoomId: targetUser.roomId,
      });
      return null;
    }

    return { targetSocketId: targetUser.socketId };
  }

  /**
   * 转发Answer
   */
  async forwardAnswer(
    fromUserId: string,
    targetUserId: string,
    _answer: RTCSessionDescriptionData
  ): Promise<{ targetSocketId: string } | null> {
    this.logger.debug('转发Answer', { fromUserId, targetUserId });

    const fromUser = this.userModel.getById(fromUserId);
    const targetUser = this.userModel.getById(targetUserId);

    if (!fromUser || !targetUser) {
      this.logger.warn('用户不存在', { fromUserId, targetUserId });
      return null;
    }

    // 验证两个用户在同一个房间
    if (fromUser.roomId !== targetUser.roomId) {
      this.logger.warn('用户不在同一房间', {
        fromUserId,
        targetUserId,
        fromRoomId: fromUser.roomId,
        targetRoomId: targetUser.roomId,
      });
      return null;
    }

    return { targetSocketId: targetUser.socketId };
  }

  /**
   * 转发ICE候选
   */
  async forwardIceCandidate(
    fromUserId: string,
    targetUserId: string,
    _candidate: IceCandidate
  ): Promise<{ targetSocketId: string } | null> {
    this.logger.debug('转发ICE候选', { fromUserId, targetUserId });

    const fromUser = this.userModel.getById(fromUserId);
    const targetUser = this.userModel.getById(targetUserId);

    if (!fromUser || !targetUser) {
      this.logger.warn('用户不存在', { fromUserId, targetUserId });
      return null;
    }

    // 验证两个用户在同一个房间
    if (fromUser.roomId !== targetUser.roomId) {
      this.logger.warn('用户不在同一房间', {
        fromUserId,
        targetUserId,
        fromRoomId: fromUser.roomId,
        targetRoomId: targetUser.roomId,
      });
      return null;
    }

    return { targetSocketId: targetUser.socketId };
  }

  /**
   * 获取房间内的所有流
   */
  getRoomStreams(roomId: string): StreamInfo[] {
    const room = this.roomModel.getById(roomId);
    if (!room) {
      return [];
    }

    return Array.from(room.streams.values());
  }
}
