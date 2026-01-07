# @screen-sharing/shared

多人屏幕共享系统的共享模块，包含客户端和服务端共享的类型定义、事件定义和常量。

## 📦 包含内容

### 类型定义 (types/)
- 用户相关类型（User, UserStatus）
- 房间相关类型（Room, CreateRoomRequest, JoinRoomRequest）
- 屏幕共享相关类型（ShareSource, ShareConfig, StreamInfo）
- WebRTC相关类型（IceCandidate, RTCSessionDescriptionData, ConnectionQuality）
- 错误相关类型（ErrorCode, ErrorResponse）
- 响应类型（ApiResponse, SuccessResponse, FailureResponse）

### 事件定义 (events/)
- 客户端事件（ClientEvents, ClientEventParams）
- 服务端事件（ServerEvents, ServerEventParams）
- 事件处理器类型（EventHandler, EventListeners）

### 常量定义 (constants/)
- 房间配置常量（ROOM_CONSTANTS）
- 用户配置常量（USER_CONSTANTS）
- 共享配置常量（SHARE_CONSTANTS, SHARE_QUALITY_CONFIG）
- WebRTC配置常量（WEBRTC_CONSTANTS）
- 连接质量阈值（QUALITY_THRESHOLDS）
- Socket.io配置（SOCKET_CONFIG）
- 错误消息（ERROR_MESSAGES）
- 其他常量（时间、存储、日志、API、应用信息）

## 🚀 使用方法

### 安装依赖

```bash
npm install
```

### 构建

```bash
npm run build
```

### 开发模式（监听文件变化）

```bash
npm run watch
```

## 📖 使用示例

### 在服务端使用

```typescript
import {
  ClientEvents,
  ServerEvents,
  Room,
  User,
  ROOM_CONSTANTS,
  ERROR_MESSAGES,
} from '@screen-sharing/shared';

// 使用类型
const room: Room = {
  id: 'ABC123',
  name: '我的房间',
  ownerId: 'user-1',
  hasPassword: false,
  members: [],
  createdAt: new Date(),
  maxMembers: ROOM_CONSTANTS.DEFAULT_MAX_MEMBERS,
};

// 监听客户端事件
socket.on(ClientEvents.CREATE_ROOM, (data) => {
  console.log('创建房间:', data);
});

// 发送服务端事件
socket.emit(ServerEvents.ROOM_CREATED, { room, userId: 'user-1' });
```

### 在客户端使用

```typescript
import {
  ClientEvents,
  ServerEvents,
  ShareQuality,
  SHARE_QUALITY_CONFIG,
  STORAGE_KEYS,
} from '@screen-sharing/shared';

// 使用常量
const quality = ShareQuality.MEDIUM;
const config = SHARE_QUALITY_CONFIG[quality];

// 发送事件到服务端
socket.emit(ClientEvents.START_SHARING, {
  sourceId: 'screen-1',
  sourceName: '主屏幕',
  sourceType: 'screen',
  config,
});

// 监听服务端事件
socket.on(ServerEvents.USER_STARTED_SHARING, (data) => {
  console.log('用户开始共享:', data);
});

// 使用本地存储键
localStorage.setItem(STORAGE_KEYS.SHARE_QUALITY, quality);
```

## 📁 目录结构

```
shared/
├── src/
│   ├── types/          # 类型定义
│   │   └── index.ts
│   ├── events/         # 事件定义
│   │   └── index.ts
│   ├── constants/      # 常量定义
│   │   └── index.ts
│   └── index.ts        # 主入口文件
├── dist/               # 编译输出目录
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 开发

本模块使用 TypeScript 开发，编译后生成 JavaScript 和类型声明文件。

### 添加新类型

在 `src/types/index.ts` 中添加：

```typescript
export interface NewType {
  // 字段定义
}
```

### 添加新事件

在 `src/events/index.ts` 中添加：

```typescript
export enum ClientEvents {
  // ...
  NEW_EVENT = 'new_event',
}

export interface ClientEventParams {
  // ...
  [ClientEvents.NEW_EVENT]: { /* 参数类型 */ };
}
```

### 添加新常量

在 `src/constants/index.ts` 中添加：

```typescript
export const NEW_CONSTANTS = {
  // 常量定义
} as const;
```

## 📝 注意事项

1. 所有导出的类型和常量都应该有清晰的注释
2. 修改类型定义后记得重新构建
3. 保持类型的向后兼容性
4. 使用 `as const` 确保常量不可变

## 📄 许可证

MIT
