/**
 * 客户端常量定义
 */

/**
 * WebRTC 配置 - 纯 P2P 直连模式
 *
 * 连接策略：
 * 1. 多个 STUN 服务器 - 提高获取公网地址的成功率
 * 2. 支持 IPv6 - 如果双端都有 IPv6，可直接连接绕过 NAT
 * 3. 增大候选池 - 加速 ICE 收集过程
 *
 * NAT 兼容性：
 * ✅ 完全锥型 NAT (Full Cone)
 * ✅ 受限锥型 NAT (Restricted Cone)
 * ⚠️ 端口受限锥型 NAT (Port Restricted Cone) - 可能失败
 * ❌ 对称型 NAT (Symmetric) - 无法直连
 *
 * 注意：本项目仅支持 P2P 直连，不提供 TURN 中继服务器。
 * 如需在复杂 NAT 环境下使用，请自行部署 TURN 服务器。
 */
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // === STUN 服务器 - 用于获取公网 IP 和端口映射 ===
    // 国内 STUN 服务器（腾讯、小米），提高国内连接成功率
    { urls: 'stun:stun.qq.com:3478' },
    { urls: 'stun:stun.miwifi.com:3478' },
    // Google STUN 服务器（稳定可靠）
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Cloudflare STUN（国内访问较友好）
    { urls: 'stun:stun.cloudflare.com:3478' },
    // Syncthing STUN
    { urls: 'stun:stun.syncthing.net:3478' },
    // Twilio STUN
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  // ICE 传输策略：all 尝试所有可用的连接方式
  iceTransportPolicy: 'all',
  // 增大候选池，预先收集候选以加快连接
  iceCandidatePoolSize: 10,
  // bundlePolicy: 将所有媒体流合并到一个传输通道，减少需要打通的端口数
  bundlePolicy: 'max-bundle',
  // rtcpMuxPolicy: 复用 RTP 和 RTCP 到同一端口，减少打洞复杂度
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
  ENABLE_IPV6: 'enable_ipv6',
} as const;

// 网络质量阈值
export const NETWORK_QUALITY = {
  EXCELLENT: { delay: 100, label: '优秀' },
  GOOD: { delay: 200, label: '良好' },
  FAIR: { delay: 500, label: '一般' },
  POOR: { delay: 1000, label: '较差' },
} as const;
