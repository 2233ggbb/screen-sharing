import React from 'react';
import { List, Avatar, Badge, Typography, Empty } from 'antd';
import { UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useRoomStore } from '../../store/room';
import './index.less';

const { Text } = Typography;

const UserList: React.FC = () => {
  const { members, roomInfo } = useRoomStore();

  return (
    <div className="user-list">
      <div className="user-list-header">
        <Text strong>房间成员 ({members.length})</Text>
        {roomInfo && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            房间ID: {roomInfo.id}
          </Text>
        )}
      </div>

      {members.length === 0 ? (
        <Empty description="暂无成员" />
      ) : (
        <List
          dataSource={members}
          renderItem={(member) => (
            <List.Item className="user-list-item">
              <List.Item.Meta
                avatar={
                  <Badge dot={member.isSharing} color="red">
                    <Avatar icon={<UserOutlined />} />
                  </Badge>
                }
                title={
                  <div className="user-info">
                    <Text>{member.nickname}</Text>
                    {member.isSharing && (
                      <VideoCameraOutlined className="sharing-icon" />
                    )}
                  </div>
                }
                description={member.isSharing ? '正在共享屏幕' : '在线'}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default UserList;
