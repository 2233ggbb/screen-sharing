/**
 * WebRTC 信令处理器（增强版）
 * 集成 NAT 检测和连接协调功能
 */

import { Socket, Server as SocketIOServer } from 'socket.io';
import {
  ClientEvents,
  ServerEvents,
  ClientEventParams,
  ErrorCode,
} from '@screen-sharing/shared';
import { RoomService } from '../../services/RoomService';
import { SignalingService } from '../../services/SignalingService';
import { NATDetectionService } from '../../services/NATDetectionService';
import { ConnectionCoordinator } from '../../services/ConnectionCoordinator';
import { Logger } from '../../utils/logger';

/**
 * WebRTC 处理器类（增强版）
 */
export class WebRTCHandlerEnhanced {
  private logger: Logger;
  private roomService: RoomService;
  private signalingService: SignalingService;
  private natDetector: NATDetectionService;
  private coordinator: ConnectionCoordinator;

  // 存储用户的 NAT 信息
  private userNATInfo = new Map<
    string,
    {
      requiresSync: boolean;
      natType: string;
    }
  >();

  private readonly enableCoordination: boolean;

  constructor(
    roomService: RoomService,
    signalingService: SignalingService,
    io: SocketIOServer
  ) {
    this.logger = new Logger('WebRTCHandler');
    this.roomService = roomService;
    this.signalingService = signalingService;
    this.natDetector = new NATDetectionService();
    this.coordinator = new ConnectionCoordinator();

    const raw = String(process.env.ENABLE_ICE_COORDINATION || '').toLowerCase();
    this.enableCoordination = ['true', '1', 'yes'].includes(raw);
    this.logger.info(`ICE 协调模式: ${this.enableCoordination ? '启用' : '禁用'}`);

    // 保存 io 实例供后续使用
    (this as any).io = io;
  }

  /**
   * 注册 WebRTC 相关事件
   */
  register(socket: Socket): void {
    // 原有事件
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

    // 新增事件
    socket.on(
      ClientEvents.DETECT_NAT_TYPE,
      this.handleDetectNAT.bind(this, socket)
    );
    socket.on(
      ClientEvents.ICE_GATHERING_COMPLETE,
      this.handleIceGatheringComplete.bind(this, socket)
    );
  }

  /**
   * 处理 NAT 检测请求
   */
  private async handleDetectNAT(
    socket: Socket,
    data: ClientEventParams[ClientEvents.DETECT_NAT_TYPE]
  ): Promise<void> {
    this.logger.info('收到 NAT 检测请求', { socketId: socket.id });

    try {
      // 获取客户端 IP
      const clientIp =
        socket.handshake.address || socket.conn.remoteAddress || '0.0.0.0';

      this.logger.debug('客户端 IP', { clientIp });

      // 执行 NAT 检测（简化版）
      const result = await this.natDetector.detectNATTypeSimple(clientIp);

      // 保存用户 NAT 信息
      const user = this.roomService.getUserBySocketId(socket.id);
      if (user) {
        this.userNATInfo.set(user.id, {
          requiresSync: result.requiresSync,
          natType: result.type,
        });
      }

      // 返回检测结果
      socket.emit(ServerEvents.NAT_TYPE_DETECTED, result);

      this.logger.info('NAT 检测完成', {
        type: result.type,
        canP2P: result.canP2P,
        requiresSync: result.requiresSync,
      });
    } catch (error) {
      this.logger.error('NAT 检测失败', error);
      socket.emit(ServerEvents.ERROR, {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'NAT 检测失败',
      });
    }
  }

  /**
   * 处理开始共享（集成协调器）
   */
  private async handleStartSharing(
    socket: Socket,
    data: ClientEventParams[ClientEvents.START_SHARING],
    callback?: (response: any) => void
  ): Promise<void> {
    this.logger.info('开始共享屏幕', { socketId: socket.id });

    const user = this.roomService.getUserBySocketId(socket.id);
    if (!user) {
      const error = {
        code: ErrorCode.USER_NOT_FOUND,
        message: '用户不存在',
      };
      socket.emit(ServerEvents.ERROR, error);
      callback?.({ success: false, error });
      return;
    }

    const streamInfo = await this.signalingService.startSharing(user.id, data);
    if (!streamInfo) {
      const error = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: '启动共享失败',
      };
      socket.emit(ServerEvents.ERROR, error);
      callback?.({ success: false, error });
      return;
    }

    // 获取房间内其他成员
    const roomMembers = this.roomService.getRoomUsers(user.roomId);
    const otherUsers = roomMembers.filter((u: any) => u.id !== user.id);

    // 检查是否需要为这些连接启用协调
    // 默认关闭：由于简化 NAT 检测误判概率高，且“候选缓存协调”可能降低 Trickle ICE 的成功率。
    const userNAT = this.userNATInfo.get(user.id);

