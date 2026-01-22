import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, message, Spin } from 'antd';
import { useRoomStore } from '../../store/room';
import { useStreamStore } from '../../store/stream';
import { useRoomWebRTC } from './hooks/useRoomWebRTC';
import { useRoomSocket } from './hooks/useRoomSocket';
import VideoGrid from '../../components/VideoGrid';
import UserList from '../../components/UserList';
import Controls from '../../components/Controls';
import './index.less';

const { Sider, Content } = Layout;

/**
 * 房间页面组件
 * 负责协调 WebRTC 和 Socket 事件处理
 */
const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { reset: resetRoom } = useRoomStore();
  const reset = useStreamStore((state) => state.reset);
  const isFullscreen = useStreamStore((state) => state.isFullscreen);
  const [loading, setLoading] = useState(true);

  // 使用 WebRTC Hook
  const {
    sendOfferToAllMembers,
    sendOfferToUser,
    handleWebRTCOffer,
    handleWebRTCAnswer,
    handleIceCandidate,
    closeConnection,
    cleanup: cleanupWebRTC,
  } = useRoomWebRTC({ roomId: roomId! });

  /**
   * 处理新用户加入时发送 offer
   * 当自己正在共享时，需要向新加入的用户发送 offer
   */
  const handleNewUserJoined = useCallback(
    async (userId: string) => {
      const localStream = useStreamStore.getState().localStream;
      if (localStream) {
        await sendOfferToUser(userId, localStream);
      }
    },
    [sendOfferToUser]
  );

  // 使用 Socket Hook
  const { setupSocketHandlers, leaveRoom, isConnected } = useRoomSocket({
    roomId: roomId!,
    onWebRTCOffer: handleWebRTCOffer,
    onWebRTCAnswer: handleWebRTCAnswer,
    onIceCandidate: handleIceCandidate,
    onUserLeft: closeConnection,
    onNewUserJoined: handleNewUserJoined,
  });

  /**
   * 初始化房间
   */
  const initRoom = useCallback(async () => {
    try {
      // 确保 Socket 已连接
      if (!isConnected()) {
        message.error('未连接到服务器，请重新加入房间');
        navigate('/');
        return;
      }

      // 设置 Socket 事件处理器
      setupSocketHandlers();

      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error('初始化房间失败: ' + errorMessage);
      navigate('/');
    }
  }, [isConnected, setupSocketHandlers, navigate]);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    initRoom();

    // 清理函数 - 只在组件真正卸载时执行
    // 注意：不在这里调用 leaveRoom，因为 React Strict Mode 会导致多次挂载/卸载
  }, [roomId, initRoom, navigate]);

  /**
   * 离开房间
   */
  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    cleanupWebRTC();
    resetRoom();
    reset();
    navigate('/');
  }, [leaveRoom, cleanupWebRTC, resetRoom, reset, navigate]);

  if (loading) {
    return (
      <div className="room-loading">
        <Spin size="large" tip="正在加入房间..." />
      </div>
    );
  }

  return (
    <Layout className="room-page">
      <Content className="room-content">
        <VideoGrid />
        {/* 全屏时隐藏控制栏 */}
        {!isFullscreen && (
          <Controls
            roomId={roomId!}
            onLeave={handleLeaveRoom}
            onStartSharing={sendOfferToAllMembers}
          />
        )}
      </Content>
      {/* 全屏时隐藏侧边栏 */}
      {!isFullscreen && (
        <Sider width={280} theme="light" className="room-sider">
          <UserList />
        </Sider>
      )}
    </Layout>
  );
};

export default Room;
