import { create } from 'zustand';

interface StreamInfo {
  userId: string;
  stream: MediaStream;
  nickname: string;
  isLocal: boolean;
}

interface StreamState {
  streams: StreamInfo[];
  localStream: MediaStream | null;
  focusedStreamUserId: string | null;
  /** 是否共享系统音频 */
  shareSystemAudio: boolean;
  /** 是否处于全屏模式 */
  isFullscreen: boolean;
  
  addStream: (stream: StreamInfo) => void;
  removeStream: (userId: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setFocusedStream: (userId: string | null) => void;
  setShareSystemAudio: (enabled: boolean) => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  getStream: (userId: string) => StreamInfo | undefined;
  reset: () => void;
}

const defaultShareSystemAudio =
  typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);

const initialState = {
  streams: [] as StreamInfo[],
  localStream: null as MediaStream | null,
  focusedStreamUserId: null as string | null,
  // 系统音频捕获在 Windows 支持更好；其它平台默认关闭，避免触发 NotReadableError
  shareSystemAudio: defaultShareSystemAudio,
  isFullscreen: false,
};

export const useStreamStore = create<StreamState>((set, get) => ({
  ...initialState,
  
  addStream: (streamInfo) => set((state) => {
    const exists = state.streams.some((s) => s.userId === streamInfo.userId);
    if (exists) {
      return {
        streams: state.streams.map((s) =>
          s.userId === streamInfo.userId ? streamInfo : s
        ),
      };
    }
    return { streams: [...state.streams, streamInfo] };
  }),
  
  removeStream: (userId) => set((state) => {
    const stream = state.streams.find((s) => s.userId === userId);
    if (stream?.stream) {
      // 停止所有tracks
      stream.stream.getTracks().forEach((track) => track.stop());
    }
    return {
      streams: state.streams.filter((s) => s.userId !== userId),
      focusedStreamUserId:
        state.focusedStreamUserId === userId ? null : state.focusedStreamUserId,
    };
  }),
  
  setLocalStream: (stream) => {
    const currentStream = get().localStream;
    if (currentStream && currentStream !== stream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }
    set({ localStream: stream });
  },
  
  setFocusedStream: (userId) => set({ focusedStreamUserId: userId }),

  setShareSystemAudio: (enabled) => set({ shareSystemAudio: enabled }),

  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  
  getStream: (userId) => {
    return get().streams.find((s) => s.userId === userId);
  },
  
  reset: () => {
    const { streams, localStream } = get();
    
    // 停止所有流
    streams.forEach((s) => {
      s.stream.getTracks().forEach((track) => track.stop());
    });
    
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    
    set(initialState);
  },
}));
