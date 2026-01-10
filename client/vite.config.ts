import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  // 设置 base 为相对路径,确保打包后资源正确加载
  base: './',
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist/main',
          },
        },
      },
      {
        entry: 'src/preload/index.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/preload',
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    // 确保资源路径正确
    assetsDir: 'assets',
    // 生成 sourcemap 便于调试
    sourcemap: false,
  },
});
