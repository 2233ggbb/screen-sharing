/**
 * 客户端常量定义
 */

// WebRTC配置 - 包含 TURN 中继服务器以支持对称型 NAT
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // STUN 服务器 - 用于获取公网 IP 和 NAT 穿透
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // TURN 服务器 - 当直接连接失败时作为中继
    // 使用 Open Relay Project 提供的公共 TURN 服务器
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
    // 备用 TURN 服务器 - Metered 免费额度
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'e8dd65c92f62d6c9c1bc6723',
      credential: 'dxVA2xhtcSPxgxaC',
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'e8dd65c92f62d6c9c1bc6723',
      credential: 'dxVA2xhtcSPxgxaC',
    },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: 'e8dd65c92f62d6c9c1bc6723',
      credential: 'dxVA2xhtcSPxgxaC',
    },
  ],
  // ICE 传输策略：all 尝试所有可用的连接方式（包括 relay）
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
