/**
 * 日志工具
 * 提供统一的日志记录接口
 */

// 声明 React Native 全局变量
declare const __DEV__: boolean;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: unknown;
}

class Logger {
  private isDebugEnabled: boolean;

  constructor() {
    this.isDebugEnabled = __DEV__;
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return data ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  debug(message: string, ...data: unknown[]): void {
    if (this.isDebugEnabled) {
      console.log(this.formatMessage('debug', message), ...data);
    }
  }

  info(message: string, ...data: unknown[]): void {
    console.info(this.formatMessage('info', message), ...data);
  }

  warn(message: string, ...data: unknown[]): void {
    console.warn(this.formatMessage('warn', message), ...data);
  }

  error(message: string, ...data: unknown[]): void {
    console.error(this.formatMessage('error', message), ...data);
  }

  /**
   * 记录性能指标
   */
  performance(label: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.debug(`[Performance] ${label}: ${duration}ms`);
  }

  /**
   * 创建带有命名空间的 logger
   */
  createNamespacedLogger(namespace: string): {
    debug: (message: string, ...data: unknown[]) => void;
    info: (message: string, ...data: unknown[]) => void;
    warn: (message: string, ...data: unknown[]) => void;
    error: (message: string, ...data: unknown[]) => void;
  } {
    return {
      debug: (message: string, ...data: unknown[]) =>
        this.debug(`[${namespace}] ${message}`, ...data),
      info: (message: string, ...data: unknown[]) =>
        this.info(`[${namespace}] ${message}`, ...data),
      warn: (message: string, ...data: unknown[]) =>
        this.warn(`[${namespace}] ${message}`, ...data),
      error: (message: string, ...data: unknown[]) =>
        this.error(`[${namespace}] ${message}`, ...data),
    };
  }
}

export const logger = new Logger();
