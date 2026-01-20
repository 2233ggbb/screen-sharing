# NAT 穿透解决方案

## 📋 文档信息

| 文档类型 | 技术方案 |
|---------|---------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-01-19 |
| 适用场景 | Port Restricted Cone NAT 环境下的 P2P 连接 |

---

## 1. 问题背景

### 1.1 场景描述

在以下环境下建立 WebRTC P2P 连接：
- 无公网 IP 服务器
- 双方都在 **Port Restricted Cone NAT** 环境
- 属于中国内的不同运营商
- 需要实现屏幕共享的实时传输

### 1.2 Port Restricted Cone NAT 特点

```
特性说明：
├── 对外映射：同一内部端口映射到同一外部端口
├── 发送限制：允许向任意外部地址发送数据
└── 接收限制：只接受来自"之前通信过的特定外部地址+端口"的数据包
```

**挑战**：
- 两个 Port Restricted Cone NAT 之间很难直接建立连接
- STUN 服务器只能获取公网地址，无法完成打洞
- 需要 TURN 服务器或特殊的打洞技术

### 1.3 WebRTC 连接类型说明

**重要概念澄清：**

| 连接类型 | 是否 P2P | 路径 | 说明 |
|---------|---------|------|------|
| **host** | ✅ 真P2P | 客户端A ↔ 客户端B | 局域网内直连 |
| **srflx** (Server Reflexive) | ✅ 真P2P | 客户端A ↔ 客户端B | 通过 NAT 直连，STUN 仅用于发现地址 |
| **relay** (TURN) | ❌ 非P2P | 客户端A → TURN → 客户端B | **通过 TURN 服务器中转** |

**TURN 不是 P2P：**
- TURN 服务器会转发所有媒体流量
- 数据路径：客户端A → TURN服务器 → 客户端B
- 延迟更高，带宽成本由 TURN 服务器承担

---

## 2. 解决方案

### 方案 A：使用 TURN 服务器（最稳定但非真正的 P2P）

**原理**：TURN 服务器作为中继，转发媒体流

⚠️ **注意**：这不是真正的 P2P 连接，所有流量都会经过 TURN 服务器中转

**优点**：
- 几乎 100% 的连接成功率
- 适用于任何 NAT 类型

**缺点**：
- 非真正的 P2P，延迟较高（+50-100ms）
- 带宽成本由 TURN 服务器承担
- 流量消耗大（约2倍原始流量）

#### 2.1 免费 TURN 服务提供商

| 服务商 | 免费额度 | 限制 | 官网 |
|--------|---------|------|------|
| **Metered.ca** | 50GB/月 | 需注册 | https://www.metered.ca/ |
| **Xirsys** | 500MB/月 | 需注册 | https://xirsys.com/ |
| **Twilio TURN** | 试用额度 | 需信用卡 | https://www.twilio.com/ |

#### 2.2 配置示例

在 [`client/src/renderer/services/webrtc/peer-connection.ts`](client/src/renderer/services/webrtc/peer-connection.ts:1) 中配置：

```typescript
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  // Google STUN 服务器（用于获取公网地址）
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  
  // Metered.ca 免费 TURN 服务器
  {
    urls: [
      'turn:a.relay.metered.ca:80',
      'turn:a.relay.metered.ca:80?transport=tcp',
      'turn:a.relay.metered.ca:443',
      'turns:a.relay.metered.ca:443?transport=tcp'
    ],
    username: 'your-metered-username',
    credential: 'your-metered-credential'
  }
];
```

#### 2.3 获取免费 TURN 服务

**Metered.ca 注册步骤：**

1. 访问 https://www.metered.ca/tools/openrelay/
2. 注册账号（邮箱验证）
3. 获取 TURN 服务器配置信息
4. 复制 `username` 和 `credential` 到项目配置

**配置到项目：**

```typescript
// client/src/renderer/utils/constants.ts
export const ICE_SERVERS = {
  STUN: [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302'
  ],
  TURN: [
    {
      urls: [
        'turn:a.relay.metered.ca:80',
        'turn:a.relay.metered.ca:443',
        'turns:a.relay.metered.ca:443?transport=tcp'
      ],
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || ''
    }
  ]
};
```

---

### 方案 B：真正的 P2P 打洞方案（推荐尝试 ⭐）

**原理**：利用信令服务器协调，同时发送 UDP 打洞包

#### 2.1 端口预测打洞法

**关键技术**：
1. 利用 STUN 服务器获取多个公网端口
2. 预测 NAT 的端口分配规律
3. 双方同时向对方的预测端口发送数据

**实现步骤：**

