/**
 * 应用常量配置
 */

// 声明 React Native 全局变量
declare const __DEV__: boolean;

// 服务器配置
// Android 模拟器使用 10.0.2.2 访问宿主机 localhost
// 真机请替换为电脑的局域网 IP 地址
export const SERVER_URL = __DEV__
  ? 'http://10.0.2.2:3000' // 开发环境 - 模拟器使用 10.0.2.2，真机使用局域网 IP
  : 'https://your-production-server.com'; // 生产环境

// WebRTC 配置类型
interface RTCConfig {
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  iceCandidatePoolSize?: number;
  iceTransportPolicy?: 'all' | 'relay';
}

// WebRTC 配置 - 纯 P2P 直连模式
// 注意：本项目仅支持 P2P 直连，不提供 TURN 中继服务器
// 如需在复杂 NAT 环境下使用，请自行部署 TURN 服务器
export const RTC_CONFIG: RTCConfig = {
  iceServers: [
    // STUN 服务器 - 用于获取公网 IP
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.syncthing.net:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
};

// 屏幕共享配置
export const SCREEN_SHARE_CONFIG = {
  LOW: {
    width: 640,
    height: 360,
    frameRate: 15,
    bitrate: 500,
  },
  MEDIUM: {
    width: 1280,
    height: 720,
    frameRate: 24,
    bitrate: 1200,
  },
  HIGH: {
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 2500,
  },
};

// 房间配置
export const ROOM_CONFIG = {
  MAX_MEMBERS: 10,
  MAX_SHARERS: 3,
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
};

// Socket 事件超时时间
export const SOCKET_TIMEOUT = 10000;

// ICE 批量处理配置
export const ICE_BATCH_CONFIG = {
  DELAY: 100,
  SIZE: 5,
};
