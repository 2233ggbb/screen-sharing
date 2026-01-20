# NAT 穿透优化方案 - 后端协助 P2P 连接

## 📋 文档信息

| 文档类型 | 技术方案 |
|---------|---------|
| 文档版本 | v2.0 |
| 创建日期 | 2026-01-19 |
| 适用场景 | 使用后端服务协助 P2P 连接建立，但不转发媒体流 |

---

## 1. 设计原则

### 1.1 核心理念

**后端服务仅协助连接，不转发媒体**

```
┌─────────────────────────────────────────────────────────┐
│                    协助式 P2P 架构                        │
└─────────────────────────────────────────────────────────┘

客户端 A ←──────── WebRTC P2P ────────→ 客户端 B
   │                                        │
   │  ① 信令 (SDP/ICE 交换)                 │
   │  ② NAT 类型检测请求                    │
   │  ③ 连接协调信号                        │
   └──────────┬────────────┬────────────────┘
              │            │
              ▼            ▼
     ┌────────────────────────────┐
     │   后端协助服务              │
     ├────────────────────────────┤
     │ 1. NAT 类型检测服务         │
     │ 2. 连接时序协调器           │
     │ 3. ICE 候选优化器           │
     │ 4. STUN 服务器              │
     └────────────────────────────┘

✅ 媒体流：客户端 A ↔ 客户端 B (P2P 直连)
✅ 后端成本：极低（仅信令 + 检测）
✅ 延迟：最低（无中继）
```

### 1.2 与 TURN 方案的区别

| 对比项 | 本方案 | TURN 方案 |
|-------|--------|----------|
| **后端作用** | 🔧 协助建立连接 | 🚚 转发所有媒体流 |
| **媒体路径** | 客户端A ↔ 客户端B | 客户端A → TURN → 客户端B |
| **是否 P2P** | ✅ 真正的 P2P | ❌ 中继模式 |
| **延迟** | 50-200ms | 100-500ms |
| **带宽成本** | 极低（KB级） | 极高（GB级） |
| **隐私性** | ✅ 端到端 | ⚠️ 可被截获 |
| **成功率提升** | +40% (40%→80%) | +60% (40%→99%) |

---

## 2. 方案一：NAT 类型检测服务 ⭐⭐⭐⭐⭐

### 2.1 原理

通过后端的多端口 STUN 测试，准确检测客户端的 NAT 类型，**提前判断连接可行性**。

**检测流程**：
```
步骤 1: 客户端向后端端口 A (3478) 发送 UDP 包
        ↓
        后端记录客户端公网地址 IP1:Port1

步骤 2: 客户端向后端端口 B (3479) 发送 UDP 包
        ↓
        后端记录客户端公网地址 IP2:Port2

步骤 3: 后端从端口 C (3480) 向 IP1:Port1 发送测试包
        ↓
        检测客户端是否能收到（测试端口限制）

步骤 4: 分析结果，判断 NAT 类型

结果分析：
├─ IP1 === IP2 && Port1 === Port2
│  ├─ 能收到步骤3的包 → 完全锥型 NAT ✅ (P2P成功率95%)
│  └─ 收不到步骤3的包 → 端口受限锥型 ⚠️ (需要协助)
└─ IP相同但Port不同 → 对称型 NAT ❌ (无法P2P)
```

### 2.2 后端实现

