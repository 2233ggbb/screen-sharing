module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // 'react-native-reanimated/plugin', // Temporarily disabled due to RN 0.84 compatibility issues
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@theme': './src/theme',
          '@types': './src/types',
        },
      },
    ],
  ],
};
