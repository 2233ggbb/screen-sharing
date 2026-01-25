import { logger } from '../../utils/logger';

export interface DesktopSource {
  id: string;
  name: string;
  thumbnail: string;
  display_id?: string;
  appIcon?: string;
}

export interface CaptureOptions {
  /** 是否捕获系统音频 */
  captureAudio?: boolean;
}

/**
 * 屏幕捕获服务
 */
export class ScreenCaptureService {
  private currentStream: MediaStream | null = null;

  /**
   * 获取可用的屏幕和窗口源
   */
  async getSources(): Promise<DesktopSource[]> {
    try {
      // 浏览器环境支持
      if (!('electron' in window)) {
        return [{
          id: 'browser-screen',
          name: '浏览器屏幕共享',
          thumbnail: '', // 浏览器无法获取缩略图
        }];
      }

      type ElectronDesktopSource = {
        id: string;
        name: string;
        thumbnail: { toDataURL: () => string };
        display_id?: string;
        appIcon?: { toDataURL: () => string };
      };

      type ElectronApi = {
        getDesktopSources: (opts: {
          types: Array<'screen' | 'window'>;
          thumbnailSize: { width: number; height: number };
        }) => Promise<ElectronDesktopSource[]>;
      };

      const electronApi = (window as unknown as { electron?: ElectronApi }).electron;
      if (!electronApi) {
        return [{
          id: 'browser-screen',
          name: '浏览器屏幕共享',
          thumbnail: '',
        }];
      }

      const sources = await electronApi.getDesktopSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 300, height: 200 },
      });

      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
        display_id: source.display_id,
        appIcon: source.appIcon?.toDataURL(),
      }));
    } catch (error) {
      logger.error('获取桌面源失败:', error);
      throw error;
    }
  }

  /**
   * 从指定源创建媒体流
   * @param sourceId - 屏幕源ID
   * @param options - 捕获选项，包括是否捕获系统音频
   */
  async getStreamFromSource(
    sourceId: string,
    options: CaptureOptions = {}
  ): Promise<MediaStream> {
    const { captureAudio = false } = options;

    // 停止之前的流
    this.stopCurrentStream();

    type ElectronDesktopMandatoryConstraints = {
      mandatory: {
        chromeMediaSource: 'desktop';
        chromeMediaSourceId: string;
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
        minFrameRate?: number;
        maxFrameRate?: number;
      };
    };

    type ElectronDesktopTrackConstraints = MediaTrackConstraints & ElectronDesktopMandatoryConstraints;

    const getErrorName = (err: unknown): string | undefined => {
      if (typeof err === 'object' && err !== null && 'name' in err) {
        const name = (err as { name?: unknown }).name;
        return typeof name === 'string' ? name : undefined;
      }
      return undefined;
    };

    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message;
      if (typeof err === 'object' && err !== null && 'message' in err) {
        const message = (err as { message?: unknown }).message;
        return typeof message === 'string' ? message : String(err);
      }
      return String(err);
    };

    const isAudioStartError = (err: unknown): boolean => {
      const name = getErrorName(err);
      const message = getErrorMessage(err);
      return name === 'NotReadableError' || message.includes('Could not start audio source');
    };

    const createStream = async (withAudio: boolean): Promise<MediaStream> => {
      // 浏览器环境
      if (!('electron' in window)) {
        return await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: withAudio,
        });
      }

      // Electron 环境
      // 说明：系统音频捕获在 macOS 上通常不可用（需虚拟声卡/额外能力），因此上层可能会降级为仅视频。
      const audioConstraints: ElectronDesktopTrackConstraints | false = withAudio
        ? {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
            },
          }
        : false;

      const videoConstraints: ElectronDesktopTrackConstraints = {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080,
          minFrameRate: 15,
          maxFrameRate: 30,
        },
      };

      return await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: videoConstraints,
      });
    };

    const captureAudioRequested = captureAudio;
    let captureAudioUsed = captureAudio;

    let stream: MediaStream;

    try {
      stream = await createStream(captureAudioRequested);
    } catch (error) {
      // 常见场景：开启“共享系统音频”后，音频源无法启动（macOS / 无可用设备 / 被占用）
      if (captureAudioRequested && isAudioStartError(error)) {
        captureAudioUsed = false;
        logger.warn('系统音频捕获失败，已降级为仅视频:', {
          sourceId,
          errorName: getErrorName(error),
          errorMessage: getErrorMessage(error),
        });
        stream = await createStream(false);
      } else {
        logger.error('获取屏幕流失败:', error);
        throw error;
      }
    }

    this.currentStream = stream;
    logger.info('成功获取屏幕流:', {
      sourceId,
      captureAudioRequested,
      captureAudioUsed,
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
    });

    return stream;
  }

  /**
   * 停止当前流
   */
  stopCurrentStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        track.stop();
        logger.debug('停止track:', track.kind);
      });
      this.currentStream = null;
      logger.info('屏幕流已停止');
    }
  }

  /**
   * 获取当前流
   */
  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  /**
   * 调整流质量
   */
  async adjustStreamQuality(
    stream: MediaStream,
    options: {
      width?: number;
      height?: number;
      frameRate?: number;
    }
  ): Promise<void> {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      logger.warn('没有视频轨道');
      return;
    }

    try {
      await videoTrack.applyConstraints({
        width: options.width,
        height: options.height,
        frameRate: options.frameRate,
      });
      logger.info('调整流质量成功:', options);
    } catch (error) {
      logger.error('调整流质量失败:', error);
      throw error;
    }
  }

  /**
   * 获取流统计信息
   */
  getStreamStats(stream: MediaStream): {
    videoTracks: number;
    audioTracks: number;
    videoSettings?: MediaTrackSettings;
  } {
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    return {
      videoTracks: videoTracks.length,
      audioTracks: audioTracks.length,
      videoSettings: videoTracks[0]?.getSettings(),
    };
  }
}

// 导出单例
export const screenCaptureService = new ScreenCaptureService();
