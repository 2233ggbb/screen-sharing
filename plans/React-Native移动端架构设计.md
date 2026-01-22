# React Native 移动端屏幕共享应用 - 架构设计文档

## 文档信息

| 项目名称 | 多人屏幕共享系统 - React Native 移动端 |
|---------|--------------------------------------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-01-12 |
| 文档类型 | 技术架构设计 |
| 目标平台 | Android / iOS |

---

## 1. 项目概述

### 1.1 项目目标

开发一个基于 React Native 的移动端屏幕共享应用，支持：
- ✅ **观看模式**：观看桌面端用户共享的屏幕（优先级：P0）
- ✅ **共享模式**：移动端用户共享自己的屏幕（优先级：P1）
- ✅ **房间管理**：创建/加入房间，管理成员
- ✅ **实时通信**：基于 WebRTC 的 P2P 低延迟传输

### 1.2 核心特性

| 特性 | 描述 | 平台支持 |
|-----|------|---------|
| **多人观看** | 同时观看多个共享屏幕 | Android + iOS |
| **屏幕共享** | 分享移动端屏幕内容 | Android (优先) |
| **房间系统** | 创建/加入房间，密码保护 | Android + iOS |
| **P2P连接** | WebRTC 直连，低延迟 | Android + iOS |
| **自适应码率** | 根据网络自动调整质量 | Android + iOS |
| **后台保活** | 支持后台继续接收流 | Android + iOS |

### 1.3 技术优势

- **代码复用**：复用现有桌面端的服务逻辑（Socket、WebRTC）
- **跨平台**：同时支持 Android 和 iOS
- **原生性能**：关键模块使用原生桥接
- **统一后端**：无需修改服务端代码

---

## 2. 技术架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    移动端应用架构                             │
└─────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────┐
    │         React Native 应用层                 │
    │  ┌────────────┐  ┌────────────┐           │
    │  │  UI层       │  │ 业务逻辑层  │           │
    │  │  (React)   │  │ (Hooks)    │           │
    │  └────────────┘  └────────────┘           │
    └─────────────┬────────────┬─────────────────┘
                  │            │
    ┌─────────────┴────────────┴─────────────────┐
    │           服务层 (Services)                 │
    │  ┌────────────┐  ┌────────────┐           │
    │  │ Socket服务  │  │ WebRTC服务 │           │
    │  └────────────┘  └────────────┘           │
    │  ┌────────────┐  ┌────────────┐           │
    │  │ 屏幕捕获    │  │ 权限管理    │           │
    │  └────────────┘  └────────────┘           │
    └─────────────┬────────────┬─────────────────┘
                  │            │
    ┌─────────────┴────────────┴─────────────────┐
    │        Native Bridge (原生桥接)             │
    │  ┌────────────┐  ┌────────────┐           │
    │  │ Android原生 │  │  iOS原生    │           │
    │  │ MediaProj.  │  │ ReplayKit  │           │
    │  └────────────┘  └────────────┘           │
    └──────────────────────────────────────────────┘
                       │
                       │ WSS + WebRTC
                       │
    ┌──────────────────▼──────────────────────┐
    │          信令服务器 (现有)               │
    │        Socket.io + Express              │
    └──────────────────────────────────────────┘
