/**
 * 服务器入口文件
 */

import express from 'express';
import { createServer } from 'http';
import { config } from './config';
import { initializeSocket } from './socket';
import { corsHandler } from './middleware/corsHandler';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { APP_INFO } from '@screen-sharing/shared';

/**
 * 创建Express应用
 */
const app = express();

/**
 * 中间件配置
 */
// CORS
app.use(corsHandler);

// Body解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

/**
 * API路由
 */
// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: APP_INFO.VERSION,
  });
});

// API信息
app.get('/api', (req, res) => {
  res.json({
    name: APP_INFO.NAME,
    version: APP_INFO.VERSION,
    author: APP_INFO.AUTHOR,
    license: APP_INFO.LICENSE,
  });
});

/**
 * 错误处理
 */
// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

/**
 * 创建HTTP服务器
 */
const httpServer = createServer(app);

/**
 * 初始化Socket.io
 */
const io = initializeSocket(httpServer);

/**
 * 启动服务器
 */
httpServer.listen(config.port, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ${APP_INFO.NAME}                                      ║
║                                                           ║
║     版本: ${APP_INFO.VERSION}                             ║
║     环境: ${config.env}                                   ║
║     端口: ${config.port}                                  ║
║                                                           ║
║     服务器已启动 🚀                                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

/**
 * 优雅关闭
 */
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');
  
  httpServer.close(() => {
    logger.info('HTTP服务器已关闭');
    io.close(() => {
      logger.info('Socket.io服务器已关闭');
      process.exit(0);
    });
  });

  // 如果10秒后还没关闭，强制退出
  setTimeout(() => {
    logger.error('强制关闭服务器');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，开始优雅关闭...');
  
  httpServer.close(() => {
    logger.info('HTTP服务器已关闭');
    io.close(() => {
      logger.info('Socket.io服务器已关闭');
      process.exit(0);
    });
  });
});

/**
 * 未捕获异常处理
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('未捕获的异常', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('未处理的Promise拒绝', reason);
  process.exit(1);
});
