/**
 * 房间界面
 * 屏幕共享和视频展示
 * 支持横屏适配和优化的观看体验
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Alert,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import {
  Text,
  IconButton,
  FAB,
  Portal,
  Dialog,
  Button,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRoomStore } from '../store/useRoomStore';
import { useUserStore } from '../store/useUserStore';
import { useStreamStore } from '../store/useStreamStore';
import { socketService } from '../services/socket/SocketService';
import { webrtcService } from '../services/webrtc/WebRTCService';
import { screenCaptureService } from '../services/screenCapture/ScreenCaptureService';
import VideoGrid from '../components/VideoGrid';
import UserList from '../components/UserList';
import { spacing, borderRadius } from '../theme';

type RouteParams = {
  roomId: string;
};

type NavigationProp = {
  navigate: (screen: string) => void;
  goBack: () => void;
};

const RoomScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const params = route.params as RouteParams;

  // 屏幕尺寸和方向检测
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { currentRoom, members, clearRoom } = useRoomStore();
  const { userId, nickname } = useUserStore();
  const {
    localStream,
    remoteStreams,
    isSharing,
    shareQuality,
    setLocalStream,
    addRemoteStream,
    removeRemoteStream,
    setIsSharing,
    clearAllStreams,
  } = useStreamStore();

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  // 紧凑模式：横屏时隐藏控制栏
  const [compactMode, setCompactMode] = useState(false);

  // 设置 Socket 回调
  useEffect(() => {
    socketService.setCallbacks({
      onUserJoined: (user, roomId) => {
        // 如果我正在共享，向新用户发送 offer
        if (isSharing && localStream) {
          createOfferForUser(user.id);
        }
      },
      onUserLeft: (leftUserId, roomId) => {
        // 移除该用户的远程流
        removeRemoteStream(leftUserId);
        // 关闭对应的 P2P 连接
        webrtcService.closePeerConnection(leftUserId);
      },
      onUserStartedSharing: (sharingUserId, streamInfo) => {
        // 其他用户开始共享，准备接收
        if (sharingUserId !== userId) {
          setupReceiverConnection(sharingUserId);
        }
      },
      onUserStoppedSharing: (stoppedUserId, streamId) => {
        // 其他用户停止共享，移除远程流
        removeRemoteStream(stoppedUserId);
        webrtcService.closePeerConnection(stoppedUserId);
      },
      onReceiveOffer: async (fromUserId, offer) => {
        try {
          // 创建或获取连接
          let pc = webrtcService.getPeerConnection(fromUserId);
          if (!pc) {
            pc = webrtcService.createPeerConnection(fromUserId, {
              onTrack: (stream) => {
                addRemoteStream(fromUserId, stream, {
                  id: stream.id,
                  userId: fromUserId,
                  nickname: '',
                  sourceType: 'screen' as any,
                  sourceName: '',
                  resolution: '1280x720',
                  fps: 24,
                  startedAt: new Date(),
                });
              },
            });
          }

          // 设置远程描述
          await webrtcService.setRemoteDescription(fromUserId, offer);

          // 创建并发送 answer
          const answer = await webrtcService.createAnswer(fromUserId);
          socketService.sendAnswer(fromUserId, answer);
        } catch (error) {
          console.error('处理 Offer 失败:', error);
        }
      },
      onReceiveAnswer: async (fromUserId, answer) => {
        try {
          await webrtcService.setRemoteDescription(fromUserId, answer);
        } catch (error) {
          console.error('处理 Answer 失败:', error);
        }
      },
      onReceiveIceCandidate: async (fromUserId, candidate) => {
        try {
          await webrtcService.addIceCandidate(fromUserId, candidate);
        } catch (error) {
          console.error('添加 ICE 候选失败:', error);
        }
      },
    });

    return () => {
      // 清理
    };
  }, [userId, isSharing, localStream, addRemoteStream, removeRemoteStream]);

  // 为指定用户创建 Offer
  const createOfferForUser = useCallback(
    async (targetUserId: string) => {
      if (!localStream) return;

      try {
        const pc = webrtcService.createPeerConnection(targetUserId, {
          onIceCandidate: (candidate) => {
            socketService.sendIceCandidate(targetUserId, candidate as any);
          },
        });

        webrtcService.addLocalStream(targetUserId, localStream);
        const offer = await webrtcService.createOffer(targetUserId);
        socketService.sendOffer(targetUserId, offer);
      } catch (error) {
        console.error('创建 Offer 失败:', error);
      }
    },
    [localStream]
  );

  // 设置接收方连接
  const setupReceiverConnection = useCallback((sharingUserId: string) => {
    const pc = webrtcService.createPeerConnection(sharingUserId, {
      onIceCandidate: (candidate) => {
        socketService.sendIceCandidate(sharingUserId, candidate as any);
      },
      onTrack: (stream) => {
        addRemoteStream(sharingUserId, stream, {
          id: stream.id,
          userId: sharingUserId,
          nickname: '',
          sourceType: 'screen' as any,
          sourceName: '',
          resolution: '1280x720',
          fps: 24,
          startedAt: new Date(),
        });
      },
    });
  }, [addRemoteStream]);

  // 开始屏幕共享
  const handleStartSharing = useCallback(async () => {
    setIsConnecting(true);

    try {
      const stream = await screenCaptureService.startCapture(shareQuality);
      if (!stream) {
        setIsConnecting(false);
        return;
      }

      setLocalStream(stream);
      setIsSharing(true);

      // 通知服务器开始共享
      socketService.startSharing({
        sourceId: 'screen',
        sourceName: '屏幕',
        sourceType: 'screen',
        config: {
          width: 1280,
          height: 720,
          frameRate: 24,
        },
      });

      // 向所有其他成员发送 offer
      members.forEach((member) => {
        if (member.id !== userId) {
          createOfferForUser(member.id);
        }
      });
    } catch (error) {
      console.error('开始共享失败:', error);
      Alert.alert('错误', '启动屏幕共享失败');
    } finally {
      setIsConnecting(false);
    }
  }, [shareQuality, members, userId, createOfferForUser, setLocalStream, setIsSharing]);

  // 停止屏幕共享
  const handleStopSharing = useCallback(() => {
    screenCaptureService.stopCapture();
    webrtcService.closeAllConnections();

    setLocalStream(null);
    setIsSharing(false);

    socketService.stopSharing();
  }, [setLocalStream, setIsSharing]);

  // 离开房间
  const handleLeaveRoom = useCallback(() => {
    setShowExitDialog(false);

    // 停止共享
    if (isSharing) {
      handleStopSharing();
    }

    // 清理资源
    clearAllStreams();
    webrtcService.destroy();

    // 离开房间
    socketService.leaveRoom();
    clearRoom();

    // 返回首页
    navigation.goBack();
  }, [isSharing, handleStopSharing, clearAllStreams, clearRoom, navigation]);

  // 处理返回按钮
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowExitDialog(true);
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // 横屏时自动启用紧凑模式
  useEffect(() => {
    if (isLandscape && remoteStreams.size > 0) {
      setCompactMode(true);
    }
  }, [isLandscape, remoteStreams.size]);

  // 切换紧凑模式
  const toggleCompactMode = useCallback(() => {
    setCompactMode((prev) => !prev);
  }, []);

  return (
    <SafeAreaView
      style={styles.container}
      edges={isLandscape ? [] : ['top']}
    >
      <StatusBar hidden={isLandscape && compactMode} />
      
      {/* 顶部栏 - 横屏紧凑模式下隐藏 */}
      {!(isLandscape && compactMode) && (
        <View style={[styles.header, isLandscape && styles.headerLandscape]}>
          <IconButton
            icon="arrow-left"
            onPress={() => setShowExitDialog(true)}
            size={isLandscape ? 20 : 24}
          />
          <View style={styles.roomInfo}>
            <Text
              variant={isLandscape ? 'bodyMedium' : 'titleMedium'}
              numberOfLines={1}
            >
              {currentRoom?.name || '房间'}
            </Text>
            <Chip compact style={styles.roomIdChip}>
              {params.roomId}
            </Chip>
          </View>
          <IconButton
            icon="account-group"
            onPress={() => setShowUserList(true)}
            size={isLandscape ? 20 : 24}
          />
          {isLandscape && (
            <IconButton
              icon={compactMode ? 'fullscreen' : 'fullscreen-exit'}
              onPress={toggleCompactMode}
              size={20}
            />
          )}
        </View>
      )}

      {/* 视频网格 */}
      <View style={styles.videoContainer}>
        <VideoGrid
          localStream={localStream}
          remoteStreams={remoteStreams}
          isSharing={isSharing}
          currentUserId={userId || ''}
          nickname={nickname}
        />
        
        {/* 横屏紧凑模式下的浮动控制按钮 */}
        {isLandscape && compactMode && (
          <View style={styles.floatingControls}>
            <IconButton
              icon="arrow-left"
              iconColor="#fff"
              size={24}
              onPress={() => setShowExitDialog(true)}
              style={styles.floatingButton}
            />
            <IconButton
              icon="fullscreen-exit"
              iconColor="#fff"
              size={24}
              onPress={toggleCompactMode}
              style={styles.floatingButton}
            />
          </View>
        )}
      </View>

      {/* 控制栏 - 横屏紧凑模式下隐藏 */}
      {!(isLandscape && compactMode) && (
        <View style={[styles.controls, isLandscape && styles.controlsLandscape]}>
          <FAB
            icon={isSharing ? 'stop' : 'monitor-share'}
            label={isLandscape ? undefined : (isSharing ? '停止共享' : '共享屏幕')}
            onPress={isSharing ? handleStopSharing : handleStartSharing}
            loading={isConnecting}
            disabled={isConnecting}
            style={[styles.fab, isSharing && styles.fabStop]}
            size={isLandscape ? 'small' : 'medium'}
          />
        </View>
      )}

      {/* 退出确认弹窗 */}
      <Portal>
        <Dialog visible={showExitDialog} onDismiss={() => setShowExitDialog(false)}>
          <Dialog.Title>离开房间</Dialog.Title>
          <Dialog.Content>
            <Text>确定要离开当前房间吗？</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExitDialog(false)}>取消</Button>
            <Button onPress={handleLeaveRoom}>离开</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 用户列表弹窗 */}
      <Portal>
        <Dialog
          visible={showUserList}
          onDismiss={() => setShowUserList(false)}
          style={styles.userListDialog}
        >
          <Dialog.Title>房间成员 ({members.length})</Dialog.Title>
          <Dialog.Content>
            <UserList members={members} currentUserId={userId || ''} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowUserList(false)}>关闭</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: '#1f1f1f',
  },
  headerLandscape: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  roomInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roomIdChip: {
    height: 24,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  controls: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
  },
  controlsLandscape: {
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fab: {
    borderRadius: borderRadius.full,
  },
  fabStop: {
    backgroundColor: '#ff4d4f',
  },
  floatingControls: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    zIndex: 10,
  },
  floatingButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: borderRadius.full,
    margin: 0,
  },
  userListDialog: {
    maxHeight: '70%',
  },
});

export default RoomScreen;
