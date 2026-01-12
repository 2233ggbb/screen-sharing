/**
 * 流状态管理
 */

import { create } from 'zustand';
import { MediaStream } from 'react-native-webrtc';
import { StreamInfo } from '@screen-sharing/shared';

// 远程流信息
interface RemoteStream {
  userId: string;
  stream: MediaStream;
  streamInfo: StreamInfo;
}

interface StreamState {
  // 状态
  localStream: MediaStream | null;
  remoteStreams: Map<string, RemoteStream>;
  isSharing: boolean;
  shareQuality: 'LOW' | 'MEDIUM' | 'HIGH';

  // Actions
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (userId: string, stream: MediaStream, streamInfo: StreamInfo) => void;
  removeRemoteStream: (userId: string) => void;
  updateRemoteStreamInfo: (userId: string, streamInfo: StreamInfo) => void;
  setIsSharing: (sharing: boolean) => void;
  setShareQuality: (quality: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  clearAllStreams: () => void;
  reset: () => void;
}

const initialState = {
  localStream: null,
  remoteStreams: new Map<string, RemoteStream>(),
  isSharing: false,
  shareQuality: 'MEDIUM' as const,
};

export const useStreamStore = create<StreamState>((set, get) => ({
  ...initialState,

  setLocalStream: (stream: MediaStream | null) => set({ localStream: stream }),

  addRemoteStream: (userId: string, stream: MediaStream, streamInfo: StreamInfo) =>
    set((state) => {
      const newMap = new Map(state.remoteStreams);
      newMap.set(userId, { userId, stream, streamInfo });
      return { remoteStreams: newMap };
    }),

  removeRemoteStream: (userId: string) =>
    set((state) => {
      const newMap = new Map(state.remoteStreams);
      // 停止流轨道
      const existing = newMap.get(userId);
      if (existing) {
        existing.stream.getTracks().forEach((track: any) => track.stop());
      }
      newMap.delete(userId);
      return { remoteStreams: newMap };
    }),

  updateRemoteStreamInfo: (userId: string, streamInfo: StreamInfo) =>
    set((state) => {
      const newMap = new Map(state.remoteStreams);
      const existing = newMap.get(userId);
      if (existing) {
        newMap.set(userId, { ...existing, streamInfo });
      }
      return { remoteStreams: newMap };
    }),

  setIsSharing: (sharing: boolean) => set({ isSharing: sharing }),

  setShareQuality: (quality: 'LOW' | 'MEDIUM' | 'HIGH') =>
    set({ shareQuality: quality }),

  clearAllStreams: () =>
    set((state) => {
      // 停止本地流
      if (state.localStream) {
        state.localStream.getTracks().forEach((track: any) => track.stop());
      }

      // 停止所有远程流
      state.remoteStreams.forEach((remote) => {
        remote.stream.getTracks().forEach((track: any) => track.stop());
      });

      return {
        localStream: null,
        remoteStreams: new Map(),
        isSharing: false,
      };
    }),

  reset: () =>
    set((state) => {
      // 清理流
      if (state.localStream) {
        state.localStream.getTracks().forEach((track: any) => track.stop());
      }
      state.remoteStreams.forEach((remote) => {
        remote.stream.getTracks().forEach((track: any) => track.stop());
      });

      return initialState;
    }),
}));

// 辅助 hooks
export const useLocalStream = () => useStreamStore((state) => state.localStream);
export const useRemoteStreams = () => useStreamStore((state) => state.remoteStreams);
export const useIsSharing = () => useStreamStore((state) => state.isSharing);