    for (const otherUser of otherUsers) {
      const otherNAT = this.userNATInfo.get(otherUser.id);

      // 只有在明确启用时才启用协调模式
      if (this.enableCoordination && (userNAT?.requiresSync || otherNAT?.requiresSync)) {
        this.coordinator.registerConnection(
          user.id,
          socket.id,
          otherUser.id,
          otherUser.socketId
        );

        this.logger.info(`🔧 启用协调模式`, {
          userA: user.id,
          userB: otherUser.id,
          reason: userNAT?.requiresSync
            ? `${user.id} 需要协调`
            : `${otherUser.id} 需要协调`,
        });
      } else {
        this.logger.debug('未启用协调模式（使用 Trickle ICE 直通）', {
          enableCoordination: this.enableCoordination,
          userA: user.id,
          userB: otherUser.id,
        });
      }
    }

    // 通知房间内其他成员
    socket.to(user.roomId).emit(ServerEvents.USER_STARTED_SHARING, {
      userId: user.id,
      streamInfo,
    });

    callback?.({ success: true, data: { streamInfo } });
    this.logger.info('共享已启动', { userId: user.id, streamId: streamInfo.id });
  }

  /**
   * 处理 ICE 候选（集成协调器）
   */
  private async handleSendIceCandidate(
    socket: Socket,
    data: ClientEventParams[ClientEvents.SEND_ICE_CANDIDATE],
    callback?: (response: any) => void
  ): Promise<void> {
    const fromUser = this.roomService.getUserBySocketId(socket.id);
    if (!fromUser) {
      const error = {
        code: ErrorCode.USER_NOT_FOUND,
        message: '用户不存在',
      };
      socket.emit(ServerEvents.ERROR, error);
      callback?.({ success: false, error });
      return;
    }

    // 尝试添加到协调器
    const result = this.coordinator.addCandidate(
      fromUser.id,
      data.targetUserId,
      data.candidate
    );

    // 如果不需要协调，立即转发
    if (result.shouldForward) {
      const forwardResult = await this.signalingService.forwardIceCandidate(
        fromUser.id,
        data.targetUserId,
        data.candidate
      );

      if (!forwardResult) {
        const error = {
          code: ErrorCode.CONNECTION_FAILED,
          message: '转发ICE候选失败',
        };
        socket.emit(ServerEvents.ERROR, error);
        callback?.({ success: false, error });
        return;
      }

      // 转发给目标用户
      socket.to(forwardResult.targetSocketId).emit(ServerEvents.RECEIVE_ICE_CANDIDATE, {
        fromUserId: fromUser.id,
        candidate: data.candidate,
      });
    } else {
      this.logger.debug('候选已缓存，等待同步释放', {
        from: fromUser.id,
        to: data.targetUserId,
      });
    }

    callback?.({ success: true });
  }

  /**
   * 处理 ICE 收集完成通知
   */
  private async handleIceGatheringComplete(
    socket: Socket,
    data: ClientEventParams[ClientEvents.ICE_GATHERING_COMPLETE]
  ): Promise<void> {
    const user = this.roomService.getUserBySocketId(socket.id);
    if (!user) {
      this.logger.warn('用户不存在，无法处理 ICE 收集完成通知');
      return;
    }

    this.logger.info('收到 ICE 收集完成通知', {
      userId: user.id,
      targetUserId: data.targetUserId,
      connectionId: data.connectionId,
    });

    // 通知协调器
    const io = (this as any).io as SocketIOServer;
    await this.coordinator.markReady(user.id, data.connectionId, io);
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
      callback?.({ success: false, error });
      return;
    }

    const result = await this.signalingService.stopSharing(user.id);
    if (!result) {
      const error = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: '停止共享失败',
      };
      socket.emit(ServerEvents.ERROR, error);
      callback?.({ success: false, error });
      return;
    }

    // 通知房间内其他成员
    socket.to(result.roomId).emit(ServerEvents.USER_STOPPED_SHARING, {
      userId: user.id,
      streamId: result.streamId,
    });

    callback?.({ success: true });
    this.logger.info('共享已停止', { userId: user.id, streamId: result.streamId });
  }

  /**
   * 处理发送 Offer
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
      callback?.({ success: false, error });
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
      callback?.({ success: false, error });
      return;
    }

    // 转发Offer给目标用户
    socket.to(result.targetSocketId).emit(ServerEvents.RECEIVE_OFFER, {
      fromUserId: fromUser.id,
      offer: data.offer,
    });

    callback?.({ success: true });
  }

  /**
   * 处理发送 Answer
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
      callback?.({ success: false, error });
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
      callback?.({ success: false, error });
      return;
    }

    // 转发Answer给目标用户
    socket.to(result.targetSocketId).emit(ServerEvents.RECEIVE_ANSWER, {
      fromUserId: fromUser.id,
      answer: data.answer,
    });

    callback?.({ success: true });
  }

  /**
   * 清理用户 NAT 信息（用户离开时调用）
   */
  cleanupUser(userId: string): void {
    this.userNATInfo.delete(userId);
    this.logger.debug('清理用户 NAT 信息', { userId });
  }

  /**
   * 销毁处理器
   */
  destroy(): void {
    this.natDetector.destroy();
    this.coordinator.destroy();
    this.userNATInfo.clear();
    this.logger.info('WebRTC Handler 已销毁');
  }
}
