/**
 * 视频网格组件
 * 展示本地和远程屏幕共享流
 * 支持横屏适配和全屏模式
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { Text, Avatar, IconButton } from 'react-native-paper';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { StreamInfo } from '@screen-sharing/shared';
import { spacing, borderRadius } from '../theme';

// 远程流信息
interface RemoteStream {
  userId: string;
  stream: MediaStream;
  streamInfo: StreamInfo;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, RemoteStream>;
  isSharing: boolean;
  currentUserId: string;
  nickname: string;
}

interface StreamItem {
  id: string;
  stream: MediaStream;
  label: string;
  isLocal: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remoteStreams,
  isSharing,
  currentUserId,
  nickname,
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // 全屏状态
  const [fullscreenStream, setFullscreenStream] = useState<StreamItem | null>(null);
  // 控制栏显示状态
  const [showControls, setShowControls] = useState(true);

  // 自动隐藏控制栏
  useEffect(() => {
    if (fullscreenStream && showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fullscreenStream, showControls]);

  // 计算布局
  const streams = useMemo(() => {
    const result: StreamItem[] = [];

    // 添加远程流
    remoteStreams.forEach((remote, id) => {
      result.push({
        id,
        stream: remote.stream,
        label: remote.streamInfo.sourceName || `用户 ${id.slice(0, 6)}`,
        isLocal: false,
      });
    });

    // 添加本地流
    if (localStream && isSharing) {
      result.push({
        id: currentUserId,
        stream: localStream,
        label: `${nickname} (我)`,
        isLocal: true,
      });
    }

    return result;
  }, [localStream, remoteStreams, isSharing, currentUserId, nickname]);

  // 计算网格尺寸 - 根据屏幕方向和流数量优化布局
  const gridLayout = useMemo(() => {
    const count = streams.length;
    const availableHeight = height - 120; // 减去头部和控制栏高度
    const availableWidth = width - spacing.md * 2;

    if (count === 0) {
      return { cols: 1, rows: 1, itemWidth: availableWidth, itemHeight: availableHeight };
    }

    if (count === 1) {
      // 单个视频 - 尽可能大
      return {
        cols: 1,
        rows: 1,
        itemWidth: availableWidth,
        itemHeight: availableHeight,
      };
    }

    if (isLandscape) {
      // 横屏模式
      if (count === 2) {
        return {
          cols: 2,
          rows: 1,
          itemWidth: availableWidth / 2 - spacing.xs,
          itemHeight: availableHeight,
        };
      }
      if (count <= 4) {
        return {
          cols: 2,
          rows: 2,
          itemWidth: availableWidth / 2 - spacing.xs,
          itemHeight: availableHeight / 2 - spacing.xs,
        };
      }
      // 多于4个
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      return {
        cols,
        rows,
        itemWidth: availableWidth / cols - spacing.xs,
        itemHeight: availableHeight / rows - spacing.xs,
      };
    } else {
      // 竖屏模式
      if (count === 2) {
        return {
          cols: 1,
          rows: 2,
          itemWidth: availableWidth,
          itemHeight: availableHeight / 2 - spacing.xs,
        };
      }
      if (count <= 4) {
        return {
          cols: 2,
          rows: 2,
          itemWidth: availableWidth / 2 - spacing.xs,
          itemHeight: availableHeight / 2 - spacing.xs,
        };
      }
      // 多于4个
      const cols = 2;
      const rows = Math.ceil(count / cols);
      return {
        cols,
        rows,
        itemWidth: availableWidth / cols - spacing.xs,
        itemHeight: Math.min(availableHeight / rows - spacing.xs, 200),
      };
    }
  }, [streams.length, width, height, isLandscape]);

  // 进入全屏
  const handleEnterFullscreen = useCallback((item: StreamItem) => {
    setFullscreenStream(item);
    setShowControls(true);
  }, []);

  // 退出全屏
  const handleExitFullscreen = useCallback(() => {
    setFullscreenStream(null);
    setShowControls(true);
  }, []);

  // 切换控制栏显示
  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  // 无共享状态
  if (streams.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Avatar.Icon size={80} icon="monitor-off" style={styles.emptyIcon} />
        <Text variant="headlineSmall" style={styles.emptyText}>
          暂无屏幕共享
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>
          等待其他用户开始共享屏幕
        </Text>
      </View>
    );
  }

  // 渲染单个视频卡片
  const renderVideoCard = (item: StreamItem, isFullscreen: boolean = false) => {
    const cardStyle = isFullscreen
      ? styles.fullscreenVideo
      : {
          width: gridLayout.itemWidth,
          height: gridLayout.itemHeight,
        };

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.9}
        onPress={() => {
          if (isFullscreen) {
            toggleControls();
          } else {
            handleEnterFullscreen(item);
          }
        }}
        style={[styles.videoCard, cardStyle]}
      >
        <RTCView
          streamURL={(item.stream as any).toURL()}
          style={styles.video}
          objectFit={isFullscreen ? 'contain' : 'contain'}
          mirror={false}
        />
        {/* 视频标签 - 非全屏或显示控制时显示 */}
        {(!isFullscreen || showControls) && (
          <View style={[styles.labelContainer, isFullscreen && styles.fullscreenLabel]}>
            <Text variant="labelMedium" style={styles.label} numberOfLines={1}>
              {item.isLocal && '📺 '}
              {item.label}
            </Text>
            {!isFullscreen && (
              <IconButton
                icon="fullscreen"
                size={18}
                iconColor="#fff"
                onPress={() => handleEnterFullscreen(item)}
                style={styles.fullscreenButton}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 视频网格 */}
      <View style={[styles.grid, isLandscape && styles.gridLandscape]}>
        {streams.map((item) => renderVideoCard(item))}
      </View>

      {/* 全屏模态 */}
      <Modal
        visible={fullscreenStream !== null}
        animationType="fade"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={handleExitFullscreen}
        statusBarTranslucent
      >
        <StatusBar hidden={!showControls} />
        <View style={styles.fullscreenContainer}>
          {fullscreenStream && (
            <Pressable style={styles.fullscreenPressable} onPress={toggleControls}>
              <RTCView
                streamURL={(fullscreenStream.stream as any).toURL()}
                style={styles.fullscreenRTCView}
                objectFit="contain"
                mirror={false}
              />
            </Pressable>
          )}

          {/* 全屏控制栏 */}
          {showControls && fullscreenStream && (
            <>
              {/* 顶部栏 */}
              <View style={styles.fullscreenHeader}>
                <IconButton
                  icon="close"
                  iconColor="#fff"
                  size={28}
                  onPress={handleExitFullscreen}
                  style={styles.closeButton}
                />
                <Text variant="titleMedium" style={styles.fullscreenTitle}>
                  {fullscreenStream.isLocal && '📺 '}
                  {fullscreenStream.label}
                </Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* 底部提示 */}
              <View style={styles.fullscreenFooter}>
                <Text variant="bodySmall" style={styles.fullscreenHint}>
                  点击屏幕显示/隐藏控制栏
                </Text>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    padding: spacing.xs,
    gap: spacing.xs,
  },
  gridLandscape: {
    paddingHorizontal: spacing.md,
  },
  videoCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullscreenLabel: {
    backgroundColor: 'transparent',
  },
  label: {
    color: '#fff',
    flex: 1,
  },
  fullscreenButton: {
    margin: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    backgroundColor: '#333',
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: '#fff',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  // 全屏样式
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  fullscreenRTCView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullscreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  closeButton: {
    margin: 0,
  },
  fullscreenTitle: {
    flex: 1,
    color: '#fff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  fullscreenFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
  },
  fullscreenHint: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default VideoGrid;
