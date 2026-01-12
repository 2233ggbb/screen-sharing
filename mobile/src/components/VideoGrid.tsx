/**
 * 视频网格组件
 * 展示本地和远程屏幕共享流
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Text, Surface, Avatar } from 'react-native-paper';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remoteStreams,
  isSharing,
  currentUserId,
  nickname,
}) => {
  // 计算布局
  const streams = useMemo(() => {
    const result: Array<{
      id: string;
      stream: MediaStream;
      label: string;
      isLocal: boolean;
    }> = [];

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

  // 计算网格尺寸
  const gridDimensions = useMemo(() => {
    const count = streams.length;
    if (count === 0) return { cols: 1, rows: 1, itemWidth: screenWidth, itemHeight: screenHeight * 0.7 };
    if (count === 1) return { cols: 1, rows: 1, itemWidth: screenWidth, itemHeight: screenHeight * 0.7 };
    if (count === 2) return { cols: 1, rows: 2, itemWidth: screenWidth, itemHeight: (screenHeight * 0.7) / 2 };
    if (count <= 4) return { cols: 2, rows: 2, itemWidth: screenWidth / 2, itemHeight: (screenHeight * 0.7) / 2 };
    return { cols: 2, rows: Math.ceil(count / 2), itemWidth: screenWidth / 2, itemHeight: screenHeight * 0.3 };
  }, [streams.length]);

  // 无共享状态
  if (streams.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Avatar.Icon size={80} icon="monitor-off" style={styles.emptyIcon} />
        <Text variant="headlineSmall" style={styles.emptyText}>
          暂无屏幕共享
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>
          点击下方按钮开始共享您的屏幕
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.grid}>
        {streams.map((item) => (
          <Surface
            key={item.id}
            style={[
              styles.videoCard,
              {
                width: gridDimensions.itemWidth - spacing.sm * 2,
                height: gridDimensions.itemHeight - spacing.sm * 2,
              },
            ]}
            elevation={2}
          >
            <RTCView
              streamURL={(item.stream as any).toURL()}
              style={styles.video}
              objectFit="contain"
              mirror={false}
            />
            <View style={styles.labelContainer}>
              <Text variant="labelMedium" style={styles.label} numberOfLines={1}>
                {item.isLocal && '📺 '}
                {item.label}
              </Text>
            </View>
          </Surface>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  videoCard: {
    margin: spacing.sm,
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
    paddingHorizontal: spacing.sm,
  },
  label: {
    color: '#fff',
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
});

export default VideoGrid;
