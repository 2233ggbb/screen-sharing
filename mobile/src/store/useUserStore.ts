/**
 * 用户状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  // 状态
  userId: string | null;
  nickname: string;
  avatar: string | null;
  isConnected: boolean;

  // Actions
  setUserId: (userId: string) => void;
  setNickname: (nickname: string) => void;
  setAvatar: (avatar: string | null) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

const initialState = {
  userId: null,
  nickname: '',
  avatar: null,
  isConnected: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setUserId: (userId: string) => set({ userId }),

      setNickname: (nickname: string) => set({ nickname }),

      setAvatar: (avatar: string | null) => set({ avatar }),

      setConnected: (connected: boolean) => set({ isConnected: connected }),

      reset: () => set(initialState),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        nickname: state.nickname,
        avatar: state.avatar,
      }),
    }
  )
);
