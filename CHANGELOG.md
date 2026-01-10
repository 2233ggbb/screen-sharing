# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 无

### Changed
- 无

### Fixed
- 无

---

## [1.0.1] - 2026-01-10

### Fixed
- 🐛 修复客户端设置页面修改服务器地址后不生效的问题
- 修复 SocketService 单例在初始化时未从 localStorage 读取保存的服务器地址
- 添加 `updateServerUrl()` 方法支持动态更新服务器地址
- 设置页面保存后立即更新 socketService 的服务器地址

### Changed
- SocketService 的 `connect()` 方法现在会自动从 localStorage 读取服务器地址

---

## [1.0.0] - 2026-01-10

### Added
- 🎉 首个正式版本发布
- 多人屏幕共享功能
- 房间创建与加入
- 屏幕源选择（显示器/窗口）
- 实时视频流传输
- 用户列表显示

### Technical
- React 19 + TypeScript
- Electron 39
- WebRTC + Socket.io
- Zustand 状态管理
- Ant Design 6 UI 组件库
