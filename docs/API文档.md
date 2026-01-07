# 多人屏幕共享系统 - API接口文档

## 文档信息

| 项目名称 | 多人屏幕共享系统 |
|---------|-----------------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-01-04 |
| 协议类型 | WebSocket (Socket.io) + HTTP REST |

---

## 1. 接口概览

### 1.1 接口分类

| 类型 | 协议 | 用途 |
|------|------|------|
| **实时通信接口** | WebSocket (Socket.io) | 房间管理、信令传输、实时消息 |
| **HTTP接口** | HTTP REST | 健康检查、房间查询（可选） |

### 1.2 服务器地址

```typescript
// 开发环境
const DEV_SERVER = {
  ws: 'ws://localhost:3000',
  http: 'http://localhost:3000'
};

// 生产环境
const PROD_SERVER = {
  ws: 'wss://your-domain.com',
  http: 'https://your-domain.com'
};
```

---

## 2. WebSocket 接口（Socket.io）

### 2.1 连接建立

#### 2.1.1 客户端连接

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('ws://localhost:3000', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 10000,
  auth: {
    userId: 'user-123',      // 可选：用户ID
    nickname: '张三',         // 可选：昵称
  }
});

// 连接成功
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// 连接失败
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// 断开连接
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

#### 2.1.2 服务端响应

```typescript
// 连接认证（可选）
io.use((socket, next) => {
  const { userId, nickname } = socket.handshake.auth;
  
  if (!nickname || nickname.length === 0) {
    return next(new Error('Nickname is required'));
  }
  
  // 将用户信息附加到socket
  socket.data.userId = userId || generateUserId();
  socket.data.nickname = nickname;
  
  next();
});
```

---

### 2.2 房间管理接口

#### 2.2.1 创建房间

**事件名**: `create-room`

**客户端发送**:

```typescript
interface CreateRoomRequest {
  name: string;           // 房间名称 (1-50字符)
  password?: string;      // 房间密码 (可选, 4-20字符)
  maxMembers?: number;    // 最大成员数 (默认10)
}

socket.emit('create-room', {
  name: '技术分享会议',
  password: 'abc123',
  maxMembers: 10
});
```

**服务端响应**:

```typescript
interface CreateRoomResponse {
  success: boolean;
  roomId: string;         // 房间ID (6位字符)
  roomInfo: {
    id: string;
    name: string;
    hostId: string;       // 房主用户ID
    maxMembers: number;
    hasPassword: boolean; // 是否有密码
    memberCount: number;  // 当前成员数
    createdAt: string;    // ISO 8601格式
  };
}

// 成功
socket.on('room-created', (response: CreateRoomResponse) => {
  console.log('Room created:', response);
});

// 失败
socket.on('create-room-error', (error: ErrorResponse) => {
  console.error('Failed to create room:', error);
});
```

**错误码**:

| 错误码 | 说明 |
|-------|------|
| `INVALID_ROOM_NAME` | 房间名称不合法 |
| `INVALID_PASSWORD` | 密码格式不合法 |
| `ROOM_LIMIT_REACHED` | 达到房间数量上限 |

---

#### 2.2.2 加入房间

**事件名**: `join-room`

**客户端发送**:

```typescript
interface JoinRoomRequest {
  roomId: string;         // 房间ID
  password?: string;      // 房间密码（如果房间有密码）
  userInfo: {
    nickname: string;     // 昵称
    avatar?: string;      // 头像URL（可选）
  };
}

socket.emit('join-room', {
  roomId: 'ABC123',
  password: 'abc123',
  userInfo: {
    nickname: '李四',
    avatar: 'https://example.com/avatar.jpg'
  }
});
```

**服务端响应**:

