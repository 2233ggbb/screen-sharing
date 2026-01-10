import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Home from './pages/Home';
import Room from './pages/Room';
import Settings from './pages/Settings';

/**
 * 使用 HashRouter 而非 BrowserRouter
 * 因为 Electron 打包后使用 file:// 协议加载页面
 * BrowserRouter 依赖 HTML5 History API，在 file:// 协议下会导致路由失效
 * HashRouter 使用 URL hash 管理路由，完全兼容 file:// 协议
 */
const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ConfigProvider>
  );
};

export default App;
