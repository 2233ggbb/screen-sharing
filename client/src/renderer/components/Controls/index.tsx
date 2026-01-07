import React, { useState } from 'react';
import { Button, Space, Modal, message, List, Image } from 'antd';
import {
  DesktopOutlined,
  StopOutlined,
  LogoutOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useStreamStore } from '../../store/stream';
import { useUserStore } from '../../store/user';
import { useRoomStore } from '../../store/room';
import { screenCaptureService, DesktopSource } from '../../services/screen/capture';
import { socketService } from '../../services/socket/client';
import './index.less';

interface ControlsProps {
  roomId: string;
  onLeave: () => void;
  onStartSharing: (stream: MediaStream) => Promise<void>;
}

const Controls: React.FC<ControlsProps> = ({ roomId, onLeave, onStartSharing }) => {
  const { userId } = useUserStore();
  const { localStream, setLocalStream, addStream, removeStream } = useStreamStore();
  const [isSharing, setIsSharing] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [sources, setSources] = useState<DesktopSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // 开始共享
  const handleStartSharing = async () => {
    try {
      setLoadingSources(true);
      setSourceModalVisible(true);
      const availableSources = await screenCaptureService.getSources();
      setSources(availableSources);
    } catch (error: any) {
      message.error('获取屏幕源失败: ' + error.message);
    } finally {
      setLoadingSources(false);
    }
  };

  // 选择源并开始共享
  const handleSelectSource = async (sourceId: string) => {
    try {
      const stream = await screenCaptureService.getStreamFromSource(sourceId);
      
      // 获取选中的源信息
      const selectedSource = sources.find(s => s.id === sourceId);
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      // 检查 Socket 连接状态
      if (!socketService.isConnected()) {
        screenCaptureService.stopCurrentStream();
        throw new Error('未连接到服务器，请重新加入房间');
      }

      console.log('[Controls] 准备开始共享', {
        userId,
        roomId,
        sourceId,
        isConnected: socketService.isConnected()
      });

      // 通知服务器开始共享
      await socketService.startSharing({
        sourceId,
        sourceName: selectedSource?.name || 'Unknown',
        sourceType: sourceId.startsWith('screen:') ? 'screen' : 'window',
        config: {
          width: settings.width || 1920,
          height: settings.height || 1080,
          frameRate: settings.frameRate || 30,
        },
      });

      console.log('[Controls] 服务器确认开始共享');

      setLocalStream(stream);
      setIsSharing(true);
      setSourceModalVisible(false);

      // 添加到本地流列表
      const { nickname } = useUserStore.getState();
      addStream({
        userId,
        stream,
        nickname,
        isLocal: true,
      });

      message.success('开始共享屏幕');

      // 监听流结束事件
      videoTrack.onended = () => {
        handleStopSharing();
      };

      // 向房间内所有其他成员发送 WebRTC offer
      console.log('[Controls] 向所有成员发送offer');
      await onStartSharing(stream);
    } catch (error: any) {
      console.error('[Controls] 开始共享失败', error);
      message.error('开始共享失败: ' + error.message);
      setSourceModalVisible(false);
    }
  };

  // 停止共享
  const handleStopSharing = async () => {
    try {
      screenCaptureService.stopCurrentStream();
      setLocalStream(null);
      setIsSharing(false);

      // 从视频网格中移除自己的视频流
      removeStream(userId);

      // 通知服务器停止共享
      await socketService.stopSharing();

      message.info('已停止共享');
    } catch (error: any) {
      message.error('停止共享失败: ' + error.message);
    }
  };

  // 复制房间ID
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    message.success('房间ID已复制');
  };

  // 离开房间
  const handleLeaveRoom = () => {
    Modal.confirm({
      title: '确认离开',
      content: '确定要离开房间吗？',
      onOk: () => {
        if (isSharing) {
          handleStopSharing();
        }
        onLeave();
      },
    });
  };

  return (
    <>
      <div className="controls">
        <Space size="middle">
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopyRoomId}
          >
            复制房间ID
          </Button>

          {!isSharing ? (
            <Button
              type="primary"
              icon={<DesktopOutlined />}
              onClick={handleStartSharing}
            >
              开始共享
            </Button>
          ) : (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleStopSharing}
            >
              停止共享
            </Button>
          )}

          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleLeaveRoom}
          >
            离开房间
          </Button>
        </Space>
      </div>

      {/* 选择屏幕源的模态框 */}
      <Modal
        title="选择要共享的屏幕"
        open={sourceModalVisible}
        onCancel={() => setSourceModalVisible(false)}
        footer={null}
        width={800}
      >
        <List
          loading={loadingSources}
          grid={{ gutter: 16, column: 2 }}
          dataSource={sources}
          renderItem={(source) => (
            <List.Item>
              <div
                className="source-item"
                onClick={() => handleSelectSource(source.id)}
              >
                <Image
                  src={source.thumbnail}
                  preview={false}
                  alt={source.name}
                />
                <div className="source-name">{source.name}</div>
              </div>
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

export default Controls;
