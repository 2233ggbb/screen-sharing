/**
 * Logger单元测试
 */

import { Logger } from '../../utils/logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestContext');
  });

  describe('constructor', () => {
    it('应该创建Logger实例', () => {
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
    });

    it('应该设置context', () => {
      const customLogger = new Logger('CustomContext');
      expect(customLogger).toBeDefined();
    });
  });

  describe('debug', () => {
    it('应该调用debug方法', () => {
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    it('应该接受额外的元数据', () => {
      expect(() => logger.debug('Debug with meta', { key: 'value' })).not.toThrow();
    });
  });

  describe('info', () => {
    it('应该调用info方法', () => {
      expect(() => logger.info('Info message')).not.toThrow();
    });

    it('应该接受额外的元数据', () => {
      expect(() => logger.info('Info with meta', { userId: 123 })).not.toThrow();
    });
  });

  describe('warn', () => {
    it('应该调用warn方法', () => {
      expect(() => logger.warn('Warning message')).not.toThrow();
    });

    it('应该接受额外的元数据', () => {
      expect(() => logger.warn('Warning with meta', { warning: true })).not.toThrow();
    });
  });

  describe('error', () => {
    it('应该调用error方法', () => {
      expect(() => logger.error('Error message')).not.toThrow();
    });

    it('应该接受Error对象', () => {
      const error = new Error('Test error');
      expect(() => logger.error('Error occurred', error)).not.toThrow();
    });

    it('应该接受额外的元数据', () => {
      const error = new Error('Test error');
      expect(() => logger.error('Error with meta', error, { critical: true })).not.toThrow();
    });

    it('应该处理非Error对象', () => {
      expect(() => logger.error('Error', { code: 'E001' })).not.toThrow();
    });
  });
});
