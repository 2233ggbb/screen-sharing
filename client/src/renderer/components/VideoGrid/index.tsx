import React, { useRef, useEffect } from 'react';
import { Empty } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import { useStreamStore } from '../../store/stream';
import './index.less';

const VideoGrid: React.FC = () => {
  const { streams, focusedStreamUserId, setFocusedStream } = useStreamStore();

  if (streams.length === 0) {
    return (
      <div className="video-grid-empty">
        <Empty
          image={<VideoCameraOutlined style={{ fontSize: 64 }} />}
          description="暂无屏幕共享"
        />
      </div>
    );
  }

  // 焦点模式
  if (focusedStreamUserId) {
    const focusedStream = streams.find((s) => s.userId === focusedStreamUserId);
    const otherStreams = streams.filter((s) => s.userId !== focusedStreamUserId);

    return (
      <div className="video-grid-focus">
        <div className="focus-main">
          {focusedStream && (
            <VideoPlayer
              stream={focusedStream.stream}
              nickname={focusedStream.nickname}
              onDoubleClick={() => setFocusedStream(null)}
            />
          )}
        </div>
        {otherStreams.length > 0 && (
          <div className="focus-sidebar">
            {otherStreams.map((streamInfo) => (
              <div
                key={streamInfo.userId}
                className="sidebar-item"
                onClick={() => setFocusedStream(streamInfo.userId)}
              >
                <VideoPlayer
                  stream={streamInfo.stream}
                  nickname={streamInfo.nickname}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 网格模式 - 根据屏幕数量动态调整
  const getGridClass = () => {
    const count = streams.length;
    if (count === 1) {
      return 'video-grid grid-1x1';
    } else if (count <= 4) {
      return 'video-grid grid-2x2';
    } else if (count <= 9) {
      return 'video-grid grid-3x3';
    } else {
      return 'video-grid grid-4x4';
    }
  };

  return (
    <div className={getGridClass()}>
      {streams.map((streamInfo) => (
        <div
          key={streamInfo.userId}
          className="grid-item"
          onDoubleClick={() => setFocusedStream(streamInfo.userId)}
        >
          <VideoPlayer
            stream={streamInfo.stream}
            nickname={streamInfo.nickname}
          />
        </div>
      ))}
    </div>
  );
};

interface VideoPlayerProps {
  stream: MediaStream;
  nickname: string;
  onDoubleClick?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream, nickname, onDoubleClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-player" onDoubleClick={onDoubleClick}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="video-element"
      />
      <div className="video-nickname">{nickname}</div>
    </div>
  );
};

export default VideoGrid;
