# 多人屏幕共享系统 - 客户端

基于 Electron + React + TypeScript 的桌面客户端应用。

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **React 18**: UI框架
- **TypeScript**: 类型安全
- **Vite**: 快速构建工具
- **Ant Design**: UI组件库
- **Zustand**: 状态管理
- **Socket.io Client**: WebSocket通信
- **WebRTC**: 实时音视频传输

## 项目结构

```
client/
├── src/
│   ├── main/              # Electron主进程
│   │   ├── index.ts       # 主进程入口
│   │   └── ipc/           # IPC通信处理
│   ├── preload/           # 预加载脚本
│   │   └── index.ts
│   └── renderer/          # 渲染进程（React应用）
│       ├── pages/         # 页面组件
│       │   ├── Home/      # 首页
│       │   ├── Room/      # 房间页
│       │   └── Settings/  # 设置页
│       ├── components/    # 可复用组件
│       │   ├── VideoGrid/ # 视频网格
│       │   ├── UserList/  # 用户列表
│       │   └── Controls/  # 控制栏
│       ├── services/      # 业务服务
│       │   ├── webrtc/    # WebRTC服务
│       │   ├── socket/    # Socket服务
│       │   └── screen/    # 屏幕捕获服务
│       ├── store/         # 状态管理
│       │   ├── user.ts    # 用户状态
│       │   ├── room.ts    # 房间状态
│       │   └── stream.ts  # 流状态
│       ├── utils/         # 工具函数
│       └── styles/        # 全局样式
├── public/                # 静态资源
├── build/                 # 构建配置
└── package.json
```

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

这将同时启动：
- Vite开发服务器 (http://localhost:5173)
- Electron应用

### 构建

```bash
# 构建渲染进程
npm run build:renderer

# 构建主进程
npm run build:main

# 构建预加载脚本
npm run build:preload

# 完整构建
npm run build
```

### 打包

```bash
# 打包为可分发的应用
npm run build:prod
```

## 核心功能

### 1. 房间管理
- 创建房间
- 加入房间
- 离开房间

### 2. 屏幕共享
- 选择屏幕/窗口源
- 开始/停止共享
- 多人同时共享

### 3. 视频显示
- 网格布局
- 焦点模式
- 双击切换

### 4. 用户管理
- 用户列表
- 在线状态
- 共享状态

## 配置

### 服务器地址

在设置页面可以修改服务器地址，默认为 `http://localhost:3000`

### 视频质量

支持的分辨率：
- 720p (1280x720)
- 1080p (1920x1080)

支持的帧率：
- 15 FPS
- 30 FPS

## 注意事项

1. **屏幕权限**: macOS需要授予屏幕录制权限
2. **网络要求**: 需要稳定的网络连接
3. **浏览器内核**: 使用Electron内置的Chromium

## 故障排除

### 无法捕获屏幕
- 检查是否授予了屏幕录制权限（macOS）
- 重启应用程序

### 连接失败
- 确认服务器地址正确
- 检查服务器是否运行
- 检查网络连接

### 视频卡顿
- 降低分辨率和帧率
- 检查网络带宽
- 关闭其他占用资源的程序

## License

MIT