```typescript
// server/src/services/NATDetectionService.ts

import dgram from 'dgram';
import { Logger } from '../utils/logger';

export interface NATDetectionResult {
  type: 'full-cone' | 'restricted-cone' | 'port-restricted-cone' | 'symmetric';
  canP2P: boolean;
  confidence: number; // 0-100
  publicAddress: { ip: string; port: number };
  recommendation: string;
  requiresSync: boolean; // 是否需要启用协调服务
}

export class NATDetectionService {
  private logger = new Logger('NATDetection');
  private sockets: Map<number, dgram.Socket> = new Map();

  // 三个测试端口
  private readonly PRIMARY_PORT = 3478;
  private readonly SECONDARY_PORT = 3479;
  private readonly TEST_PORT = 3480;

  constructor() {
    this.initializeSockets();
  }

  private initializeSockets() {
    [this.PRIMARY_PORT, this.SECONDARY_PORT, this.TEST_PORT].forEach(port => {
      const socket = dgram.createSocket('udp4');
      socket.bind(port);
      this.sockets.set(port, socket);
      this.logger.info(`NAT 检测服务监听端口 ${port}`);
    });
  }

  /**
   * 检测客户端 NAT 类型
   */
  async detectNATType(clientIp: string): Promise<NATDetectionResult> {
    this.logger.info(`开始检测 NAT 类型: ${clientIp}`);

    // 测试 1: 从主端口获取映射
    const mapping1 = await this.getMappingFromPort(this.PRIMARY_PORT, clientIp);

    // 测试 2: 从辅助端口获取映射
    const mapping2 = await this.getMappingFromPort(this.SECONDARY_PORT, clientIp);

    // 测试 3: 端口限制测试
    const isPortRestricted = await this.testPortRestriction(
      mapping1.ip,
      mapping1.port
    );

    // 分析结果
    return this.analyzeResults(mapping1, mapping2, isPortRestricted);
  }

  /**
   * 从指定端口获取客户端的公网映射地址
   */
  private async getMappingFromPort(
    port: number,
    clientIp: string
  ): Promise<{ ip: string; port: number }> {
    return new Promise((resolve, reject) => {
      const socket = this.sockets.get(port);
      if (!socket) {
        return reject(new Error(`端口 ${port} 未初始化`));
      }

      // 超时保护
      const timeout = setTimeout(() => {
        reject(new Error('NAT 检测超时'));
      }, 5000);

      const messageHandler = (msg: Buffer, rinfo: dgram.RemoteInfo) => {
        // 检查是否来自目标客户端
        if (rinfo.address === clientIp || msg.toString().includes('NAT-TEST')) {
          clearTimeout(timeout);
          socket.removeListener('message', messageHandler);

          this.logger.debug(`从端口 ${port} 获取映射`, {
            ip: rinfo.address,
            port: rinfo.port
          });

          resolve({
            ip: rinfo.address,
            port: rinfo.port
          });
        }
      };

      socket.on('message', messageHandler);

      // 发送 STUN 绑定请求（客户端会回复）
      // 实际实现中，客户端需要主动发送测试包
    });
  }

  /**
   * 测试端口限制 - 从不同端口发送，看客户端能否收到
   */
  private async testPortRestriction(
    mappedIp: string,
    mappedPort: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const testSocket = this.sockets.get(this.TEST_PORT);
      if (!testSocket) {
        return resolve(false);
      }

      const testData = Buffer.from('PORT-RESTRICTION-TEST');
      let received = false;

      // 监听客户端回复
      const replyHandler = (msg: Buffer) => {
        if (msg.toString().includes('TEST-REPLY')) {
          received = true;
        }
      };

      testSocket.once('message', replyHandler);

      // 从不同端口发送测试包
      testSocket.send(testData, mappedPort, mappedIp, (err) => {
        if (err) {
          this.logger.warn('端口限制测试发送失败', err);
        }

        // 等待 1 秒看是否收到回复
        setTimeout(() => {
          testSocket.removeListener('message', replyHandler);
          resolve(received);
        }, 1000);
      });
    });
  }

  /**
   * 分析检测结果
   */
  private analyzeResults(
    mapping1: { ip: string; port: number },
    mapping2: { ip: string; port: number },
    receivedFromDifferentPort: boolean
  ): NATDetectionResult {
    const isSameIP = mapping1.ip === mapping2.ip;
    const isSamePort = mapping1.port === mapping2.port;

    // 对称型 NAT：每次连接端口都不同
    if (isSameIP && !isSamePort) {
      return {
        type: 'symmetric',
        canP2P: false,
        confidence: 90,
        publicAddress: mapping1,
        recommendation: '❌ 检测到对称型 NAT，无法建立 P2P 连接。\n建议：使用手机热点或其他网络，或部署 TURN 服务器。',
        requiresSync: false,
      };
    }

    // 完全锥型 NAT：可以接收来自任何端口的数据
    if (isSameIP && isSamePort && receivedFromDifferentPort) {
      return {
        type: 'full-cone',
        canP2P: true,
        confidence: 95,
        publicAddress: mapping1,
        recommendation: '✅ 完全锥型 NAT，P2P 连接成功率极高（95%+）。',
        requiresSync: false,
      };
    }

    // 端口受限锥型 NAT：只能接收来自特定端口的数据
    if (isSameIP && isSamePort && !receivedFromDifferentPort) {
      return {
        type: 'port-restricted-cone',
        canP2P: true,
        confidence: 60,
        publicAddress: mapping1,
        recommendation: '⚠️ 端口受限型 NAT，P2P 可能成功（60%）。\n系统将启用连接协调模式以提高成功率。',
        requiresSync: true, // 关键：需要启用协调服务
      };
    }

    // 默认：受限锥型
    return {
      type: 'restricted-cone',
      canP2P: true,
      confidence: 80,
      publicAddress: mapping1,
      recommendation: '✅ 受限锥型 NAT，P2P 连接成功率较高（80%+）。',
      requiresSync: false,
    };
  }
}
```

