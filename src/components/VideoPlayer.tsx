import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Volume2, VolumeX, Maximize2, RefreshCw, Shuffle, List, Search } from 'lucide-react';
import type { PlayerProps } from '../types';
import { useStore } from '../store/useStore';
import { t } from '../locales';

export function VideoPlayer({ 
  channel, 
  isFullscreen, 
  onVolumeChange, 
  onFullscreenClick,
  onSourceChange,
  onRandomChannel,
  onChannelSwitch,
  isRandomMode,
  language,
  allChannels
}: PlayerProps) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hls, setHls] = useState<Hls | null>(null);
  const [showChannelList, setShowChannelList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const currentChannel = useStore(state => state.currentChannel);
  const setCurrentChannel = useStore(state => state.setCurrentChannel);

  const filteredChannels = allChannels.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.group?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        onFullscreenClick(channel.id);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen, channel.id, onFullscreenClick]);

  useEffect(() => {
    if (containerRef.current) {
      if (isFullscreen && !document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else if (!isFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
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
              setError(t(language, 'networkError'));
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
          {channel.urls.length > 1 && ` (${t(language, 'sourceDisplay', {
            current: (channel.currentSourceIndex ?? 0) + 1,
            total: channel.urls.length
          })})`}
        </span>
        <div className="flex-grow" />
        {!isRandomMode && (
          <button
            onClick={() => setShowChannelList(true)}
            className="text-white hover:text-gray-300 transition-colors px-2"
            title={t(language, 'channelList')}
          >
            <List className="w-5 h-5" />
          </button>
        )}
        {isRandomMode && (
          <button
            onClick={() => onRandomChannel?.(channel.id)}
            className="text-white hover:text-gray-300 transition-colors px-2"
            title={t(language, 'randomSwitch')}
          >
            <Shuffle className="w-5 h-5" />
          </button>
        )}
        {channel.urls.length > 1 && (
          <button
            onClick={() => onSourceChange?.(channel.id, ((channel.currentSourceIndex ?? 0) + 1) % channel.urls.length)}
            className="text-white hover:text-gray-300 transition-colors px-2"
            title={t(language, 'switchSource')}
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

      {showChannelList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowChannelList(false);
          }
        }}>
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-semibold">{t(language, 'channelList')}</h2>
              <button
                onClick={() => setShowChannelList(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(language, 'searchPlaceholder')}
                className="w-full px-10 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      onChannelSwitch(channel.id, ch);
                      setShowChannelList(false);
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-3 p-3 rounded ${
                      ch.id === channel.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'
                    } transition-colors text-left`}
                  >
                    {ch.logo && (
                      <img src={ch.logo} alt="" className="w-8 h-8 object-contain" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{ch.name}</div>
                      {ch.group && (
                        <div className="text-gray-400 text-sm truncate">{ch.group}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}