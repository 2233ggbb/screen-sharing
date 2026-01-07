/**
 * 配置模块单元测试
 */

import { getConfig, config } from '../../config';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 重置环境变量
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('应该返回默认配置', () => {
      const config = getConfig();
      
      expect(config).toBeDefined();
      expect(config.port).toBe(3001); // 从setup.ts中设置的PORT
      expect(config.env).toBe('test');
      expect(config.cors).toBeDefined();
      expect(config.log).toBeDefined();
      expect(config.room).toBeDefined();
      expect(config.socket).toBeDefined();
    });

    it('应该从环境变量读取端口', () => {
      process.env.PORT = '4000';
      const config = getConfig();
      
      expect(config.port).toBe(4000);
    });

    it('应该从环境变量读取环境', () => {
      process.env.NODE_ENV = 'production';
      const config = getConfig();
      
      expect(config.env).toBe('production');
    });

    it('应该在开发环境使用debug日志级别', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.LOG_LEVEL; // 确保使用默认值
      const config = getConfig();
      
      expect(config.log.level).toBe('debug');
    });

    it('应该在生产环境使用warn日志级别', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL; // 确保使用默认值
      const config = getConfig();
      
      expect(config.log.level).toBe('warn');
    });

    it('应该从环境变量读取日志级别', () => {
      process.env.LOG_LEVEL = 'info';
      const config = getConfig();
      
      expect(config.log.level).toBe('info');
    });

    it('应该从环境变量读取日志目录', () => {
      process.env.LOG_DIR = '/custom/logs';
      const config = getConfig();
      
      expect(config.log.directory).toBe('/custom/logs');
    });

    it('应该从环境变量读取CORS源', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      const config = getConfig();
      
      expect(config.cors.origin).toBe('https://example.com');
    });

    it('应该在开发环境允许所有CORS源', () => {
      process.env.NODE_ENV = 'development';
      const config = getConfig();
      
      expect(config.cors.origin).toBe('*');
    });

    it('应该从环境变量读取房间最大成员数', () => {
      process.env.ROOM_MAX_MEMBERS = '20';
      const config = getConfig();
      
      expect(config.room.maxMembers).toBe(20);
    });

    it('应该包含房间配置', () => {
      const config = getConfig();
      
      expect(config.room.idLength).toBe(6); // 从ROOM_CONSTANTS.ROOM_ID_LENGTH
      expect(config.room.autoCleanupInterval).toBe(60000);
    });

    it('应该包含Socket.io配置', () => {
      const config = getConfig();
      
      expect(config.socket.pingTimeout).toBe(30000);
      expect(config.socket.pingInterval).toBe(25000);
      expect(config.socket.maxHttpBufferSize).toBe(1e8);
    });

    it('应该包含CORS credentials配置', () => {
      const config = getConfig();
      
      expect(config.cors.credentials).toBe(true);
    });
  });

  describe('config实例', () => {
    it('应该导出默认配置实例', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
  });
});