### 2.3 客户端调用

```typescript
// client/src/renderer/services/nat-detection.ts

import { Modal } from 'antd';
import { Logger } from '../utils/logger';

interface NATDetectionResult {
  type: string;
  canP2P: boolean;
  confidence: number;
  publicAddress: { ip: string; port: number };
  recommendation: string;
  requiresSync: boolean;
}

export class NATDetectionClient {
  private logger = new Logger('NATDetection');

  /**
   * 加入房间前检测 NAT 类型
   */
  async detectBeforeJoin(serverUrl: string): Promise<NATDetectionResult> {
    this.logger.info('正在检测 NAT 类型...');

    try {
      // 步骤 1: 向后端发送 UDP 测试包
      // 注意：Web 环境无法直接发送 UDP，需要通过 WebRTC Data Channel 或 HTTP API
      const result = await this.performDetection(serverUrl);

      // 步骤 2: 显示检测结果
      this.showDetectionResult(result);

      return result;
    } catch (error) {
      this.logger.error('NAT 检测失败', error);
      throw error;
    }
  }

  private async performDetection(serverUrl: string): Promise<NATDetectionResult> {
    // 方式 1: 通过 HTTP API（简化版）
    const response = await fetch(`${serverUrl}/api/nat/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: this.getClientId() })
    });

    if (!response.ok) {
      throw new Error('NAT 检测请求失败');
    }

    return await response.json();
  }

  /**
   * 显示检测结果给用户
   */
  private showDetectionResult(result: NATDetectionResult) {
    const { type, canP2P, confidence, recommendation } = result;

    // 根据结果显示不同的提示
    if (!canP2P) {
      // 无法 P2P - 显示错误提示
      Modal.error({
        title: '⚠️ 网络环境不兼容',
        content: (
          <div>
            <p><strong>NAT 类型：</strong>{this.getNATTypeName(type)}</p>
            <p><strong>检测结果：</strong>{recommendation}</p>
            <p style={{ marginTop: 16, color: '#ff4d4f' }}>
              您的网络环境无法建立 P2P 连接。<br/>
              请尝试以下方法：<br/>
              • 切换到手机热点或其他网络<br/>
              • 使用公司外的网络环境<br/>
              • 联系管理员部署 TURN 中继服务器
            </p>
          </div>
        ),
        okText: '我知道了',
        width: 480,
      });
    } else if (confidence < 70) {
      // 成功率较低 - 显示警告
      Modal.warning({
        title: '⚠️ 网络环境提示',
        content: (
          <div>
            <p><strong>NAT 类型：</strong>{this.getNATTypeName(type)}</p>
            <p><strong>预计成功率：</strong>{confidence}%</p>
            <p>{recommendation}</p>
            <p style={{ marginTop: 16 }}>
              系统将自动优化连接策略，但仍可能出现连接失败。
            </p>
          </div>
        ),
        okText: '继续加入',
        width: 480,
      });
    } else {
      // 成功率高 - 仅日志记录
      this.logger.info('NAT 检测通过', {
        type,
        confidence,
        recommendation
      });
    }
  }

  private getNATTypeName(type: string): string {
    const names: Record<string, string> = {
      'full-cone': '完全锥型 NAT',
      'restricted-cone': '受限锥型 NAT',
      'port-restricted-cone': '端口受限型 NAT',
      'symmetric': '对称型 NAT',
    };
    return names[type] || type;
  }

  private getClientId(): string {
    return localStorage.getItem('user_id') || 'anonymous';
  }
}
```

### 2.4 集成到加入房间流程

```typescript
// client/src/renderer/pages/Room/hooks/useRoomSocket.ts

