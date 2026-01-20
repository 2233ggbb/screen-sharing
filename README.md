# 多人屏幕共享系统

## 项目简介

多人屏幕共享系统是一款基于 Electron + WebRTC + Node.js 开发的跨平台屏幕共享解决方案，包含桌面端和移动端应用。专为小型团队（5-10人）设计，支持多人同时分享屏幕、多人实时观看，适用于远程会议、团队协作、技术演示等场景。

## 核心特性

- ✅ **全平台支持**：支持 Windows、macOS、Linux 桌面端及 Android 移动端
- ✅ **多人共享**：支持多人同时分享屏幕
- ✅ **灵活选择**：可选择共享整个屏幕或特定窗口
- ✅ **低延迟**：基于 WebRTC P2P 直连技术，延迟 < 500ms
- ✅ **易用性**：简单直观的操作流程，快速上手
- ✅ **房间管理**：创建/加入房间，支持密码保护

## 使用限制

⚠️ **网络环境要求**：本系统采用纯 P2P 直连模式，对网络环境有一定要求：

- ✅ **完全锥型 NAT** (Full Cone NAT) - 完全支持
- ✅ **受限锥型 NAT** (Restricted Cone NAT) - 完全支持
- ⚠️ **端口受限锥型 NAT** (Port Restricted Cone NAT) - 可能连接失败
- ❌ **对称型 NAT** (Symmetric NAT) - 无法直连
- ❌ **公司/学校防火墙** - 可能被阻止

**注意**：本项目不提供 TURN 中继服务器。如需在复杂 NAT 环境或企业网络中使用，建议自行部署 TURN 服务器。详见 [部署运维文档](docs/部署运维文档.md)。

## 技术栈

### 桌面客户端
- **Electron 28+**: 跨平台桌面应用框架
- **React 18+**: UI 框架
- **TypeScript 5+**: 类型安全
- **Ant Design 5+**: UI 组件库
- **WebRTC**: 实时音视频传输
- **Socket.io Client**: WebSocket 通信
- **Zustand**: 状态管理
- **Less + CSS Modules**: 样式方案
- **ESLint + Prettier**: 代码规范
- **Jest + Testing Library**: 测试框架

### 移动客户端 (Mobile)
- **React Native 0.76+**: 跨平台移动应用框架
- **TypeScript 5+**: 类型安全
- **React Native Paper 5+**: UI 组件库
- **react-native-webrtc**: WebRTC 实现
- **Socket.io Client**: WebSocket 通信
- **Zustand**: 状态管理

### 服务端
- **Node.js 20+**: 运行时
- **Express 4+**: Web 框架
- **Socket.io 4+**: WebSocket 服务器
- **TypeScript 5+**: 类型安全
- **Winston**: 日志管理
- **ESLint + Prettier**: 代码规范
- **Jest + Supertest**: 测试框架

## 项目结构

```
screen-sharing/
├── client/                 # 桌面客户端（Electron应用）
├── mobile/                 # 移动客户端（React Native应用）
├── server/                 # 服务端（Node.js信令服务器）
├── shared/                 # 共享代码（类型定义、常量等）
├── docs/                   # 项目文档
│   ├── 项目总览.md          # 项目总览（推荐首读）
│   ├── PRD.md             # 产品需求文档
│   ├── 技术架构设计.md      # 技术架构文档
│   ├── API文档.md          # API接口文档
│   ├── WebRTC多人共享架构说明.md  # WebRTC架构说明
│   ├── AntDesign使用指南.md      # UI组件库使用指南
│   ├── 主题设计方案.md      # UI主题设计方案
│   ├── 部署运维文档.md      # 部署运维指南
│   ├── 开发指南.md          # 开发指南
│   └── 配置文件示例.md      # 配置文件示例
├── plans/                  # 规划文档
│   └── 项目目录结构.md      # 目录结构规划
└── README.md              # 项目说明
```

## 快速开始

### 环境要求

- Node.js 20.x LTS
- npm 10.x+
- Git 2.x+

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-org/screen-sharing.git
cd screen-sharing

# 安装共享模块
cd shared && npm install && npm run build && cd ..

# 安装服务端依赖
cd server && npm install && cd ..

# 安装客户端依赖
cd client && npm install && cd ..

