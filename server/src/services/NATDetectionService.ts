/**
 * NAT 类型检测服务
 * 通过多端口 STUN 测试，检测客户端的 NAT 类型
 */

import dgram from 'dgram';
import { Logger } from '../utils/logger';

export interface NATDetectionResult {
  type: 'full-cone' | 'restricted-cone' | 'port-restricted-cone' | 'symmetric';
  canP2P: boolean;
  confidence: number; // 0-100
  publicAddress: { ip: string; port: number };
  recommendation: string;
  requiresSync: boolean; // 是否需要启用协调服务
}

export class NATDetectionService {
  private logger: Logger;
  private sockets: Map<number, dgram.Socket> = new Map();

  // 三个测试端口
  private readonly PRIMARY_PORT = 3478;
  private readonly SECONDARY_PORT = 3479;
  private readonly TEST_PORT = 3480;

  constructor() {
    this.logger = new Logger('NATDetection');
    this.initializeSockets();
  }

  /**
   * 初始化 UDP 测试端口
   */
  private initializeSockets(): void {
    const ports = [this.PRIMARY_PORT, this.SECONDARY_PORT, this.TEST_PORT];

    ports.forEach((port) => {
      try {
        const socket = dgram.createSocket('udp4');
        socket.bind(port);
        this.sockets.set(port, socket);
        this.logger.info(`NAT 检测服务监听端口 ${port}`);
      } catch (error) {
        this.logger.error(`端口 ${port} 绑定失败`, error);
      }
    });
  }

  /**
   * 简化版 NAT 检测（基于 HTTP 请求）
   * 由于 Web 环境无法直接发送 UDP，我们通过客户端 IP 推断
   */
  async detectNATTypeSimple(clientIp: string): Promise<NATDetectionResult> {
    this.logger.info(`开始检测 NAT 类型（简化版）: ${clientIp}`);

    // 基于客户端 IP 特征进行推断
    // 注意：这是简化版，生产环境建议使用完整的 STUN 测试

    // 检查是否为私有地址（可能在 NAT 后）
    const isPrivate = this.isPrivateIP(clientIp);

    if (!isPrivate) {
      // 公网 IP，不需要 NAT 穿透
      return {
        type: 'full-cone',
        canP2P: true,
        confidence: 100,
        publicAddress: { ip: clientIp, port: 0 },
        recommendation: '✅ 检测到公网 IP，P2P 连接成功率极高。',
        requiresSync: false,
      };
    }

    // 默认假设为端口受限型 NAT（最常见的情况）
    // 实际环境中可以通过客户端发送 UDP 包进行精确检测
    return {
      type: 'port-restricted-cone',
      canP2P: true,
      confidence: 70,
      publicAddress: { ip: clientIp, port: 0 },
      recommendation:
        '⚠️ 检测到 NAT 环境，预计为端口受限型。\n系统将启用连接协调模式以提高成功率。',
      requiresSync: true, // 启用协调模式
    };
  }