import { NATDetectionClient } from '../../../services/nat-detection';

export function useRoomSocket() {
  const natDetector = new NATDetectionClient();

  const joinRoom = async (roomId: string) => {
    try {
      // ✅ 步骤 1: 先检测 NAT 类型
      const natResult = await natDetector.detectBeforeJoin(SERVER_URL);

      if (!natResult.canP2P) {
        // 无法 P2P，终止加入
        return;
      }

      // ✅ 步骤 2: 带上 NAT 信息加入房间
      socket.emit('JOIN_ROOM', {
        roomId,
        natInfo: {
          type: natResult.type,
          requiresSync: natResult.requiresSync,
        }
      });

    } catch (error) {
      console.error('加入房间失败', error);
    }
  };

  return { joinRoom };
}
```

---

## 3. 方案二：连接时序协调服务 ⭐⭐⭐⭐⭐

### 3.1 问题分析

**端口受限型 NAT 的致命问题**：

```
当前串行流程（慢）：

客户端 A: 收集 ICE (2s) → 发送候选 → 等待 B
                                  ↓
                            服务器转发 (200ms)
                                  ↓
客户端 B:                         收到 A 的候选
         收集 ICE (2s) → 发送候选 → 等待 A
                                  ↓
                            服务器转发 (200ms)
                                  ↓
客户端 A:                         收到 B 的候选

总延迟：4-5 秒 ❌

问题：等 A 和 B 都拿到对方候选时，NAT 的打洞窗口已经关闭！
```

**协调后的并行流程（快）：**

```
客户端 A 和 B 同时开始收集 ICE (2s)
         ↓                    ↓
    服务器缓存 A 的候选   服务器缓存 B 的候选
         ↓                    ↓
   双方都收集完成后，服务器同时释放
         ↓                    ↓
    A 立即收到 B 的所有候选
                           B 立即收到 A 的所有候选
         ↓                    ↓
    同时尝试连接（几乎同一时刻！）✅

总延迟：2-3 秒 ✅
成功率：从 40% 提升到 80%+ 🎉
```

### 3.2 后端实现

```typescript
// server/src/services/ConnectionCoordinator.ts

import { Socket } from 'socket.io';
import { ServerEvents } from '@screen-sharing/shared';
import { Logger } from '../utils/logger';

interface PendingConnection {
  userA: string;
  userB: string;
  socketA: string; // Socket ID
  socketB: string;
  candidatesA: RTCIceCandidate[];
  candidatesB: RTCIceCandidate[];
  sdpA: RTCSessionDescription | null;
  sdpB: RTCSessionDescription | null;
  readyA: boolean;
  readyB: boolean;
  createdAt: number;
}

export class ConnectionCoordinator {
  private logger = new Logger('Coordinator');

  // 存储待协调的连接对
  private pendingConnections = new Map<string, PendingConnection>();

  // 清理超时连接（30秒未完成）
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
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

    this.pendingConnections.set(connectionId, {
      userA,
      userB,
      socketA,
      socketB,
      candidatesA: [],
      candidatesB: [],
      sdpA: null,
      sdpB: null,
      readyA: false,
      readyB: false,
      createdAt: Date.now(),
    });

