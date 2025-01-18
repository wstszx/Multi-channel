import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Volume2, VolumeX, Maximize2, RefreshCw, Shuffle } from 'lucide-react';
import type { PlayerProps } from '../types';
import { useStore } from '../store/useStore';

export function VideoPlayer({ 
  channel, 
  isFullscreen, 
  onVolumeChange, 
  onFullscreenClick,
  onSourceChange,
  onRandomChannel,
  isRandomMode
}: PlayerProps) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hls, setHls] = useState<Hls | null>(null);
  const currentChannel = useStore(state => state.currentChannel);
  const setCurrentChannel = useStore(state => state.setCurrentChannel);

  useEffect(() => {
    setError(null);
  }, [channel.name]);

  useEffect(() => {
    if (!currentChannel && channel.id === '1') {
      setCurrentChannel(channel);
      setIsMuted(false);
    }
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      const shouldBeMuted = currentChannel?.id !== channel.id;
      playerRef.current.muted = shouldBeMuted;
      setIsMuted(shouldBeMuted);
      
      if (!shouldBeMuted) {
        playerRef.current.volume = channel.volume;
      }
    }
  }, [currentChannel, channel.id, channel.volume]);

  useEffect(() => {
    if (isFullscreen && containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (!playerRef.current) return;

    const video = playerRef.current;
    const currentUrl = channel.urls[channel.currentSourceIndex ?? 0];

    if (hls) {
      hls.destroy();
    }

    if (Hls.isSupported()) {
      const newHls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      newHls.attachMedia(video);
      newHls.on(Hls.Events.MEDIA_ATTACHED, () => {
        newHls.loadSource(currentUrl);
      });

      newHls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error:', data);
              setError('网络错误，正在尝试切换源...');
              onSourceChange?.(channel.id, ((channel.currentSourceIndex ?? 0) + 1) % channel.urls.length);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error:', data);
              newHls.recoverMediaError();
              break;
            default:
              console.error('Fatal error:', data);
              newHls.destroy();
              break;
          }
        }
      });

      setHls(newHls);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentUrl;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [channel.urls, channel.currentSourceIndex]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const volume = parseFloat(e.target.value);
    if (playerRef.current) {
      playerRef.current.volume = volume;
      onVolumeChange(channel.id, volume);
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        setCurrentChannel(channel);
        const defaultVolume = 0.5;
        playerRef.current.volume = defaultVolume;
        onVolumeChange(channel.id, defaultVolume);
      } else if (currentChannel?.id === channel.id) {
        setCurrentChannel(null);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'
      }`}
    >
      <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/70 to-transparent z-10 flex items-center gap-2">
        {channel.logo && (
          <img src={channel.logo} alt={channel.name} className="w-6 h-6 object-contain" />
        )}
        <span className="text-white text-sm font-medium truncate">
          {channel.name}
          {channel.urls.length > 1 && ` (源 ${(channel.currentSourceIndex ?? 0) + 1}/${channel.urls.length})`}
        </span>
        <div className="flex-grow" />
        {isRandomMode && (
          <button
            onClick={() => onRandomChannel?.(channel.id)}
            className="text-white hover:text-gray-300 transition-colors px-2"
            title="随机切换频道"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        )}
        {channel.urls.length > 1 && (
          <button
            onClick={() => onSourceChange?.(channel.id, ((channel.currentSourceIndex ?? 0) + 1) % channel.urls.length)}
            className="text-white hover:text-gray-300 transition-colors px-2"
            title="切换源"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => onFullscreenClick(channel.id)}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full h-full flex items-center justify-center">
        <video
          ref={playerRef}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          controls
          muted={isMuted}
        />
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMute}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          {!isMuted && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={channel.volume}
              onChange={handleVolumeChange}
              className="w-24 accent-blue-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}