```typescript
interface JoinRoomResponse {
  success: boolean;
  roomInfo: {
    id: string;
    name: string;
    hostId: string;
    memberCount: number;
    maxMembers: number;
  };
  members: User[];        // 房间内所有成员
  streams: Stream[];      // 当前所有共享流
  yourUserId: string;     // 当前用户的ID
}

interface User {
  id: string;
  nickname: string;
  avatar?: string;
  isHost: boolean;
  isSharing: boolean;
  joinedAt: string;
}

interface Stream {
  id: string;
  userId: string;
  type: 'screen' | 'window';
  title: string;
  resolution: {
    width: number;
    height: number;
  };
  startedAt: string;
}

// 成功
socket.on('join-success', (response: JoinRoomResponse) => {
  console.log('Joined room:', response);
});

// 失败
socket.on('join-error', (error: ErrorResponse) => {
  console.error('Failed to join room:', error);
});
```

**错误码**:

| 错误码 | 说明 |
|-------|------|
| `ROOM_NOT_FOUND` | 房间不存在 |
| `WRONG_PASSWORD` | 密码错误 |
| `ROOM_FULL` | 房间已满 |
| `ALREADY_IN_ROOM` | 已在房间中 |

**房间内广播**:

当新成员加入时，服务器会向房间内其他成员广播：

```typescript
interface UserJoinedEvent {
  userId: string;
  userInfo: {
    nickname: string;
    avatar?: string;
    isHost: boolean;
  };
}

socket.on('user-joined', (event: UserJoinedEvent) => {
  console.log('New user joined:', event);
  // 更新UI显示新成员
});
```

---

#### 2.2.3 离开房间

**事件名**: `leave-room`

**客户端发送**:

```typescript
interface LeaveRoomRequest {
  roomId: string;
}

socket.emit('leave-room', {
  roomId: 'ABC123'
});
```

**服务端响应**:

```typescript
interface LeaveRoomResponse {
  success: boolean;
  message: string;
}

socket.on('leave-success', (response: LeaveRoomResponse) => {
  console.log('Left room:', response);
});
```

**房间内广播**:

```typescript
interface UserLeftEvent {
  userId: string;
  nickname: string;
  newHostId?: string;  // 如果房主离开，新房主ID
}

socket.on('user-left', (event: UserLeftEvent) => {
  console.log('User left:', event);
  // 更新UI移除该用户
});

// 如果是房主离开，通知新房主
socket.on('host-changed', (event: { newHostId: string }) => {
  console.log('New host:', event);
});
```

---

#### 2.2.4 获取房间信息

**事件名**: `get-room-info`

**客户端发送**:

```typescript
socket.emit('get-room-info', { roomId: 'ABC123' });
```

**服务端响应**:

```typescript
interface RoomInfo {
  id: string;
  name: string;
  hostId: string;
  memberCount: number;
  maxMembers: number;
  hasPassword: boolean;
  members: User[];
  streams: Stream[];
}

socket.on('room-info', (info: RoomInfo) => {
  console.log('Room info:', info);
});
```

---

### 2.3 屏幕共享接口

#### 2.3.1 开始共享

**事件名**: `start-sharing`

**客户端发送**:

```typescript
interface StartSharingRequest {
  roomId: string;
  streamInfo: {
    type: 'screen' | 'window';
    title: string;        // 屏幕名称或窗口标题
    resolution: {
      width: number;
      height: number;
    };
    frameRate: number;
  };
}

socket.emit('start-sharing', {
  roomId: 'ABC123',
  streamInfo: {
    type: 'screen',
    title: '主屏幕',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30
  }
});
```

**服务端响应**:

```typescript
interface StartSharingResponse {
  success: boolean;
  streamId: string;     // 生成的流ID
}

socket.on('sharing-started', (response: StartSharingResponse) => {
  console.log('Sharing started:', response);
});
```

**房间内广播**:

```typescript
interface StreamAddedEvent {
  streamId: string;
  userId: string;
  userNickname: string;
  streamInfo: {
    type: 'screen' | 'window';
    title: string;
    resolution: { width: number; height: number };
  };
}

socket.on('stream-added', (event: StreamAddedEvent) => {
  console.log('New stream added:', event);
  // 发起WebRTC连接请求该流
});
```

---

#### 2.3.2 停止共享

