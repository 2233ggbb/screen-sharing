"use strict";
/**
 * Socket.io 事件定义
 * 定义客户端和服务端之间的所有Socket.io事件
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = exports.ServerEvents = exports.ClientEvents = void 0;
// ==================== 客户端发送事件 ====================
/**
 * 客户端发送的事件类型
 */
var ClientEvents;
(function (ClientEvents) {
    /** 创建房间 */
    ClientEvents["CREATE_ROOM"] = "create_room";
    /** 加入房间 */
    ClientEvents["JOIN_ROOM"] = "join_room";
    /** 离开房间 */
    ClientEvents["LEAVE_ROOM"] = "leave_room";
    /** 开始共享 */
    ClientEvents["START_SHARING"] = "start_sharing";
    /** 停止共享 */
    ClientEvents["STOP_SHARING"] = "stop_sharing";
    /** 发送Offer */
    ClientEvents["SEND_OFFER"] = "send_offer";
    /** 发送Answer */
    ClientEvents["SEND_ANSWER"] = "send_answer";
    /** 发送ICE候选 */
    ClientEvents["SEND_ICE_CANDIDATE"] = "send_ice_candidate";
    /** 更新连接质量 */
    ClientEvents["UPDATE_QUALITY"] = "update_quality";
    /** 请求房间列表 */
    ClientEvents["GET_ROOMS"] = "get_rooms";
    /** 请求房间信息 */
    ClientEvents["GET_ROOM_INFO"] = "get_room_info";
    /** NAT 类型检测 */
    ClientEvents["DETECT_NAT_TYPE"] = "detect_nat_type";
    /** ICE 收集完成通知 */
    ClientEvents["ICE_GATHERING_COMPLETE"] = "ice_gathering_complete";
})(ClientEvents || (exports.ClientEvents = ClientEvents = {}));
// ==================== 服务端发送事件 ====================
/**
 * 服务端发送的事件类型
 */
var ServerEvents;
(function (ServerEvents) {
    /** 房间创建成功 */
    ServerEvents["ROOM_CREATED"] = "room_created";
    /** 加入房间成功 */
    ServerEvents["ROOM_JOINED"] = "room_joined";
    /** 用户加入房间（广播给其他人） */
    ServerEvents["USER_JOINED"] = "user_joined";
    /** 用户离开房间 */
    ServerEvents["USER_LEFT"] = "user_left";
    /** 用户开始共享 */
    ServerEvents["USER_STARTED_SHARING"] = "user_started_sharing";
    /** 用户停止共享 */
    ServerEvents["USER_STOPPED_SHARING"] = "user_stopped_sharing";
    /** 收到Offer */
    ServerEvents["RECEIVE_OFFER"] = "receive_offer";
    /** 收到Answer */
    ServerEvents["RECEIVE_ANSWER"] = "receive_answer";
    /** 收到ICE候选 */
    ServerEvents["RECEIVE_ICE_CANDIDATE"] = "receive_ice_candidate";
    /** 连接质量更新 */
    ServerEvents["QUALITY_UPDATED"] = "quality_updated";
    /** 房间列表 */
    ServerEvents["ROOMS_LIST"] = "rooms_list";
    /** 房间信息 */
    ServerEvents["ROOM_INFO"] = "room_info";
    /** 错误 */
    ServerEvents["ERROR"] = "error";
    /** 连接成功 */
    ServerEvents["CONNECTED"] = "connected";
    /** 断开连接 */
    ServerEvents["DISCONNECTED"] = "disconnected";
    /** NAT 类型检测结果 */
    ServerEvents["NAT_TYPE_DETECTED"] = "nat_type_detected";
})(ServerEvents || (exports.ServerEvents = ServerEvents = {}));
// ==================== 统一事件枚举 ====================
/**
 * Socket.io 事件枚举（统一客户端和服务端事件）
 * 用于方便在客户端代码中引用
 */
var SocketEvents;
(function (SocketEvents) {
    // 客户端发送事件
    SocketEvents["CREATE_ROOM"] = "create_room";
    SocketEvents["JOIN_ROOM"] = "join_room";
    SocketEvents["LEAVE_ROOM"] = "leave_room";
    SocketEvents["START_SHARING"] = "start_sharing";
    SocketEvents["STOP_SHARING"] = "stop_sharing";
    SocketEvents["SEND_OFFER"] = "send_offer";
    SocketEvents["SEND_ANSWER"] = "send_answer";
    SocketEvents["SEND_ICE_CANDIDATE"] = "send_ice_candidate";
    SocketEvents["UPDATE_QUALITY"] = "update_quality";
    SocketEvents["GET_ROOMS"] = "get_rooms";
    SocketEvents["GET_ROOM_INFO"] = "get_room_info";
    // 服务端发送事件
    SocketEvents["ROOM_CREATED"] = "room_created";
    SocketEvents["ROOM_JOINED"] = "room_joined";
    SocketEvents["USER_JOINED"] = "user_joined";
    SocketEvents["USER_LEFT"] = "user_left";
    SocketEvents["USER_STARTED_SHARING"] = "user_started_sharing";
    SocketEvents["USER_STOPPED_SHARING"] = "user_stopped_sharing";
    SocketEvents["RECEIVE_OFFER"] = "receive_offer";
    SocketEvents["RECEIVE_ANSWER"] = "receive_answer";
    SocketEvents["RECEIVE_ICE_CANDIDATE"] = "receive_ice_candidate";
    SocketEvents["QUALITY_UPDATED"] = "quality_updated";
    SocketEvents["ROOMS_LIST"] = "rooms_list";
    SocketEvents["ROOM_INFO"] = "room_info";
    SocketEvents["ERROR"] = "error";
    SocketEvents["CONNECTED"] = "connected";
    SocketEvents["DISCONNECTED"] = "disconnected";
    // WebRTC 信令事件（客户端使用的别名）
    SocketEvents["WEBRTC_OFFER"] = "receive_offer";
    SocketEvents["WEBRTC_ANSWER"] = "receive_answer";
    SocketEvents["WEBRTC_ICE_CANDIDATE"] = "receive_ice_candidate";
    // 用户共享事件（客户端使用的别名）
    SocketEvents["USER_START_SHARING"] = "user_started_sharing";
    SocketEvents["USER_STOP_SHARING"] = "user_stopped_sharing";
})(SocketEvents || (exports.SocketEvents = SocketEvents = {}));