```

### 2.2 分层架构

```
┌─────────────────────────────────────────────┐
│            UI 层 (Presentation)              │
│  - Screens (页面)                            │
│  - Components (组件)                         │
│  - Navigation (导航)                         │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│          业务逻辑层 (Business Logic)         │
│  - Custom Hooks                             │
│  - State Management (Zustand)               │
│  - Context Providers                        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│           服务层 (Services)                  │
│  - SocketService (Socket.io 连接)          │
│  - WebRTCService (P2P 连接管理)            │
│  - ScreenCaptureService (屏幕捕获)         │
│  - PermissionService (权限管理)            │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Native 模块层 (Native Modules)       │
│  - Android MediaProjection (屏幕捕获)       │
│  - iOS ReplayKit (屏幕录制)                 │
│  - 权限请求原生模块                          │
└──────────────────────────────────────────────┘
```

---

## 3. 技术选型

### 3.1 核心技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| **React Native** | 0.76+ | 跨平台框架 | 成熟稳定、社区活跃、跨平台 |
| **TypeScript** | 5.x | 编程语言 | 类型安全、可复用桌面端类型 |
| **react-native-webrtc** | 124.0+ | WebRTC支持 | 官方推荐、原生性能 |
| **socket.io-client** | 4.8+ | 实时通信 | 与服务端一致 |
| **@react-navigation** | 7.x | 导航管理 | RN官方推荐 |
| **zustand** | 5.x | 状态管理 | 轻量级、与桌面端一致 |
| **react-native-permissions** | 5.x | 权限管理 | 统一权限API |

### 3.2 UI 组件库

| 组件库 | 版本 | 用途 | 说明 |
|--------|------|------|------|
| **React Native Paper** | 5.x | Material Design | 美观、完整 |
| **react-native-vector-icons** | 10.x | 图标库 | 丰富的图标 |
| **react-native-gesture-handler** | 2.x | 手势处理 | 流畅的交互 |
| **react-native-reanimated** | 3.x | 动画库 | 高性能动画 |

### 3.3 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| **Metro** | 0.80+ | 打包工具 |
| **ESLint** | 8.x | 代码检查 |
| **Prettier** | 3.x | 代码格式化 |
| **Jest** | 29.x | 单元测试 |
| **Detox** | 20.x | E2E测试（可选） |

---

## 4. 项目目录结构

### 4.1 完整目录树

```
mobile/
├── android/                    # Android 原生代码
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/com/screensharing/
│   │   │   │   │   ├── MainActivity.java
│   │   │   │   │   ├── MainApplication.java
│   │   │   │   │   └── modules/
│   │   │   │   │       └── ScreenCaptureModule.java
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   └── res/
│   │   └── build.gradle
│   ├── gradle/
│   └── build.gradle
│
├── ios/                        # iOS 原生代码
│   ├── ScreenSharing/
│   │   ├── AppDelegate.h
│   │   ├── AppDelegate.mm
│   │   ├── Info.plist
│   │   └── Modules/
│   │       └── ScreenCaptureModule.h
│   │       └── ScreenCaptureModule.m
│   ├── Podfile
│   └── ScreenSharing.xcodeproj/
│
├── src/                        # 源代码目录
│   ├── App.tsx                 # 应用根组件
│   ├── navigation/             # 导航配置
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── types.ts
│   │
│   ├── screens/                # 页面/屏幕
│   │   ├── Home/
│   │   │   ├── HomeScreen.tsx
│   │   │   └── styles.ts
│   │   ├── Room/
│   │   │   ├── RoomScreen.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useRoomSocket.ts
│   │   │   │   └── useRoomWebRTC.ts
│   │   │   └── styles.ts
│   │   ├── Settings/
│   │   │   ├── SettingsScreen.tsx
│   │   │   └── styles.ts
│   │   └── JoinRoom/
│   │       ├── JoinRoomScreen.tsx
│   │       └── styles.ts
│   │
│   ├── components/             # 通用组件
│   │   ├── VideoGrid/
│   │   │   ├── index.tsx
│   │   │   └── styles.ts
│   │   ├── VideoStream/
│   │   │   ├── index.tsx
│   │   │   └── styles.ts
│   │   ├── UserList/
│   │   │   ├── index.tsx
│   │   │   └── styles.ts
│   │   ├── Controls/
│   │   │   ├── index.tsx
│   │   │   └── styles.ts
│   │   ├── Button/
│   │   │   ├── index.tsx
│   │   │   └── styles.ts
│   │   └── Loading/
│   │       ├── index.tsx
│   │       └── styles.ts
│   │
│   ├── services/               # 服务层
│   │   ├── socket/
│   │   │   ├── SocketService.ts
│   │   │   └── types.ts
│   │   ├── webrtc/
│   │   │   ├── WebRTCService.ts
│   │   │   ├── PeerConnectionManager.ts
│   │   │   └── types.ts
│   │   ├── screenCapture/
│   │   │   ├── ScreenCaptureService.ts
│   │   │   └── types.ts
│   │   └── permission/
│   │       ├── PermissionService.ts
│   │       └── types.ts
│   │
│   ├── store/                  # 状态管理
│   │   ├── useRoomStore.ts
│   │   ├── useUserStore.ts
│   │   ├── useStreamStore.ts
│   │   └── useSettingsStore.ts
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useSocket.ts
│   │   ├── useWebRTC.ts
│   │   ├── usePermissions.ts
│   │   └── useNetworkQuality.ts
│   │
│   ├── utils/                  # 工具函数
│   │   ├── logger.ts
│   │   ├── constants.ts
│   │   ├── validation.ts
│   │   └── performance.ts
│   │
│   ├── types/                  # TypeScript 类型定义
│   │   ├── navigation.ts
│   │   ├── components.ts
│   │   └── index.ts
│   │
│   └── theme/                  # 主题配置
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       └── index.ts
│
├── shared/                     # 共享代码（软链接到 ../shared）
│   └── @screen-sharing/shared
│
├── __tests__/                  # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── assets/                     # 静态资源
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── .eslintrc.js               # ESLint 配置
├── .prettierrc.js             # Prettier 配置
├── tsconfig.json              # TypeScript 配置
├── babel.config.js            # Babel 配置
├── metro.config.js            # Metro 打包配置
├── package.json               # 依赖配置
├── app.json                   # 应用配置
└── README.md                  # 项目说明
```

### 4.2 目录说明

| 目录 | 说明 | 关键文件 |
|------|------|---------|
| **src/screens/** | 应用页面 | HomeScreen, RoomScreen |
| **src/components/** | 可复用组件 | VideoGrid, UserList |
| **src/services/** | 业务服务 | SocketService, WebRTCService |
| **src/store/** | 全局状态 | useRoomStore, useUserStore |
| **src/hooks/** | 自定义钩子 | useSocket, useWebRTC |
| **android/** | Android原生代码 | ScreenCaptureModule.java |
| **ios/** | iOS原生代码 | ScreenCaptureModule.m |

---

## 5. 核心模块设计

### 5.1 Socket 服务模块

```typescript
// src/services/socket/SocketService.ts