**事件名**: `stop-sharing`

**客户端发送**:

```typescript
interface StopSharingRequest {
  roomId: string;
  streamId: string;
}

socket.emit('stop-sharing', {
  roomId: 'ABC123',
  streamId: 'stream-xyz'
});
```

**服务端响应**:

```typescript
socket.on('sharing-stopped', (response: { success: boolean }) => {
  console.log('Sharing stopped:', response);
});
```

**房间内广播**:

```typescript
interface StreamRemovedEvent {
  streamId: string;
  userId: string;
}

socket.on('stream-removed', (event: StreamRemovedEvent) => {
  console.log('Stream removed:', event);
  // 关闭对应的PeerConnection
});
```

---

### 2.4 WebRTC 信令接口

#### 2.4.1 发送 Offer

**事件名**: `webrtc-offer`

**客户端发送**:

```typescript
interface WebRTCOfferRequest {
  roomId: string;
  toUserId: string;       // 目标用户ID
  streamId: string;       // 关联的流ID
  offer: {
    type: 'offer';
    sdp: string;          // SDP描述
  };
}

socket.emit('webrtc-offer', {
  roomId: 'ABC123',
  toUserId: 'user-456',
  streamId: 'stream-xyz',
  offer: {
    type: 'offer',
    sdp: '...'
  }
});
```

**目标用户收到**:

```typescript
interface WebRTCOfferEvent {
  fromUserId: string;
  fromNickname: string;
  streamId: string;
  offer: RTCSessionDescriptionInit;
}

socket.on('webrtc-offer', async (event: WebRTCOfferEvent) => {
  console.log('Received offer from:', event.fromUserId);
  
  // 创建PeerConnection并设置远程描述
  const pc = new RTCPeerConnection(config);
  await pc.setRemoteDescription(event.offer);
  
  // 创建Answer
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  
  // 发送Answer
  socket.emit('webrtc-answer', {
    roomId: 'ABC123',
    toUserId: event.fromUserId,
    streamId: event.streamId,
    answer: answer
  });
});
```

---

#### 2.4.2 发送 Answer

**事件名**: `webrtc-answer`

**客户端发送**:

```typescript
interface WebRTCAnswerRequest {
  roomId: string;
  toUserId: string;
  streamId: string;
  answer: {
    type: 'answer';
    sdp: string;
  };
}

socket.emit('webrtc-answer', {
  roomId: 'ABC123',
  toUserId: 'user-123',
  streamId: 'stream-xyz',
  answer: {
    type: 'answer',
    sdp: '...'
  }
});
```

**目标用户收到**:

```typescript
interface WebRTCAnswerEvent {
  fromUserId: string;
  streamId: string;
  answer: RTCSessionDescriptionInit;
}

socket.on('webrtc-answer', async (event: WebRTCAnswerEvent) => {
  console.log('Received answer from:', event.fromUserId);
  
  // 获取对应的PeerConnection
  const pc = getPeerConnection(event.fromUserId);
  await pc.setRemoteDescription(event.answer);
});
```

---

#### 2.4.3 交换 ICE 候选

**事件名**: `ice-candidate`

**客户端发送**:

```typescript
interface IceCandidateRequest {
  roomId: string;
  toUserId: string;
  candidate: RTCIceCandidateInit;
}

// 监听本地ICE候选
pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', {
      roomId: 'ABC123',
      toUserId: 'user-456',
      candidate: event.candidate.toJSON()
    });
  }
};
```

**目标用户收到**:

```typescript
interface IceCandidateEvent {
  fromUserId: string;
  candidate: RTCIceCandidateInit;
}

socket.on('ice-candidate', async (event: IceCandidateEvent) => {
  console.log('Received ICE candidate from:', event.fromUserId);
  
  const pc = getPeerConnection(event.fromUserId);
  await pc.addIceCandidate(new RTCIceCandidate(event.candidate));
});
```

---

### 2.5 聊天接口（可选）

#### 2.5.1 发送消息

**事件名**: `chat-message`

