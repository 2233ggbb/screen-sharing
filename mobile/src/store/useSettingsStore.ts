/**
 * 设置状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 分辨率选项
export type Resolution = '720p' | '1080p' | '1440p' | '2160p';

// 帧率选项
export type FrameRate = 15 | 24 | 30 | 60;

// 主题选项
export type Theme = 'light' | 'dark';

interface SettingsState {
  // 网络设置
  serverUrl: string;

  // 视频设置
  defaultResolution: Resolution;
  defaultFrameRate: FrameRate;
  hardwareAcceleration: boolean;

  // 外观设置
  theme: Theme;

  // Actions
  setServerUrl: (url: string) => void;
  setDefaultResolution: (resolution: Resolution) => void;
  setDefaultFrameRate: (frameRate: FrameRate) => void;
  setHardwareAcceleration: (enabled: boolean) => void;
  setTheme: (theme: Theme) => void;
  resetToDefaults: () => void;
}

// 默认服务器地址
const DEFAULT_SERVER_URL = __DEV__
  ? 'http://10.0.2.2:3000'
  : 'https://your-production-server.com';

const defaultSettings = {
  serverUrl: DEFAULT_SERVER_URL,
  defaultResolution: '1080p' as Resolution,
  defaultFrameRate: 30 as FrameRate,
  hardwareAcceleration: true,
  theme: 'dark' as Theme,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setServerUrl: (serverUrl: string) => set({ serverUrl }),

      setDefaultResolution: (defaultResolution: Resolution) =>
        set({ defaultResolution }),

      setDefaultFrameRate: (defaultFrameRate: FrameRate) =>
        set({ defaultFrameRate }),

      setHardwareAcceleration: (hardwareAcceleration: boolean) =>
        set({ hardwareAcceleration }),

      setTheme: (theme: Theme) => set({ theme }),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// 导出默认值供其他模块使用
export const getDefaultServerUrl = () => DEFAULT_SERVER_URL;