import io, { Socket } from 'socket.io-client';
import { ClientEvents, ServerEvents } from '@screen-sharing/shared';
import { logger } from '../../utils/logger';

export class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * 连接到服务器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        logger.info('Socket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        logger.error('Socket connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        logger.warn('Socket disconnected:', reason);
      });
    });
  }

  /**
   * 监听服务端事件
   */
  on<T>(event: ServerEvents, handler: (data: T) => void): void {
    this.socket?.on(event, handler);
  }

  /**
   * 发送事件到服务器
   */
  emit<T>(event: ClientEvents, data: T): void {
    this.socket?.emit(event, data);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
```

### 5.2 WebRTC 服务模块

```typescript
// src/services/webrtc/WebRTCService.ts

import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';
import { logger } from '../../utils/logger';

export interface WebRTCConfig {
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
}

export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private config: WebRTCConfig;

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  /**
   * 创建 P2P 连接
   */
  createPeerConnection(
    remoteUserId: string,
    callbacks: {
      onIceCandidate?: (candidate: RTCIceCandidate) => void;
      onTrack?: (stream: MediaStream) => void;
      onConnectionStateChange?: (state: string) => void;
    }
  ): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.config);

    // ICE 候选事件
    pc.onicecandidate = (event) => {
      if (event.candidate && callbacks.onIceCandidate) {
        callbacks.onIceCandidate(event.candidate);
      }
    };

    // 接收远程流
    pc.ontrack = (event) => {
      logger.info('Received remote track:', remoteUserId);
      if (event.streams[0] && callbacks.onTrack) {
        callbacks.onTrack(event.streams[0]);
      }
    };

    // 连接状态变化
    pc.onconnectionstatechange = () => {
      logger.info(`Connection state [${remoteUserId}]:`, pc.connectionState);
      if (callbacks.onConnectionStateChange) {
        callbacks.onConnectionStateChange(pc.connectionState);
      }
    };

    this.peerConnections.set(remoteUserId, pc);
    return pc;
  }

  /**
   * 添加本地流到连接
   */
  addLocalStream(remoteUserId: string, stream: MediaStream): void {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      logger.error('Peer connection not found:', remoteUserId);
      return;
    }

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }

  /**
   * 创建 Offer
   */
  async createOffer(remoteUserId: string): Promise<RTCSessionDescription> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      throw new Error(`Peer connection not found: ${remoteUserId}`);
    }

    const offer = await pc.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * 创建 Answer
   */
  async createAnswer(remoteUserId: string): Promise<RTCSessionDescription> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      throw new Error(`Peer connection not found: ${remoteUserId}`);
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * 设置远程描述
   */
  async setRemoteDescription(
    remoteUserId: string,
    description: RTCSessionDescription
  ): Promise<void> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      throw new Error(`Peer connection not found: ${remoteUserId}`);
    }

    await pc.setRemoteDescription(description);
  }

  /**
   * 添加 ICE 候选
   */
  async addIceCandidate(
    remoteUserId: string,
    candidate: RTCIceCandidate
  ): Promise<void> {
    const pc = this.peerConnections.get(remoteUserId);
    if (!pc) {
      logger.warn('Peer connection not found, ignoring ICE candidate:', remoteUserId);
      return;
    }

    await pc.addIceCandidate(candidate);
  }

  /**
   * 关闭指定连接
   */
  closePeerConnection(remoteUserId: string): void {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
      logger.info('Closed peer connection:', remoteUserId);
    }
  }

  /**
   * 关闭所有连接
   */
  closeAllConnections(): void {
    this.peerConnections.forEach((pc, userId) => {
      pc.close();
      logger.info('Closed peer connection:', userId);
    });
    this.peerConnections.clear();
  }

  /**
   * 停止本地流
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}
```

### 5.3 屏幕捕获服务模块（Android）

```typescript
// src/services/screenCapture/ScreenCaptureService.ts

import { NativeModules, Platform } from 'react-native';
import { mediaDevices } from 'react-native-webrtc';
import { logger } from '../../utils/logger';

const { ScreenCaptureModule } = NativeModules;

export interface CaptureConfig {
  width: number;
  height: number;
  frameRate: number;
}

export class ScreenCaptureService {
  /**
   * 请求屏幕捕获权限（Android）
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      logger.warn('Screen capture only supported on Android');
      return false;
    }

    try {
      const granted = await ScreenCaptureModule.requestScreenCapturePermission();
      return granted;
    } catch (error) {
      logger.error('Failed to request screen capture permission:', error);
      return false;
    }
  }

  /**
   * 开始屏幕捕获
   */
  async startCapture(config: CaptureConfig): Promise<MediaStream> {
    if (Platform.OS !== 'android') {
      throw new Error('Screen capture only supported on Android');
    }

    try {
      // 请求权限
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Screen capture permission denied');
      }

      // 获取屏幕流
      const stream = await mediaDevices.getDisplayMedia({
        video: {
          width: config.width,
          height: config.height,
          frameRate: config.frameRate,
        },
      });

      logger.info('Screen capture started:', config);
      return stream;
    } catch (error) {
      logger.error('Failed to start screen capture:', error);
      throw error;
    }
  }

  /**
   * 停止屏幕捕获
   */
  stopCapture(stream: MediaStream): void {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    logger.info('Screen capture stopped');
  }
}
```

### 5.4 权限服务模块

```typescript
// src/services/permission/PermissionService.ts

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { logger } from '../../utils/logger';