**客户端发送**:

```typescript
interface ChatMessageRequest {
  roomId: string;
  message: {
    type: 'text' | 'link';
    content: string;
    timestamp: number;
  };
}

socket.emit('chat-message', {
  roomId: 'ABC123',
  message: {
    type: 'text',
    content: '大家好',
    timestamp: Date.now()
  }
});
```

**房间内广播**:

```typescript
interface ChatMessageEvent {
  messageId: string;
  fromUserId: string;
  fromNickname: string;
  message: {
    type: 'text' | 'link';
    content: string;
    timestamp: number;
  };
}

socket.on('chat-message', (event: ChatMessageEvent) => {
  console.log('New message:', event);
  // 显示消息
});
```

---

### 2.6 系统事件

#### 2.6.1 错误事件

**事件名**: `error`

```typescript
interface ErrorResponse {
  code: string;           // 错误码
  message: string;        // 错误描述
  details?: any;          // 详细信息（可选）
}

socket.on('error', (error: ErrorResponse) => {
  console.error('Error:', error);
  
  switch (error.code) {
    case 'ROOM_NOT_FOUND':
      alert('房间不存在');
      break;
    case 'WRONG_PASSWORD':
      alert('密码错误');
      break;
    case 'ROOM_FULL':
      alert('房间已满');
      break;
    default:
      alert('发生错误: ' + error.message);
  }
});
```

**常见错误码**:

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `ROOM_NOT_FOUND` | 房间不存在 | 检查房间ID |
| `WRONG_PASSWORD` | 密码错误 | 重新输入密码 |
| `ROOM_FULL` | 房间已满 | 联系房主或稍后重试 |
| `ALREADY_IN_ROOM` | 已在房间中 | 先离开当前房间 |
| `PERMISSION_DENIED` | 权限不足 | 联系房主 |
| `INVALID_STREAM_ID` | 无效的流ID | 刷新页面重试 |
| `CONNECTION_TIMEOUT` | 连接超时 | 检查网络连接 |

---

#### 2.6.2 房间关闭事件

**事件名**: `room-closed`

```typescript
interface RoomClosedEvent {
  roomId: string;
  reason: 'host_left' | 'empty' | 'admin_closed';
  message: string;
}

socket.on('room-closed', (event: RoomClosedEvent) => {
  console.log('Room closed:', event);
  alert('房间已关闭: ' + event.message);
  // 返回首页
});
```

---

#### 2.6.3 被移除事件

**事件名**: `kicked`

```typescript
interface KickedEvent {
  roomId: string;
  reason: string;
  by: string;  // 执行移除操作的用户ID
}

socket.on('kicked', (event: KickedEvent) => {
  console.log('You were kicked:', event);
  alert('您已被移出房间');
  // 返回首页
});
```

---

## 3. HTTP REST 接口

### 3.1 健康检查

**接口**: `GET /health`

**描述**: 检查服务器健康状态

**请求**:

```bash
curl -X GET http://localhost:3000/health
```

**响应**:

```json
{
  "status": "ok",
  "timestamp": "2026-01-04T06:00:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "metrics": {
    "activeConnections": 50,
    "totalRooms": 10,
    "totalUsers": 45,
    "memoryUsage": {
      "rss": 150000000,
      "heapUsed": 100000000
    }
  }
}
```

---

### 3.2 获取公开房间列表（可选）

**接口**: `GET /api/rooms`

**描述**: 获取所有公开房间列表

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码（默认1） |
| `limit` | number | 否 | 每页数量（默认20） |
| `status` | string | 否 | 房间状态（active/all） |

**请求示例**:

```bash
curl -X GET "http://localhost:3000/api/rooms?page=1&limit=20&status=active"
```

**响应**:

