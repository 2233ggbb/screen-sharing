/**
 * 屏幕捕获服务
 * 负责 Android/iOS 屏幕捕获功能
 */

import { NativeModules, Platform, Alert } from 'react-native';
import { mediaDevices, MediaStream } from 'react-native-webrtc';
import { logger } from '../../utils/logger';
import { SCREEN_SHARE_CONFIG } from '../../utils/constants';

const captureLogger = logger.createNamespacedLogger('ScreenCapture');

// 原生模块
const { ScreenCaptureModule } = NativeModules;

// 屏幕捕获配置
export interface CaptureConfig {
  width: number;
  height: number;
  frameRate: number;
}

// 屏幕捕获质量预设
export type CaptureQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export class ScreenCaptureService {
  private currentStream: MediaStream | null = null;
  private isCapturing: boolean = false;

  /**
   * 检查平台是否支持屏幕捕获
   */
  isSupported(): boolean {
    if (Platform.OS === 'android') {
      return Platform.Version >= 21; // Android 5.0+
    }
    if (Platform.OS === 'ios') {
      // iOS ReplayKit 需要 iOS 11+
      return parseInt(Platform.Version as string, 10) >= 11;
    }
    return false;
  }

  /**
   * 检查是否在模拟器中运行
   * 模拟器通常不支持屏幕捕获功能
   */
  private isEmulator(): boolean {
    // Android 模拟器的一些特征
    // 注意：这只是一个简单的检测方法，不一定100%准确
    if (Platform.OS === 'android') {
      const model = (Platform as any).constants?.Model || '';
      const brand = (Platform as any).constants?.Brand || '';
      const fingerprint = (Platform as any).constants?.Fingerprint || '';
      
      // 常见的模拟器特征
      const emulatorIndicators = [
        'sdk',
        'google_sdk',
        'emulator',
        'generic',
        'unknown',
      ];
      
      const lowerModel = model.toLowerCase();
      const lowerBrand = brand.toLowerCase();
      const lowerFingerprint = fingerprint.toLowerCase();
      
      return emulatorIndicators.some(
        (indicator) =>
          lowerModel.includes(indicator) ||
          lowerBrand.includes(indicator) ||
          lowerFingerprint.includes(indicator)
      );
    }
    return false;
  }

  /**
   * 请求屏幕捕获权限（Android）
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      captureLogger.warn('屏幕捕获权限请求仅支持 Android');
      return false;
    }

    if (!ScreenCaptureModule) {
      captureLogger.error('ScreenCaptureModule 未找到');
      // 检测是否在模拟器中
      if (this.isEmulator()) {
        Alert.alert(
          '模拟器不支持',
          '屏幕共享功能在 Android 模拟器上不可用，请使用真机测试。\n\n移动端作为观看者仍可正常观看其他用户的屏幕共享。',
          [{ text: '我知道了' }]
        );
      }
      return false;
    }

    try {
      captureLogger.info('请求屏幕捕获权限...');
      const granted = await ScreenCaptureModule.requestScreenCapturePermission();
      captureLogger.info('屏幕捕获权限:', granted ? '已授权' : '已拒绝');
      return granted;
    } catch (error) {
      captureLogger.error('请求屏幕捕获权限失败:', error);
      return false;
    }
  }

  /**
   * 开始屏幕捕获
   */
  async startCapture(
    quality: CaptureQuality = 'MEDIUM'
  ): Promise<MediaStream | null> {
    if (!this.isSupported()) {
      captureLogger.error('当前平台不支持屏幕捕获');
      Alert.alert('不支持', '当前设备不支持屏幕共享功能');
      return null;
    }

    if (this.isCapturing) {
      captureLogger.warn('屏幕捕获已在进行中');
      return this.currentStream;
    }

    // 获取配置
    const config = SCREEN_SHARE_CONFIG[quality];
    captureLogger.info('开始屏幕捕获:', config);

    try {
      // Android 需要先请求权限
      if (Platform.OS === 'android') {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) {
          captureLogger.error('屏幕捕获权限被拒绝');
          Alert.alert('权限被拒绝', '需要屏幕录制权限才能共享屏幕');
          return null;
        }
      }

      // 获取屏幕流
      const stream = await (mediaDevices as any).getDisplayMedia({
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          frameRate: { ideal: config.frameRate },
        },
        audio: false,
      });

      this.currentStream = stream;
      this.isCapturing = true;

      captureLogger.info('屏幕捕获已开始');

      // 监听流结束事件
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          captureLogger.info('屏幕捕获已被用户停止');
          this.stopCapture();
        };
      }

      return stream;
    } catch (error: any) {
      captureLogger.error('开始屏幕捕获失败:', error);

      if (error.name === 'NotAllowedError') {
        Alert.alert('权限被拒绝', '用户取消了屏幕共享');
      } else {
        Alert.alert('错误', '启动屏幕共享失败，请重试');
      }

      return null;
    }
  }

  /**
   * 使用自定义配置开始屏幕捕获
   */
  async startCaptureWithConfig(config: CaptureConfig): Promise<MediaStream | null> {
    if (!this.isSupported()) {
      captureLogger.error('当前平台不支持屏幕捕获');
      return null;
    }

    if (this.isCapturing) {
      captureLogger.warn('屏幕捕获已在进行中');
      return this.currentStream;
    }

    try {
      // Android 需要先请求权限
      if (Platform.OS === 'android') {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) {
          return null;
        }
      }

      const stream = await (mediaDevices as any).getDisplayMedia({
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          frameRate: { ideal: config.frameRate },
        },
        audio: false,
      });

      this.currentStream = stream;
      this.isCapturing = true;

      return stream;
    } catch (error) {
      captureLogger.error('开始屏幕捕获失败:', error);
      return null;
    }
  }

  /**
   * 停止屏幕捕获
   */
  stopCapture(): void {
    if (!this.isCapturing || !this.currentStream) {
      captureLogger.warn('没有正在进行的屏幕捕获');
      return;
    }

    captureLogger.info('停止屏幕捕获');

    // 停止所有轨道
    this.currentStream.getTracks().forEach((track: any) => {
      track.stop();
    });

    this.currentStream = null;
    this.isCapturing = false;

    captureLogger.info('屏幕捕获已停止');
  }

  /**
   * 获取当前屏幕流
   */
  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  /**
   * 获取捕获状态
   */
  getIsCapturing(): boolean {
    return this.isCapturing;
  }

  /**
   * 切换捕获质量
   */
  async switchQuality(quality: CaptureQuality): Promise<MediaStream | null> {
    if (!this.isCapturing) {
      captureLogger.warn('没有正在进行的屏幕捕获');
      return null;
    }

    // 先停止当前捕获
    this.stopCapture();

    // 使用新质量重新开始
    return this.startCapture(quality);
  }
}

// 导出单例
export const screenCaptureService = new ScreenCaptureService();
