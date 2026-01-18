/**
 * 共享常量定义
 */

import { ShareConfig, ShareQuality } from '../types';

// ==================== 房间相关常量 ====================

/**
 * 房间配置常量
 */
export const ROOM_CONSTANTS = {
  /** 默认最大成员数 */
  DEFAULT_MAX_MEMBERS: 10,
  /** 房间ID长度 */
  ROOM_ID_LENGTH: 6,
  /** 房间名称最大长度 */
  MAX_ROOM_NAME_LENGTH: 50,
  /** 密码最小长度 */
  MIN_PASSWORD_LENGTH: 4,
  /** 密码最大长度 */
  MAX_PASSWORD_LENGTH: 20,
} as const;

// ==================== 用户相关常量 ====================

/**
 * 用户配置常量
 */
export const USER_CONSTANTS = {
  /** 昵称最小长度 */
  MIN_NICKNAME_LENGTH: 2,
  /** 昵称最大长度 */
  MAX_NICKNAME_LENGTH: 20,
  /** 默认头像 */
  DEFAULT_AVATAR: '/assets/default-avatar.png',
} as const;

// ==================== 屏幕共享相关常量 ====================

/**
 * 共享质量配置映射
 */
export const SHARE_QUALITY_CONFIG: Record<ShareQuality, ShareConfig> = {
  [ShareQuality.LOW]: {
    width: 1280,
    height: 720,
    frameRate: 15,
  },
  [ShareQuality.MEDIUM]: {
    width: 1920,
    height: 1080,
    frameRate: 24,
  },
  [ShareQuality.HIGH]: {
    width: 1920,
    height: 1080,
    frameRate: 30,
  },
};

/**
 * 共享配置常量
 */
export const SHARE_CONSTANTS = {
  /** 默认质量 */
  DEFAULT_QUALITY: ShareQuality.MEDIUM,
  /** 最大同时共享人数 */
  MAX_CONCURRENT_SHARERS: 2,
  /** 视频编码格式 */
  VIDEO_CODEC: 'VP8',
  /** 最大比特率 (kbps) */
  MAX_BITRATE: 5000,
  /** 最小比特率 (kbps) */
  MIN_BITRATE: 500,
} as const;

// ==================== WebRTC相关常量 ====================

/**
 * WebRTC配置常量
 * 注意：生产环境应使用自建的 TURN 服务器以确保稳定性
 */
export const WEBRTC_CONSTANTS = {
  /** ICE服务器配置 */
  ICE_SERVERS: [
    // STUN 服务器
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // 公共 TURN 服务器（OpenRelay - 免费测试用）
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
  /** 连接超时时间 (ms) */
  CONNECTION_TIMEOUT: 30000,
  /** ICE收集超时时间 (ms) */
  ICE_GATHERING_TIMEOUT: 10000,
  /** 重连最大次数 */
  MAX_RECONNECT_ATTEMPTS: 3,
  /** 重连延迟 (ms) */
  RECONNECT_DELAY: 2000,
} as const;

// ==================== 连接质量相关常量 ====================

/**
 * 连接质量阈值
 */
export const QUALITY_THRESHOLDS = {
  /** 优秀 */
  EXCELLENT: {
    maxLatency: 100,
    maxPacketLoss: 1,
    minBandwidth: 3000,
  },
  /** 良好 */
  GOOD: {
    maxLatency: 200,
    maxPacketLoss: 3,
    minBandwidth: 2000,
  },
  /** 一般 */
  FAIR: {
    maxLatency: 400,
    maxPacketLoss: 5,
    minBandwidth: 1000,
  },
  /** 差 */
  POOR: {
    maxLatency: Infinity,
    maxPacketLoss: Infinity,
    minBandwidth: 0,
  },
} as const;

/**
 * 质量监控配置
 */
export const QUALITY_MONITOR_CONFIG = {
  /** 检查间隔 (ms) */
  CHECK_INTERVAL: 2000,
  /** 统计窗口大小 */
  STATS_WINDOW_SIZE: 10,
} as const;

// ==================== 网络相关常量 ====================

/**
 * Socket.io配置
 */
export const SOCKET_CONFIG = {
  /** 重连尝试次数 */
  RECONNECTION_ATTEMPTS: 5,
  /** 重连延迟 (ms) */
  RECONNECTION_DELAY: 1000,
  /** 最大重连延迟 (ms) */
  RECONNECTION_DELAY_MAX: 5000,
  /** 连接超时 (ms) */
  TIMEOUT: 20000,
  /** 传输方式 */
  TRANSPORTS: ['websocket', 'polling'],
} as const;

// ==================== 错误消息 ====================

/**
 * 错误消息映射
 */
export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: '房间不存在',
  ROOM_FULL: '房间已满',
  WRONG_PASSWORD: '密码错误',
  USER_NOT_FOUND: '用户未找到',
  PERMISSION_DENIED: '权限不足',
  CONNECTION_FAILED: '连接失败',
  UNKNOWN_ERROR: '未知错误',
  INVALID_ROOM_NAME: '无效的房间名称',
  INVALID_NICKNAME: '无效的昵称',
  INVALID_PASSWORD: '无效的密码',
  MAX_SHARERS_REACHED: '已达到最大共享人数',
} as const;

// ==================== 时间相关常量 ====================

/**
 * 时间常量 (毫秒)
 */
export const TIME_CONSTANTS = {
  /** 1秒 */
  SECOND: 1000,
  /** 1分钟 */
  MINUTE: 60 * 1000,
  /** 1小时 */
  HOUR: 60 * 60 * 1000,
  /** 1天 */
  DAY: 24 * 60 * 60 * 1000,
  
  /** 心跳间隔 */
  HEARTBEAT_INTERVAL: 30 * 1000,
  /** 会话超时 */
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
} as const;

// ==================== 本地存储Key ====================

/**
 * LocalStorage键名
 */
export const STORAGE_KEYS = {
  /** 主题 */
  THEME: 'app-theme',
  /** 用户昵称 */
  NICKNAME: 'user-nickname',
  /** 用户头像 */
  AVATAR: 'user-avatar',
  /** 共享质量偏好 */
  SHARE_QUALITY: 'share-quality',
  /** 最近加入的房间 */
  RECENT_ROOMS: 'recent-rooms',
} as const;

// ==================== 日志相关常量 ====================

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 日志配置
 */
export const LOG_CONFIG = {
  /** 开发环境日志级别 */
  DEV_LEVEL: LogLevel.DEBUG,
  /** 生产环境日志级别 */
  PROD_LEVEL: LogLevel.WARN,
  /** 日志文件最大大小 (bytes) */
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  /** 日志文件保留天数 */
  LOG_RETENTION_DAYS: 7,
} as const;

// ==================== API相关常量 ====================

/**
 * API配置
 */
export const API_CONFIG = {
  /** API版本 */
  VERSION: 'v1',
  /** 默认端口 */
  DEFAULT_PORT: 3000,
  /** 超时时间 (ms) */
  TIMEOUT: 10000,
  /** 请求重试次数 */
  MAX_RETRIES: 3,
} as const;

// ==================== 应用信息 ====================

/**
 * 应用信息
 */
export const APP_INFO = {
  /** 应用名称 */
  NAME: '多人屏幕共享系统',
  /** 应用版本 */
  VERSION: '1.0.0',
  /** 作者 */
  AUTHOR: 'Screen Sharing Team',
  /** 许可证 */
  LICENSE: 'MIT',
} as const;
