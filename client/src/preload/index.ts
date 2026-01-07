import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的API到渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 获取桌面捕获源（屏幕、窗口）
  getDesktopSources: (options: Electron.SourcesOptions) => 
    ipcRenderer.invoke('get-desktop-sources', options),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});

// 类型定义
export interface ElectronAPI {
  getDesktopSources: (options: Electron.SourcesOptions) => Promise<Electron.DesktopCapturerSource[]>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
