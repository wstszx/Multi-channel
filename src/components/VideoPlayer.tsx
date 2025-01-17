import React, { useCallback, useState } from 'react';
import ReactPlayer from 'react-player';
import { Volume2, Maximize2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import Hls from 'hls.js';
import type { PlayerProps } from '../types';

export const VideoPlayer: React.FC<PlayerProps> = ({
  channel,
  isFullscreen,
  onVolumeChange,
  onFullscreenClick,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange(channel.id, Number(e.target.value));
    },
    [channel.id, onVolumeChange]
  );

  const handleError = (e: any) => {
    console.error('Video playback error:', e);
    setError('Failed to load video stream');
  };

  const handleReady = () => {
    setIsLoading(false);
    setError(null);
  };

  return (
    <div
      className={clsx(
        'relative group bg-gray-900 rounded-lg overflow-hidden transition-all duration-300',
        isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'
      )}
    >
      {Hls.isSupported() ? (
        <ReactPlayer
          url={channel.url}
          width="100%"
          height="100%"
          playing
          volume={channel.volume}
          muted={channel.volume === 0}
          onError={handleError}
          onReady={handleReady}
          config={{
            file: {
              forceHLS: true,
              hlsVersion: '1.5.7',
              hlsOptions: {
                enableWorker: true,
                debug: false,
                lowLatencyMode: true,
                backBufferLength: 90,
                xhrSetup: function(xhr: XMLHttpRequest) {
                  xhr.withCredentials = false;
                }
              },
            },
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Your browser doesn't support HLS playback</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
          <div className="text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">{channel.name}</span>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-white" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={channel.volume}
                onChange={handleVolumeChange}
                className="w-24 accent-blue-500"
              />
            </div>
            
            <button
              onClick={() => onFullscreenClick(channel.id)}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};