/**
 * Socket.io 事件定义
 * 定义客户端和服务端之间的所有Socket.io事件
 */

import {
  CreateRoomRequest,
  JoinRoomRequest,
  Room,
  User,
  StreamInfo,
  RTCSessionDescriptionData,
  IceCandidate,
  ErrorResponse,
  ConnectionQuality,
} from '../types';

// ==================== 客户端发送事件 ====================

/**
 * 客户端发送的事件类型
 */
export enum ClientEvents {
  /** 创建房间 */
  CREATE_ROOM = 'create_room',
  /** 加入房间 */
  JOIN_ROOM = 'join_room',
  /** 离开房间 */
  LEAVE_ROOM = 'leave_room',
  
  /** 开始共享 */
  START_SHARING = 'start_sharing',
  /** 停止共享 */
  STOP_SHARING = 'stop_sharing',
  
  /** 发送Offer */
  SEND_OFFER = 'send_offer',
  /** 发送Answer */
  SEND_ANSWER = 'send_answer',
  /** 发送ICE候选 */
  SEND_ICE_CANDIDATE = 'send_ice_candidate',
  
  /** 更新连接质量 */
  UPDATE_QUALITY = 'update_quality',
  
  /** 请求房间列表 */
  GET_ROOMS = 'get_rooms',
  /** 请求房间信息 */
  GET_ROOM_INFO = 'get_room_info',

  /** NAT 类型检测 */
  DETECT_NAT_TYPE = 'detect_nat_type',
  /** ICE 收集完成通知 */
  ICE_GATHERING_COMPLETE = 'ice_gathering_complete',
}

/**
 * 客户端事件参数类型映射
 */
export interface ClientEventParams {
  [ClientEvents.CREATE_ROOM]: CreateRoomRequest;
  [ClientEvents.JOIN_ROOM]: JoinRoomRequest;
  [ClientEvents.LEAVE_ROOM]: undefined;
  
  [ClientEvents.START_SHARING]: {
    sourceId: string;
    sourceName: string;
    sourceType: 'screen' | 'window';
    config: {
      width: number;
      height: number;
      frameRate: number;
    };
  };
  [ClientEvents.STOP_SHARING]: undefined;
  
  [ClientEvents.SEND_OFFER]: {
    targetUserId: string;
    offer: RTCSessionDescriptionData;
  };
  [ClientEvents.SEND_ANSWER]: {
    targetUserId: string;
    answer: RTCSessionDescriptionData;
  };
  [ClientEvents.SEND_ICE_CANDIDATE]: {
    targetUserId: string;
    candidate: IceCandidate;
  };
  
  [ClientEvents.UPDATE_QUALITY]: ConnectionQuality;
  
  [ClientEvents.GET_ROOMS]: undefined;
  [ClientEvents.GET_ROOM_INFO]: { roomId: string };

  [ClientEvents.DETECT_NAT_TYPE]: {
    clientId?: string;
  };
  [ClientEvents.ICE_GATHERING_COMPLETE]: {
    targetUserId: string;
    connectionId: string;
  };
}

// ==================== 服务端发送事件 ====================

/**
 * 服务端发送的事件类型
 */
export enum ServerEvents {
  /** 房间创建成功 */
  ROOM_CREATED = 'room_created',
  /** 加入房间成功 */
  ROOM_JOINED = 'room_joined',
  /** 用户加入房间（广播给其他人） */
  USER_JOINED = 'user_joined',
  /** 用户离开房间 */
  USER_LEFT = 'user_left',
  
  /** 用户开始共享 */
  USER_STARTED_SHARING = 'user_started_sharing',
  /** 用户停止共享 */
  USER_STOPPED_SHARING = 'user_stopped_sharing',
  
  /** 收到Offer */
  RECEIVE_OFFER = 'receive_offer',
  /** 收到Answer */
  RECEIVE_ANSWER = 'receive_answer',
  /** 收到ICE候选 */
  RECEIVE_ICE_CANDIDATE = 'receive_ice_candidate',
  
  /** 连接质量更新 */
  QUALITY_UPDATED = 'quality_updated',
  
  /** 房间列表 */
  ROOMS_LIST = 'rooms_list',
  /** 房间信息 */
  ROOM_INFO = 'room_info',
  
  /** 错误 */
  ERROR = 'error',
  
