/**
 * 用户列表组件
 * 显示房间成员列表
 */

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Avatar, Text, Chip } from 'react-native-paper';
import { User } from '@screen-sharing/shared';
import { spacing, borderRadius } from '../theme';

interface UserListProps {
  members: User[];
  currentUserId: string;
}

const UserList: React.FC<UserListProps> = ({ members, currentUserId }) => {
  const renderItem = ({ item }: { item: User }) => {
    const isCurrentUser = item.id === currentUserId;
    const isSharing = item.isSharing;

    return (
      <List.Item
        style={styles.listItem}
        title={
          <View style={styles.titleContainer}>
            <Text variant="bodyLarge" style={styles.nickname}>
              {item.nickname}
            </Text>
            {isCurrentUser && (
              <Chip compact style={styles.meChip} textStyle={styles.chipText}>
                我
              </Chip>
            )}
          </View>
        }
        description={isSharing ? '正在共享屏幕' : ''}
        left={(props) => (
          <Avatar.Text
            {...props}
            size={40}
            label={item.nickname.charAt(0).toUpperCase()}
            style={[
              styles.avatar,
              isSharing && styles.avatarSharing,
            ]}
          />
        )}
        right={() =>
          isSharing ? (
            <Chip
              icon="monitor-share"
              compact
              style={styles.sharingChip}
              textStyle={styles.sharingChipText}
            >
              共享中
            </Chip>
          ) : null
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            暂无成员
          </Text>
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
  },
  list: {
    flex: 1,
  },
  listItem: {
    paddingVertical: spacing.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nickname: {
    fontWeight: '500',
  },
  meChip: {
    height: 20,
    backgroundColor: '#1890ff',
  },
  chipText: {
    fontSize: 10,
    color: '#fff',
  },
  avatar: {
    backgroundColor: '#1890ff',
  },
  avatarSharing: {
    backgroundColor: '#52c41a',
  },
  sharingChip: {
    backgroundColor: '#f6ffed',
    height: 28,
    alignSelf: 'center',
  },
  sharingChipText: {
    fontSize: 12,
    color: '#52c41a',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: 'rgba(0, 0, 0, 0.45)',
  },
});

export default UserList;
