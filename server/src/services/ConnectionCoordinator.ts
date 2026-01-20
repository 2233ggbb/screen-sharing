/**
 * 连接协调服务
 * 协调双方的 ICE 候选交换时序，提高端口受限型 NAT 的连接成功率
 */

import { Server as SocketIOServer } from 'socket.io';
import { ServerEvents } from '@screen-sharing/shared';
import { Logger } from '../utils/logger';

interface PendingConnection {
  userA: string;
  userB: string;
  socketA: string; // Socket ID
  socketB: string;
  candidatesA: RTCIceCandidate[];
  candidatesB: RTCIceCandidate[];
  readyA: boolean;
  readyB: boolean;
  createdAt: number;
}

export class ConnectionCoordinator {
  private logger: Logger;
  private pendingConnections = new Map<string, PendingConnection>();
  private cleanupInterval: NodeJS.Timeout;

  // 配置
  private readonly CONNECTION_TIMEOUT = 30000; // 30 秒
  private readonly CLEANUP_INTERVAL = 10000; // 10 秒

  constructor() {
    this.logger = new Logger('Coordinator');
    this.startCleanupTimer();
  }

  /**
   * 注册需要协调的连接对
   */
  registerConnection(
    userA: string,
    socketA: string,
    userB: string,
    socketB: string
  ): string {
    const connectionId = this.getConnectionId(userA, userB);

    // 检查是否已存在
    if (this.pendingConnections.has(connectionId)) {
      this.logger.warn(`连接对 ${connectionId} 已存在，跳过注册`);
      return connectionId;
    }

    this.pendingConnections.set(connectionId, {
      userA,
      userB,
      socketA,
      socketB,
      candidatesA: [],
      candidatesB: [],
      readyA: false,
      readyB: false,
      createdAt: Date.now(),
    });

    this.logger.info(`📝 注册连接协调`, {
      connectionId,
      userA,
      userB,
    });

    return connectionId;
  }

  /**
   * 添加 ICE 候选（不立即转发，先缓存）
   * @returns shouldForward - 是否应该立即转发（true=立即转发，false=缓存）
   */
  addCandidate(
    fromUser: string,
    toUser: string,
    candidate: RTCIceCandidate
  ): { shouldForward: boolean } {
    const connectionId = this.getConnectionId(fromUser, toUser);
    const conn = this.pendingConnections.get(connectionId);

    if (!conn) {
      // 没有注册协调，说明是普通连接，立即转发
      return { shouldForward: true };
    }

    // 缓存候选
    if (fromUser === conn.userA) {
      conn.candidatesA.push(candidate);
      this.logger.debug(`💾 缓存候选 A->B`, {
        from: fromUser,
        to: toUser,
        total: conn.candidatesA.length,
      });
    } else if (fromUser === conn.userB) {
      conn.candidatesB.push(candidate);
      this.logger.debug(`💾 缓存候选 B->A`, {
        from: fromUser,
        to: toUser,
        total: conn.candidatesB.length,
      });
    }

    // 不立即转发
    return { shouldForward: false };
  }

  /**
   * 标记一方 ICE 收集完成
   */
  async markReady(
    user: string,
    connectionId: string,
    io: SocketIOServer
  ): Promise<void> {
    const conn = this.pendingConnections.get(connectionId);

    if (!conn) {
      this.logger.warn(`连接 ${connectionId} 不存在，无法标记就绪`);
      return;
    }

    // 标记准备就绪
    if (user === conn.userA) {
      conn.readyA = true;
    } else if (user === conn.userB) {
      conn.readyB = true;
    } else {
      this.logger.warn(`用户 ${user} 不属于连接 ${connectionId}`);
      return;
    }

    this.logger.info(`✅ ${user} ICE 收集完成`, {
      connectionId,
      statusA: conn.readyA ? '✅ 就绪' : '⏳ 等待',
      statusB: conn.readyB ? '✅ 就绪' : '⏳ 等待',
      candidatesA: conn.candidatesA.length,
      candidatesB: conn.candidatesB.length,
    });

    // 如果双方都准备好了，同步释放候选
    if (conn.readyA && conn.readyB) {
      await this.syncReleaseCandidates(conn, io);
    }
  }

