const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 */

const defaultConfig = getDefaultConfig(__dirname);

// mobile 的 node_modules 路径
const mobileNodeModules = path.resolve(__dirname, 'node_modules');

const config = {
  // 允许从 shared 包导入
  watchFolders: [path.resolve(__dirname, '../shared')],
  resolver: {
    // 支持的文件扩展名
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    // 解析 shared 包及其依赖
    // 让所有模块都从 mobile 的 node_modules 解析
    extraNodeModules: new Proxy(
      {
        '@screen-sharing/shared': path.resolve(__dirname, '../shared'),
      },
      {
        get: (target, name) => {
          if (target.hasOwnProperty(name)) {
            return target[name];
          }
          // 其他模块从 mobile 的 node_modules 解析
          return path.join(mobileNodeModules, name);
        },
      }
    ),
    // 阻止从 shared/node_modules 解析
    blockList: [/shared[\/\\]node_modules[\/\\].*/],
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
