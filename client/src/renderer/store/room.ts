import { create } from 'zustand';
import type { User, RoomInfo } from '@shared/types';

interface RoomMember extends User {
  isSharing: boolean;
}

interface RoomState {
  roomInfo: RoomInfo | null;
  members: RoomMember[];
  isConnected: boolean;
  isHost: boolean;
  
  setRoomInfo: (info: RoomInfo) => void;
  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  updateMember: (userId: string, updates: Partial<RoomMember>) => void;
  setConnected: (connected: boolean) => void;
  setHost: (isHost: boolean) => void;
  reset: () => void;
}

const initialState = {
  roomInfo: null,
  members: [],
  isConnected: false,
  isHost: false,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,
  
  setRoomInfo: (info) => set({ roomInfo: info }),
  
  setMembers: (members) => set({ members }),
  
  addMember: (member) => set((state) => ({
    members: [...state.members, member],
  })),
  
  removeMember: (userId) => set((state) => ({
    members: state.members.filter((m) => m.id !== userId),
  })),
  
  updateMember: (userId, updates) => set((state) => ({
    members: state.members.map((m) =>
      m.id === userId ? { ...m, ...updates } : m
    ),
  })),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setHost: (isHost) => set({ isHost }),
  
  reset: () => set(initialState),
}));