# 安装移动端依赖
cd mobile && npm install && cd ..
```

### 启动开发环境

**启动服务端**:
```bash
cd server
npm run dev
```

**启动桌面客户端**:
```bash
cd client
npm run dev
```

**启动移动端**:
```bash
cd mobile
# 启动 Metro bundler
npm start

# 运行 Android (需连接设备或模拟器)
npm run android
```

### 构建生产版本

**构建服务端**:
```bash
cd server
npm run build
```

**打包客户端**:
```bash
cd client
npm run build:prod
```

**打包移动端 (Android)**:
```bash
cd mobile
npm run build:android
```

## 文档导航

### 🌟 快速入口
- [**项目总览**](docs/项目总览.md) - **推荐首先阅读**，全面了解项目概况、技术栈、文档体系

### 📋 产品文档
- [产品需求文档 (PRD)](docs/PRD.md) - 了解产品定位、功能需求和用户流程

### 🏗️ 技术文档
- [技术架构设计](docs/技术架构设计.md) - 深入了解系统架构和技术选型
- [API接口文档](docs/API文档.md) - 查看所有 WebSocket 和 HTTP 接口定义
- [WebRTC多人共享架构说明](docs/WebRTC多人共享架构说明.md) - P2P多人共享机制详解
- [NAT穿透优化方案](docs/NAT穿透优化方案.md) - ⭐ 后端协助 P2P 连接方案（推荐）
- [NAT穿透实施指南](docs/NAT穿透实施指南.md) - NAT 穿透优化的实施步骤
- [NAT穿透解决方案](docs/NAT穿透解决方案.md) - 包含 TURN 中继的传统方案
- [项目目录结构](plans/项目目录结构.md) - 详细的项目文件组织说明

### 🚀 开发文档
- [开发指南](docs/开发指南.md) - 快速上手开发，包含代码规范和最佳实践
- [Ant Design使用指南](docs/AntDesign使用指南.md) - UI组件库使用方法和最佳实践
- [主题设计方案](docs/主题设计方案.md) - 天蓝色和淡粉色两套完整主题设计
- [配置文件示例](docs/配置文件示例.md) - ESLint、Prettier、TypeScript等配置示例

### 🔧 部署文档
- [部署运维文档](docs/部署运维文档.md) - 生产环境部署和运维管理
- [Render部署指南](docs/Render部署指南.md) - Render.com 平台部署指南
- [Railway部署指南](docs/Railway部署指南.md) - Railway.app 平台部署指南
- [本地部署指南](docs/本地部署指南.md) - 本地开发和测试部署

## 核心功能

### 房间管理
- 创建房间（支持房间名称和密码）
- 加入房间（通过房间 ID）
- 离开房间
- 房主权限管理

### 屏幕共享
- 选择共享源（屏幕/窗口）
- 开始/停止共享
- 多人同时共享
- 调整共享质量

### 多屏观看
- 网格布局显示所有共享屏幕
- 焦点模式放大查看
- 实时显示网络质量
- 自适应分辨率

## 系统架构

```
客户端A ←──────────────────────→ 客户端B
   │        WebRTC P2P 直连         │
   │                                │
   │ Socket.io (信令)               │
   ├────────────┐          ┌────────┤
                │          │
            信令服务器 (Node.js)
```

**架构说明**：
- 媒体流通过 **WebRTC P2P 直连**，不经过服务器，延迟低、带宽成本低
- 信令服务器仅用于**房间管理和 SDP/ICE 交换**，不转发媒体流
- 服务器压力小，可支持 5-10 人小团队同时使用

## 开发规范

### Git 提交规范
```bash
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式
refactor: 重构
perf:     性能优化
test:     测试
chore:    构建过程或辅助工具的变动
```

### 分支管理
- `main`: 主分支，生产环境代码
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支
- `release/*`: 发布分支

## 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目主页: https://github.com/your-org/screen-sharing
- 问题反馈: https://github.com/your-org/screen-sharing/issues
- 文档网站: https://your-docs-site.com

## 致谢

感谢以下开源项目：
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Ant Design](https://ant.design/)
- [WebRTC](https://webrtc.org/)
- [Socket.io](https://socket.io/)
- [Node.js](https://nodejs.org/)

---

**版本**: v1.0.0  
**最后更新**: 2026-01-04
