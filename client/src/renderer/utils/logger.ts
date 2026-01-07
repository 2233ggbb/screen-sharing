/**
 * 日志工具
 */
class Logger {
  private prefix = '[ScreenSharing]';

  debug(...args: any[]) {
    console.debug(this.prefix, ...args);
  }

  info(...args: any[]) {
    console.info(this.prefix, ...args);
  }

  warn(...args: any[]) {
    console.warn(this.prefix, ...args);
  }

  error(...args: any[]) {
    console.error(this.prefix, ...args);
  }
}

export const logger = new Logger();