    this.logger.info(`📝 注册连接协调 ${userA} <-> ${userB}`);
    return connectionId;
  }

  /**
   * 添加 ICE 候选（不立即转发，先缓存）
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
    } else if (fromUser === conn.userB) {
      conn.candidatesB.push(candidate);
    }

    this.logger.debug(`💾 缓存 ICE 候选 ${fromUser} -> ${toUser}`, {
      totalA: conn.candidatesA.length,
      totalB: conn.candidatesB.length,
    });

    // 不立即转发
    return { shouldForward: false };
  }

  /**
   * 标记一方 ICE 收集完成
   */
  async markReady(
    user: string,
    connectionId: string,
    io: any
  ): Promise<void> {
    const conn = this.pendingConnections.get(connectionId);
    if (!conn) {
      this.logger.warn(`连接 ${connectionId} 不存在`);
      return;
    }

    // 标记准备就绪
    if (user === conn.userA) {
      conn.readyA = true;
    } else if (user === conn.userB) {
      conn.readyB = true;
    }

    this.logger.info(`✅ ${user} 准备就绪`, {
      connectionId,
      userA: conn.readyA ? '✅' : '⏳',
      userB: conn.readyB ? '✅' : '⏳',
    });

    // 如果双方都准备好了，同步释放候选
    if (conn.readyA && conn.readyB) {
      await this.syncReleaseCandidates(conn, io);
    }
  }

  /**
   * 同步释放候选 - 核心逻辑！
   */
  private async syncReleaseCandidates(
    conn: PendingConnection,
    io: any
  ): Promise<void> {
    this.logger.info(`🚀 同步释放候选`, {
      connectionId: this.getConnectionId(conn.userA, conn.userB),
      candidatesA: conn.candidatesA.length,
      candidatesB: conn.candidatesB.length,
    });

    // 获取双方的 Socket
    const socketA = io.sockets.sockets.get(conn.socketA);
    const socketB = io.sockets.sockets.get(conn.socketB);

    if (!socketA || !socketB) {
      this.logger.error('Socket 不存在，无法释放候选');
      return;
    }

    // 关键：同时发送所有候选（并行，非串行）
    await Promise.all([
      // A 的候选发给 B
      this.sendAllCandidates(socketB, conn.userA, conn.candidatesA),
      // B 的候选发给 A
      this.sendAllCandidates(socketA, conn.userB, conn.candidatesB),
    ]);

    this.logger.info(`✅ 候选已同步释放，开始连接`);

    // 清理连接记录
    const connectionId = this.getConnectionId(conn.userA, conn.userB);
    this.pendingConnections.delete(connectionId);
  }

  /**
   * 批量发送候选
   */
  private async sendAllCandidates(
    socket: Socket,
    fromUser: string,
    candidates: RTCIceCandidate[]
  ): Promise<void> {
    for (const candidate of candidates) {
      socket.emit(ServerEvents.RECEIVE_ICE_CANDIDATE, {
        fromUserId: fromUser,
        candidate,
      });
    }

    this.logger.debug(`📤 发送 ${candidates.length} 个候选给 ${socket.id}`);
  }

  /**
   * 生成连接 ID
   */
  private getConnectionId(userA: string, userB: string): string {
    return [userA, userB].sort().join('-');
  }

  /**
   * 清理超时连接
   */
  private startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 秒

      this.pendingConnections.forEach((conn, id) => {
        if (now - conn.createdAt > timeout) {
          this.logger.warn(`⏰ 清理超时连接 ${id}`);
          this.pendingConnections.delete(id);
        }
      });
    }, 10000); // 每 10 秒检查一次
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}
```

### 3.3 集成到 WebRTC Handler

```typescript
// server/src/socket/handlers/WebRTCHandler.ts

import { ConnectionCoordinator } from '../../services/ConnectionCoordinator';
import { NATDetectionService } from '../../services/NATDetectionService';

export class WebRTCHandler {
  private coordinator: ConnectionCoordinator;
  private natDetector: NATDetectionService;

  // 存储用户的 NAT 信息
  private userNATInfo = new Map<string, { requiresSync: boolean }>();

  constructor(
    private roomService: RoomService,
    private signalingService: SignalingService
  ) {
    this.coordinator = new ConnectionCoordinator();
    this.natDetector = new NATDetectionService();
  }