export class PermissionService {
  /**
   * 请求相机权限（用于未来视频通话功能）
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await request(PERMISSIONS.IOS.CAMERA);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      logger.error('Failed to request camera permission:', error);
      return false;
    }
  }

  /**
   * 请求麦克风权限（用于未来音频通话功能）
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await request(PERMISSIONS.IOS.MICROPHONE);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      logger.error('Failed to request microphone permission:', error);
      return false;
    }
  }

  /**
   * 显示权限说明对话框
   */
  showPermissionAlert(
    title: string,
    message: string,
    onConfirm: () => void
  ): void {
    Alert.alert(title, message, [
      { text: '取消', style: 'cancel' },
      { text: '去设置', onPress: onConfirm },
    ]);
  }
}
```

---

## 6. 屏幕共享实现方案

### 6.1 Android 屏幕捕获（MediaProjection API）

#### 6.1.1 原生模块实现

```java
// android/app/src/main/java/com/screensharing/modules/ScreenCaptureModule.java

package com.screensharing.modules;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ScreenCaptureModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final int REQUEST_MEDIA_PROJECTION = 1001;
    private Promise screenCapturePromise;

    public ScreenCaptureModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "ScreenCaptureModule";
    }

    @ReactMethod
    public void requestScreenCapturePermission(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ERROR", "Activity not found");
            return;
        }

        screenCapturePromise = promise;
        
        MediaProjectionManager manager = (MediaProjectionManager) 
            activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        
        Intent intent = manager.createScreenCaptureIntent();
        activity.startActivityForResult(intent, REQUEST_MEDIA_PROJECTION);
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_MEDIA_PROJECTION) {
            if (screenCapturePromise != null) {
                if (resultCode == Activity.RESULT_OK) {
                    screenCapturePromise.resolve(true);
                } else {
                    screenCapturePromise.reject("ERROR", "Permission denied");
                }
                screenCapturePromise = null;
            }
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not needed
    }
}
```

#### 6.1.2 注册原生模块

```java
// android/app/src/main/java/com/screensharing/MainApplication.java

