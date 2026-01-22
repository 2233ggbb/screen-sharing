import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Form, Card, Typography, Space, Divider, message } from 'antd';
import {
  VideoCameraOutlined,
  LoginOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useUserStore } from '../../store/user';
import { useRoomStore } from '../../store/room';
import { socketService } from '../../services/socket/client';
import { natDetector } from '../../services/nat-detection';
import './index.less';

const { Title, Text } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { nickname, setUserId, setNickname, loadFromStorage } = useUserStore();
  const { setRoomInfo, setMembers } = useRoomStore();
  const [loading, setLoading] = useState(false);
  const [nicknameForm] = Form.useForm();
  const [joinForm] = Form.useForm();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);


  // 创建房间
  const handleCreateRoom = async () => {
    if (!nickname) {
      message.warning('请先设置昵称');
      return;
    }

    setLoading(true);
    try {
      // 连接Socket服务器
      await socketService.connect();

      // 监听房间创建成功事件
      socketService.setHandlers({
        onRoomCreated: (data) => {
          // 更新服务端返回的 userId
          setUserId(data.userId);
          
          // 设置房间信息到 store
          setRoomInfo({
            id: data.room.id,
            name: data.room.name,
            ownerId: data.room.ownerId,
            hasPassword: data.room.hasPassword,
            createdAt: data.room.createdAt,
            maxMembers: data.room.maxMembers,
          });
          
          // 设置成员列表
          const members = data.room.members.map(member => ({
            ...member,
            isSharing: member.isSharing || false,
          }));
          setMembers(members);
          
          message.success('房间创建成功');
          navigate(`/room/${data.room.id}`);
        },
        onError: (error) => {
          message.error(error.message);
          setLoading(false);
        },
      });

      // 创建房间
      await socketService.createRoom({
        roomName: `${nickname}的房间`,
        nickname: nickname,
      });
    } catch (error: any) {
      message.error('创建房间失败: ' + error.message);
      setLoading(false);
    }
  };

  // 加入房间
  const handleJoinRoom = async (values: { roomId: string }) => {
    if (!nickname) {
      message.warning('请先设置昵称');
      return;
    }

    setLoading(true);
    try {
      // 连接Socket服务器
      await socketService.connect();

      // ✅ 步骤 1: 先检测 NAT 类型
      console.log('[Home] 开始 NAT 检测...');
      const socket = socketService.getSocket();
      if (!socket) {
        throw new Error('Socket 未连接');
      }

      const natResult = await natDetector.detectNATType(socket);
      console.log('[Home] NAT 检测完成:', natResult);

      // 如果无法 P2P，不继续加入
      if (!natResult.canP2P) {
        message.error('您的网络环境不支持 P2P 连接，无法加入房间');
        setLoading(false);
        return;
      }

      // ✅ 步骤 2: 监听房间加入成功事件
      socketService.setHandlers({
        onRoomJoined: (data) => {
          // 更新服务端返回的 userId
          setUserId(data.userId);

          // 设置房间信息到 store
          setRoomInfo({
            id: data.room.id,
            name: data.room.name,
            ownerId: data.room.ownerId,
            hasPassword: data.room.hasPassword,
            createdAt: data.room.createdAt,
            maxMembers: data.room.maxMembers,
          });

          // 设置成员列表
          const members = data.room.members.map((member) => ({
            ...member,
            isSharing: member.isSharing || false,
          }));
          setMembers(members);

          message.success('加入房间成功');
          navigate(`/room/${data.room.id}`);
        },
        onError: (error) => {
          message.error(error.message);
          setLoading(false);
        },
      });

      // ✅ 步骤 3: 加入房间
      await socketService.joinRoom({
        roomId: values.roomId,
        nickname: nickname,
      });
    } catch (error: any) {
      console.error('[Home] 加入房间失败:', error);
      message.error('加入房间失败: ' + error.message);
      setLoading(false);
    }
  };

  // 保存昵称
  const handleSaveNickname = (values: { nickname: string }) => {
    setNickname(values.nickname);
    message.success('昵称已保存');
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <VideoCameraOutlined className="home-icon" />
          <Title level={2}>多人屏幕共享</Title>
          <Text type="secondary">轻松共享，高效协作</Text>
        </div>

        {/* 昵称设置 */}
        <Card title={<><UserOutlined /> 用户信息</>} className="nickname-card">
          <Form
            form={nicknameForm}
            layout="inline"
            onFinish={handleSaveNickname}
            initialValues={{ nickname }}
          >
            <Form.Item
              name="nickname"
              rules={[{ required: true, message: '请输入昵称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入您的昵称" maxLength={20} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <div className="room-actions">
          {/* 创建房间 */}
          <Card className="action-card">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Title level={4}>创建新房间</Title>
              <Text type="secondary">创建一个新的屏幕共享房间</Text>
              <Button
                type="primary"
                size="large"
                icon={<VideoCameraOutlined />}
                onClick={handleCreateRoom}
                loading={loading}
                block
                disabled={!nickname}
              >
                创建房间
              </Button>
            </Space>
          </Card>

          <Divider type="vertical" className="divider-vertical">或</Divider>

          {/* 加入房间 */}
          <Card className="action-card">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Title level={4}>加入现有房间</Title>
              <Text type="secondary">输入房间ID加入房间</Text>
              <Form form={joinForm} onFinish={handleJoinRoom}>
                <Form.Item
                  name="roomId"
                  rules={[{ required: true, message: '请输入房间ID' }]}
                  style={{ marginBottom: 16 }}
                >
                  <Input
                    placeholder="请输入房间ID"
                    size="large"
                    maxLength={6}
                  />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<LoginOutlined />}
                    htmlType="submit"
                    loading={loading}
                    block
                    disabled={!nickname}
                  >
                    加入房间
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        </div>

        {/* 设置按钮 */}
        <Button
          icon={<SettingOutlined />}
          onClick={() => navigate('/settings')}
          block
          className="settings-button"
        >
          设置
        </Button>
      </div>
    </div>
  );
};

export default Home;
