import { useState, useCallback, useRef, useEffect } from 'react';
import { PeerConnectionManager } from '../../../services/webrtc/peer-connection';
import {
  socketService,
  WebRTCOfferData,
  WebRTCAnswerData,
  WebRTCIceCandidateData,
} from '../../../services/socket/client';
import { useStreamStore } from '../../../store/stream';
import { useRoomStore } from '../../../store/room';
import { useUserStore } from '../../../store/user';

interface UseRoomWebRTCOptions {
  roomId: string;
}

// 重新导出类型供 useRoomSocket 使用
export type { WebRTCOfferData, WebRTCAnswerData, WebRTCIceCandidateData };

/**
 * WebRTC 连接管理 Hook
 * 处理 P2P 连接的创建、Offer/Answer 交换、ICE 候选等逻辑
 */
export function useRoomWebRTC({ roomId }: UseRoomWebRTCOptions) {
  const [peerManager] = useState(() => new PeerConnectionManager());
  const { userId } = useUserStore();
  const { addStream } = useStreamStore();

  // 使用 ref 保存最新的 members，避免闭包陷阱
  const membersRef = useRef(useRoomStore.getState().members);

  useEffect(() => {
    // 设置本地用户 ID 到 peerManager
    if (userId) {
      peerManager.setLocalUserId(userId);
      console.log('[useRoomWebRTC] 设置本地用户 ID:', userId);
    }
  }, [userId, peerManager]);

  useEffect(() => {
    // 订阅 store 变化，保持 ref 最新
    const unsubscribe = useRoomStore.subscribe((state) => {
      membersRef.current = state.members;
    });
    return () => unsubscribe();
  }, []);

  /**
   * 向指定用户发送 Offer
   */
  const sendOfferToUser = useCallback(
    async (targetUserId: string, stream: MediaStream) => {
      console.log('[useRoomWebRTC] 开始创建连接并发送Offer to:', targetUserId);
      
      const pc = peerManager.createConnection(targetUserId, {
        onIceCandidate: (candidate) => {
          console.log('[useRoomWebRTC] 本地ICE候选生成，准备发送:', {
            to: targetUserId,
            type: candidate.type,
            address: candidate.address,
            port: candidate.port,
          });
          socketService.sendIceCandidate({
            roomId,
            from: userId,
            to: targetUserId,
            targetUserId,
            candidate,
          });
        },
        onTrack: (remoteStream) => {
          console.log('[useRoomWebRTC] 收到远程流:', targetUserId);
          const member = membersRef.current.find((m) => m.id === targetUserId);
          addStream({
            userId: targetUserId,
            stream: remoteStream,
            nickname: member?.nickname || 'Unknown',
            isLocal: false,
          });
        },
        // ICE 重启回调 - 发送新的 Offer 给对方
        onIceRestart: async (offer) => {
          console.log('[useRoomWebRTC] ICE重启，发送新Offer to:', targetUserId);
          await socketService.sendOffer({
            roomId,
            from: userId,
            to: targetUserId,
            targetUserId,
            offer: {
              type: offer.type as 'offer' | 'answer',
              sdp: offer.sdp!,
            },
          });
        },
        // ICE 收集完成回调 - 通知服务器进行协调
        onIceGatheringComplete: (target, connectionId) => {
          console.log('[useRoomWebRTC] ICE 收集完成，通知服务器协调:', {
            target,
            connectionId,
          });
          socketService.notifyIceGatheringComplete(target, connectionId);
        },
      });

      console.log('[useRoomWebRTC] PeerConnection 已创建，添加本地流...');
      peerManager.addStream(targetUserId, stream);
      console.log('[useRoomWebRTC] 本地流已添加，创建 Offer...');
      const offer = await peerManager.createOffer(targetUserId);
      console.log('[useRoomWebRTC] Offer 已创建，发送中...');

      await socketService.sendOffer({
        roomId,
        from: userId,
        to: targetUserId,
        targetUserId,
        offer: {
          type: offer.type as 'offer' | 'answer',
          sdp: offer.sdp!,
        },
      });
    },
    [roomId, userId, peerManager, addStream]
  );

  /**
   * 向所有房间成员发送 Offer
   */
  const sendOfferToAllMembers = useCallback(
    async (stream: MediaStream) => {
      const members = membersRef.current;
      const otherMembers = members.filter((m) => m.id !== userId);

      for (const member of otherMembers) {
        try {
          await sendOfferToUser(member.id, stream);
          console.log('[useRoomWebRTC] 已向成员发送offer', member.nickname);
        } catch (error) {
          console.error('[useRoomWebRTC] 向成员发送offer失败', member.nickname, error);
        }
      }
    },
    [userId, sendOfferToUser]
  );

  /**
   * 处理收到的 WebRTC Offer
   */
  const handleWebRTCOffer = useCallback(
    async (data: WebRTCOfferData) => {
      console.log('[useRoomWebRTC] 处理Offer，fromUserId:', data.fromUserId);

      if (!data.fromUserId) {
        console.error('[useRoomWebRTC] Offer缺少fromUserId字段', data);
        return;
      }

      peerManager.createConnection(data.fromUserId, {
        onIceCandidate: (candidate) => {
          console.log('[useRoomWebRTC] 本地ICE候选生成(Answer端)，发送:', {
            to: data.fromUserId,
            type: candidate.type,
          });
          socketService.sendIceCandidate({
            roomId,
            from: userId,
            to: data.fromUserId,
            targetUserId: data.fromUserId,
            candidate,
          });
        },
        onTrack: (remoteStream) => {
          console.log('[useRoomWebRTC] 收到远程流 from:', data.fromUserId);
          const member = membersRef.current.find((m) => m.id === data.fromUserId);
          addStream({
            userId: data.fromUserId,
            stream: remoteStream,
            nickname: member?.nickname || 'Unknown',
            isLocal: false,
          });
        },
        // Answer 端一般不主动发起 ICE 重启，但留着以防万一
        onIceRestart: async (offer) => {
          console.log('[useRoomWebRTC] ICE重启(Answer端)，发送新Offer to:', data.fromUserId);
          await socketService.sendOffer({
            roomId,
            from: userId,
            to: data.fromUserId,
            targetUserId: data.fromUserId,
            offer: {
              type: offer.type as 'offer' | 'answer',
              sdp: offer.sdp!,
            },
          });
        },
        // ICE 收集完成回调 - Answer 端也需要通知
        onIceGatheringComplete: (target, connectionId) => {
          console.log('[useRoomWebRTC] ICE 收集完成(Answer端)，通知服务器:', {
            target,
            connectionId,
          });
          socketService.notifyIceGatheringComplete(target, connectionId);
        },
      });

      // 转换类型：RTCSessionDescriptionData -> RTCSessionDescriptionInit
      const offerInit: RTCSessionDescriptionInit = {
        type: data.offer.type,
        sdp: data.offer.sdp,
      };
      await peerManager.setRemoteDescription(data.fromUserId, offerInit);

      // 如果自己正在共享，添加本地流
      const localStream = useStreamStore.getState().localStream;
      if (localStream) {
        peerManager.addStream(data.fromUserId, localStream);
      }

      const answer = await peerManager.createAnswer(data.fromUserId);
      await socketService.sendAnswer({
        roomId,
        from: userId,
        to: data.fromUserId,
        targetUserId: data.fromUserId,
        answer: {
          type: answer.type as 'offer' | 'answer',
          sdp: answer.sdp!,
        },
      });
    },
    [roomId, userId, peerManager, addStream]
  );

  /**
   * 处理收到的 WebRTC Answer
   */
  const handleWebRTCAnswer = useCallback(
    async (data: WebRTCAnswerData) => {
      console.log('[useRoomWebRTC] 处理Answer，fromUserId:', data.fromUserId);
      
      // 转换类型：RTCSessionDescriptionData -> RTCSessionDescriptionInit
      const answerInit: RTCSessionDescriptionInit = {
        type: data.answer.type,
        sdp: data.answer.sdp,
      };
      
      try {
        await peerManager.setRemoteDescription(data.fromUserId, answerInit);
        console.log('[useRoomWebRTC] Answer处理完成，远程描述已设置:', data.fromUserId);
      } catch (error) {
        console.error('[useRoomWebRTC] 设置远程描述失败:', error);
      }
    },
    [peerManager]
  );

  /**
   * 处理收到的 ICE 候选
   */
  const handleIceCandidate = useCallback(
    async (data: WebRTCIceCandidateData) => {
      console.log('[useRoomWebRTC] 处理远程ICE候选:', {
        fromUserId: data.fromUserId,
        candidate: data.candidate?.candidate?.substring(0, 50) + '...',
      });
      // 转换类型：IceCandidate -> RTCIceCandidateInit
      const candidateInit: RTCIceCandidateInit = {
        candidate: data.candidate.candidate,
        sdpMLineIndex: data.candidate.sdpMLineIndex,
        sdpMid: data.candidate.sdpMid,
      };
      try {
        await peerManager.addIceCandidate(data.fromUserId, candidateInit);
        console.log('[useRoomWebRTC] ICE候选已添加:', data.fromUserId);
      } catch (error) {
        console.error('[useRoomWebRTC] 添加ICE候选失败:', error);
      }
    },
    [peerManager]
  );

  /**
   * 关闭指定用户的连接
   */
  const closeConnection = useCallback(
    (targetUserId: string) => {
      peerManager.closeConnection(targetUserId);
    },
    [peerManager]
  );

  /**
   * 关闭所有连接并清理资源
   */
  const cleanup = useCallback(() => {
    peerManager.destroy();
  }, [peerManager]);

  return {
    peerManager,
    sendOfferToUser,
    sendOfferToAllMembers,
    handleWebRTCOffer,
    handleWebRTCAnswer,
    handleIceCandidate,
    closeConnection,
    cleanup,
  };
}
