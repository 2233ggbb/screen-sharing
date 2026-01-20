/**
 * NAT 类型检测客户端
 * 在加入房间前检测 NAT 类型，提前告知用户连接可行性
 */

import { Modal } from 'antd';
import { ServerEvents, ClientEvents } from '@shared/events';
import { logger } from '../utils/logger';
import React from 'react';

export interface NATDetectionResult {
  type: 'full-cone' | 'restricted-cone' | 'port-restricted-cone' | 'symmetric';
  canP2P: boolean;
  confidence: number;
  publicAddress: { ip: string; port: number };
  recommendation: string;
  requiresSync: boolean;
}

export class NATDetectionClient {
  constructor() {
    // 使用全局 logger 实例
  }

  /**
   * 检测 NAT 类型
   * @param socket Socket.io 客户端实例
   */
  async detectNATType(socket: any): Promise<NATDetectionResult> {
    logger.info('开始检测 NAT 类型...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        logger.error('NAT 检测超时');
        reject(new Error('NAT 检测超时，请检查网络连接'));
      }, 10000); // 10 秒超时

      // 监听检测结果（只监听一次）
      socket.once(
        ServerEvents.NAT_TYPE_DETECTED,
        (result: NATDetectionResult) => {
          clearTimeout(timeout);
          logger.info('NAT 检测完成', {
            type: result.type,
            canP2P: result.canP2P,
            confidence: result.confidence,
          });

          // 显示检测结果给用户
          this.showDetectionResult(result);

          resolve(result);
        }
      );

      // 发起检测请求
      socket.emit(ClientEvents.DETECT_NAT_TYPE, {
        clientId: this.getClientId(),
      });

      logger.debug('已发送 NAT 检测请求');
    });
  }

  /**
   * 显示检测结果给用户
   */
  private showDetectionResult(result: NATDetectionResult): void {
    const { type, canP2P, confidence, recommendation } = result;
    const natTypeName = this.getNATTypeName(type);

    if (!canP2P) {
      // 无法 P2P - 显示错误提示
      const lines = [
        `NAT 类型: ${natTypeName}`,
        '',
        `检测结果: ${recommendation}`,
        '',
        '您的网络环境无法建立 P2P 连接。',
        '',
        '解决方法:',
        '• 切换到手机热点或家庭宽带',
        '• 避免使用公司/学校网络',
        '• 联系管理员部署 TURN 中继服务器'
      ];

      Modal.error({
        title: '⚠️ 网络环境不兼容',
        content: React.createElement('div', null,
          lines.map((line, i) => React.createElement('div', { key: i }, line || '\u00A0'))
        ),
        okText: '我知道了',
        width: 500,
      });
    } else if (confidence < 70) {
      // 成功率较低 - 显示警告
      const lines = [
        `NAT 类型: ${natTypeName}`,
        '',
        `预计成功率: ${confidence}%`,
        '',
        recommendation,
        '',
        '系统将自动优化连接策略，但仍可能出现连接失败。',
        '如果连接失败，建议切换网络环境。'
      ];

      Modal.warning({
        title: '⚠️ 网络环境提示',
        content: React.createElement('div', null,
          lines.map((line, i) => React.createElement('div', { key: i }, line || '\u00A0'))
        ),
        okText: '继续加入',
        width: 500,
      });
    } else {
      // 成功率高 - 仅日志记录
      logger.info('✅ NAT 检测通过', {
        type,
        confidence: `${confidence}%`,
        recommendation,
      });

      // 显示简短的成功提示
      const lines = [
        `NAT 类型: ${natTypeName}`,
        '',
        `预计成功率: ${confidence}%`
      ];

      Modal.success({
        title: '✅ 网络环境检测通过',
        content: React.createElement('div', null,
          lines.map((line, i) => React.createElement('div', { key: i }, line || '\u00A0'))
        ),
        okText: '继续',
        width: 400,
        duration: 3, // 3 秒后自动关闭
      });
    }
  }

  /**
   * 获取 NAT 类型的中文名称
   */
  private getNATTypeName(type: string): string {
    const names: Record<string, string> = {
      'full-cone': '完全锥型 NAT ✅',
      'restricted-cone': '受限锥型 NAT ✅',
      'port-restricted-cone': '端口受限型 NAT ⚠️',
      symmetric: '对称型 NAT ❌',
    };
    return names[type] || type;
  }

  /**
   * 获取客户端 ID（从本地存储）
   */
  private getClientId(): string {
    const userId = localStorage.getItem('user_id');
    return userId || 'anonymous';
  }

  /**
   * 静默检测（不显示 UI）
   */
  async detectNATTypeSilent(socket: any): Promise<NATDetectionResult> {
    logger.info('开始静默检测 NAT 类型...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('NAT 检测超时'));
      }, 10000);

      socket.once(
        ServerEvents.NAT_TYPE_DETECTED,
        (result: NATDetectionResult) => {
          clearTimeout(timeout);
          logger.info('静默检测完成', { type: result.type });
          resolve(result);
        }
      );

      socket.emit(ClientEvents.DETECT_NAT_TYPE, {
        clientId: this.getClientId(),
      });
    });
  }
}

// 导出单例
export const natDetector = new NATDetectionClient();