```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "ABC123",
        "name": "技术分享会议",
        "hostId": "user-123",
        "hostNickname": "张三",
        "memberCount": 5,
        "maxMembers": 10,
        "hasPassword": true,
        "activeStreams": 2,
        "createdAt": "2026-01-04T06:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3.3 验证房间密码

**接口**: `POST /api/rooms/:roomId/verify`

**描述**: 验证房间密码是否正确

**请求**:

```bash
curl -X POST http://localhost:3000/api/rooms/ABC123/verify \
  -H "Content-Type: application/json" \
  -d '{"password": "abc123"}'
```

**响应**:

```json
{
  "success": true,
  "valid": true,
  "message": "密码正确"
}
```

---

## 4. 完整使用示例

### 4.1 创建房间并分享屏幕

```typescript
import { io, Socket } from 'socket.io-client';

class ScreenSharingClient {
  private socket: Socket;
  private roomId: string = '';
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  
  constructor() {
    // 1. 连接服务器
    this.socket = io('ws://localhost:3000', {
      auth: {
        nickname: '张三'
      }
    });
    
    this.setupListeners();
  }
  
  private setupListeners() {
    // 监听房间创建成功
    this.socket.on('room-created', (response) => {
      this.roomId = response.roomId;
      console.log('房间创建成功:', response);
    });
    
    // 监听新用户加入
    this.socket.on('user-joined', (event) => {
      console.log('新用户加入:', event.userInfo.nickname);
      // 如果我在共享屏幕，为新用户创建连接
      if (this.isSharing()) {
        this.createOfferForUser(event.userId);
      }
    });
    
    // 监听WebRTC Offer
    this.socket.on('webrtc-offer', async (event) => {
      await this.handleOffer(event);
    });
    
    // 监听WebRTC Answer
    this.socket.on('webrtc-answer', async (event) => {
      await this.handleAnswer(event);
    });
    
    // 监听ICE候选
    this.socket.on('ice-candidate', async (event) => {
      await this.handleIceCandidate(event);
    });
  }
  
  // 2. 创建房间
  async createRoom(name: string, password?: string) {
    this.socket.emit('create-room', { name, password });
  }
  
  // 3. 开始屏幕共享
  async startSharing() {
    // 获取屏幕流
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      }
    });
    
    // 通知服务器
    this.socket.emit('start-sharing', {
      roomId: this.roomId,
      streamInfo: {
        type: 'screen',
        title: '主屏幕',
        resolution: { width: 1920, height: 1080 },
        frameRate: 30
      }
    });
    
    // 为房间内每个用户创建Offer
    // （需要先获取房间成员列表）
  }
  
  // 4. 为指定用户创建Offer
  private async createOfferForUser(userId: string) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });
    
    // 添加本地流
    const stream = this.getLocalStream();
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    // 监听ICE候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          roomId: this.roomId,
          toUserId: userId,
          candidate: event.candidate.toJSON()
        });
      }
    };
    
    // 创建Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // 发送Offer
    this.socket.emit('webrtc-offer', {
      roomId: this.roomId,
      toUserId: userId,
      streamId: 'my-stream-id',
      offer: offer
    });
    
    this.peerConnections.set(userId, pc);
  }
  
  // 5. 处理收到的Offer
  private async handleOffer(event: any) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });
    
    // 监听远程流
    pc.ontrack = (trackEvent) => {
      console.log('收到远程流:', trackEvent.streams[0]);
      this.displayRemoteStream(event.fromUserId, trackEvent.streams[0]);
    };
    
    // 监听ICE候选
    pc.onicecandidate = (iceEvent) => {
      if (iceEvent.candidate) {
        this.socket.emit('ice-candidate', {
          roomId: this.roomId,
          toUserId: event.fromUserId,
          candidate: iceEvent.candidate.toJSON()
        });
      }
    };
    
    // 设置远程描述
    await pc.setRemoteDescription(event.offer);
    
    // 创建Answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    // 发送Answer
    this.socket.emit('webrtc-answer', {
      roomId: this.roomId,
      toUserId: event.fromUserId,
      streamId: event.streamId,
      answer: answer
    });
    
    this.peerConnections.set(event.fromUserId, pc);
  }
  
  // 6. 处理收到的Answer
  private async handleAnswer(event: any) {
    const pc = this.peerConnections.get(event.fromUserId);
    if (pc) {
      await pc.setRemoteDescription(event.answer);
    }
  }
  
  // 7. 处理ICE候选
  private async handleIceCandidate(event: any) {
    const pc = this.peerConnections.get(event.fromUserId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(event.candidate));
    }
  }
  
  // 辅助方法
  private getLocalStream(): MediaStream {
    // 返回本地流
    return new MediaStream();
  }
  
  private isSharing(): boolean {
    // 检查是否正在共享
    return false;
  }
  
  private displayRemoteStream(userId: string, stream: MediaStream) {
    // 在UI上显示远程流
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    document.body.appendChild(video);
  }
}