```typescript
// 在 client/src/renderer/services/webrtc/peer-connection.ts 中实现

class AggressiveICEStrategy {
  async performHolePunching(
    localCandidates: RTCIceCandidate[],
    remoteCandidates: RTCIceCandidate[]
  ): Promise<boolean> {
    // 1. 获取对方的 srflx 候选（公网地址）
    const remoteSrflx = remoteCandidates.find(c => c.type === 'srflx');
    if (!remoteSrflx) return false;

    // 2. 预测可能的端口范围
    const basePort = remoteSrflx.port;
    const portRange = Array.from(
      { length: 20 },
      (_, i) => basePort + i - 10
    );

    // 3. 同时向多个预测端口发送打洞包
    const stunBindings = portRange.map(port =>
      this.sendStunBinding(remoteSrflx.address, port)
    );

    await Promise.race(stunBindings);
    return true;
  }
}
```

#### 2.2 配置 ICE 收集策略

```typescript
// 优化 ICE 配置以提高打洞成功率
const config: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.qq.com:3478' },  // 腾讯 STUN（国内快）
  ],
  // 关键：只尝试直连，不使用 TURN（强制 P2P）
  iceTransportPolicy: 'all',  // 或 'relay' 强制使用 TURN
  iceCandidatePoolSize: 10,
  
  // 启用 Trickle ICE（逐步发送候选）
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};
```

#### 2.3 实现信令服务器协调打洞

在 [`server/src/socket/handlers/WebRTCHandler.ts`](server/src/socket/handlers/WebRTCHandler.ts:1) 中添加：

```typescript
class WebRTCHandler {
  // 协调同时打洞
  async coordinateSimultaneousOpen(
    peer1: string,
    peer2: string
  ): Promise<void> {
    // 1. 收集双方的所有 ICE 候选
    const peer1Candidates = await this.collectCandidates(peer1);
    const peer2Candidates = await this.collectCandidates(peer2);

    // 2. 找出 srflx 类型的候选（公网地址）
    const peer1Srflx = this.findSrflxCandidates(peer1Candidates);
    const peer2Srflx = this.findSrflxCandidates(peer2Candidates);

    // 3. 同时通知双方开始打洞
    const timestamp = Date.now();
    await Promise.all([
      this.signalHolePunch(peer1, peer2Srflx, timestamp),
      this.signalHolePunch(peer2, peer1Srflx, timestamp)
    ]);
  }
}
```

**成功率**：Port Restricted Cone NAT 下约 **30-50%**

---

### 方案 C：混合策略（实用方案 ⭐⭐⭐）

**推荐实施**：优先尝试 P2P，失败后自动降级到 TURN

#### 3.1 实现连接降级策略

```typescript
// client/src/renderer/services/webrtc/peer-connection.ts

export class AdaptivePeerConnection {
  async establishConnection(remoteUserId: string): Promise<RTCPeerConnection> {
    // 策略 1：首先尝试纯 P2P（无 TURN）
    logger.info('尝试建立直接 P2P 连接...');
    const p2pResult = await this.tryDirectP2P(remoteUserId, 8000);  // 8秒超时
    
    if (p2pResult.success && p2pResult.connectionType !== 'relay') {
      logger.info('✅ P2P 直连成功！', p2pResult.connectionType);
      return p2pResult.connection;
    }

    // 策略 2：启用 TURN 服务器重试
    logger.warn('P2P 直连失败，降级到 TURN 中继...');
    const turnResult = await this.tryWithTURN(remoteUserId);
    
    if (turnResult.success) {
      logger.info('✅ TURN 中继连接成功（非P2P）');
      return turnResult.connection;
    }

    throw new Error('所有连接策略均失败');
  }

  private async tryDirectP2P(
    remoteUserId: string,
    timeout: number
  ): Promise<ConnectionResult> {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.qq.com:3478' }
      ],
      // 不使用 TURN
      iceTransportPolicy: 'all'
    };

    return this.tryConnection(config, remoteUserId, timeout);
  }

  private async tryWithTURN(remoteUserId: string): Promise<ConnectionResult> {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:a.relay.metered.ca:80',
          username: 'your-username',
          credential: 'your-credential'
        }
      ]
    };

    return this.tryConnection(config, remoteUserId, 15000);
  }

  // 检测实际连接类型
  private async getActiveConnectionType(
    pc: RTCPeerConnection
  ): Promise<'host' | 'srflx' | 'relay' | 'unknown'> {
    const stats = await pc.getStats();
    let activeType: string = 'unknown';

    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        // 获取本地候选
        const localCandidate = stats.get(report.localCandidateId);
        if (localCandidate) {
          activeType = localCandidate.candidateType;
        }
      }
    });

    return activeType as any;
  }
}
```

