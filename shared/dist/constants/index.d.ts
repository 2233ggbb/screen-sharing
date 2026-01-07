/**
 * 共享常量定义
 */
import { ShareConfig, ShareQuality } from '../types';
/**
 * 房间配置常量
 */
export declare const ROOM_CONSTANTS: {
    /** 默认最大成员数 */
    readonly DEFAULT_MAX_MEMBERS: 10;
    /** 房间ID长度 */
    readonly ROOM_ID_LENGTH: 6;
    /** 房间名称最大长度 */
    readonly MAX_ROOM_NAME_LENGTH: 50;
    /** 密码最小长度 */
    readonly MIN_PASSWORD_LENGTH: 4;
    /** 密码最大长度 */
    readonly MAX_PASSWORD_LENGTH: 20;
};
/**
 * 用户配置常量
 */
export declare const USER_CONSTANTS: {
    /** 昵称最小长度 */
    readonly MIN_NICKNAME_LENGTH: 2;
    /** 昵称最大长度 */
    readonly MAX_NICKNAME_LENGTH: 20;
    /** 默认头像 */
    readonly DEFAULT_AVATAR: "/assets/default-avatar.png";
};
/**
 * 共享质量配置映射
 */
export declare const SHARE_QUALITY_CONFIG: Record<ShareQuality, ShareConfig>;
/**
 * 共享配置常量
 */
export declare const SHARE_CONSTANTS: {
    /** 默认质量 */
    readonly DEFAULT_QUALITY: ShareQuality.MEDIUM;
    /** 最大同时共享人数 */
    readonly MAX_CONCURRENT_SHARERS: 2;
    /** 视频编码格式 */
    readonly VIDEO_CODEC: "VP8";
    /** 最大比特率 (kbps) */
    readonly MAX_BITRATE: 5000;
    /** 最小比特率 (kbps) */
    readonly MIN_BITRATE: 500;
};
/**
 * WebRTC配置常量
 */
export declare const WEBRTC_CONSTANTS: {
    /** ICE服务器配置 */
    readonly ICE_SERVERS: readonly [{
        readonly urls: "stun:stun.l.google.com:19302";
    }, {
        readonly urls: "stun:stun1.l.google.com:19302";
    }];
    /** 连接超时时间 (ms) */
    readonly CONNECTION_TIMEOUT: 30000;
    /** ICE收集超时时间 (ms) */
    readonly ICE_GATHERING_TIMEOUT: 10000;
    /** 重连最大次数 */
    readonly MAX_RECONNECT_ATTEMPTS: 3;
    /** 重连延迟 (ms) */
    readonly RECONNECT_DELAY: 2000;
};
/**
 * 连接质量阈值
 */
export declare const QUALITY_THRESHOLDS: {
    /** 优秀 */
    readonly EXCELLENT: {
        readonly maxLatency: 100;
        readonly maxPacketLoss: 1;
        readonly minBandwidth: 3000;
    };
    /** 良好 */
    readonly GOOD: {
        readonly maxLatency: 200;
        readonly maxPacketLoss: 3;
        readonly minBandwidth: 2000;
    };
    /** 一般 */
    readonly FAIR: {
        readonly maxLatency: 400;
        readonly maxPacketLoss: 5;
        readonly minBandwidth: 1000;
    };
    /** 差 */
    readonly POOR: {
        readonly maxLatency: number;
        readonly maxPacketLoss: number;
        readonly minBandwidth: 0;
    };
};
/**
 * 质量监控配置
 */
export declare const QUALITY_MONITOR_CONFIG: {
    /** 检查间隔 (ms) */
    readonly CHECK_INTERVAL: 2000;
    /** 统计窗口大小 */
    readonly STATS_WINDOW_SIZE: 10;
};
/**
 * Socket.io配置
 */
export declare const SOCKET_CONFIG: {
    /** 重连尝试次数 */
    readonly RECONNECTION_ATTEMPTS: 5;
    /** 重连延迟 (ms) */
    readonly RECONNECTION_DELAY: 1000;
    /** 最大重连延迟 (ms) */
    readonly RECONNECTION_DELAY_MAX: 5000;
    /** 连接超时 (ms) */
    readonly TIMEOUT: 20000;
    /** 传输方式 */
    readonly TRANSPORTS: readonly ["websocket", "polling"];
};
/**
 * 错误消息映射
 */
export declare const ERROR_MESSAGES: {
    readonly ROOM_NOT_FOUND: "房间不存在";
    readonly ROOM_FULL: "房间已满";
    readonly WRONG_PASSWORD: "密码错误";
    readonly USER_NOT_FOUND: "用户未找到";
    readonly PERMISSION_DENIED: "权限不足";
    readonly CONNECTION_FAILED: "连接失败";
    readonly UNKNOWN_ERROR: "未知错误";
    readonly INVALID_ROOM_NAME: "无效的房间名称";
    readonly INVALID_NICKNAME: "无效的昵称";
    readonly INVALID_PASSWORD: "无效的密码";
    readonly MAX_SHARERS_REACHED: "已达到最大共享人数";
};
/**
 * 时间常量 (毫秒)
 */
export declare const TIME_CONSTANTS: {
    /** 1秒 */
    readonly SECOND: 1000;
    /** 1分钟 */
    readonly MINUTE: number;
    /** 1小时 */
    readonly HOUR: number;
    /** 1天 */
    readonly DAY: number;
    /** 心跳间隔 */
    readonly HEARTBEAT_INTERVAL: number;
    /** 会话超时 */
    readonly SESSION_TIMEOUT: number;
};
/**
 * LocalStorage键名
 */
export declare const STORAGE_KEYS: {
    /** 主题 */
    readonly THEME: "app-theme";
    /** 用户昵称 */
    readonly NICKNAME: "user-nickname";
    /** 用户头像 */
    readonly AVATAR: "user-avatar";
    /** 共享质量偏好 */
    readonly SHARE_QUALITY: "share-quality";
    /** 最近加入的房间 */
    readonly RECENT_ROOMS: "recent-rooms";
};
/**
 * 日志级别
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
/**
 * 日志配置
 */
export declare const LOG_CONFIG: {
    /** 开发环境日志级别 */
    readonly DEV_LEVEL: LogLevel.DEBUG;
    /** 生产环境日志级别 */
    readonly PROD_LEVEL: LogLevel.WARN;
    /** 日志文件最大大小 (bytes) */
    readonly MAX_LOG_SIZE: number;
    /** 日志文件保留天数 */
    readonly LOG_RETENTION_DAYS: 7;
};
/**
 * API配置
 */
export declare const API_CONFIG: {
    /** API版本 */
    readonly VERSION: "v1";
    /** 默认端口 */
    readonly DEFAULT_PORT: 3000;
    /** 超时时间 (ms) */
    readonly TIMEOUT: 10000;
    /** 请求重试次数 */
    readonly MAX_RETRIES: 3;
};
/**
 * 应用信息
 */
export declare const APP_INFO: {
    /** 应用名称 */
    readonly NAME: "多人屏幕共享系统";
    /** 应用版本 */
    readonly VERSION: "1.0.0";
    /** 作者 */
    readonly AUTHOR: "Screen Sharing Team";
    /** 许可证 */
    readonly LICENSE: "MIT";
};
//# sourceMappingURL=index.d.ts.map