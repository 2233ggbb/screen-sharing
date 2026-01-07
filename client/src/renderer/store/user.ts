import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../utils/constants';

interface UserState {
  userId: string;
  nickname: string;
  avatar?: string;
  
  setUserId: (userId: string) => void;
  setNickname: (nickname: string) => void;
  setAvatar: (avatar: string) => void;
  loadFromStorage: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: uuidv4(),
  nickname: '',
  avatar: undefined,
  
  setUserId: (userId) => {
    set({ userId });
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
    const nickname = localStorage.getItem(STORAGE_KEYS.USER_NICKNAME) || '';
    const avatar = localStorage.getItem(STORAGE_KEYS.USER_AVATAR) || undefined;
    set({ nickname, avatar });
  },
}));
