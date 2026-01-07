# 多人屏幕共享系统 - 信令服务器

这是多人屏幕共享系统的信令服务器，基于 Node.js、Express 和 Socket.io 构建。

## 功能特性

- ✅ 房间管理（创建、加入、离开）
- ✅ 用户管理（在线状态、权限控制）
- ✅ WebRTC信令转发（Offer、Answer、ICE候选）
- ✅ 屏幕共享流管理
- ✅ 实时通信（基于Socket.io）
- ✅ 日志记录（基于Winston）
- ✅ 类型安全（TypeScript）

## 技术栈

- **Node.js** 20+
- **Express** 4.x - Web框架
- **Socket.io** 4.x - WebSocket服务
- **TypeScript** 5.x - 类型安全
- **Winston** 3.x - 日志管理

## 目录结构

```
server/
├── src/
│   ├── config/              # 配置文件
│   │   └── index.ts         # 服务器配置
│   ├── models/              # 数据模型
│   │   ├── Room.ts          # 房间模型
│   │   └── User.ts          # 用户模型
│   ├── services/            # 业务服务
│   │   ├── RoomService.ts   # 房间管理服务
│   │   └── SignalingService.ts # 信令服务
│   ├── socket/              # Socket.io处理
│   │   ├── handlers/        # 事件处理器
│   │   │   ├── ConnectionHandler.ts
│   │   │   ├── RoomHandler.ts
│   │   │   └── WebRTCHandler.ts
│   │   └── index.ts         # Socket.io初始化
│   ├── middleware/          # Express中间件
│   │   ├── corsHandler.ts
│   │   └── errorHandler.ts
│   ├── utils/               # 工具函数
│   │   ├── logger.ts        # 日志工具
│   │   ├── id-generator.ts  # ID生成器
│   │   └── validation.ts    # 数据验证
│   └── index.ts             # 服务器入口
├── logs/                    # 日志文件目录
├── .env.example             # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

环境变量说明：

```env
PORT=3000                    # 服务器端口
NODE_ENV=development         # 运行环境
CORS_ORIGIN=*               # CORS允许的来源
LOG_LEVEL=debug             # 日志级别
LOG_DIR=./logs              # 日志目录
ROOM_MAX_MEMBERS=10         # 房间最大成员数
```

### 3. 开发模式运行

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

### 5. 生产模式运行

```bash
npm start
```

## API接口

### HTTP接口

#### 健康检查

```
GET /health
```

响应示例：
```json
{
  "status": "ok",
  "timestamp": "2026-01-04T09:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### API信息

```
GET /api
```

响应示例：
```json
{
  "name": "多人屏幕共享系统",
  "version": "1.0.0",
  "author": "Screen Sharing Team",
  "license": "MIT"
}
```

### Socket.io事件

详细的Socket.io事件说明请参考 `shared/src/events/index.ts`

#### 客户端 → 服务端

- `create_room` - 创建房间
- `join_room` - 加入房间
- `leave_room` - 离开房间
- `start_sharing` - 开始共享
- `stop_sharing` - 停止共享
- `send_offer` - 发送WebRTC Offer
- `send_answer` - 发送WebRTC Answer
- `send_ice_candidate` - 发送ICE候选

#### 服务端 → 客户端

- `connected` - 连接成功
- `room_created` - 房间创建成功
- `room_joined` - 加入房间成功
- `user_joined` - 新用户加入
- `user_left` - 用户离开
- `user_started_sharing` - 用户开始共享
- `user_stopped_sharing` - 用户停止共享
- `receive_offer` - 收到Offer
- `receive_answer` - 收到Answer
- `receive_ice_candidate` - 收到ICE候选
- `error` - 错误消息

## 开发指南

### 添加新的Socket事件

1. 在 `shared/src/events/index.ts` 中定义事件类型
2. 在对应的Handler中添加处理逻辑
3. 在 `socket/index.ts` 中注册事件

### 日志记录

使用Winston进行日志记录：

```typescript
import { Logger } from './utils/logger';

const logger = new Logger('ModuleName');

logger.debug('调试信息');
logger.info('普通信息');
logger.warn('警告信息');
logger.error('错误信息', error);
```

### 数据验证

使用内置的验证工具：

```typescript
import { validateRoomName, validateNickname } from './utils/validation';

const result = validateRoomName(name);
if (!result.valid) {
  // 处理验证失败
}
```

## 测试

### 运行单元测试

```bash
npm test
```

### 运行测试并查看覆盖率

```bash
npm run test:coverage
```

## 部署

### 使用PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start dist/index.js --name screen-sharing-server

# 查看日志
pm2 logs screen-sharing-server

# 重启服务
pm2 restart screen-sharing-server
```

### 使用Docker部署

```bash
# 构建镜像
docker build -t screen-sharing-server .

# 运行容器
docker run -p 3000:3000 -d screen-sharing-server
```

## 性能优化

- 使用内存存储（适合小规模部署）
- 定期清理空房间
- Socket.io连接池管理
- 日志轮转（自动清理旧日志）

## 监控

- 健康检查端点：`GET /health`
- 日志文件：`logs/app.log`、`logs/error.log`
- 进程监控：使用PM2或类似工具

## 故障排查

### 常见问题

1. **端口被占用**
   - 检查环境变量 `PORT`
   - 使用 `lsof -i :3000` 查看端口占用

2. **Socket.io连接失败**
   - 检查CORS配置
   - 确认客户端URL正确

3. **内存占用过高**
   - 检查房间是否正常清理
   - 查看日志文件大小

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系开发团队。
