import React, { useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import type { PlayerProps } from '../types';

export function VideoPlayer({ 
  channel, 
  isFullscreen, 
  onVolumeChange, 
  onFullscreenClick,
  onSourceChange,
  onAuthRequired,
  authCredentials
}: PlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFullscreen && playerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    }
  }, [isFullscreen]);

  const handleSourceChange = useCallback(() => {
    if (onSourceChange && channel.urls.length > 1) {
      const nextIndex = ((channel.currentSourceIndex ?? 0) + 1) % channel.urls.length;
      onSourceChange(channel.id, nextIndex);
    }
  }, [channel.id, channel.urls.length, channel.currentSourceIndex, onSourceChange]);

  const handleError = useCallback((e: any) => {
    console.error('Video error:', e);
    
    // 当遇到任何错误（包括认证错误）时，直接切换到下一个源
    handleSourceChange();
  }, [handleSourceChange]);

  const currentUrl = channel.urls[channel.currentSourceIndex ?? 0];

  return (
    <div
      ref={playerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'
      }`}
    >
      <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/70 to-transparent z-10 flex items-center gap-2">
        {channel.logo && (
          <img src={channel.logo} alt={channel.name} className="w-6 h-6 object-contain" />
        )}
        <span className="text-white text-sm font-medium">
          {channel.name}
          {channel.urls.length > 1 && ` (源 ${(channel.currentSourceIndex ?? 0) + 1}/${channel.urls.length})`}
        </span>
        <div className="flex-grow" />
        {channel.urls.length > 1 && (
          <button
            onClick={handleSourceChange}
            className="text-white hover:text-gray-300 transition-colors px-2"
            title="切换源"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onFullscreenClick(channel.id)}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            {isFullscreen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            )}
          </svg>
        </button>
      </div>
      <ReactPlayer
        url={currentUrl}
        width="100%"
        height="100%"
        playing
        controls
        volume={channel.volume}
        onVolumeChange={(e: any) => onVolumeChange(channel.id, e.target.volume)}
        onError={handleError}
        config={{
          file: {
            forceHLS: true,
            hlsOptions: {
              xhrSetup: function(xhr: XMLHttpRequest) {
                xhr.withCredentials = true;
              }
            }
          }
        }}
      />
    </div>
  );
}