#### 3.2 配置优先级策略

```typescript
// 在 client/src/renderer/utils/constants.ts 中配置

export const CONNECTION_STRATEGY = {
  // 第一阶段：纯 P2P 尝试（8秒）
  PHASE_1: {
    timeout: 8000,
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun.qq.com:3478' }
    ],
    iceTransportPolicy: 'all' as RTCIceTransportPolicy
  },
  
  // 第二阶段：启用 TURN 中继（15秒）
  PHASE_2: {
    timeout: 15000,
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: [
          'turn:a.relay.metered.ca:80',
          'turn:a.relay.metered.ca:443'
        ],
        username: process.env.TURN_USERNAME || '',
        credential: process.env.TURN_CREDENTIAL || ''
      }
    ],
    iceTransportPolicy: 'all' as RTCIceTransportPolicy
  }
};
```

---

### 方案 D：部署 Coturn（自建 TURN 中继）

⚠️ **注意**：这也不是真正的 P2P，但你可以控制服务器

#### 2.1 在 Render 上部署 Coturn

修改 [`server/render.yaml`](server/render.yaml:1)：

```yaml
services:
  - type: web
    name: screen-sharing-turn
    env: docker
    dockerfilePath: ./Dockerfile.turn
    envVars:
      - key: TURN_USERNAME
        generateValue: true
      - key: TURN_PASSWORD
        generateValue: true
    healthCheckPath: /health
```

#### 2.2 Coturn Dockerfile

创建 `server/Dockerfile.turn`：

```dockerfile
FROM ubuntu:22.04

# 安装 Coturn
RUN apt-get update && \
    apt-get install -y coturn && \
    rm -rf /var/lib/apt/lists/*

# 复制配置文件
COPY turnserver.conf /etc/coturn/turnserver.conf

# 暴露端口
EXPOSE 3478 3478/udp 5349 5349/tcp

# 启动 Coturn
CMD ["turnserver", "-c", "/etc/coturn/turnserver.conf", "--log-file=stdout"]
```

#### 2.3 Coturn 配置文件

创建 `server/turnserver.conf`：

```conf
# Coturn 基础配置
listening-port=3478
tls-listening-port=5349

# 外部 IP（Render 会自动提供）
external-ip=${RENDER_EXTERNAL_HOSTNAME}

# 认证
lt-cred-mech
user=${TURN_USERNAME}:${TURN_PASSWORD}

# 域名
realm=turn.yourdomain.com
server-name=turn.yourdomain.com

# 日志
verbose
log-file=stdout

# 安全设置
fingerprint
no-multicast-peers
no-cli
```

---

### 方案 C：使用公网信令服务器 + 优化 ICE 策略

即使使用免费部署平台，也可以有效提升连接成功率。

#### 3.1 部署信令服务器到 Render

你的项目已经配置好了，只需部署：

```bash
# 使用 Render 部署
cd server
git push render main
```

#### 3.2 优化 WebRTC ICE 配置

在 [`client/src/renderer/services/webrtc/peer-connection.ts`](client/src/renderer/services/webrtc/peer-connection.ts:1) 中优化：

```typescript
export class PeerConnection {
  private createPeerConnection(): RTCPeerConnection {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.qq.com:3478' },  // 腾讯 STUN
        { urls: 'stun:stun.miwifi.com:3478' },  // 小米 STUN
        // 添加 TURN 配置
        {
          urls: 'turn:a.relay.metered.ca:80',
          username: 'your-username',
          credential: 'your-credential'
        }
      ],
      // 优化 ICE 策略
      iceTransportPolicy: 'all',  // 尝试所有方式
      iceCandidatePoolSize: 10,   // 预生成候选
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };

    return new RTCPeerConnection(config);
  }

  // 添加 ICE 收集超时机制
  private async gatherIceCandidates(pc: RTCPeerConnection): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        logger.warn('ICE gathering timeout, proceeding anyway');
        resolve();
      }, 5000);  // 5秒超时

      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }
}
```

---

## 3. 真相：Port Restricted Cone NAT 下的 P2P 可行性

### 3.1 残酷现实

**在你的场景下（Port Restricted Cone NAT + 不同运营商）：**

```
真正的 P2P 连接成功率：
├── Full Cone NAT ↔ Full Cone NAT        ～95%  ✅
├── Restricted Cone ↔ Restricted Cone     ～70%  ⚠️
├── Port Restricted ↔ Port Restricted    ～10-30% ❌
└── Symmetric NAT ↔ Symmetric NAT        ～0-5%  ❌
```

