import React, { useRef, useEffect, memo, useCallback, useState } from 'react';
import { Empty, Button, Tooltip } from 'antd';
import { VideoCameraOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { useRoomStore } from '../../store/room';
import { useStreamStore } from '../../store/stream';
import './index.less';

/**
 * 视频网格组件
 * 显示所有共享的屏幕流
 */
const VideoGrid: React.FC = () => {
  const streams = useStreamStore((state) => state.streams);
  const focusedStreamUserId = useStreamStore((state) => state.focusedStreamUserId);
  const setFocusedStream = useStreamStore((state) => state.setFocusedStream);
  const isFullscreen = useStreamStore((state) => state.isFullscreen);
  const setIsFullscreen = useStreamStore((state) => state.setIsFullscreen);
  const members = useRoomStore((state) => state.members);

  // 关键：远端用户停止共享后，可能会复用同一条 WebRTC receiver track 再次开始共享。
  // 此时不会再次触发 ontrack 事件，因此不能把远端 stream 彻底销毁/stop。
  // 我们仅根据 members.isSharing 来决定“是否展示”。
  const visibleStreams = streams.filter((streamInfo) => {
    if (streamInfo.isLocal) return true;
    const member = members.find((m) => m.id === streamInfo.userId);
    return member?.isSharing ?? true;
  });

  // 监听浏览器全屏状态变化，同步到 store
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [setIsFullscreen]);

  if (visibleStreams.length === 0) {
    return (
      <div className="video-grid-empty">
        <Empty
          image={<VideoCameraOutlined style={{ fontSize: 64 }} />}
          description="暂无屏幕共享"
        />
      </div>
    );
  }

  // 焦点模式
  if (focusedStreamUserId) {
    const focusedStream = visibleStreams.find((s) => s.userId === focusedStreamUserId);
    const otherStreams = visibleStreams.filter((s) => s.userId !== focusedStreamUserId);

    return (
      <div className="video-grid-focus">
        <div className="focus-main">
          {focusedStream && (
            <VideoPlayer
              stream={focusedStream.stream}
              nickname={focusedStream.nickname}
              muted={focusedStream.isLocal}
              isFullscreen={isFullscreen}
              onDoubleClick={() => setFocusedStream(null)}
            />
          )}
        </div>
        {otherStreams.length > 0 && (
          <div className="focus-sidebar">
            {otherStreams.map((streamInfo) => (
              <div
                key={streamInfo.userId}
                className="sidebar-item"
                onClick={() => setFocusedStream(streamInfo.userId)}
              >
                <VideoPlayer
                  stream={streamInfo.stream}
                  nickname={streamInfo.nickname}
                  muted={streamInfo.isLocal}
                  isFullscreen={isFullscreen}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 网格模式 - 根据屏幕数量动态调整
  const getGridClass = () => {
    const count = visibleStreams.length;
    if (count === 1) {
      return 'video-grid grid-1x1';
    } else if (count <= 4) {
      return 'video-grid grid-2x2';
    } else if (count <= 9) {
      return 'video-grid grid-3x3';
    } else {
      return 'video-grid grid-4x4';
    }
  };

  return (
    <div className={getGridClass()}>
      {visibleStreams.map((streamInfo) => (
        <div
          key={streamInfo.userId}
          className="grid-item"
          onDoubleClick={() => setFocusedStream(streamInfo.userId)}
        >
          <VideoPlayer
            stream={streamInfo.stream}
            nickname={streamInfo.nickname}
            muted={streamInfo.isLocal}
            isFullscreen={isFullscreen}
          />
        </div>
      ))}
    </div>
  );
};

interface VideoPlayerProps {
  stream: MediaStream;
  nickname: string;
  /** 是否静音，本地流应该静音避免回声 */
  muted?: boolean;
  /** 是否处于全屏模式（从 store 传入） */
  isFullscreen?: boolean;
  onDoubleClick?: () => void;
}

/**
 * 视频播放器组件
 * 使用 React.memo 避免不必要的重渲染
 */
const VideoPlayer = memo<VideoPlayerProps>(({
  stream,
  nickname,
  muted = false,
  isFullscreen = false,
  onDoubleClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 鼠标活跃状态 - 控制全屏时控件的显示隐藏
  const [isMouseActive, setIsMouseActive] = useState(true);

  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement && stream) {
      videoElement.srcObject = stream;
    }

    // 清理函数 - 防止内存泄漏
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream]);

  // 全屏时监听鼠标移动，3秒无操作后隐藏控件
  useEffect(() => {
    if (!isFullscreen) {
      // 非全屏时重置状态
      setIsMouseActive(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => {
      // 鼠标移动时显示控件
      setIsMouseActive(true);

      // 清除之前的定时器
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // 1秒后隐藏控件
      hideTimeoutRef.current = setTimeout(() => {
        setIsMouseActive(false);
      }, 1000);
    };

    // 初始状态：1秒后隐藏
    hideTimeoutRef.current = setTimeout(() => {
      setIsMouseActive(false);
    }, 1000);

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.();
  }, [onDoubleClick]);

  // 切换真正的浏览器全屏
  const toggleFullscreen = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发双击事件
    
    try {
      if (!document.fullscreenElement) {
        // 进入全屏 - 让视频容器全屏
        await containerRef.current?.requestFullscreen();
      } else {
        // 退出全屏
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('全屏切换失败:', error);
    }
  }, []);

  // 是否显示控件：非全屏时正常显示，全屏时根据鼠标活跃状态
  const showControls = !isFullscreen || isMouseActive;
  // 是否隐藏鼠标指针
  const hideCursor = isFullscreen && !isMouseActive;

  return (
    <div
      ref={containerRef}
      className={`video-player ${isFullscreen ? 'is-fullscreen' : ''} ${hideCursor ? 'hide-cursor' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="video-element"
      />
      <div className={`video-nickname ${showControls ? '' : 'hidden'}`}>{nickname}</div>
      
      {/* 全屏按钮 */}
      <div className={`video-controls ${showControls ? '' : 'hidden'}`}>
        <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            className="fullscreen-btn"
          />
        </Tooltip>
      </div>
    </div>
  );
});

// 添加 displayName 用于调试
VideoPlayer.displayName = 'VideoPlayer';

export default VideoGrid;