package com.screensharing;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.screensharing.modules.ScreenCaptureModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ScreenCapturePackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new ScreenCaptureModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
```

### 6.2 iOS 屏幕捕获（ReplayKit）

```objective-c
// ios/ScreenSharing/Modules/ScreenCaptureModule.m

#import <React/RCTBridgeModule.h>
#import <ReplayKit/ReplayKit.h>

@interface ScreenCaptureModule : NSObject <RCTBridgeModule>
@end

@implementation ScreenCaptureModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(requestScreenCapturePermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (@available(iOS 11.0, *)) {
    RPScreenRecorder *recorder = [RPScreenRecorder sharedRecorder];
    if (recorder.isAvailable) {
      resolve(@YES);
    } else {
      reject(@"ERROR", @"Screen recording not available", nil);
    }
  } else {
    reject(@"ERROR", @"iOS version too old", nil);
  }
}

@end
```

### 6.3 跨平台使用示例

```typescript
// src/screens/Room/RoomScreen.tsx

import React, { useState } from 'react';
import { View, Button, Platform } from 'react-native';
import { ScreenCaptureService } from '../../services/screenCapture/ScreenCaptureService';
import { WebRTCService } from '../../services/webrtc/WebRTCService';

const captureService = new ScreenCaptureService();
const webrtcService = new WebRTCService(RTC_CONFIG);

export const RoomScreen = () => {
  const [isSharing, setIsSharing] = useState(false);

  const handleStartSharing = async () => {
    try {
      // 开始屏幕捕获
      const stream = await captureService.startCapture({
        width: 1280,
        height: 720,
        frameRate: 15,
      });

      // 为每个房间成员创建 P2P 连接并发送流
      // ... WebRTC 连接逻辑

      setIsSharing(true);
    } catch (error) {
      console.error('Failed to start sharing:', error);
    }
  };

  return (
    <View>
      {Platform.OS === 'android' && (
        <Button
          title={isSharing ? '停止共享' : '开始共享'}
          onPress={handleStartSharing}
        />
      )}
    </View>
  );
};
```

---

## 7. 状态管理设计

### 7.1 房间状态（Zustand）

```typescript
// src/store/useRoomStore.ts

import { create } from 'zustand';
import { Room, User } from '@screen-sharing/shared';

interface RoomState {
  currentRoom: Room | null;
  members: User[];
  isInRoom: boolean;
  
  setCurrentRoom: (room: Room) => void;
  addMember: (user: User) => void;
  removeMember: (userId: string) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  members: [],
  isInRoom: false,
  
  setCurrentRoom: (room) => set({ currentRoom: room, isInRoom: true }),
  
  addMember: (user) => set((state) => ({
    members: [...state.members, user],
  })),
  
  removeMember: (userId) => set((state) => ({
    members: state.members.filter((m) => m.id !== userId),
  })),
  
  leaveRoom: () => set({
    currentRoom: null,
    members: [],
    isInRoom: false,
  }),
}));
```

### 7.2 流状态

```typescript
// src/store/useStreamStore.ts

import { create } from 'zustand';
import { StreamInfo } from '@screen-sharing/shared';

