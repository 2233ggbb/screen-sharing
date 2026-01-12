module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  rules: {
    // 允许使用 any 类型（因为 react-native-webrtc 类型定义不完整）
    '@typescript-eslint/no-explicit-any': 'off',
    // 允许使用 require
    '@typescript-eslint/no-var-requires': 'off',
    // 关闭 react-hooks/exhaustive-deps 警告
    'react-hooks/exhaustive-deps': 'warn',
    // 允许空函数
    '@typescript-eslint/no-empty-function': 'off',
    // 未使用的变量警告
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // React 17+ 不需要导入 React
    'react/react-in-jsx-scope': 'off',
    // 允许使用 JSX
    'react/jsx-uses-react': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['node_modules/', 'android/', 'ios/', 'coverage/', '*.config.js'],
};
