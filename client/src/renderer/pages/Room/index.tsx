import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, message, Spin } from 'antd';
import { useRoomStore } from '../../store/room';
import { useStreamStore } from '../../store/stream';
import { useUserStore } from '../../store/user';
import { socketService } from '../../services/socket/client';
import { PeerConnectionManager } from '../../services/webrtc/peer-connection';
import VideoGrid from '../../components/VideoGrid';
import UserList from '../../components/UserList';
import Controls from '../../components/Controls';
import './index.less';

const { Sider, Content } = Layout;

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userId, nickname } = useUserStore();
  const {
    roomInfo,
    members,
    setRoomInfo,
    setMembers,
    addMember,
    removeMember,
    updateMember,
    reset: resetRoom,
  } = useRoomStore();
  const { streams, addStream, removeStream, reset: resetStreams } = useStreamStore();
  const [loading, setLoading] = useState(true);
  const [peerManager] = useState(() => new PeerConnectionManager());

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // 初始化房间
    initRoom();

    // 注意：不要在这里的清理函数中调用 handleLeaveRoom
    // 因为 React Strict Mode 或热重载会导致组件多次挂载/卸载
    // 只在用户真正想要离开时才调用（通过 Controls 组件的离开按钮）
  }, [roomId]);

  // 初始化房间
  const initRoom = async () => {
    try {
      // 确保 Socket 已连接
      if (!socketService.isConnected()) {
        message.error('未连接到服务器，请重新加入房间');
        navigate('/');
        return;
      }

      // 设置Socket事件处理器
      setupSocketHandlers();

      setLoading(false);
    } catch (error: any) {
      message.error('初始化房间失败: ' + error.message);
      navigate('/');
    }
  };

  // 设置Socket事件处理器
  const setupSocketHandlers = () => {
    socketService.setHandlers({
      // 用户加入
      onUserJoined: async (data) => {
        message.info(`${data.user.nickname} 加入了房间`);
        addMember({ ...data.user, isSharing: false });

        // 如果自己正在共享，向新用户发送offer
        const localStream = useStreamStore.getState().localStream;
        if (localStream) {
          await sendOfferToUser(data.user.id, localStream);
        }
      },

      // 用户离开
      onUserLeft: (data) => {
        const member = members.find(m => m.id === data.userId);
        if (member) {
          message.info(`${member.nickname} 离开了房间`);
        }
        removeMember(data.userId);
        removeStream(data.userId);
        peerManager.closeConnection(data.userId);
      },

      // 用户开始共享
      onUserStartSharing: async (data) => {
        console.log('[Room] 用户开始共享', data);
        updateMember(data.userId, { isSharing: true });
        
        // 其他用户开始共享时，等待对方发送 offer
        // WebRTC 连接由共享方发起
        if (data.userId !== userId) {
          const member = members.find(m => m.id === data.userId);
          message.info(`${member?.nickname || '成员'} 开始共享屏幕`);
          console.log('[Room] 等待来自', data.userId, '的 offer');
        }
      },

      // 用户停止共享
      onUserStopSharing: (data) => {
        updateMember(data.userId, { isSharing: false });
        removeStream(data.userId);
      },

      // WebRTC Offer
      onWebRTCOffer: async (data: any) => {
        console.log('[Room] 收到WebRTC Offer', data);
        await handleWebRTCOffer(data);
      },

      // WebRTC Answer
      onWebRTCAnswer: async (data: any) => {
        await handleWebRTCAnswer(data);
      },

      // ICE候选
      onWebRTCIceCandidate: async (data: any) => {
        await peerManager.addIceCandidate(data.fromUserId, data.candidate!);
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
  };

  // 向所有房间成员发送Offer
  const sendOfferToAllMembers = async (stream: MediaStream) => {
    console.log('[Room] 向所有成员发送offer', { memberCount: members.length });
    
    // 向除自己外的所有成员发送offer
    const otherMembers = members.filter(m => m.id !== userId);
    
    for (const member of otherMembers) {
      try {
        await sendOfferToUser(member.id, stream);
        console.log('[Room] 已向成员发送offer', member.nickname);
      } catch (error) {
        console.error('[Room] 向成员发送offer失败', member.nickname, error);
      }
    }
  };

  // 向指定用户发送Offer
  const sendOfferToUser = async (targetUserId: string, stream: MediaStream) => {
    const pc = peerManager.createConnection(targetUserId, {
      onIceCandidate: (candidate) => {
        socketService.sendIceCandidate({
          roomId: roomId!,
          from: userId,
          to: targetUserId,
          targetUserId: targetUserId,
          candidate,
        } as any);
      },
      onTrack: (remoteStream) => {
        const member = members.find((m) => m.id === targetUserId);
        addStream({
          userId: targetUserId,
          stream: remoteStream,
          nickname: member?.nickname || 'Unknown',
          isLocal: false,
        });
      },
    });

    peerManager.addStream(targetUserId, stream);
    const offer = await peerManager.createOffer(targetUserId);

    await socketService.sendOffer({
      roomId: roomId!,
      from: userId,
      to: targetUserId,
      targetUserId: targetUserId,
      offer: {
        type: offer.type as 'offer' | 'answer',
        sdp: offer.sdp!,
      },
    } as any);
  };

  // 处理WebRTC Offer
  const handleWebRTCOffer = async (data: any) => {
    console.log('[Room] 处理Offer，fromUserId:', data.fromUserId, 'offer:', data.offer);
    
    if (!data.fromUserId) {
      console.error('[Room] Offer缺少fromUserId字段', data);
      return;
    }
    
    const pc = peerManager.createConnection(data.fromUserId, {
      onIceCandidate: (candidate) => {
        socketService.sendIceCandidate({
          roomId: roomId!,
          from: userId,
          to: data.fromUserId,
          targetUserId: data.fromUserId,
          candidate,
        } as any);
      },
      onTrack: (remoteStream) => {
        console.log('[Room] 收到远程流 from:', data.fromUserId);
        const member = members.find((m) => m.id === data.fromUserId);
        addStream({
          userId: data.fromUserId,
          stream: remoteStream,
          nickname: member?.nickname || 'Unknown',
          isLocal: false,
        });
      },
    });

    await peerManager.setRemoteDescription(data.fromUserId, data.offer!);

    // 如果自己正在共享，添加本地流
    const localStream = useStreamStore.getState().localStream;
    if (localStream) {
      peerManager.addStream(data.fromUserId, localStream);
    }

    const answer = await peerManager.createAnswer(data.fromUserId);
    await socketService.sendAnswer({
      roomId: roomId!,
      from: userId,
      to: data.fromUserId,
      targetUserId: data.fromUserId,
      answer: {
        type: answer.type as 'offer' | 'answer',
        sdp: answer.sdp!,
      },
    } as any);
  };

  // 处理WebRTC Answer
  const handleWebRTCAnswer = async (data: any) => {
    await peerManager.setRemoteDescription(data.fromUserId, data.answer!);
  };

  // 离开房间
  const handleLeaveRoom = () => {
    if (roomId) {
      socketService.leaveRoom({ roomId });
    }
    peerManager.closeAllConnections();
    resetRoom();
    resetStreams();
    navigate('/');
  };

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
        <Controls
          roomId={roomId!}
          onLeave={handleLeaveRoom}
          onStartSharing={sendOfferToAllMembers}
        />
      </Content>
      <Sider width={280} theme="light" className="room-sider">
        <UserList />
      </Sider>
    </Layout>
  );
};

export default Room;
