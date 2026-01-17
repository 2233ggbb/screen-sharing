/**
 * 首页界面
 * 房间创建和加入功能
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Snackbar,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../store/useUserStore';
import { useRoomStore } from '../store/useRoomStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { socketService } from '../services/socket/SocketService';
import { spacing, fontSize, borderRadius } from '../theme';

type NavigationProp = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { nickname, setNickname, setUserId, setConnected } = useUserStore();
  const { setCurrentRoom, setLoading, isLoading, setError } = useRoomStore();
  const { serverUrl } = useSettingsStore();

  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // 显示提示信息
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // 连接服务器并设置回调
  const connectAndSetupCallbacks = useCallback(async () => {
    try {
      // 确保使用最新的服务器地址
      socketService.updateServerUrl(serverUrl);
      await socketService.connect();

      socketService.setCallbacks({
        onConnected: (userId) => {
          setUserId(userId);
          setConnected(true);
        },
        onRoomCreated: (room, userId) => {
          setCurrentRoom(room);
          setUserId(userId);
          setLoading(false);
          navigation.navigate('Room', { roomId: room.id });
        },
        onRoomJoined: (room, userId) => {
          setCurrentRoom(room);
          setUserId(userId);
          setLoading(false);
          navigation.navigate('Room', { roomId: room.id });
        },
        onError: (err) => {
          setError(err.message);
          showSnackbar(err.message);
          setLoading(false);
        },
        onDisconnected: () => {
          setConnected(false);
        },
      });

      return true;
    } catch {
      showSnackbar('连接服务器失败');
      return false;
    }
  }, [navigation, serverUrl, setConnected, setCurrentRoom, setError, setLoading, setUserId, showSnackbar]);

  // 创建房间
  const handleCreateRoom = useCallback(async () => {
    if (!nickname.trim()) {
      showSnackbar('请输入昵称');
      return;
    }

    // 如果没有填写房间名称，使用默认名称（与客户端保持一致）
    const finalRoomName = roomName.trim() || `${nickname.trim()}的房间`;

    setLoading(true);
    setError(null);

    const connected = await connectAndSetupCallbacks();
    if (!connected) {
      setLoading(false);
      return;
    }

    socketService.createRoom({
      roomName: finalRoomName,
      nickname: nickname.trim(),
    });
  }, [nickname, roomName, connectAndSetupCallbacks, setLoading, setError, showSnackbar]);

  // 加入房间
  const handleJoinRoom = useCallback(async () => {
    if (!nickname.trim()) {
      showSnackbar('请输入昵称');
      return;
    }

    if (!roomId.trim()) {
      showSnackbar('请输入房间号');
      return;
    }

    setLoading(true);
    setError(null);

    const connected = await connectAndSetupCallbacks();
    if (!connected) {
      setLoading(false);
      return;
    }

    socketService.joinRoom({
      roomId: roomId.trim(),
      nickname: nickname.trim(),
    });
  }, [nickname, roomId, connectAndSetupCallbacks, setLoading, setError, showSnackbar]);

  // 跳转到设置页面
  const handleGoToSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 标题和设置按钮 */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text variant="headlineLarge" style={styles.title}>
                屏幕共享
              </Text>
              <IconButton
                icon="cog"
                size={24}
                onPress={handleGoToSettings}
                style={styles.settingsButton}
              />
            </View>
            <Text variant="bodyMedium" style={styles.subtitle}>
              多人实时屏幕共享协作平台
            </Text>
          </View>

          {/* 昵称输入 */}
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="昵称"
                value={nickname}
                onChangeText={setNickname}
                mode="outlined"
                placeholder="请输入您的昵称"
                maxLength={20}
                style={styles.input}
              />
            </Card.Content>
          </Card>

          {/* 创建房间 */}
          <Card style={styles.card}>
            <Card.Title title="创建房间" titleVariant="titleMedium" />
            <Card.Content>
              <TextInput
                label="房间名称（选填）"
                value={roomName}
                onChangeText={setRoomName}
                mode="outlined"
                placeholder={nickname ? `${nickname}的房间` : '请输入房间名称'}
                maxLength={50}
                style={styles.input}
              />
              <Text variant="bodySmall" style={styles.hint}>
                不填写则使用默认名称「昵称的房间」
              </Text>
              <Button
                mode="contained"
                onPress={handleCreateRoom}
                loading={isLoading}
                disabled={isLoading || !nickname.trim()}
                style={styles.button}
              >
                创建房间
              </Button>
            </Card.Content>
          </Card>

          {/* 加入房间 */}
          <Card style={styles.card}>
            <Card.Title title="加入房间" titleVariant="titleMedium" />
            <Card.Content>
              <TextInput
                label="房间号"
                value={roomId}
                onChangeText={setRoomId}
                mode="outlined"
                placeholder="请输入房间号"
                autoCapitalize="characters"
                maxLength={10}
                style={styles.input}
              />
              <Button
                mode="contained-tonal"
                onPress={handleJoinRoom}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
              >
                加入房间
              </Button>
            </Card.Content>
          </Card>

          {/* 设置按钮 */}
          <Button
            mode="text"
            onPress={handleGoToSettings}
            icon="cog"
            style={styles.settingsButtonBottom}
          >
            设置
          </Button>

          {/* 加载指示器 */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>连接中...</Text>
            </View>
          )}
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#1890ff',
  },
  settingsButton: {
    position: 'absolute',
    right: -48,
  },
  subtitle: {
    marginTop: spacing.sm,
    opacity: 0.7,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  input: {
    marginBottom: spacing.xs,
  },
  hint: {
    opacity: 0.6,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
  settingsButtonBottom: {
    marginTop: spacing.md,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
});

export default HomeScreen;
