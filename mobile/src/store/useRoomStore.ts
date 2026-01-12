/**
 * 房间状态管理
 */

import { create } from 'zustand';
import { Room, User } from '@screen-sharing/shared';

interface RoomState {
  // 状态
  currentRoom: Room | null;
  members: User[];
  isInRoom: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentRoom: (room: Room) => void;
  clearRoom: () => void;
  setMembers: (members: User[]) => void;
  addMember: (user: User) => void;
  removeMember: (userId: string) => void;
  updateMember: (userId: string, updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentRoom: null,
  members: [],
  isInRoom: false,
  isLoading: false,
  error: null,
};

export const useRoomStore = create<RoomState>((set, get) => ({
  ...initialState,

  setCurrentRoom: (room: Room) =>
    set({
      currentRoom: room,
      members: room.members || [],
      isInRoom: true,
      error: null,
    }),

  clearRoom: () =>
    set({
      currentRoom: null,
      members: [],
      isInRoom: false,
    }),

  setMembers: (members: User[]) => set({ members }),

  addMember: (user: User) =>
    set((state) => {
      // 避免重复添加
      if (state.members.find((m) => m.id === user.id)) {
        return state;
      }
      return { members: [...state.members, user] };
    }),

  removeMember: (userId: string) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== userId),
    })),

  updateMember: (userId: string, updates: Partial<User>) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === userId ? { ...m, ...updates } : m
      ),
    })),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  reset: () => set(initialState),
}));
