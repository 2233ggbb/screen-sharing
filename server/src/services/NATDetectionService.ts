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
    // 注意：简化检测不需要监听 UDP 端口。
    // 为避免与 STUN/TURN（常用 3478）等服务端口冲突，UDP 测试端口改为按需初始化。
  }

  /**
   * 初始化 UDP 测试端口（仅用于完整版检测）
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
   * 确保 UDP 测试端口已初始化（仅供 detectNATTypeFull 使用）
   */
  private ensureSocketsInitialized(): void {
    if (this.sockets.size > 0) return;
    this.initializeSockets();
  }

  /**
   * 简化版 NAT 检测（基于 Socket 连接信息）
   *
   * 重要说明：
   * - 仅凭服务端看到的 clientIp 很难准确判断 NAT 类型（尤其是存在反向代理/IPv6 映射时）。
   * - 该方法只用于给用户提供“粗略提示”，不能据此改变关键连接时序。
   * - 为避免误判导致连接成功率下降：简化检测不再默认启用候选“协调缓存”模式。
   */
  async detectNATTypeSimple(clientIp: string): Promise<NATDetectionResult> {
    const normalizedIp = this.normalizeClientIp(clientIp);
    this.logger.info(`开始检测 NAT 类型（简化版）: ${clientIp} -> ${normalizedIp}`);

    // 基于客户端 IP 特征进行推断（仅供提示）
    const isPrivate = this.isPrivateIP(normalizedIp);

    if (!isPrivate) {
      // 公网 IP（或服务端判断为非私网），大概率不需要 NAT 穿透
      return {
        type: 'full-cone',
        canP2P: true,
        confidence: 90,
        publicAddress: { ip: normalizedIp, port: 0 },
        recommendation: '✅ 检测到非私网地址，P2P 连接成功率较高。',
        requiresSync: false,
      };
    }

    // 私网地址：说明存在 NAT/代理环境，但无法进一步区分 restricted/port-restricted/symmetric
    // 为避免误判引入额外时序干预，这里仅做提示，不启用协调缓存。
    return {
      type: 'port-restricted-cone',
      canP2P: true,
      confidence: 50,
      publicAddress: { ip: normalizedIp, port: 0 },
      recommendation:
        '⚠️ 检测到私网地址，可能处于 NAT/代理环境。\n将使用标准 Trickle ICE 进行打洞（不启用候选缓存协调）。\n如连接失败，建议切换网络或部署 TURN。',
      requiresSync: false,
    };
  }

  /**
   * 规范化服务端看到的客户端 IP
   * - 处理 Socket.IO 常见的 ::ffff:IPv4 映射
   * - 去掉可能的端口（极端情况下）
   */
  private normalizeClientIp(ip: string): string {
    const withoutPort = ip.includes(':') && ip.includes('.') ? ip : ip.split(':')[0];
    if (withoutPort.startsWith('::ffff:')) {
      return withoutPort.replace('::ffff:', '');
    }
    return withoutPort;
  }

  /**
   * 判断是否为私有 IP
   * - 支持 IPv4 私网段
   * - 对 IPv6 做最小判断（ULA/link-local/loopback）
   */
  private isPrivateIP(ip: string): boolean {
    // IPv6
    if (ip.includes(':')) {
      const lower = ip.toLowerCase();
      if (lower === '::1') return true;
      if (lower.startsWith('fe80:')) return true; // link-local
      if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
      return false;
    }

    // IPv4
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;

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

    // 完整检测需要 UDP 端口监听，按需初始化以避免启动时端口冲突
    this.ensureSocketsInitialized();

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