**你的情况属于倒数第二差**，真正的 P2P 成功率很低。

### 3.2 为什么这么难？

```
Port Restricted Cone NAT 的限制：

客户端 A (NAT-A)                     客户端 B (NAT-B)
内网: 192.168.1.100:5000            内网: 192.168.2.200:6000
外网: 1.2.3.4:50000                 外网: 5.6.7.8:60000

步骤 1: A 通过 STUN 发现自己的公网地址 1.2.3.4:50000
步骤 2: B 通过 STUN 发现自己的公网地址 5.6.7.8:60000
步骤 3: A 向 5.6.7.8:60000 发送数据
       → NAT-A 记录: "已向 5.6.7.8:60000 发送过"
       → 数据到达 NAT-B，但 NAT-B 检查：
          "之前 5.6.7.8:60000 有没有收到过来自 1.2.3.4:50000 的数据？"
          答案：没有！ → 丢弃数据包 ❌

步骤 4: B 同时向 1.2.3.4:50000 发送数据
       → 同样被 NAT-A 丢弃 ❌

结果：双方的数据包都被对方的 NAT 丢弃，无法建立连接
```

### 3.3 真正的 P2P 方案（成功率低）

**方案：同时打洞（Simultaneous Open）**

需要精确的时间同步和多次尝试：

```typescript
// 高级打洞策略
class AdvancedHolePunching {
  async simultaneousOpen(
    localAddr: string,
    remoteAddr: string
  ): Promise<boolean> {
    // 1. 信令服务器协调，确保双方在同一时刻开始
    const syncTime = await this.syncWithServer();
    
    // 2. 在同一毫秒级时刻，双方同时发送数据
    await this.waitUntil(syncTime);
    
    // 3. 快速连续发送多个打洞包（提高成功率）
    for (let i = 0; i < 50; i++) {
      this.sendHolePunchPacket(remoteAddr);
      await sleep(10);  // 每10ms发一次
    }
    
    // 4. 如果某个包恰好在对方发送后到达，可能成功
    return this.waitForConnection(2000);  // 等待2秒
  }
}
```

**成功率**：约 10-30%，取决于：
- 网络延迟抖动
- NAT 的端口映射稳定性
- 运营商的 NAT 实现细节

---

## 3. 推荐实施路径

### 🎯 现实方案：混合策略

**核心思想**：先尝试 P2P，失败后快速降级到 TURN

#### 阶段 1：实现智能连接策略（立即实施）

1. **优先尝试 P2P**（8秒超时）：
   - 使用 STUN 服务器获取公网地址
   - 实现同时打洞逻辑
   - 如果建立了 host 或 srflx 连接 → ✅ 真正的 P2P

2. **自动降级到 TURN**（失败后）：
   - 使用免费 Metered.ca TURN 服务
   - 虽然不是 P2P，但能保证连接成功
   - 用户体验：稍高延迟但可用

#### 阶段 2：部署公网信令服务器（重要）

即使使用免费平台也比没有好：

1. **部署到 Render**（免费额度）：
   ```bash
   cd server
   # 推送到 Render
   ```

2. **优势**：
   - 公网 IP，信令更稳定
   - 可以实现更精确的打洞协调
   - WebSocket 连接更可靠

#### 阶段 3：优化和监控（持续改进）

1. **监控连接类型分布**：
   ```typescript
   // 记录实际使用的连接类型
   logger.info('连接统计', {
     p2p_success: p2pCount,      // 真 P2P 成功次数
     turn_fallback: turnCount,   // TURN 降级次数
     total_attempts: totalCount
   });
   ```

2. **根据数据决策**：
   - 如果 P2P 成功率 < 20%：考虑直接用 TURN，优化用户体验
   - 如果 P2P 成功率 > 50%：继续优化打洞算法

---

## 4. 测试验证

### 4.1 测试 ICE 连接类型

添加调试日志：

```typescript
// 在 peer-connection.ts 中添加
pc.addEventListener('icecandidate', (event) => {
  if (event.candidate) {
    const { candidate } = event.candidate;
    // 检查连接类型
    if (candidate.includes('typ relay')) {
      logger.info('使用 TURN 中继连接');
    } else if (candidate.includes('typ srflx')) {
      logger.info('使用 STUN 反射连接');
    } else if (candidate.includes('typ host')) {
      logger.info('使用本地连接');
    }
  }
});
```

### 4.2 监控连接质量

