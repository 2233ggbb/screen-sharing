/**
 * 开发环境配置快捷方式
 * 用于快速切换不同的服务器环境
 */

export const DEV_SERVERS = {
  LOCAL: 'http://localhost:3000',
  RENDER: 'https://your-app-name.onrender.com', // 替换为你的实际 Render URL
  NGROK: '', // 每次使用 ngrok 时填入临时 URL
} as const;

/**
 * 快速切换到指定服务器
 * 用法：在浏览器控制台输入：
 *
 * import { switchServer } from './utils/dev-config';
 * switchServer('LOCAL');  // 切换到本地
 * switchServer('RENDER'); // 切换到 Render
 */
export function switchServer(env: keyof typeof DEV_SERVERS): void {
  const url = DEV_SERVERS[env];
  if (!url) {
    console.error(`服务器地址为空: ${env}`);
    return;
  }

  localStorage.setItem('server_url', url);
  console.log(`✅ 已切换到 ${env} 服务器: ${url}`);
  console.log('⚠️ 请刷新页面使配置生效');
}

/**
 * 显示当前服务器配置
 */
export function showCurrentServer(): void {
  const current = localStorage.getItem('server_url') || 'http://localhost:3000';
  console.log(`当前服务器: ${current}`);
}

// 开发模式下暴露到全局
const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false;
if (isDev) {
  (window as any).switchServer = switchServer;
  (window as any).showCurrentServer = showCurrentServer;
  console.log('🛠️ 开发工具已加载：');
  console.log('  - switchServer("LOCAL")  切换到本地服务器');
  console.log('  - switchServer("RENDER") 切换到 Render');
  console.log('  - showCurrentServer()    显示当前配置');
}