// 使用示例
const client = new ScreenSharingClient();
client.createRoom('技术分享会', 'abc123');
```

---

### 4.2 加入房间并观看

```typescript
class ScreenViewerClient {
  private socket: Socket;
  private roomId: string;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  
  constructor(roomId: string) {
    this.roomId = roomId;
    this.socket = io('ws://localhost:3000', {
      auth: { nickname: '李四' }
    });
    
    this.setupListeners();
    this.joinRoom();
  }
  
  private setupListeners() {
    // 加入成功
    this.socket.on('join-success', (response) => {
      console.log('加入成功:', response);
      
      // 为每个现有流创建连接
      response.streams.forEach(stream => {
        // 等待对方发送Offer
      });
    });
    
    // 新流添加
    this.socket.on('stream-added', (event) => {
      console.log('新流添加:', event);
      // 等待对方发送Offer
    });
    
    // 流移除
    this.socket.on('stream-removed', (event) => {
      console.log('流移除:', event);
      const pc = this.peerConnections.get(event.userId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(event.userId);
      }
    });
    
    // WebRTC信令
    this.socket.on('webrtc-offer', async (event) => {
      await this.handleOffer(event);
    });
    
    this.socket.on('ice-candidate', async (event) => {
      await this.handleIceCandidate(event);
    });
  }
  
  private joinRoom() {
    this.socket.emit('join-room', {
      roomId: this.roomId,
      userInfo: { nickname: '李四' }
    });
  }
  
  private async handleOffer(event: any) {
    // （同上面的示例）
  }
  
  private async handleIceCandidate(event: any) {
    // （同上面的示例）
  }
}

// 使用示例
const viewer = new ScreenViewerClient('ABC123');
```

---

## 5. 错误处理最佳实践

```typescript
class ErrorHandler {
  static handle(error: ErrorResponse) {
    switch (error.code) {
      case 'ROOM_NOT_FOUND':
        this.showError('房间不存在，请检查房间号');
        this.redirectToHome();
        break;
        
      case 'WRONG_PASSWORD':
        this.showError('密码错误，请重试');
        break;
        
      case 'ROOM_FULL':
        this.showError('房间已满，请稍后再试');
        this.redirectToHome();
        break;
        
      case 'CONNECTION_TIMEOUT':
        this.showError('连接超时，正在重试...');
        this.retryConnection();
        break;
        
      default:
        this.showError('发生未知错误: ' + error.message);
        console.error('Unhandled error:', error);
    }
  }
  
  static showError(message: string) {
    // 显示错误提示
    alert(message);
  }
  
  static redirectToHome() {
    // 返回首页
    window.location.href = '/';
  }
  
  static retryConnection() {
    // 重试连接逻辑
  }
}

// 使用
socket.on('error', (error) => {
  ErrorHandler.handle(error);
});
```

---

## 6. 性能优化建议

### 6.1 心跳检测

```typescript
// 客户端心跳
setInterval(() => {
  socket.emit('ping');
}, 30000);  // 每30秒发送一次心跳

socket.on('pong', () => {
  console.log('服务器响应正常');
});
```

### 6.2 消息压缩

```typescript
// Socket.io配置
const io = new Server(httpServer, {
  perMessageDeflate: {
    threshold: 1024  // 超过1KB的消息进行压缩
  }
});
```

### 6.3 事件节流

```typescript
// 对于频繁触发的事件（如鼠标移动），使用节流
let lastEmitTime = 0;
const throttleInterval = 100;  // 100ms

