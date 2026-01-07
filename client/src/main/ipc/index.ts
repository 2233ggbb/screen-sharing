import { BrowserWindow, ipcMain, desktopCapturer } from 'electron';

/**
 * 设置IPC处理器
 */
export function setupIpcHandlers(mainWindow: BrowserWindow) {
  // 获取屏幕和窗口源
  ipcMain.handle('get-desktop-sources', async (event, options) => {
    try {
      const sources = await desktopCapturer.getSources(options);
      return sources;
    } catch (error) {
      console.error('获取桌面源失败:', error);
      throw error;
    }
  });

  // 最小化窗口
  ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
  });

  // 最大化/还原窗口
  ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  });

  // 关闭窗口
  ipcMain.handle('close-window', () => {
    mainWindow.close();
  });

  // 获取应用版本
  ipcMain.handle('get-app-version', () => {
    return require('../../package.json').version;
  });
}
