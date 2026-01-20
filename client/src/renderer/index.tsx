import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.less';
import './utils/dev-config'; // 开发工具

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