interface StreamState {
  streams: Map<string, MediaStream>;
  streamInfos: Map<string, StreamInfo>;
  
  addStream: (userId: string, stream: MediaStream, info: StreamInfo) => void;
  removeStream: (userId: string) => void;
  getStream: (userId: string) => MediaStream | undefined;
}

export const useStreamStore = create<StreamState>((set, get) => ({
  streams: new Map(),
  streamInfos: new Map(),
  
  addStream: (userId, stream, info) => set((state) => {
    const newStreams = new Map(state.streams);
    const newInfos = new Map(state.streamInfos);
    newStreams.set(userId, stream);
    newInfos.set(userId, info);
    return { streams: newStreams, streamInfos: newInfos };
  }),
  
  removeStream: (userId) => set((state) => {
    const newStreams = new Map(state.streams);
    const newInfos = new Map(state.streamInfos);
    newStreams.delete(userId);
    newInfos.delete(userId);
    return { streams: newStreams, streamInfos: newInfos };
  }),
  
  getStream: (userId) => get().streams.get(userId),
}));
```

---

## 8. Android 权限配置

### 8.1 AndroidManifest.xml 配置

```xml
<!-- android/app/src/main/AndroidManifest.xml -->

<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.screensharing">

    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- WebRTC 权限 -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <!-- 屏幕捕获权限（Android 5.0+） -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    
    <!-- 后台运行权限 -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <!-- 屏幕捕获前台服务 -->
        <service
            android:name=".services.ScreenCaptureService"
            android:foregroundServiceType="mediaProjection"
            android:enabled="true"
            android:exported="false" />
    </application>
</manifest>
```

### 8.2 权限请求流程

```typescript
// src/screens/Room/hooks/useScreenCapture.ts

import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { ScreenCaptureService } from '../../../services/screenCapture/ScreenCaptureService';
import { PermissionService } from '../../../services/permission/PermissionService';

export const useScreenCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const captureService = new ScreenCaptureService();
  const permissionService = new PermissionService();

  const startCapture = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('提示', '屏幕共享功能目前仅支持 Android 设备');
      return;
    }

    try {
      // 请求权限
      const hasPermission = await captureService.requestPermission();
      if (!hasPermission) {
        Alert.alert('权限被拒绝', '需要屏幕录制权限才能共享屏幕');
        return;
      }

      // 开始捕获
      const mediaStream = await captureService.startCapture({
        width: 1280,
        height: 720,
        frameRate: 15,
      });

      setStream(mediaStream);
      setIsCapturing(true);
      
      return mediaStream;
    } catch (error) {
      console.error('Failed to start screen capture:', error);
      Alert.alert('错误', '启动屏幕共享失败');
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (stream) {
      captureService.stopCapture(stream);
      setStream(null);
      setIsCapturing(false);
    }
  }, [stream]);

  return {
    isCapturing,
    stream,
    startCapture,
    stopCapture,
  };
};
```

---

## 9. 性能优化策略

### 9.1 视频渲染优化

```typescript
// src/components/VideoStream/index.tsx

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

interface VideoStreamProps {
  stream: MediaStream;
  userId: string;
  style?: any;
}

