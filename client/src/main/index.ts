import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc';

// 是否为开发模式
const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

/**
 * 创建主窗口
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      // 生产环境需要关闭 webSecurity 以允许 file:// 协议加载 ES 模块
      // 这在桌面应用中是安全的,因为只加载本地文件且已启用 contextIsolation
      webSecurity: isDev,
    },
    show: false,
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 监听渲染进程的控制台消息,便于调试打包后的问题
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer Console ${level}]:`, message, `at ${sourceId}:${line}`);
  });

  // 监听加载失败事件
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境加载本地文件
    const indexPath = path.join(__dirname, '../renderer/index.html');
    console.log('Loading file from:', indexPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
    });
  }

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 设置IPC处理器
  setupIpcHandlers(mainWindow);
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOS系统点击dock图标重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 退出前清理
app.on('before-quit', () => {
  // 清理资源
});

export { mainWindow };
