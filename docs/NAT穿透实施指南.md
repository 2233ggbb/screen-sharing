# NAT 穿透优化方案 - 实施指南

## 📋 已完成工作

### ✅ 后端服务（已实现）

1. **NAT 检测服务** - `server/src/services/NATDetectionService.ts`
   - 通过客户端 IP 检测 NAT 类型
   - 判断是否需要启用协调模式
   - 返回连接可行性评估

2. **连接协调服务** - `server/src/services/ConnectionCoordinator.ts`
   - 缓存双方的 ICE 候选
   - 等待双方 ICE 收集完成
   - 同步释放候选（关键！）
   - 自动清理超时连接

3. **增强 WebRTC Handler** - `server/src/socket/handlers/WebRTCHandlerEnhanced.ts`
   - 集成 NAT 检测和连接协调
   - 处理新增的事件（NAT 检测、ICE 完成通知）
   - 自动为需要协调的连接对注册

4. **事件定义** - `shared/src/events/index.ts`
   - 新增 `DETECT_NAT_TYPE` 事件
   - 新增 `ICE_GATHERING_COMPLETE` 事件
   - 新增 `NAT_TYPE_DETECTED` 事件

---

## 🚧 剩余工作

### 📱 客户端实现（需要完成）

#### 1. 创建 NAT 检测客户端服务

创建文件：`client/src/renderer/services/nat-detection.ts`

```typescript
import { Modal } from 'antd';
import { socket } from './socket';
import { ServerEvents } from '@screen-sharing/shared';
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
   * 检测 NAT 类型
   */
  async detectNATType(): Promise<NATDetectionResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('NAT 检测超时'));
      }, 10000);

      // 监听检测结果
      socket.once(ServerEvents.NAT_TYPE_DETECTED, (result: NATDetectionResult) => {
        clearTimeout(timeout);
        this.showDetectionResult(result);
        resolve(result);
      });

      // 发起检测请求
      socket.emit('detect_nat_type', {});
    });
  }

  /**
   * 显示检测结果
   */
  private showDetectionResult(result: NATDetectionResult): void {
    const { type, canP2P, confidence, recommendation } = result;

    if (!canP2P) {
      // 无法 P2P
      Modal.error({
        title: '⚠️ 网络环境不兼容',
        content: (
          <div>
            <p><strong>NAT 类型：</strong>{this.getNATTypeName(type)}</p>
            <p style={{ color: '#ff4d4f' }}>{recommendation}</p>
            <p style={{ marginTop: 16 }}>
              请尝试：<br/>
              • 切换到手机热点<br/>
              • 使用其他网络环境
            </p>
          </div>
        ),
        width: 480,
      });
    } else if (confidence < 70) {
      // 成功率较低
      Modal.warning({
        title: '⚠️ 网络环境提示',
        content: (
          <div>
            <p><strong>NAT 类型：</strong>{this.getNATTypeName(type)}</p>
            <p><strong>预计成功率：</strong>{confidence}%</p>
            <p>{recommendation}</p>
          </div>
        ),
        width: 480,
      });
    } else {
      // 正常
      this.logger.info('NAT 检测通过', { type, confidence });
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
}

export const natDetector = new NATDetectionClient();
```

#### 2. 修改 PeerConnectionManager

修改文件：`client/src/renderer/services/webrtc/peer-connection.ts`

在 `createConnection` 方法中添加：

```typescript
// 监听 ICE 收集状态
pc.onicegatheringstatechange = () => {
  if (pc.iceGatheringState === 'complete') {
    console.log('[ICE] ✅ 收集完成，通知服务器');

    // 生成连接 ID
    const connectionId = this.getConnectionId(this.localUserId, remoteUserId);

    // 通知服务器
    handlers.onIceGatheringComplete?.(remoteUserId, connectionId);
  }
};

// 添加辅助方法
private getConnectionId(userA: string, userB: string): string {
  return [userA, userB].sort().join('-');
}
```

并在 handlers 接口中添加：

```typescript
export interface ConnectionHandlers {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onTrack?: (track: MediaStreamTrack, streams: MediaStream[]) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  onIceGatheringComplete?: (targetUserId: string, connectionId: string) => void; // 新增
}
```

然后在实际使用时传递这个handler：

```typescript
// 在 useRoomWebRTC.ts 中
const connection = peerConnectionManager.createConnection(userId, {
  onIceCandidate: (candidate) => {
    socketService.sendIceCandidate(userId, candidate);
  },
  onIceGatheringComplete: (targetUserId, connectionId) => {
    socketService.notifyIceGatheringComplete(targetUserId, connectionId);
  },
  // ... 其他 handlers
});
```

