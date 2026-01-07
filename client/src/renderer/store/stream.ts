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
  
  addStream: (stream: StreamInfo) => void;
  removeStream: (userId: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setFocusedStream: (userId: string | null) => void;
  getStream: (userId: string) => StreamInfo | undefined;
  reset: () => void;
}

const initialState = {
  streams: [],
  localStream: null,
  focusedStreamUserId: null,
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
