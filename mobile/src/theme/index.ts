/**
 * 主题配置
 * 与桌面端保持一致的设计语言
 */

import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// 颜色配置
export const colors = {
  light: {
    primary: '#1890ff',
    primaryLight: '#40a9ff',
    primaryDark: '#096dd9',
    secondary: '#52c41a',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: 'rgba(0, 0, 0, 0.85)',
    textSecondary: 'rgba(0, 0, 0, 0.45)',
    border: '#d9d9d9',
    error: '#ff4d4f',
    warning: '#faad14',
    success: '#52c41a',
    info: '#1890ff',
  },
  dark: {
    primary: '#1890ff',
    primaryLight: '#40a9ff',
    primaryDark: '#096dd9',
    secondary: '#52c41a',
    background: '#141414',
    surface: '#1f1f1f',
    text: 'rgba(255, 255, 255, 0.85)',
    textSecondary: 'rgba(255, 255, 255, 0.45)',
    border: '#434343',
    error: '#ff4d4f',
    warning: '#faad14',
    success: '#52c41a',
    info: '#1890ff',
  },
};

// 亮色主题
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.light.primary,
    secondary: colors.light.secondary,
    background: colors.light.background,
    surface: colors.light.surface,
    error: colors.light.error,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: colors.light.text,
    onSurface: colors.light.text,
  },
  custom: colors.light,
};

// 暗色主题
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.dark.primary,
    secondary: colors.dark.secondary,
    background: colors.dark.background,
    surface: colors.dark.surface,
    error: colors.dark.error,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: colors.dark.text,
    onSurface: colors.dark.text,
  },
  custom: colors.dark,
};

// 间距配置
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// 圆角配置
export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

// 字体大小配置
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  display: 32,
};

// 阴影配置
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export type AppTheme = typeof lightTheme;
