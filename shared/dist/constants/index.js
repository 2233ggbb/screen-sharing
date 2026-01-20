"use strict";
/**
 * 共享常量定义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_INFO = exports.API_CONFIG = exports.LOG_CONFIG = exports.LogLevel = exports.STORAGE_KEYS = exports.TIME_CONSTANTS = exports.ERROR_MESSAGES = exports.SOCKET_CONFIG = exports.QUALITY_MONITOR_CONFIG = exports.QUALITY_THRESHOLDS = exports.WEBRTC_CONSTANTS = exports.SHARE_CONSTANTS = exports.SHARE_QUALITY_CONFIG = exports.USER_CONSTANTS = exports.ROOM_CONSTANTS = void 0;
const types_1 = require("../types");
// ==================== 房间相关常量 ====================
/**
 * 房间配置常量
 */
exports.ROOM_CONSTANTS = {
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
};
// ==================== 用户相关常量 ====================
/**
 * 用户配置常量
 */
exports.USER_CONSTANTS = {
    /** 昵称最小长度 */
    MIN_NICKNAME_LENGTH: 2,
    /** 昵称最大长度 */
    MAX_NICKNAME_LENGTH: 20,
    /** 默认头像 */
    DEFAULT_AVATAR: '/assets/default-avatar.png',
};
// ==================== 屏幕共享相关常量 ====================
/**
 * 共享质量配置映射
 */
exports.SHARE_QUALITY_CONFIG = {
    [types_1.ShareQuality.LOW]: {
        width: 1280,
        height: 720,
        frameRate: 15,
    },
    [types_1.ShareQuality.MEDIUM]: {
        width: 1920,
        height: 1080,
        frameRate: 24,
    },
    [types_1.ShareQuality.HIGH]: {
        width: 1920,
        height: 1080,
        frameRate: 30,
    },
};
/**
 * 共享配置常量
 */
exports.SHARE_CONSTANTS = {
    /** 默认质量 */
    DEFAULT_QUALITY: types_1.ShareQuality.MEDIUM,
    /** 最大同时共享人数 */
    MAX_CONCURRENT_SHARERS: 2,
    /** 视频编码格式 */
    VIDEO_CODEC: 'VP8',
    /** 最大比特率 (kbps) */
    MAX_BITRATE: 5000,
    /** 最小比特率 (kbps) */
    MIN_BITRATE: 500,
};
// ==================== WebRTC相关常量 ====================
/**
 * WebRTC配置常量 - 纯 P2P 直连模式
 * 注意：本项目仅支持 P2P 直连，不提供 TURN 中继服务器
 * 如需在复杂 NAT 环境下使用，请自行部署 TURN 服务器
 */
exports.WEBRTC_CONSTANTS = {
    /** ICE服务器配置 */
    ICE_SERVERS: [
        // STUN 服务器 - 用于获取公网 IP 和端口映射
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.syncthing.net:3478' },
        { urls: 'stun:global.stun.twilio.com:3478' },
    ],
    /** 连接超时时间 (ms) */
    CONNECTION_TIMEOUT: 30000,
    /** ICE收集超时时间 (ms) */
    ICE_GATHERING_TIMEOUT: 10000,
    /** 重连最大次数 */
    MAX_RECONNECT_ATTEMPTS: 3,
    /** 重连延迟 (ms) */
    RECONNECT_DELAY: 2000,
};
// ==================== 连接质量相关常量 ====================
/**
 * 连接质量阈值
 */
exports.QUALITY_THRESHOLDS = {
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
};
/**
 * 质量监控配置
 */
exports.QUALITY_MONITOR_CONFIG = {
    /** 检查间隔 (ms) */
    CHECK_INTERVAL: 2000,
    /** 统计窗口大小 */
    STATS_WINDOW_SIZE: 10,
};
// ==================== 网络相关常量 ====================
/**
 * Socket.io配置
 */
exports.SOCKET_CONFIG = {
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
};
// ==================== 错误消息 ====================
/**
 * 错误消息映射
 */
exports.ERROR_MESSAGES = {
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
};
// ==================== 时间相关常量 ====================
/**
 * 时间常量 (毫秒)
 */
exports.TIME_CONSTANTS = {
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
};
// ==================== 本地存储Key ====================
/**
 * LocalStorage键名
 */
exports.STORAGE_KEYS = {
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
};
// ==================== 日志相关常量 ====================
/**
 * 日志级别
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * 日志配置
 */
exports.LOG_CONFIG = {
    /** 开发环境日志级别 */
    DEV_LEVEL: LogLevel.DEBUG,
    /** 生产环境日志级别 */
    PROD_LEVEL: LogLevel.WARN,
    /** 日志文件最大大小 (bytes) */
    MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
    /** 日志文件保留天数 */
    LOG_RETENTION_DAYS: 7,
};
// ==================== API相关常量 ====================
/**
 * API配置
 */
exports.API_CONFIG = {
    /** API版本 */
    VERSION: 'v1',
    /** 默认端口 */
    DEFAULT_PORT: 3000,
    /** 超时时间 (ms) */
    TIMEOUT: 10000,
    /** 请求重试次数 */
    MAX_RETRIES: 3,
};
// ==================== 应用信息 ====================
/**
 * 应用信息
 */
exports.APP_INFO = {
    /** 应用名称 */
    NAME: '多人屏幕共享系统',
    /** 应用版本 */
    VERSION: '1.0.0',
    /** 作者 */
    AUTHOR: 'Screen Sharing Team',
    /** 许可证 */
    LICENSE: 'MIT',
};