```typescript
setInterval(() => {
  pc.getStats().then(stats => {
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        logger.info('连接类型:', report.localCandidateId, '->', report.remoteCandidateId);
        logger.info('往返时延 (RTT):', report.currentRoundTripTime * 1000, 'ms');
      }
    });
  });
}, 5000);
```

---

## 5. 方案对比

| 方案 | 是否真P2P | 连接成功率 | 延迟 | 月成本 | 实施难度 |
|------|----------|-----------|------|--------|---------|
| **纯 P2P 打洞** | ✅ 是 | 10-30% | 最低 | $0 | 高 |
| **免费 TURN** | ❌ 否 | 95%+ | +50-100ms | $0 (有限额) | 低 |
| **混合策略** | ⚠️ 部分 | 95%+ | 动态 | $0-10 | 中 |
| **自建 Coturn** | ❌ 否 | 99%+ | +30-80ms | ~$7 | 中 |
| **商业 TURN** | ❌ 否 | 99%+ | +20-50ms | ~$50 | 低 |

---

## 6. 最终建议

### 6.1 针对你的场景

**Port Restricted Cone NAT + 不同运营商 = 很难真正的 P2P**

**务实的做法：**

1. ✅ **立即实施**：
   - 注册 Metered.ca 获取免费 TURN 服务
   - 实现混合连接策略（先试 P2P，失败后用 TURN）
   - 部署信令服务器到 Render/Railway

2. ✅ **接受现实**：
   - 在你的 NAT 环境下，**10-30% 能实现真 P2P**
   - 其余 70-90% 需要 TURN 中继
   - 这是 WebRTC 在复杂 NAT 环境下的常态

3. ✅ **优化体验**：
   - 使用国内的 STUN 服务器（腾讯、小米）
   - TURN 服务器选择延迟低的（Metered.ca 香港节点）
   - 实现连接质量监控，向用户展示连接类型

### 6.2 实施清单

```markdown
[ ] 注册 Metered.ca 获取免费 TURN 配置
[ ] 更新 client/src/renderer/services/webrtc/peer-connection.ts
[ ] 实现混合连接策略（P2P → TURN 降级）
[ ] 添加连接类型监控和日志
[ ] 部署信令服务器到 Render（使用现有配置）
[ ] 测试不同网络环境下的连接成功率
[ ] 根据统计数据优化策略
```

### 6.3 关键代码位置

需要修改的文件：
1. [`client/src/renderer/services/webrtc/peer-connection.ts`](client/src/renderer/services/webrtc/peer-connection.ts:1) - ICE 配置和连接策略
2. [`client/src/renderer/utils/constants.ts`](client/src/renderer/utils/constants.ts:1) - TURN 服务器配置
3. [`server/src/socket/handlers/WebRTCHandler.ts`](server/src/socket/handlers/WebRTCHandler.ts:1) - 信令协调逻辑

---

## 7. 总结

### ✅ 可行方案：混合策略

```
┌─────────────────────────────────────────┐
│        智能连接建立流程                  │
├─────────────────────────────────────────┤
│                                         │
│  1. 尝试 P2P 直连 (8秒)                 │
│     ├─ 成功 → ✅ 真正的 P2P（10-30%）    │
│     └─ 失败 → 进入步骤 2                │
│                                         │
│  2. 启用 TURN 中继 (15秒)               │
│     ├─ 成功 → ⚠️ TURN中继（70-90%）     │
│     └─ 失败 → ❌ 连接失败（<1%）         │
│                                         │
└─────────────────────────────────────────┘

总体连接成功率：95%+
其中真正的 P2P：10-30%
TURN 中继：70-90%
```

### ❌ 不可行：100% 的真 P2P

在 Port Restricted Cone NAT 环境下，**没有可靠的方法保证 100% P2P 连接**。这是 NAT 技术的物理限制，不是软件问题。

### 🎯 务实建议

接受现实，使用混合策略：
- 大部分连接会通过 TURN 中继（非 P2P）
- 少数幸运的连接可以实现真 P2P
- 用户体验稳定，连接成功率高

**如果必须是真 P2P**，只有一个办法：
- 确保至少一方有公网 IP 或在 Full Cone NAT 环境
- 否则物理上无法保证 P2P 连接

---

## 7. 参考资源

- [Coturn 官方文档](https://github.com/coturn/coturn)
- [WebRTC ICE 详解](https://webrtc.org/getting-started/peer-connections)
- [NAT 穿透技术](https://datatracker.ietf.org/doc/html/rfc5389)
- [Metered.ca 使用指南](https://www.metered.ca/docs/)

---

**文档版本**: v1.0  
**最后更新**: 2026-01-19  
**维护者**: [项目团队]
