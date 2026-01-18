/**
 * 客户端常量定义
 */

// WebRTC配置
// 注意：生产环境应使用自建的 TURN 服务器以确保稳定性
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // STUN 服务器 - 用于获取公网 IP
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // 公共 TURN 服务器 - 用于 NAT 穿透失败时的中继
    // 使用 OpenRelay 公共 TURN 服务器（免费，适合测试）
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  // ICE 传输策略：all 表示同时尝试直连和中继
  iceTransportPolicy: 'all',
  // 启用 ICE 候选池，加快连接建立
  iceCandidatePoolSize: 10,
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