export const VideoStream = memo<VideoStreamProps>(({ stream, userId, style }) => {
  return (
    <View style={[styles.container, style]}>
      <RTCView
        streamURL={stream.toURL()}
        style={styles.video}
        objectFit="cover"
        mirror={false}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // 仅在 stream 或 userId 变化时重新渲染
  return prevProps.userId === nextProps.userId && 
         prevProps.stream.id === nextProps.stream.id;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
});
```

### 9.2 自适应码率

```typescript
// src/utils/adaptiveBitrate.ts

export interface BitrateConfig {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

export class AdaptiveBitrateManager {
  private configs: BitrateConfig[] = [
    { width: 1920, height: 1080, frameRate: 30, bitrate: 2500 },
    { width: 1280, height: 720, frameRate: 24, bitrate: 1200 },
    { width: 854, height: 480, frameRate: 20, bitrate: 800 },
    { width: 640, height: 360, frameRate: 15, bitrate: 500 },
  ];

  selectConfig(networkSpeed: number): BitrateConfig {
    // 根据网络速度选择合适的配置
    for (const config of this.configs) {
      if (networkSpeed >= config.bitrate) {
        return config;
      }
    }
    // 返回最低配置
    return this.configs[this.configs.length - 1];
  }

  async adjustBitrate(
    peerConnection: RTCPeerConnection,
    config: BitrateConfig
  ): Promise<void> {
    const senders = peerConnection.getSenders();
    const videoSender = senders.find((s) => s.track?.kind === 'video');
    
    if (videoSender) {
      const params = videoSender.getParameters();
      if (!params.encodings) {
        params.encodings = [{}];
      }
      params.encodings[0].maxBitrate = config.bitrate * 1000;
      await videoSender.setParameters(params);
    }
  }
}
```

### 9.3 内存管理

```typescript
// src/hooks/useMemoryManagement.ts

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { WebRTCService } from '../services/webrtc/WebRTCService';

export const useMemoryManagement = (webrtcService: WebRTCService) => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        // 应用进入后台，降低质量以节省资源
        console.log('App went to background, reducing quality');
        // 实现降低质量的逻辑
      } else if (nextAppState === 'active') {
        // 应用回到前台，恢复质量
        console.log('App became active, restoring quality');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [webrtcService]);
};
```

---

## 10. 部署与打包

### 10.1 Android 打包配置

```gradle
// android/app/build.gradle

android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.screensharing"
        minSdkVersion 24  // Android 7.0+
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
    implementation 'org.webrtc:google-webrtc:1.0.32006'
}
```

### 10.2 打包命令

```bash
# Android 打包
cd android
./gradlew assembleRelease

# 生成的 APK 位置
# android/app/build/outputs/apk/release/app-release.apk

# iOS 打包（需要 Mac）
cd ios
pod install
xcodebuild -workspace ScreenSharing.xcworkspace -scheme ScreenSharing archive
```

---

## 11. 测试策略

### 11.1 单元测试

```typescript
// __tests__/services/SocketService.test.ts

import { SocketService } from '../../src/services/socket/SocketService';

describe('SocketService', () => {
  let socketService: SocketService;

  beforeEach(() => {
    socketService = new SocketService('http://localhost:3000');
  });

  test('should connect to server', async () => {
    await socketService.connect();
    expect(socketService.isConnected()).toBe(true);
  });

  test('should emit events', () => {
    const mockEmit = jest.fn();
    socketService.emit('create_room', { roomName: 'Test Room' });
    // 验证事件发送
  });
});
```

### 11.2 集成测试

```typescript
// __tests__/integration/room.test.ts

import { renderHook, act } from '@testing-library/react-hooks';
import { useRoomSocket } from '../../src/screens/Room/hooks/useRoomSocket';

describe('Room Integration', () => {
  test('should create and join room', async () => {
    const { result } = renderHook(() => useRoomSocket());
    
    await act(async () => {
      await result.current.createRoom('Test Room', 'TestUser');
    });
    
    expect(result.current.isInRoom).toBe(true);
  });
});
```

---

## 12. 开发路线图

### 12.1 阶段一：基础功能（2周）

- [x] 项目初始化和环境配置
- [x] Socket.io 集成和连接测试
- [x] WebRTC 基础服务实现
- [x] 房间管理功能（创建/加入/离开）
- [x] 观看模式（接收并显示远程流）

### 12.2 阶段二：屏幕共享（1周）

- [ ] Android MediaProjection 原生模块
- [ ] 屏幕捕获服务实现
- [ ] 权限请求和处理
- [ ] 共享模式（发送本地流）

### 12.3 阶段三：优化和完善（1周）

- [ ] 自适应码率实现
- [ ] 网络质量监控
- [ ] UI/UX 优化
- [ ] 错误处理和日志记录
- [ ] 性能优化

### 12.4 阶段四：测试和发布

- [ ] 单元测试和集成测试
- [ ] 真机测试（多设备）
- [ ] 打包和签名
- [ ] 应用商店发布准备

---

## 13. 技术挑战与解决方案

### 13.1 挑战清单

| 挑战 | 影响 | 解决方案 |
|------|------|---------|
| **Android 权限复杂** | 高 | 详细的权限引导，优雅的错误处理 |
| **WebRTC 稳定性** | 高 | 完善的重连机制，连接状态监控 |
| **内存占用** | 中 | 及时释放资源，限制同时显示的流数量 |
| **网络波动** | 中 | 自适应码率，断线重连 |
| **电池消耗** | 中 | 后台降低帧率，优化编解码 |
| **跨设备兼容** | 低 | 充分测试，适配不同屏幕尺寸 |

### 13.2 风险缓解措施

```typescript
// src/utils/errorHandler.ts

