import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
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

      // 关键：多人共享场景下，双方可能已存在 PeerConnection（例如之前已在接收对方的共享）。
      // 如果这里直接重建连接，会导致：
      // 1) 原有远程流 track 被中断（表现为黑屏）
      // 2) 对端仍持有旧的 m-line 顺序，新 Offer 用新 PC 的 m-line 顺序会触发 InvalidAccessError
      // 所以：仅在连接不存在时才创建。
      const existingPc = peerManager.getConnection(targetUserId);
      if (!existingPc) {
        peerManager.createConnection(targetUserId, {
          onConnectionError: (error) => {
            message.error({
              content: `与 ${targetUserId} 建立连接失败（${error.stage}）：${error.message}`,
              duration: 5,
            });
            console.error('[WebRTC][ConnectionError]', error);
          },
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
          onIceGatheringComplete: (target, connectionId) => {
            console.log('[useRoomWebRTC] ICE 收集完成，通知服务器协调:', {
              target,
              connectionId,
            });
            socketService.notifyIceGatheringComplete(target, connectionId);
          },
        });
      } else {
        console.log('[useRoomWebRTC] 连接已存在，复用现有 PeerConnection:', targetUserId);
      }

      console.log('[useRoomWebRTC] 添加/更新本地流到 PeerConnection...');
      peerManager.addStream(targetUserId, stream);

      console.log('[useRoomWebRTC] 创建 Offer...');
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

      // 重要：如果连接已存在（例如双方同时发起 Offer 产生 glare），不要重建连接，
      // 否则会打断本地正在进行的协商/ICE 状态，导致更高概率连接失败。
      const existingPc = peerManager.getConnection(data.fromUserId);
      if (!existingPc) {
        peerManager.createConnection(data.fromUserId, {
          onConnectionError: (error) => {
            message.error({
              content: `与 ${data.fromUserId} 建立连接失败（${error.stage}）：${error.message}`,
              duration: 5,
            });
            console.error('[WebRTC][ConnectionError]', error);
          },
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
      } else {
        console.log('[useRoomWebRTC] 连接已存在，复用现有 PeerConnection:', data.fromUserId);
      }

      // 转换类型：RTCSessionDescriptionData -> RTCSessionDescriptionInit
      const offerInit: RTCSessionDescriptionInit = {
        type: data.offer.type,
        sdp: data.offer.sdp,
      };

      // 兜底：若因 m-line 顺序不一致等“非时序问题”导致 setRemoteDescription 失败，
      // 说明该 PeerConnection 的 transceiver/m-line 已经与对端不再一致。
      // 此时最稳妥的做法是关闭并重建连接，然后再处理该 offer。
      try {
        await peerManager.setRemoteDescription(data.fromUserId, offerInit);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        const isMLineMismatch =
          errMsg.includes('m-lines') ||
          errMsg.includes('mline') ||
          errMsg.includes('order') ||
          errMsg.includes('doesn\'t match order');

        if (isMLineMismatch) {
          console.warn('[useRoomWebRTC] setRemoteDescription m-line mismatch，重建连接后重试:', {
            fromUserId: data.fromUserId,
            errMsg,
          });

          peerManager.closeConnection(data.fromUserId);

          // 重建连接
          peerManager.createConnection(data.fromUserId, {
            onConnectionError: (err) => {
              message.error({
                content: `与 ${data.fromUserId} 建立连接失败（${err.stage}）：${err.message}`,
                duration: 5,
              });
              console.error('[WebRTC][ConnectionError]', err);
            },
            onIceCandidate: (candidate) => {
              console.log('[useRoomWebRTC] 本地ICE候选生成(Answer端-重建后)，发送:', {
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
              console.log('[useRoomWebRTC] 收到远程流(重建后) from:', data.fromUserId);
              const member = membersRef.current.find((m) => m.id === data.fromUserId);
              addStream({
                userId: data.fromUserId,
                stream: remoteStream,
                nickname: member?.nickname || 'Unknown',
                isLocal: false,
              });
            },
            onIceRestart: async (offer) => {
              console.log('[useRoomWebRTC] ICE重启(Answer端-重建后)，发送新Offer to:', data.fromUserId);
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
            onIceGatheringComplete: (target, connectionId) => {
              console.log('[useRoomWebRTC] ICE 收集完成(Answer端-重建后)，通知服务器:', {
                target,
                connectionId,
              });
              socketService.notifyIceGatheringComplete(target, connectionId);
            },
          });

          // 重试设置远端描述
          await peerManager.setRemoteDescription(data.fromUserId, offerInit);
        } else {
          throw error;
        }
      }

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