  /** 连接成功 */
  CONNECTED = 'connected',
  /** 断开连接 */
  DISCONNECTED = 'disconnected',

  /** NAT 类型检测结果 */
  NAT_TYPE_DETECTED = 'nat_type_detected',
}

/**
 * 服务端事件参数类型映射
 */
export interface ServerEventParams {
  [ServerEvents.ROOM_CREATED]: {
    room: Room;
    userId: string;
  };
  [ServerEvents.ROOM_JOINED]: {
    room: Room;
    userId: string;
  };
  [ServerEvents.USER_JOINED]: {
    user: User;
    roomId: string;
  };
  [ServerEvents.USER_LEFT]: {
    userId: string;
    roomId: string;
  };
  
  [ServerEvents.USER_STARTED_SHARING]: {
    userId: string;
    streamInfo: StreamInfo;
  };
  [ServerEvents.USER_STOPPED_SHARING]: {
    userId: string;
    streamId: string;
  };
  
  [ServerEvents.RECEIVE_OFFER]: {
    fromUserId: string;
    offer: RTCSessionDescriptionData;
  };
  [ServerEvents.RECEIVE_ANSWER]: {
    fromUserId: string;
    answer: RTCSessionDescriptionData;
  };
  [ServerEvents.RECEIVE_ICE_CANDIDATE]: {
    fromUserId: string;
    candidate: IceCandidate;
  };
  
  [ServerEvents.QUALITY_UPDATED]: {
    userId: string;
    quality: ConnectionQuality;
  };
  
  [ServerEvents.ROOMS_LIST]: {
    rooms: Array<{
      id: string;
      name: string;
      memberCount: number;
      maxMembers: number;
      hasPassword: boolean;
    }>;
  };
  [ServerEvents.ROOM_INFO]: {
    room: Room;
  };
  
  [ServerEvents.ERROR]: ErrorResponse;
  
  [ServerEvents.CONNECTED]: {
    userId: string;
    serverTime: Date;
  };
  [ServerEvents.DISCONNECTED]: {
    reason: string;
  };

  [ServerEvents.NAT_TYPE_DETECTED]: {
    type: 'full-cone' | 'restricted-cone' | 'port-restricted-cone' | 'symmetric';
    canP2P: boolean;
    confidence: number;
    publicAddress: { ip: string; port: number };
    recommendation: string;
    requiresSync: boolean;
  };
}

// ==================== 统一事件枚举 ====================

/**
 * Socket.io 事件枚举（统一客户端和服务端事件）
 * 用于方便在客户端代码中引用
 */
export enum SocketEvents {
  // 客户端发送事件
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  START_SHARING = 'start_sharing',
  STOP_SHARING = 'stop_sharing',
  SEND_OFFER = 'send_offer',
  SEND_ANSWER = 'send_answer',
  SEND_ICE_CANDIDATE = 'send_ice_candidate',
  UPDATE_QUALITY = 'update_quality',
  GET_ROOMS = 'get_rooms',
  GET_ROOM_INFO = 'get_room_info',
  
  // 服务端发送事件
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_STARTED_SHARING = 'user_started_sharing',
  USER_STOPPED_SHARING = 'user_stopped_sharing',
  RECEIVE_OFFER = 'receive_offer',
  RECEIVE_ANSWER = 'receive_answer',
  RECEIVE_ICE_CANDIDATE = 'receive_ice_candidate',
  QUALITY_UPDATED = 'quality_updated',
  ROOMS_LIST = 'rooms_list',
  ROOM_INFO = 'room_info',
  ERROR = 'error',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  
  // WebRTC 信令事件（客户端使用的别名）
  WEBRTC_OFFER = 'receive_offer',
  WEBRTC_ANSWER = 'receive_answer',
  WEBRTC_ICE_CANDIDATE = 'receive_ice_candidate',
  
  // 用户共享事件（客户端使用的别名）
  USER_START_SHARING = 'user_started_sharing',
  USER_STOP_SHARING = 'user_stopped_sharing',
}

// ==================== 类型辅助工具 ====================

/**
 * 事件处理器类型
 */
export type EventHandler<T> = (data: T) => void | Promise<void>;

/**
 * 事件监听器类型映射
 */
export type ClientEventListeners = {
  [K in ClientEvents]: EventHandler<ClientEventParams[K]>;
};

export type ServerEventListeners = {
  [K in ServerEvents]: EventHandler<ServerEventParams[K]>;
};
