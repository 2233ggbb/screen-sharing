"use strict";
/**
 * 共享类型定义
 * 用于客户端和服务端之间的数据交互
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = exports.ShareQuality = exports.SourceType = exports.UserStatus = void 0;
/**
 * 用户连接状态
 */
var UserStatus;
(function (UserStatus) {
    /** 在线 */
    UserStatus["ONLINE"] = "online";
    /** 离线 */
    UserStatus["OFFLINE"] = "offline";
    /** 连接中 */
    UserStatus["CONNECTING"] = "connecting";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
// ==================== 屏幕共享相关 ====================
/**
 * 共享源类型
 */
var SourceType;
(function (SourceType) {
    /** 整个屏幕 */
    SourceType["SCREEN"] = "screen";
    /** 特定窗口 */
    SourceType["WINDOW"] = "window";
})(SourceType || (exports.SourceType = SourceType = {}));
/**
 * 屏幕共享质量预设
 */
var ShareQuality;
(function (ShareQuality) {
    /** 低质量 (720p@15fps) */
    ShareQuality["LOW"] = "low";
    /** 中质量 (1080p@24fps) */
    ShareQuality["MEDIUM"] = "medium";
    /** 高质量 (1080p@30fps) */
    ShareQuality["HIGH"] = "high";
})(ShareQuality || (exports.ShareQuality = ShareQuality = {}));
// ==================== 错误相关 ====================
/**
 * 错误码
 */
var ErrorCode;
(function (ErrorCode) {
    /** 房间不存在 */
    ErrorCode["ROOM_NOT_FOUND"] = "ROOM_NOT_FOUND";
    /** 房间已满 */
    ErrorCode["ROOM_FULL"] = "ROOM_FULL";
    /** 密码错误 */
    ErrorCode["WRONG_PASSWORD"] = "WRONG_PASSWORD";
    /** 用户未找到 */
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    /** 权限不足 */
    ErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    /** 连接失败 */
    ErrorCode["CONNECTION_FAILED"] = "CONNECTION_FAILED";
    /** 未知错误 */
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
