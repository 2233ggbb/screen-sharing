# 屏幕共享 Mobile - React Native 移动端

多人屏幕共享系统的 React Native 移动端应用，支持 Android 平台的屏幕共享功能。

## 功能特性

- 🏠 创建/加入房间
- 📺 屏幕共享（Android 5.0+）
- 👥 多人实时协作
- 🔄 WebRTC P2P 连接
- 🎛️ 多档位画质调节

## 技术栈

- **框架**: React Native 0.76
- **语言**: TypeScript
- **导航**: React Navigation 7
- **状态管理**: Zustand 5
- **UI 组件**: React Native Paper 5
- **WebRTC**: react-native-webrtc
- **Socket**: socket.io-client

## 环境要求

- Node.js >= 20
- npm >= 10
- Android SDK >= 21 (Android 5.0)
- JDK 17
- React Native CLI

## 开发环境设置

### 1. 安装依赖

```bash
cd mobile
npm install
```

### 2. 配置服务器地址

编辑 `src/utils/constants.ts`：

```typescript
export const SERVER_URL = __DEV__
  ? 'http://YOUR_LOCAL_IP:3000'  // 替换为您的本地 IP
  : 'https://your-production-server.com';
```

### 3. 运行应用

```bash
# 启动 Metro bundler
npm start

# 运行 Android（新终端）
npm run android
```

## 项目结构

```
mobile/
├── App.tsx                      # 应用入口
├── index.js                     # 注册入口
├── src/
│   ├── components/              # 组件
│   │   ├── VideoGrid.tsx        # 视频网格
│   │   └── UserList.tsx         # 用户列表
│   ├── screens/                 # 页面
│   │   ├── HomeScreen.tsx       # 首页
│   │   └── RoomScreen.tsx       # 房间页
│   ├── services/                # 服务层
│   │   ├── socket/              # Socket 服务
│   │   ├── webrtc/              # WebRTC 服务
│   │   └── screenCapture/       # 屏幕捕获服务
│   ├── store/                   # 状态管理
│   │   ├── useRoomStore.ts      # 房间状态
│   │   ├── useUserStore.ts      # 用户状态
│   │   └── useStreamStore.ts    # 流状态
│   ├── theme/                   # 主题配置
│   └── utils/                   # 工具函数
├── android/                     # Android 原生代码
│   └── app/src/main/java/com/screensharing/
│       ├── ScreenCaptureModule.java   # 屏幕捕获模块
│       ├── ScreenCapturePackage.java  # 模块注册
│       └── ScreenCaptureService.java  # 前台服务
```

## 核心模块说明

### SocketService

Socket.io 服务封装，负责与信令服务器通信：

```typescript
import { socketService } from '@services/socket/SocketService';

// 连接服务器
await socketService.connect();

// 创建房间
socketService.createRoom({ roomName: '房间名', nickname: '昵称' });

// 加入房间
socketService.joinRoom({ roomId: 'ABC123', nickname: '昵称' });
```

### WebRTCService

WebRTC P2P 连接管理：

```typescript
import { webrtcService } from '@services/webrtc/WebRTCService';

// 创建连接
const pc = webrtcService.createPeerConnection(remoteUserId, {
  onTrack: (stream) => { /* 接收远程流 */ },
  onIceCandidate: (candidate) => { /* 发送候选 */ },
});

// 创建 Offer
const offer = await webrtcService.createOffer(remoteUserId);
```

### ScreenCaptureService

屏幕捕获服务：

```typescript
import { screenCaptureService } from '@services/screenCapture/ScreenCaptureService';

// 开始屏幕共享
const stream = await screenCaptureService.startCapture('MEDIUM');

// 停止共享
screenCaptureService.stopCapture();
```

## Android 权限

应用需要以下权限（已在 AndroidManifest.xml 中配置）：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
```

## 画质配置

支持三档画质：

| 档位 | 分辨率 | 帧率 | 比特率 |
|------|--------|------|--------|
| LOW | 640x360 | 15fps | 500kbps |
| MEDIUM | 1280x720 | 24fps | 1200kbps |
| HIGH | 1920x1080 | 30fps | 2500kbps |

## 与服务端通信

移动端使用与桌面端相同的信令协议，通过共享的 `@screen-sharing/shared` 包确保类型一致。

主要事件：
- `CREATE_ROOM` / `ROOM_CREATED`
- `JOIN_ROOM` / `ROOM_JOINED`
- `START_SHARING` / `USER_STARTED_SHARING`
- `SEND_OFFER` / `RECEIVE_OFFER`
- `SEND_ANSWER` / `RECEIVE_ANSWER`
- `SEND_ICE_CANDIDATE` / `RECEIVE_ICE_CANDIDATE`

## 调试

### 查看日志

```bash
adb logcat | grep -E "(ScreenCapture|WebRTC|Socket)"
```

### React Native Debugger

1. 摇晃设备打开开发者菜单
2. 选择 "Debug with Chrome"

## 构建发布

```bash
# Debug APK
npm run build:android:debug

# Release APK
npm run build:android

# APK 输出位置
# android/app/build/outputs/apk/
```

## 已知限制

1. **iOS 屏幕共享**: 需要 Broadcast Upload Extension，暂未实现
2. **后台运行**: 屏幕共享需要保持应用在前台
3. **横屏模式**: 建议观看时使用横屏以获得最佳体验

## 故障排除

### 连接失败

1. 确保服务器地址配置正确
2. 检查手机与服务器网络连通性
3. 确保服务器端口开放

### 屏幕共享无法启动

1. 检查 Android 版本 >= 5.0
2. 确保权限弹窗已允许
3. 检查是否有其他应用占用屏幕捕获

### WebRTC 连接问题

1. 检查 STUN/TURN 服务器配置
2. 确保防火墙允许 UDP 流量
3. 尝试切换到 TURN 中继模式

## 许可证

MIT License
