import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * 获取或创建持久化的用户 ID
 * 如果 localStorage 中已有 userId，则使用它
 * 否则生成新的 userId 并保存
 */
const getOrCreateUserId = (): string => {
  const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (storedUserId) {
    return storedUserId;
  }
  const newUserId = uuidv4();
  localStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
  return newUserId;
};

interface UserState {
  userId: string;
  nickname: string;
  avatar?: string;
  
  setUserId: (userId: string) => void;
  setNickname: (nickname: string) => void;
  setAvatar: (avatar: string) => void;
  loadFromStorage: () => void;
  /**
   * 重置用户 ID（生成新的 ID）
   * 用于需要更换身份的场景
   */
  resetUserId: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: getOrCreateUserId(),
  nickname: '',
  avatar: undefined,
  
  setUserId: (userId) => {
    set({ userId });
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  },
  
  setNickname: (nickname) => {
    set({ nickname });
    localStorage.setItem(STORAGE_KEYS.USER_NICKNAME, nickname);
  },
  
  setAvatar: (avatar) => {
    set({ avatar });
    localStorage.setItem(STORAGE_KEYS.USER_AVATAR, avatar);
  },
  
  loadFromStorage: () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || getOrCreateUserId();
    const nickname = localStorage.getItem(STORAGE_KEYS.USER_NICKNAME) || '';
    const avatar = localStorage.getItem(STORAGE_KEYS.USER_AVATAR) || undefined;
    set({ userId, nickname, avatar });
  },

  resetUserId: () => {
    const newUserId = uuidv4();
    localStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
    set({ userId: newUserId });
  },
}));