  /**
   * 同步释放候选 - 核心逻辑
   * 这是提高成功率的关键：双方几乎同时收到对方的所有候选
   */
  private async syncReleaseCandidates(
    conn: PendingConnection,
    io: SocketIOServer
  ): Promise<void> {
    const connectionId = this.getConnectionId(conn.userA, conn.userB);

    this.logger.info(`🚀 同步释放候选`, {
      connectionId,
      candidatesA: conn.candidatesA.length,
      candidatesB: conn.candidatesB.length,
      userA: conn.userA,
      userB: conn.userB,
    });

    // 获取双方的 Socket
    const socketA = io.sockets.sockets.get(conn.socketA);
    const socketB = io.sockets.sockets.get(conn.socketB);

    if (!socketA) {
      this.logger.error(`用户 ${conn.userA} 的 Socket 不存在`);
      this.pendingConnections.delete(connectionId);
      return;
    }

    if (!socketB) {
      this.logger.error(`用户 ${conn.userB} 的 Socket 不存在`);
      this.pendingConnections.delete(connectionId);
      return;
    }

    // 关键：同时（并行）发送所有候选
    try {
      await Promise.all([
        // A 的候选发给 B
        this.sendAllCandidates(socketB, conn.userA, conn.candidatesA),
        // B 的候选发给 A
        this.sendAllCandidates(socketA, conn.userB, conn.candidatesB),
      ]);

      this.logger.info(`✅ 候选已同步释放，连接开始建立`, {
        connectionId,
      });
    } catch (error) {
      this.logger.error('候选释放失败', error);
    } finally {
      // 清理连接记录
      this.pendingConnections.delete(connectionId);
      this.logger.debug(`🧹 清理连接记录 ${connectionId}`);
    }
  }

  /**
   * 批量发送候选
   */
  private async sendAllCandidates(
    socket: any,
    fromUser: string,
    candidates: RTCIceCandidate[]
  ): Promise<void> {
    if (candidates.length === 0) {
      this.logger.warn(`没有候选需要发送给 ${socket.id}`);
      return;
    }

    // 批量发送所有候选
    for (const candidate of candidates) {
      socket.emit(ServerEvents.RECEIVE_ICE_CANDIDATE, {
        fromUserId: fromUser,
        candidate,
      });
    }

    this.logger.debug(`📤 已发送 ${candidates.length} 个候选`, {
      to: socket.id,
      from: fromUser,
    });
  }

  /**
   * 生成连接 ID（确保双向唯一）
   */
  private getConnectionId(userA: string, userB: string): string {
    return [userA, userB].sort().join('-');
  }

  /**
   * 检查连接是否已注册
   */
  isConnectionRegistered(userA: string, userB: string): boolean {
    const connectionId = this.getConnectionId(userA, userB);
    return this.pendingConnections.has(connectionId);
  }

  /**
   * 获取待协调连接数量
   */
  getPendingConnectionsCount(): number {
    return this.pendingConnections.size;
  }

  /**
   * 获取连接详情（调试用）
   */
  getConnectionDetails(userA: string, userB: string): PendingConnection | undefined {
    const connectionId = this.getConnectionId(userA, userB);
    return this.pendingConnections.get(connectionId);
  }

  /**
   * 清理超时连接
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      this.pendingConnections.forEach((conn, id) => {
        if (now - conn.createdAt > this.CONNECTION_TIMEOUT) {
          this.logger.warn(`⏰ 清理超时连接`, {
            connectionId: id,
            age: Math.floor((now - conn.createdAt) / 1000) + 's',
          });
          this.pendingConnections.delete(id);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        this.logger.info(`清理了 ${cleanedCount} 个超时连接`);
      }
    }, this.CLEANUP_INTERVAL);

    this.logger.info('连接清理定时器已启动');
  }

  /**
   * 取消连接协调
   */
  cancelConnection(userA: string, userB: string): void {
    const connectionId = this.getConnectionId(userA, userB);
    if (this.pendingConnections.delete(connectionId)) {
      this.logger.info(`❌ 取消连接协调 ${connectionId}`);
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.pendingConnections.clear();
    this.logger.info('连接协调服务已销毁');
  }
}