function throttledEmit(event: string, data: any) {
  const now = Date.now();
  if (now - lastEmitTime >= throttleInterval) {
    socket.emit(event, data);
    lastEmitTime = now;
  }
}
```

---

## 7. 安全建议

### 7.1 输入验证

```typescript
// 客户端验证
function validateRoomName(name: string): boolean {
  return name.length >= 1 && 
         name.length <= 50 && 
         /^[a-zA-Z0-9\u4e00-\u9fa5\s-_]+$/.test(name);
}

function validatePassword(password: string): boolean {
  return password.length >= 4 && 
         password.length <= 20 && 
         /^[a-zA-Z0-9]+$/.test(password);
}
```

### 7.2 频率限制

```typescript
// 服务端实现简单的频率限制
const rateLimiter = new Map<string, number>();

function checkRateLimit(socketId: string): boolean {
  const lastTime = rateLimiter.get(socketId) || 0;
  const now = Date.now();
  
  if (now - lastTime < 1000) {  // 1秒内只能发送一次
    return false;
  }
  
  rateLimiter.set(socketId, now);
  return true;
}
```

---

## 8. 测试工具

### 8.1 Postman 测试 HTTP 接口

```bash
# 健康检查
GET http://localhost:3000/health

# 获取房间列表
GET http://localhost:3000/api/rooms?page=1&limit=20
```

### 8.2 Socket.io 客户端测试

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.io Test Client</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Socket.io Test Client</h1>
  <button onclick="createRoom()">创建房间</button>
  <button onclick="joinRoom()">加入房间</button>
  
  <script>
    const socket = io('ws://localhost:3000', {
      auth: { nickname: '测试用户' }
    });
    
    socket.on('connect', () => {
      console.log('连接成功:', socket.id);
    });
    
    socket.on('room-created', (data) => {
      console.log('房间创建:', data);
      alert('房间ID: ' + data.roomId);
    });
    
    function createRoom() {
      socket.emit('create-room', {
        name: '测试房间',
        password: 'test123'
      });
    }
    
    function joinRoom() {
      const roomId = prompt('请输入房间ID:');
      socket.emit('join-room', {
        roomId: roomId,
        userInfo: { nickname: '测试用户' }
      });
    }
  </script>
</body>
</html>
```

---

## 附录：TypeScript 类型定义

```typescript
// shared/src/types/events.ts

// Socket事件类型定义
export interface SocketEvents {
  // 客户端 → 服务端
  'create-room': (data: CreateRoomRequest) => void;
  'join-room': (data: JoinRoomRequest) => void;
  'leave-room': (data: LeaveRoomRequest) => void;
  'start-sharing': (data: StartSharingRequest) => void;
  'stop-sharing': (data: StopSharingRequest) => void;
  'webrtc-offer': (data: WebRTCOfferRequest) => void;
  'webrtc-answer': (data: WebRTCAnswerRequest) => void;
  'ice-candidate': (data: IceCandidateRequest) => void;
  'chat-message': (data: ChatMessageRequest) => void;
  
  // 服务端 → 客户端
  'room-created': (data: CreateRoomResponse) => void;
  'join-success': (data: JoinRoomResponse) => void;
  'join-error': (data: ErrorResponse) => void;
  'user-joined': (data: UserJoinedEvent) => void;
  'user-left': (data: UserLeftEvent) => void;
  'stream-added': (data: StreamAddedEvent) => void;
  'stream-removed': (data: StreamRemovedEvent) => void;
  'room-closed': (data: RoomClosedEvent) => void;
  'kicked': (data: KickedEvent) => void;
  'error': (data: ErrorResponse) => void;
}

// 使用类型安全的Socket
import { Socket } from 'socket.io-client';

export type TypedSocket = Socket<SocketEvents, SocketEvents>;
```

---

**文档结束**
