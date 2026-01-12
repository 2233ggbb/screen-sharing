const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 */

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  // 允许从 shared 包导入
  watchFolders: [path.resolve(__dirname, '../shared')],
  resolver: {
    // 支持的文件扩展名
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    // 解析 shared 包
    extraNodeModules: {
      '@screen-sharing/shared': path.resolve(__dirname, '../shared'),
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
