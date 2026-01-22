import { useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  socketService,
  WebRTCOfferData,
  WebRTCAnswerData,
  WebRTCIceCandidateData,
} from '../../../services/socket/client';
import { useRoomStore } from '../../../store/room';
import { useStreamStore } from '../../../store/stream';
import { useUserStore } from '../../../store/user';

interface UseRoomSocketOptions {
  roomId: string;
  onWebRTCOffer: (data: WebRTCOfferData) => Promise<void>;
  onWebRTCAnswer: (data: WebRTCAnswerData) => Promise<void>;
  onIceCandidate: (data: WebRTCIceCandidateData) => Promise<void>;
  onUserLeft: (userId: string) => void;
  onNewUserJoined: (userId: string) => Promise<void>;
}

/**
 * Socket 事件处理 Hook
 * 处理房间相关的 Socket 事件
 */
export function useRoomSocket({
  roomId,
  onWebRTCOffer,
  onWebRTCAnswer,
  onIceCandidate,
  onUserLeft,
  onNewUserJoined,
}: UseRoomSocketOptions) {
  const navigate = useNavigate();
  const { userId } = useUserStore();
  const { addMember, removeMember, updateMember } = useRoomStore();
  const { removeStream } = useStreamStore();

  // 使用 ref 保存最新的 members，避免闭包陷阱
  const membersRef = useRef(useRoomStore.getState().members);

  useEffect(() => {
    const unsubscribe = useRoomStore.subscribe((state) => {
      membersRef.current = state.members;
    });
    return () => unsubscribe();
  }, []);

  /**
   * 向新加入的用户发送 offer（如果自己正在共享）
   */
  const sendOfferToNewUser = useCallback(
    async (newUserId: string) => {
      const localStream = useStreamStore.getState().localStream;
      if (localStream) {
        console.log('[useRoomSocket] 向新用户发送 offer:', newUserId);
        await onNewUserJoined(newUserId);
      }
    },
    [onNewUserJoined]
  );

  /**
   * 设置 Socket 事件处理器
   */
  const setupSocketHandlers = useCallback(() => {
    socketService.setHandlers({
      // 用户加入
      onUserJoined: async (data) => {
        message.info(`${data.user.nickname} 加入了房间`);
        addMember({ ...data.user, isSharing: false });

        // 如果自己正在共享，向新用户发送 offer
        await sendOfferToNewUser(data.user.id);
      },

      // 用户离开
      onUserLeft: (data) => {
        const member = membersRef.current.find((m) => m.id === data.userId);
        if (member) {
          message.info(`${member.nickname} 离开了房间`);
        }
        removeMember(data.userId);
        removeStream(data.userId);
        onUserLeft(data.userId);
      },

      // 用户开始共享
      onUserStartSharing: async (data) => {
        console.log('[useRoomSocket] 用户开始共享', data);
        updateMember(data.userId, { isSharing: true });

        if (data.userId !== userId) {
          const member = membersRef.current.find((m) => m.id === data.userId);
          message.info(`${member?.nickname || '成员'} 开始共享屏幕`);
          console.log('[useRoomSocket] 等待来自', data.userId, '的 offer');
        }
      },

      // 用户停止共享
      onUserStopSharing: (data) => {
        updateMember(data.userId, { isSharing: false });
        removeStream(data.userId);
      },

      // WebRTC Offer - data 已经是正确类型，直接传递
      onWebRTCOffer: async (data) => {
        console.log('[useRoomSocket] 收到WebRTC Offer', data);
        await onWebRTCOffer(data);
      },

      // WebRTC Answer
      onWebRTCAnswer: async (data) => {
        await onWebRTCAnswer(data);
      },

      // ICE候选
      onWebRTCIceCandidate: async (data) => {
        await onIceCandidate(data);
      },

      // 断开连接
      onDisconnect: () => {
        message.error('与服务器断开连接');
        navigate('/');
      },

      // 错误
      onError: (error) => {
        message.error(error.message);
      },
    });
  }, [
    userId,
    addMember,
    removeMember,
    updateMember,
    removeStream,
    onWebRTCOffer,
    onWebRTCAnswer,
    onIceCandidate,
    onUserLeft,
    sendOfferToNewUser,
    navigate,
  ]);

  /**
   * 离开房间
   */
  const leaveRoom = useCallback(() => {
    if (roomId) {
      socketService.leaveRoom({ roomId });
    }
  }, [roomId]);

  /**
   * 检查连接状态
   */
  const isConnected = useCallback(() => {
    return socketService.isConnected();
  }, []);

  return {
    setupSocketHandlers,
    leaveRoom,
    isConnected,
  };
}
