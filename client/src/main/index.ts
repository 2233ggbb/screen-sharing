import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc';

// 是否为开发模式
const isDev = process.env.NODE_ENV === 'development';

// 修复 Windows WGC "Source is not capturable" 问题
// 禁用 Chromium 的内容保护,允许窗口被 Windows Graphics Capture API 捕获
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');
app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
// 允许窗口内容被屏幕捕获
app.commandLine.appendSwitch('disable-gpu-sandbox');

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
    // 确保窗口在任务栏可见,有助于屏幕捕获 API 正确识别
    skipTaskbar: false,
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 设置窗口内容可以被捕获（修复 Windows WGC 黑屏问题）
  // 必须在窗口创建后设置,允许屏幕共享 API 捕获此窗口
  mainWindow.setContentProtection(false);

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