  /**
   * 判断是否为私有 IP
   */
  private isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);

    if (parts.length !== 4) return false;

    // 10.0.0.0/8
    if (parts[0] === 10) return true;

    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 127.0.0.0/8 (localhost)
    if (parts[0] === 127) return true;

    return false;
  }

  /**
   * 完整版 NAT 检测（需要客户端配合发送 UDP 包）
   * 这里提供接口，实际实现需要客户端通过 WebRTC Data Channel 发送测试数据
   */
  async detectNATTypeFull(
    clientIp: string,
    clientPort: number
  ): Promise<NATDetectionResult> {
    this.logger.info(`开始完整 NAT 检测: ${clientIp}:${clientPort}`);

    try {
      // 测试 1: 从主端口获取映射
      const mapping1 = await this.waitForClientPacket(this.PRIMARY_PORT, 5000);

      // 测试 2: 从辅助端口获取映射
      const mapping2 = await this.waitForClientPacket(
        this.SECONDARY_PORT,
        5000
      );

      // 测试 3: 端口限制测试
      const receivedFromDifferentPort = await this.testPortRestriction(
        mapping1.ip,
        mapping1.port
      );

      // 分析结果
      return this.analyzeResults(mapping1, mapping2, receivedFromDifferentPort);
    } catch (error) {
      this.logger.error('完整 NAT 检测失败，降级到简化版', error);
      return this.detectNATTypeSimple(clientIp);
    }
  }

  /**
   * 等待客户端发送测试包
   */
  private async waitForClientPacket(
    port: number,
    timeout: number
  ): Promise<{ ip: string; port: number }> {
    return new Promise((resolve, reject) => {
      const socket = this.sockets.get(port);
      if (!socket) {
        return reject(new Error(`端口 ${port} 未初始化`));
      }

      const timer = setTimeout(() => {
        socket.removeListener('message', messageHandler);
        reject(new Error('等待客户端包超时'));
      }, timeout);

      const messageHandler = (msg: Buffer, rinfo: dgram.RemoteInfo) => {
        clearTimeout(timer);
        socket.removeListener('message', messageHandler);

        this.logger.debug(`收到客户端包 (端口 ${port})`, {
          ip: rinfo.address,
          port: rinfo.port,
        });

        resolve({
          ip: rinfo.address,
          port: rinfo.port,
        });
      };

      socket.on('message', messageHandler);
    });
  }

  /**
   * 测试端口限制
   */
  private async testPortRestriction(
    mappedIp: string,
    mappedPort: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const testSocket = this.sockets.get(this.TEST_PORT);
      if (!testSocket) {
        return resolve(false);
      }

      const testData = Buffer.from('PORT-RESTRICTION-TEST');
      let received = false;

      const replyHandler = (msg: Buffer) => {
        if (msg.toString().includes('TEST-REPLY')) {
          received = true;
        }
      };

      testSocket.once('message', replyHandler);

      testSocket.send(testData, mappedPort, mappedIp, (err) => {
        if (err) {
          this.logger.warn('端口限制测试发送失败', err);
        }

        setTimeout(() => {
          testSocket.removeListener('message', replyHandler);
          resolve(received);
        }, 1000);
      });
    });
  }

  /**
   * 分析检测结果
   */
  private analyzeResults(
    mapping1: { ip: string; port: number },
    mapping2: { ip: string; port: number },
    receivedFromDifferentPort: boolean
  ): NATDetectionResult {
    const isSameIP = mapping1.ip === mapping2.ip;
    const isSamePort = mapping1.port === mapping2.port;

    // 对称型 NAT
    if (isSameIP && !isSamePort) {
      return {
        type: 'symmetric',
        canP2P: false,
        confidence: 90,
        publicAddress: mapping1,
        recommendation:
          '❌ 检测到对称型 NAT，无法建立 P2P 连接。\n建议：使用手机热点或其他网络，或部署 TURN 服务器。',
        requiresSync: false,
      };
    }

    // 完全锥型 NAT
    if (isSameIP && isSamePort && receivedFromDifferentPort) {
      return {
        type: 'full-cone',
        canP2P: true,
        confidence: 95,
        publicAddress: mapping1,
        recommendation: '✅ 完全锥型 NAT，P2P 连接成功率极高（95%+）。',
        requiresSync: false,
      };
    }

    // 端口受限锥型 NAT
    if (isSameIP && isSamePort && !receivedFromDifferentPort) {
      return {
        type: 'port-restricted-cone',
        canP2P: true,
        confidence: 60,
        publicAddress: mapping1,
        recommendation:
          '⚠️ 端口受限型 NAT，P2P 可能成功（60%）。\n系统将启用连接协调模式以提高成功率。',
        requiresSync: true,
      };
    }

    // 默认：受限锥型
    return {
      type: 'restricted-cone',
      canP2P: true,
      confidence: 80,
      publicAddress: mapping1,
      recommendation: '✅ 受限锥型 NAT，P2P 连接成功率较高（80%+）。',
      requiresSync: false,
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.sockets.forEach((socket, port) => {
      socket.close();
      this.logger.info(`关闭端口 ${port}`);
    });
    this.sockets.clear();
  }
}