  register(socket: Socket, io: any): void {
    // 监听加入房间事件
    socket.on('JOIN_ROOM', (data) => {
      this.handleJoinRoom(socket, data, io);
    });

    // 监听 ICE 候选
    socket.on(ClientEvents.SEND_ICE_CANDIDATE, (data) => {
      this.handleSendIceCandidate(socket, data);
    });

    // 监听 ICE 收集完成
    socket.on('ICE_GATHERING_COMPLETE', (data) => {
      this.handleIceGatheringComplete(socket, data, io);
    });

    // ... 其他事件
  }

  /**
   * 处理加入房间
   */
  private async handleJoinRoom(socket: Socket, data: any, io: any) {
    const { roomId, natInfo } = data;
    const user = this.roomService.getUserBySocketId(socket.id);

    if (!user) return;

    // 保存用户的 NAT 信息
    if (natInfo?.requiresSync) {
      this.userNATInfo.set(user.id, { requiresSync: true });
    }

    // 获取房间内其他成员
    const roomMembers = this.roomService.getRoomMembers(roomId);
    const otherUsers = roomMembers.filter(u => u.id !== user.id);

    // 为需要协调的连接对注册
    for (const otherUser of otherUsers) {
      const otherNATInfo = this.userNATInfo.get(otherUser.id);

      // 如果任一方需要协调，就启用协调模式
      if (natInfo?.requiresSync || otherNATInfo?.requiresSync) {
        this.coordinator.registerConnection(
          user.id,
          socket.id,
          otherUser.id,
          otherUser.socketId
        );

        this.logger.info(`🔧 启用协调模式: ${user.id} <-> ${otherUser.id}`);
      }
    }

    // ... 继续正常加入流程
  }

  /**
   * 处理 ICE 候选
   */
  private async handleSendIceCandidate(socket: Socket, data: any) {
    const fromUser = this.roomService.getUserBySocketId(socket.id);
    if (!fromUser) return;

    // 尝试添加到协调器
    const result = this.coordinator.addCandidate(
      fromUser.id,
      data.targetUserId,
      data.candidate
    );

    // 如果不需要协调，立即转发
    if (result.shouldForward) {
      const targetUser = this.roomService.getUserById(data.targetUserId);
      if (targetUser) {
        const targetSocket = io.sockets.sockets.get(targetUser.socketId);
        targetSocket?.emit(ServerEvents.RECEIVE_ICE_CANDIDATE, {
          fromUserId: fromUser.id,
          candidate: data.candidate,
        });
      }
    }
  }

  /**
   * 处理 ICE 收集完成
   */
  private async handleIceGatheringComplete(
    socket: Socket,
    data: any,
    io: any
  ) {
    const user = this.roomService.getUserBySocketId(socket.id);
    if (!user) return;

    await this.coordinator.markReady(user.id, data.connectionId, io);
  }
}
```

### 3.4 客户端改动

```typescript
// client/src/renderer/services/webrtc/peer-connection.ts

export class PeerConnectionManager {
  createConnection(remoteUserId: string, handlers: ConnectionHandlers) {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    // 监听 ICE 收集状态
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        console.log('[ICE] ✅ 收集完成，通知服务器');

        // 通知服务器：我准备好了
        const connectionId = this.getConnectionId(this.localUserId, remoteUserId);
        handlers.onIceGatheringComplete?.(connectionId);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // 正常发送候选（服务器会决定是否缓存）
        handlers.onIceCandidate(event.candidate);
      }
    };

    // ... 其他代码
    return pc;
  }

  private getConnectionId(userA: string, userB: string): string {
    return [userA, userB].sort().join('-');
  }
}
```

---

## 4. 方案三：ICE 候选优化 ⭐⭐⭐

### 4.1 原理

后端分析和过滤 ICE 候选，优先发送最有可能成功的候选。

**优化策略**：
```typescript
// server/src/services/ICEOptimizer.ts

export class ICEOptimizer {
  /**
   * 优化候选列表
   */
  optimizeCandidates(candidates: RTCIceCandidate[]): RTCIceCandidate[] {
    // 1. 按优先级排序
    const prioritized = this.prioritizeCandidates(candidates);

    // 2. 去重（相同地址和端口）
    const deduplicated = this.deduplicateCandidates(prioritized);

    // 3. 限制数量（减少信令负担）
    return deduplicated.slice(0, 10);
  }

