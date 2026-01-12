/**
 * 应用常量配置
 */

// 声明 React Native 全局变量
declare const __DEV__: boolean;

// 服务器配置
export const SERVER_URL = __DEV__
  ? 'http://192.168.1.100:3000' // 开发环境 - 请替换为实际 IP
  : 'https://your-production-server.com'; // 生产环境

// WebRTC 配置类型
interface RTCConfig {
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  iceCandidatePoolSize?: number;
}

export const RTC_CONFIG: RTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
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