export class ErrorHandler {
  static handleWebRTCError(error: Error): void {
    console.error('WebRTC Error:', error);
    
    if (error.name === 'NotAllowedError') {
      Alert.alert('权限被拒绝', '请授予必要的权限以继续使用');
    } else if (error.name === 'NotFoundError') {
      Alert.alert('设备未找到', '无法访问摄像头或麦克风');
    } else {
      Alert.alert('连接错误', '请检查网络连接后重试');
    }
  }

  static handleSocketError(error: Error): void {
    console.error('Socket Error:', error);
    Alert.alert('服务器连接失败', '请检查网络连接');
  }
}
```

---

## 14. 依赖清单

### 14.1 package.json

```json
{
  "name": "screen-sharing-mobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  },
  "dependencies": {
    "react": "19.0.0",
    "react-native": "0.76.0",
    "react-native-webrtc": "^124.0.0",
    "socket.io-client": "^4.8.0",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/stack": "^7.0.0",
    "react-native-screens": "^4.5.0",
    "react-native-safe-area-context": "^4.12.0",
    "react-native-gesture-handler": "^2.20.0",
    "react-native-reanimated": "^3.16.0",
    "react-native-paper": "^5.12.0",
    "react-native-vector-icons": "^10.2.0",
    "react-native-permissions": "^5.2.0",
    "zustand": "^5.0.0",
    "@screen-sharing/shared": "file:../shared"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@babel/preset-env": "^7.25.0",
    "@babel/runtime": "^7.25.0",
    "@react-native/babel-preset": "^0.76.0",
    "@react-native/eslint-config": "^0.76.0",
    "@react-native/metro-config": "^0.76.0",
    "@react-native/typescript-config": "^0.76.0",
    "@types/react": "^19.0.0",
    "@types/react-test-renderer": "^19.0.0",
    "typescript": "^5.9.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.8.0",
    "@testing-library/jest-native": "^5.4.0"
  },
  "engines": {
    "node": ">=20",
    "npm": ">=10"
  }
}
```

---

## 15. 总结与建议

### 15.1 核心优势

✅ **复用现有架构**：无需修改服务端，直接复用桌面端的服务逻辑  
✅ **跨平台支持**：React Native 同时支持 Android 和 iOS  
✅ **原生性能**：关键功能使用原生模块，确保性能  
✅ **快速开发**：基于成熟框架，开发周期短  

### 15.2 开发建议

1. **优先开发观看模式**：先实现观看功能，快速验证可行性
2. **Android 优先**：屏幕共享先支持 Android，iOS 后续跟进
3. **充分测试**：在多款真机上测试，确保兼容性
4. **性能监控**：实时监控内存、CPU、网络使用情况
5. **用户反馈**：收集用户反馈，持续优化体验

### 15.3 后续扩展

- 🎯 **iOS 屏幕共享**：基于 ReplayKit 实现 iOS 屏幕捕获
- 🎯 **录制功能**：支持录制共享内容
- 🎯 **聊天功能**：房间内文字聊天
- 🎯 **文件传输**：P2P 文件传输
- 🎯 **画板标注**：屏幕标注和涂鸦功能

---

## 16. 参考资料

### 16.1 技术文档

- **React Native**: https://reactnative.dev/
- **react-native-webrtc**: https://github.com/react-native-webrtc/react-native-webrtc
- **Socket.io Client**: https://socket.io/docs/v4/client-api/
- **Android MediaProjection**: https://developer.android.com/reference/android/media/projection/MediaProjection
- **iOS ReplayKit**: https://developer.apple.com/documentation/replaykit

### 16.2 最佳实践

- React Native 性能优化指南
- WebRTC 移动端最佳实践
- Android 屏幕录制完整教程

---

**文档版本**: v1.0  
**最后更新**: 2026-01-12  
**作者**: 架构设计团队
