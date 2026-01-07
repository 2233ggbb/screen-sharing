/**
 * 共享类型定义
 * 用于客户端和服务端之间的数据交互
 */
/**
 * 用户信息
 */
export interface User {
    /** 用户ID */
    id: string;
    /** 用户昵称 */
    nickname: string;
    /** 用户头像URL（可选） */
    avatar?: string;
    /** 是否正在共享屏幕 */
    isSharing: boolean;
    /** 加入时间 */
    joinedAt: Date;
}
/**
 * 用户连接状态
 */
export declare enum UserStatus {
    /** 在线 */
    ONLINE = "online",
    /** 离线 */
    OFFLINE = "offline",
    /** 连接中 */
    CONNECTING = "connecting"
}
/**
 * 房间信息
 */
export interface Room {
    /** 房间ID */
    id: string;
    /** 房间名称 */
    name: string;
    /** 房主ID */
    ownerId: string;
    /** 是否有密码 */
    hasPassword: boolean;
    /** 房间成员列表 */
    members: User[];
    /** 创建时间 */
    createdAt: Date;
    /** 最大成员数 */
    maxMembers: number;
}
/**
 * 创建房间请求
 */
export interface CreateRoomRequest {
    /** 房间名称 */
    roomName: string;
    /** 用户昵称 */
    nickname: string;
    /** 房间密码（可选） */
    password?: string;
    /** 最大成员数（默认10） */
    maxMembers?: number;
}
/**
 * 加入房间请求
 */
export interface JoinRoomRequest {
    /** 房间ID */
    roomId: string;
    /** 用户昵称 */
    nickname: string;
    /** 房间密码（如果有） */
    password?: string;
}
/**
 * 共享源类型
 */
export declare enum SourceType {
    /** 整个屏幕 */
    SCREEN = "screen",
    /** 特定窗口 */
    WINDOW = "window"
}
/**
 * 共享源信息
 */
export interface ShareSource {
    /** 源ID */
    id: string;
    /** 源名称 */
    name: string;
    /** 源类型 */
    type: SourceType;
    /** 缩略图（Base64） */
    thumbnail?: string;
}
/**
 * 屏幕共享配置
 */
export interface ShareConfig {
    /** 视频宽度 */
    width: number;
    /** 视频高度 */
    height: number;
    /** 帧率 */
    frameRate: number;
}
/**
 * 屏幕共享质量预设
 */
export declare enum ShareQuality {
    /** 低质量 (720p@15fps) */
    LOW = "low",
    /** 中质量 (1080p@24fps) */
    MEDIUM = "medium",
    /** 高质量 (1080p@30fps) */
    HIGH = "high"
}
/**
 * 共享流信息
 */
export interface StreamInfo {
    /** 流ID */
    id: string;
    /** 用户ID */
    userId: string;
    /** 用户昵称 */
    nickname: string;
    /** 共享源类型 */
    sourceType: SourceType;
    /** 共享源名称 */
    sourceName: string;
    /** 分辨率 */
    resolution: string;
    /** 帧率 */
    fps: number;
    /** 开始时间 */
    startedAt: Date;
}
/**
 * ICE候选信息
 */
export interface IceCandidate {
    candidate: string;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
}
/**
 * WebRTC Offer/Answer
 */
export interface RTCSessionDescriptionData {
    type: 'offer' | 'answer';
    sdp: string;
}
/**
 * 连接质量
 */
export interface ConnectionQuality {
    /** 延迟(ms) */
    latency: number;
    /** 丢包率(%) */
    packetLoss: number;
    /** 带宽(kbps) */
    bandwidth: number;
    /** 质量评级 */
    rating: 'excellent' | 'good' | 'fair' | 'poor';
}
/**
 * 错误码
 */
export declare enum ErrorCode {
    /** 房间不存在 */
    ROOM_NOT_FOUND = "ROOM_NOT_FOUND",
    /** 房间已满 */
    ROOM_FULL = "ROOM_FULL",
    /** 密码错误 */
    WRONG_PASSWORD = "WRONG_PASSWORD",
    /** 用户未找到 */
    USER_NOT_FOUND = "USER_NOT_FOUND",
    /** 权限不足 */
    PERMISSION_DENIED = "PERMISSION_DENIED",
    /** 连接失败 */
    CONNECTION_FAILED = "CONNECTION_FAILED",
    /** 未知错误 */
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
/**
 * 错误响应
 */
export interface ErrorResponse {
    /** 错误码 */
    code: ErrorCode;
    /** 错误消息 */
    message: string;
    /** 详细信息（可选） */
    details?: any;
}
/**
 * 通用成功响应
 */
export interface SuccessResponse<T = any> {
    /** 是否成功 */
    success: true;
    /** 响应数据 */
    data: T;
    /** 消息（可选） */
    message?: string;
}
/**
 * 通用失败响应
 */
export interface FailureResponse {
    /** 是否成功 */
    success: false;
    /** 错误信息 */
    error: ErrorResponse;
}
/**
 * API响应类型
 */
export type ApiResponse<T = any> = SuccessResponse<T> | FailureResponse;
//# sourceMappingURL=index.d.ts.map