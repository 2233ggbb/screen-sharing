/**
 * 设置页面
 * 参考客户端 Settings 页面实现
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Snackbar,
  Switch,
  Divider,
  IconButton,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  useSettingsStore,
  Resolution,
  FrameRate,
  Theme,
  getDefaultServerUrl,
} from '../store/useSettingsStore';
import { socketService } from '../services/socket/SocketService';
import { spacing, borderRadius } from '../theme';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    serverUrl,
    enableIPv6,
    defaultResolution,
    defaultFrameRate,
    hardwareAcceleration,
    theme,
    setServerUrl,
    setEnableIPv6,
    setDefaultResolution,
    setDefaultFrameRate,
    setHardwareAcceleration,
    setTheme,
    resetToDefaults,
  } = useSettingsStore();

  // 本地编辑状态
  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // 显示提示信息
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // 保存设置
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // 验证服务器地址格式
      if (!localServerUrl.trim()) {
        showSnackbar('请输入服务器地址');
        setSaving(false);
        return;
      }

      // 简单的 URL 格式验证
      if (!localServerUrl.startsWith('http://') && !localServerUrl.startsWith('https://')) {
        showSnackbar('服务器地址必须以 http:// 或 https:// 开头');
        setSaving(false);
        return;
      }

      // 保存服务器地址
      setServerUrl(localServerUrl.trim());

      // 更新 socket 服务的服务器地址
      socketService.updateServerUrl(localServerUrl.trim());

      showSnackbar('设置已保存');

      // 延迟返回
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      showSnackbar('保存设置失败: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [localServerUrl, setServerUrl, showSnackbar, navigation]);

  // 重置设置
  const handleReset = useCallback(() => {
    resetToDefaults();
    setLocalServerUrl(getDefaultServerUrl());
    showSnackbar('已恢复默认设置');
  }, [resetToDefaults, showSnackbar]);

  // 分辨率选项
  const resolutionOptions = [
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
    { value: '1440p', label: '2K' },
    { value: '2160p', label: '4K' },
  ];

  // 帧率选项
  const frameRateOptions = [
    { value: '15', label: '15' },
    { value: '24', label: '24' },
    { value: '30', label: '30' },
    { value: '60', label: '60' },
  ];

  // 主题选项
  const themeOptions = [
    { value: 'light', label: '亮色' },
    { value: 'dark', label: '暗色' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="headlineSmall" style={styles.title}>
            设置
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 网络设置 */}
          <Card style={styles.card}>
            <Card.Title title="网络设置" titleVariant="titleMedium" />
            <Card.Content>
              <TextInput
                label="服务器地址"
                value={localServerUrl}
                onChangeText={setLocalServerUrl}
                mode="outlined"
                placeholder="http://localhost:3000"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.input}
              />
              <Text variant="bodySmall" style={styles.hint}>
                开发环境使用 10.0.2.2 访问宿主机，真机使用局域网 IP
              </Text>

              <Divider style={styles.divider} />

              {/* IPv6 开关 */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text variant="bodyMedium">启用 IPv6</Text>
                  <Text variant="bodySmall" style={styles.hint}>
                    如果双方网络都支持 IPv6，可以绕过 NAT 直接连接，大幅提高成功率
                  </Text>
                </View>
                <Switch
                  value={enableIPv6}
                  onValueChange={setEnableIPv6}
                />
              </View>
            </Card.Content>
          </Card>

          {/* 视频设置 */}
          <Card style={styles.card}>
            <Card.Title title="视频设置" titleVariant="titleMedium" />
            <Card.Content>
              {/* 默认分辨率 */}
              <Text variant="bodyMedium" style={styles.label}>
                默认分辨率
              </Text>
              <SegmentedButtons
                value={defaultResolution}
                onValueChange={(value) => setDefaultResolution(value as Resolution)}
                buttons={resolutionOptions}
                style={styles.segmentedButtons}
              />

              <Divider style={styles.divider} />

              {/* 默认帧率 */}
              <Text variant="bodyMedium" style={styles.label}>
                默认帧率 (FPS)
              </Text>
              <SegmentedButtons
                value={String(defaultFrameRate)}
                onValueChange={(value) => setDefaultFrameRate(Number(value) as FrameRate)}
                buttons={frameRateOptions}
                style={styles.segmentedButtons}
              />

              <Divider style={styles.divider} />

              {/* 硬件加速 */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text variant="bodyMedium">硬件加速</Text>
                  <Text variant="bodySmall" style={styles.hint}>
                    启用可提升性能，但某些设备可能不支持
                  </Text>
                </View>
                <Switch
                  value={hardwareAcceleration}
                  onValueChange={setHardwareAcceleration}
                />
              </View>
            </Card.Content>
          </Card>

          {/* 外观设置 */}
          <Card style={styles.card}>
            <Card.Title title="外观设置" titleVariant="titleMedium" />
            <Card.Content>
              <Text variant="bodyMedium" style={styles.label}>
                主题
              </Text>
              <SegmentedButtons
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
                buttons={themeOptions}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>

          {/* 操作按钮 */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={styles.button}
            >
              恢复默认
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.button}
              icon="content-save"
            >
              保存设置
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 提示信息 */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: '关闭',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 48,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  input: {
    marginBottom: spacing.xs,
  },
  label: {
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  hint: {
    opacity: 0.6,
    marginTop: spacing.xs,
  },
  segmentedButtons: {
    marginBottom: spacing.sm,
  },
  divider: {
    marginVertical: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    minWidth: 120,
  },
});

export default SettingsScreen;
