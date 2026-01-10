/**
 * 日志工具
 */

import winston from 'winston';
import path from 'path';
import { config } from '../config';

/**
 * 创建Winston Logger
 */
function createLogger(): winston.Logger {
  const logDir = config.log.directory;
  
  // 日志格式
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const { timestamp, level, message, ...meta } = info;
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      
      // 添加额外的元数据
      if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
      }
      
      return log;
    })
  );

  // 基础 transports（控制台输出）
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
  ];

  // 生产环境：只输出到控制台（适合容器化部署，日志由平台收集）
  // 开发/测试环境：同时输出到文件
  if (config.env !== 'production') {
    transports.push(
      // 普通日志文件
      new winston.transports.File({
        filename: path.join(logDir, 'app.log'),
        level: 'info',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
      // 错误日志文件
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );
  }

  // 创建Logger实例
  const logger = winston.createLogger({
    level: config.log.level,
    format: logFormat,
    transports,
  });

  return logger;
}

/**
 * 全局Logger实例
 */
export const logger = createLogger();

/**
 * 日志工具类
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Debug级别日志
   */
  debug(message: string, meta?: any): void {
    logger.debug(message, { context: this.context, ...meta });
  }

  /**
   * Info级别日志
   */
  info(message: string, meta?: any): void {
    logger.info(message, { context: this.context, ...meta });
  }

  /**
   * Warn级别日志
   */
  warn(message: string, meta?: any): void {
    logger.warn(message, { context: this.context, ...meta });
  }

  /**
   * Error级别日志
   */
  error(message: string, error?: Error | any, meta?: any): void {
    logger.error(message, {
      context: this.context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
      ...meta,
    });
  }
}