  private prioritizeCandidates(
    candidates: RTCIceCandidate[]
  ): RTCIceCandidate[] {
    return candidates.sort((a, b) => {
      // 优先级：host > srflx > relay
      const priority = { host: 3, srflx: 2, relay: 1, unknown: 0 };

      const typeA = this.getCandidateType(a);
      const typeB = this.getCandidateType(b);

      return (priority[typeB] || 0) - (priority[typeA] || 0);
    });
  }

  private getCandidateType(candidate: RTCIceCandidate): string {
    const candidateStr = candidate.candidate || '';
    if (candidateStr.includes('typ host')) return 'host';
    if (candidateStr.includes('typ srflx')) return 'srflx';
    if (candidateStr.includes('typ relay')) return 'relay';
    return 'unknown';
  }
}
```

---

## 5. 实施路径

### 5.1 推荐组合 🏆

**最小可行方案**（立即实施）：
```
✅ 方案一：NAT 类型检测服务
   → 加入房间前检测，提前告知用户
   → 成本：~$0（复用信令服务器）
   → 开发时间：2-3 天

✅ 方案二：连接时序协调服务
   → 端口受限型 NAT 自动启用
   → 成本：~$0（仅缓存少量候选）
   → 开发时间：3-5 天

总预算：~$0/月
总开发时间：1 周
预期效果：成功率从 40% 提升到 80%+
```

### 5.2 代码变更清单

**新增文件**：
```
server/src/services/
├── NATDetectionService.ts       # NAT 检测
├── ConnectionCoordinator.ts     # 连接协调
└── ICEOptimizer.ts              # 候选优化（可选）

server/src/api/
└── nat.routes.ts                # NAT 检测 API

client/src/renderer/services/
└── nat-detection.ts             # 客户端 NAT 检测
```

**修改文件**：
```
server/src/socket/handlers/WebRTCHandler.ts
client/src/renderer/services/webrtc/peer-connection.ts
client/src/renderer/pages/Room/hooks/useRoomSocket.ts
shared/src/events/index.ts  (新增事件定义)
```

---

## 6. 成本效益分析

### 6.1 与 TURN 方案对比

| 指标 | 本方案 | 自建 TURN | 商业 TURN |
|------|--------|----------|----------|
| **月度成本** | **$0-5** | $50-100 | $200-500 |
| **开发时间** | 1 周 | 2-3 天 | 1 天 |
| **成功率** | 80-85% | 99% | 99% |
| **延迟** | 50-200ms | 100-500ms | 80-300ms |
| **带宽成本** | 极低 | 极高 | 极高 |
| **隐私性** | ✅ 优秀 | ⚠️ 一般 | ⚠️ 一般 |

### 6.2 投资回报率

**投入**：
- 开发时间：5-7 天
- 服务器成本：$0/月（复用现有信令服务器）

**回报**：
- 成功率提升：+40% (40% → 80%)
- 用户体验：显著改善
- 节省成本：每月节省 $50-500（相比 TURN）

**ROI**：**极高** 🎉

---

## 7. 总结

### 7.1 核心优势

✅ **真正的 P2P**：所有媒体流都是点对点传输
✅ **成本极低**：月度成本接近零
✅ **延迟最低**：无中继跳转
✅ **隐私安全**：端到端加密，无第三方
✅ **成功率高**：从 40% 提升到 80%+

### 7.2 适用场景

**最适合**：
- 5-10 人小团队
- 预算有限的项目
- 对隐私要求高的场景
- 对延迟敏感的应用

**不适合**：
- 必须 99% 成功率的企业场景（建议自建 TURN）
- 需要支持对称型 NAT 的场景（必须 TURN）

### 7.3 下一步

1. ✅ 实现 NAT 检测服务
2. ✅ 实现连接协调服务
3. ✅ 测试不同网络环境
4. ✅ 收集成功率数据
5. ⚠️ 根据数据决定是否需要补充 TURN

---

**文档版本**: v2.0
**最后更新**: 2026-01-19
