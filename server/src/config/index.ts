/**
 * 服务器配置模块
 */

import dotenv from 'dotenv';
import { API_CONFIG, ROOM_CONSTANTS } from '@screen-sharing/shared';

// 加载环境变量
dotenv.config();

/**
 * 服务器配置接口
 */
export interface ServerConfig {
  /** 服务器端口 */
  port: number;
  /** 环境 */
  env: 'development' | 'production' | 'test';
  /** CORS配置 */
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  /** 日志配置 */
  log: {
    level: string;
    directory: string;
  };
  /** 房间配置 */
  room: {
    maxMembers: number;
    idLength: number;
    autoCleanupInterval: number; // 自动清理空房间的间隔(ms)
  };
  /** Socket.io配置 */
  socket: {
    pingTimeout: number;
    pingInterval: number;
    maxHttpBufferSize: number;
  };
}

/**
 * 获取配置
 */
export function getConfig(): ServerConfig {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  return {
    port: parseInt(process.env.PORT || String(API_CONFIG.DEFAULT_PORT), 10),
    env: (process.env.NODE_ENV as ServerConfig['env']) || 'development',
    
    cors: {
      origin: process.env.CORS_ORIGIN || (isDevelopment ? '*' : 'http://localhost:3000'),
      credentials: true,
    },
    
    log: {
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'warn'),
      directory: process.env.LOG_DIR || './logs',
    },
    
    room: {
      maxMembers: parseInt(
        process.env.ROOM_MAX_MEMBERS || String(ROOM_CONSTANTS.DEFAULT_MAX_MEMBERS),
        10
      ),
      idLength: ROOM_CONSTANTS.ROOM_ID_LENGTH,
      autoCleanupInterval: 60000, // 1分钟
    },
    
    socket: {
      pingTimeout: 30000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e8, // 100MB
    },
  };
}

/**
 * 默认配置实例
 */
export const config = getConfig();
