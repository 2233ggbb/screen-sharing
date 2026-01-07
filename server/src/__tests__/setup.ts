/**
 * Jest测试环境设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';
process.env.LOG_DIR = './logs/test';

// Mock nanoid
let counter = 0;
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => {
    counter++;
    return `test-id-${counter.toString().padStart(15, '0')}`;
  }),
  customAlphabet: jest.fn((alphabet: string, size: number) => {
    let localCounter = 0;
    return jest.fn(() => {
      localCounter++;
      // 生成指定长度的字符串
      const chars = alphabet.split('');
      let result = '';
      for (let i = 0; i < size; i++) {
        result += chars[(localCounter + i) % chars.length];
      }
      return result;
    });
  }),
}));

// 模拟Winston Logger以避免在测试中输出日志
jest.mock('../utils/logger', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return {
    logger: mockLogger,
    Logger: jest.fn().mockImplementation(() => mockLogger),
  };
});
