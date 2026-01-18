/**
 * 客户端常量定义
 */

// WebRTC配置 - 仅使用 STUN 进行 P2P 直连
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // STUN 服务器 - 用于获取公网 IP 和 NAT 穿透
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  // ICE 传输策略：all 尝试所有可用的连接方式
  iceTransportPolicy: 'all',
  // 启用 ICE 候选池，预先收集候选以加快连接
  iceCandidatePoolSize: 10,
  // bundlePolicy: 将所有媒体流合并到一个传输通道，减少需要打通的端口数
  bundlePolicy: 'max-bundle',
  // rtcpMuxPolicy: 复用 RTP 和 RTCP 到同一端口
  rtcpMuxPolicy: 'require',
};

// 视频流配置
export const STREAM_CONSTRAINTS = {
  video: {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
  },
  audio: false,
};

// 服务器配置
export const DEFAULT_SERVER_URL = 'http://localhost:3000';

// 房间配置
export const MAX_ROOM_MEMBERS = 10;
export const ROOM_ID_LENGTH = 6;

// 本地存储键
export const STORAGE_KEYS = {
  USER_ID: 'user_id',
  USER_NICKNAME: 'user_nickname',
  USER_AVATAR: 'user_avatar',
  RECENT_ROOMS: 'recent_rooms',
  SERVER_URL: 'server_url',
  THEME: 'theme',
} as const;

// 网络质量阈值
export const NETWORK_QUALITY = {
  EXCELLENT: { delay: 100, label: '优秀' },
  GOOD: { delay: 200, label: '良好' },
  FAIR: { delay: 500, label: '一般' },
  POOR: { delay: 1000, label: '较差' },
} as const;