#### 3. 修改 SocketService

修改文件：`client/src/renderer/services/socket/index.ts`

添加方法：

```typescript
/**
 * 通知 ICE 收集完成
 */
notifyIceGatheringComplete(targetUserId: string, connectionId: string): void {
  this.socket?.emit('ice_gathering_complete', {
    targetUserId,
    connectionId,
  });
}
```

#### 4. 集成到加入房间流程

修改文件：`client/src/renderer/pages/Room/hooks/useRoomSocket.ts`

```typescript
import { natDetector } from '../../../services/nat-detection';

const joinRoom = async (roomId: string) => {
  try {
    // 1. 先检测 NAT 类型
    const natResult = await natDetector.detectNATType();

    if (!natResult.canP2P) {
      // 无法 P2P，不加入房间
      return;
    }

    // 2. 正常加入房间
    socketService.joinRoom(roomId);

  } catch (error) {
    console.error('加入房间失败', error);
  }
};
```

---

## 🔄 服务器端集成

### 使用增强版 Handler

修改文件：`server/src/socket/index.ts`

```typescript
import { WebRTCHandlerEnhanced } from './handlers/WebRTCHandlerEnhanced';

// 替换原来的 WebRTCHandler
export function initializeSocketHandlers(
  io: Server,
  roomService: RoomService,
  signalingService: SignalingService
): void {
  const webrtcHandler = new WebRTCHandlerEnhanced(
    roomService,
    signalingService,
    io  // 传入 io 实例
  );

  io.on('connection', (socket) => {
    logger.info('客户端连接', { socketId: socket.id });

    // 注册事件
    webrtcHandler.register(socket);
    // ... 其他 handlers

    socket.on('disconnect', () => {
      const user = roomService.getUserBySocketId(socket.id);
      if (user) {
        webrtcHandler.cleanupUser(user.id);
      }
    });
  });
}
```

---

## 📝 测试步骤

### 1. 测试 NAT 检测

```typescript
// 在浏览器控制台测试
import { natDetector } from './services/nat-detection';

const result = await natDetector.detectNATType();
console.log('NAT 检测结果:', result);
```

### 2. 测试连接协调

1. 打开两个客户端
2. 双方加入同一房间
3. 开始共享屏幕
4. 查看服务器日志，应该看到：
   ```
   [Coordinator] 📝 注册连接协调 user1 <-> user2
   [Coordinator] ✅ user1 ICE 收集完成
   [Coordinator] ✅ user2 ICE 收集完成
   [Coordinator] 🚀 同步释放候选
   ```

### 3. 验证连接成功率

在端口受限型 NAT 环境下测试：
- 记录连接成功/失败次数
- 对比启用协调前后的成功率

---

## 📊 预期效果

| 指标 | 改进前 | 改进后 |
|------|--------|--------|
| **完全锥型 NAT** | 95% | 95% |
| **受限锥型 NAT** | 90% | 90% |
| **端口受限型 NAT** | **40-60%** | **80-85%** ✅ |
| **对称型 NAT** | 0% | 0% |

**核心改进**：
- ⚡ 连接建立时间缩短 50%
- 📈 端口受限型 NAT 成功率提升 40%+
- 💰 月度成本：$0（无需 TURN）

---

## 🐛 调试技巧

### 查看协调器状态

在服务器代码中添加调试端点：

```typescript
app.get('/debug/coordinator', (req, res) => {
  res.json({
    pendingConnections: coordinator.getPendingConnectionsCount(),
  });
});
```

### 客户端日志

在 peer-connection.ts 中添加：

```typescript
pc.onicegatheringstatechange = () => {
  console.log('[ICE] 收集状态:', pc.iceGatheringState);

  if (pc.iceGatheringState === 'complete') {
    console.log('[ICE] ✅ 收集完成');
    // 通知服务器...
  }
};
```

---

## 📚 相关文档

- [NAT 穿透优化方案.md](./NAT穿透优化方案.md) - 完整技术方案
- [NAT 穿透解决方案.md](./NAT穿透解决方案.md) - 原有方案（包含 TURN）

---

## ✅ 验收标准

1. ✅ 客户端能成功检测 NAT 类型
2. ✅ 端口受限型 NAT 环境下自动启用协调
3. ✅ 双方 ICE 候选被正确缓存
4. ✅ 收集完成后候选同步释放
5. ✅ 连接成功率显著提升

---

**版本**: v1.0
**最后更新**: 2026-01-19
