/**
 * WebRTC信令处理器
 */

import { Socket } from 'socket.io';
import {
  ClientEvents,
  ServerEvents,
  ClientEventParams,
  ErrorCode,
} from '@screen-sharing/shared';
import { RoomService } from '../../services/RoomService';
import { SignalingService } from '../../services/SignalingService';
import { Logger } from '../../utils/logger';

/**
 * WebRTC处理器类
 */
export class WebRTCHandler {
  private logger: Logger;
  private roomService: RoomService;
  private signalingService: SignalingService;

  constructor(roomService: RoomService, signalingService: SignalingService) {
    this.logger = new Logger('WebRTCHandler');
    this.roomService = roomService;
    this.signalingService = signalingService;
  }

  /**
   * 注册WebRTC相关事件
   */
  register(socket: Socket): void {
    socket.on(
      ClientEvents.START_SHARING,
      this.handleStartSharing.bind(this, socket)
    );
    socket.on(
      ClientEvents.STOP_SHARING,
      this.handleStopSharing.bind(this, socket)
    );
    socket.on(
      ClientEvents.SEND_OFFER,
      this.handleSendOffer.bind(this, socket)
    );
    socket.on(
      ClientEvents.SEND_ANSWER,
      this.handleSendAnswer.bind(this, socket)
    );
    socket.on(
      ClientEvents.SEND_ICE_CANDIDATE,
      this.handleSendIceCandidate.bind(this, socket)
    );
  }

  /**
   * 处理开始共享
   */
  private async handleStartSharing(
    socket: Socket,
    data: ClientEventParams[ClientEvents.START_SHARING],
    callback?: (response: any) => void
  ): Promise<void> {
    this.logger.info('开始共享屏幕', { socketId: socket.id, data });

    const user = this.roomService.getUserBySocketId(socket.id);
    if (!user) {
      // 添加详细的调试信息
      const allUsers = this.roomService.getUserById('') || [];
      this.logger.error('查找用户失败', {
        socketId: socket.id,
        allUsers: allUsers,
        totalUsers: 'count'
      });
      
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

    const streamInfo = await this.signalingService.startSharing(user.id, data);
    if (!streamInfo) {
      const error = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: '启动共享失败',
      };
      socket.emit(ServerEvents.ERROR, error);
      if (callback) {
        callback({ success: false, error });
      }
      return;
    }

    // 通知房间内其他成员
    socket.to(user.roomId).emit(ServerEvents.USER_STARTED_SHARING, {
      userId: user.id,
      streamInfo,
    });

    if (callback) {
      callback({ success: true, data: { streamInfo } });
    }

    this.logger.info('共享已启动', { userId: user.id, streamId: streamInfo.id });
  }

  /**
   * 处理停止共享
   */
  private async handleStopSharing(
    socket: Socket,
    _data: ClientEventParams[ClientEvents.STOP_SHARING],
    callback?: (response: any) => void
  ): Promise<void> {
    this.logger.info('停止共享屏幕', { socketId: socket.id });

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

    const result = await this.signalingService.stopSharing(user.id);
    if (!result) {
      const error = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: '停止共享失败',
      };
      socket.emit(ServerEvents.ERROR, error);
      if (callback) {
        callback({ success: false, error });
      }
      return;
    }

    // 通知房间内其他成员
    socket.to(result.roomId).emit(ServerEvents.USER_STOPPED_SHARING, {
      userId: user.id,
      streamId: result.streamId,
    });

    if (callback) {
      callback({ success: true });
    }

    this.logger.info('共享已停止', { userId: user.id, streamId: result.streamId });
  }

  /**
   * 处理发送Offer
   */
  private async handleSendOffer(
    socket: Socket,
    data: ClientEventParams[ClientEvents.SEND_OFFER],
    callback?: (response: any) => void
  ): Promise<void> {
    this.logger.debug('转发Offer', { socketId: socket.id });

    const fromUser = this.roomService.getUserBySocketId(socket.id);
    if (!fromUser) {
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

    const result = await this.signalingService.forwardOffer(
      fromUser.id,
      data.targetUserId,
      data.offer
    );

    if (!result) {
      const error = {
        code: ErrorCode.CONNECTION_FAILED,
        message: '转发Offer失败',
      };
      socket.emit(ServerEvents.ERROR, error);
      if (callback) {
        callback({ success: false, error });
      }
      return;
    }

    // 转发Offer给目标用户
    socket.to(result.targetSocketId).emit(ServerEvents.RECEIVE_OFFER, {
      fromUserId: fromUser.id,
      offer: data.offer,
    });

    if (callback) {
      callback({ success: true });
    }
  }

  /**
   * 处理发送Answer
   */
  private async handleSendAnswer(
    socket: Socket,
    data: ClientEventParams[ClientEvents.SEND_ANSWER],
    callback?: (response: any) => void
  ): Promise<void> {
    this.logger.debug('转发Answer', { socketId: socket.id });

    const fromUser = this.roomService.getUserBySocketId(socket.id);
    if (!fromUser) {
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

    const result = await this.signalingService.forwardAnswer(
      fromUser.id,
      data.targetUserId,
      data.answer
    );

    if (!result) {
      const error = {
        code: ErrorCode.CONNECTION_FAILED,
        message: '转发Answer失败',
      };
      socket.emit(ServerEvents.ERROR, error);
      if (callback) {
        callback({ success: false, error });
      }
      return;
    }

    // 转发Answer给目标用户
    socket.to(result.targetSocketId).emit(ServerEvents.RECEIVE_ANSWER, {
      fromUserId: fromUser.id,
      answer: data.answer,
    });

    if (callback) {
      callback({ success: true });
    }
  }

  /**
   * 处理发送ICE候选
   */
  private async handleSendIceCandidate(
    socket: Socket,
    data: ClientEventParams[ClientEvents.SEND_ICE_CANDIDATE],
    callback?: (response: any) => void
  ): Promise<void> {
    this.logger.debug('转发ICE候选', { socketId: socket.id });

    const fromUser = this.roomService.getUserBySocketId(socket.id);
    if (!fromUser) {
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

    const result = await this.signalingService.forwardIceCandidate(
      fromUser.id,
      data.targetUserId,
      data.candidate
    );

    if (!result) {
      const error = {
        code: ErrorCode.CONNECTION_FAILED,
        message: '转发ICE候选失败',
      };
      socket.emit(ServerEvents.ERROR, error);
      if (callback) {
        callback({ success: false, error });
      }
      return;
    }

    // 转发ICE候选给目标用户
    socket.to(result.targetSocketId).emit(ServerEvents.RECEIVE_ICE_CANDIDATE, {
      fromUserId: fromUser.id,
      candidate: data.candidate,
    });

    if (callback) {
      callback({ success: true });
    }
  }
}
