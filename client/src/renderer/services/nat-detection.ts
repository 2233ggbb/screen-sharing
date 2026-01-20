/**
 * NAT 类型检测客户端
 * 在加入房间前检测 NAT 类型，提前告知用户连接可行性
 */

import { Modal } from 'antd';
import { ServerEvents, ClientEvents } from '@screen-sharing/shared';
import { Logger } from '../utils/logger';

export interface NATDetectionResult {
  type: 'full-cone' | 'restricted-cone' | 'port-restricted-cone' | 'symmetric';
  canP2P: boolean;
  confidence: number;
  publicAddress: { ip: string; port: number };
  recommendation: string;
  requiresSync: boolean;
}

export class NATDetectionClient {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('NATDetection');
  }

  /**
   * 检测 NAT 类型
   * @param socket Socket.io 客户端实例
   */
  async detectNATType(socket: any): Promise<NATDetectionResult> {
    this.logger.info('开始检测 NAT 类型...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.logger.error('NAT 检测超时');
        reject(new Error('NAT 检测超时，请检查网络连接'));
      }, 10000); // 10 秒超时

      // 监听检测结果（只监听一次）
      socket.once(
        ServerEvents.NAT_TYPE_DETECTED,
        (result: NATDetectionResult) => {
          clearTimeout(timeout);
          this.logger.info('NAT 检测完成', {
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

      this.logger.debug('已发送 NAT 检测请求');
    });
  }

  /**
   * 显示检测结果给用户
   */
  private showDetectionResult(result: NATDetectionResult): void {
    const { type, canP2P, confidence, recommendation } = result;

    if (!canP2P) {
      // 无法 P2P - 显示错误提示
      Modal.error({
        title: '⚠️ 网络环境不兼容',
        content: (
          <div>
            <p>
              <strong>NAT 类型：</strong>
              {this.getNATTypeName(type)}
            </p>
            <p>
              <strong>检测结果：</strong>
              <span style={{ color: '#ff4d4f' }}>{recommendation}</span>
            </p>
            <p style={{ marginTop: 16 }}>
              您的网络环境无法建立 P2P 连接。
              <br />
              <br />
              <strong>解决方法：</strong>
              <br />
              • 切换到手机热点或家庭宽带
              <br />
              • 避免使用公司/学校网络
              <br />
              • 联系管理员部署 TURN 中继服务器
              <br />
            </p>
          </div>
        ),
        okText: '我知道了',
        width: 500,
      });
    } else if (confidence < 70) {
      // 成功率较低 - 显示警告
      Modal.warning({
        title: '⚠️ 网络环境提示',
        content: (
          <div>
            <p>
              <strong>NAT 类型：</strong>
              {this.getNATTypeName(type)}
            </p>
            <p>
              <strong>预计成功率：</strong>
              <span style={{ color: '#faad14' }}>{confidence}%</span>
            </p>
            <p style={{ marginTop: 8 }}>{recommendation}</p>
            <p style={{ marginTop: 16, color: '#8c8c8c' }}>
              系统将自动优化连接策略，但仍可能出现连接失败。
              <br />
              如果连接失败，建议切换网络环境。
            </p>
          </div>
        ),
        okText: '继续加入',
        width: 500,
      });
    } else {
      // 成功率高 - 仅日志记录
      this.logger.info('✅ NAT 检测通过', {
        type,
        confidence: `${confidence}%`,
        recommendation,
      });

      // 显示简短的成功提示
      Modal.success({
        title: '✅ 网络环境检测通过',
        content: (
          <div>
            <p>
              <strong>NAT 类型：</strong>
              {this.getNATTypeName(type)}
            </p>
            <p>
              <strong>预计成功率：</strong>
              <span style={{ color: '#52c41a' }}>{confidence}%</span>
            </p>
          </div>
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
    this.logger.info('开始静默检测 NAT 类型...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('NAT 检测超时'));
      }, 10000);

      socket.once(
        ServerEvents.NAT_TYPE_DETECTED,
        (result: NATDetectionResult) => {
          clearTimeout(timeout);
          this.logger.info('静默检测完成', { type: result.type });
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
