/**
 * 错误处理中间件单元测试
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
    };

    mockResponse = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('应该处理标准错误', () => {
      const error = new Error('测试错误');
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '测试错误',
        },
      });
    });

    it('应该使用自定义状态码', () => {
      const error = new Error('自定义错误');
      mockResponse.statusCode = 400;
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('应该在开发环境包含堆栈信息', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('开发错误');
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          message: '开发错误',
          stack: expect.any(String),
        }),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('应该处理没有消息的错误', () => {
      const error = new Error();
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '服务器内部错误',
        },
      });
    });
  });

  describe('notFoundHandler', () => {
    it('应该处理404错误', () => {
      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '未找到路由: GET /test',
        },
      });
    });

    it('应该包含请求方法和URL', () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      
      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '未找到路由: POST /api/users',
        },
      });
    });
  });
});
