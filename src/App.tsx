import React, { useState, useCallback } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelConfig } from './components/ChannelConfig';
import type { Channel } from './types';

// Example channels - replace URLs with actual m3u8 streams
const initialChannels: Channel[] = [
  { id: '1', name: 'Channel 1', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', volume: 0 },
  { id: '2', name: 'Channel 2', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', volume: 0 },
  { id: '3', name: 'Channel 3', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', volume: 0 },
  { id: '4', name: 'Channel 4', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', volume: 0 },
  { id: '5', name: 'Channel 5', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', volume: 0 },
  { id: '6', name: 'Channel 6', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', volume: 0 },
  { id: '7', name: 'Channel 7', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', volume: 0 },
  { id: '8', name: 'Channel 8', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', volume: 0 },
  { id: '9', name: 'Channel 9', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', volume: 0 },
];

function App() {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);

  const handleVolumeChange = useCallback((id: string, volume: number) => {
    setChannels(prev =>
      prev.map(channel =>
        channel.id === id ? { ...channel, volume } : channel
      )
    );
  }, []);

  const handleFullscreenClick = useCallback((id: string) => {
    setFullscreenId(prev => (prev === id ? null : id));
  }, []);

  const handleChannelConfigSave = useCallback((updatedChannels: Channel[]) => {
    setChannels(updatedChannels);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6">
      <div className="max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map(channel => (
            <VideoPlayer
              key={channel.id}
              channel={channel}
              isFullscreen={channel.id === fullscreenId}
              onVolumeChange={handleVolumeChange}
              onFullscreenClick={handleFullscreenClick}
            />
          ))}
        </div>
      </div>
      <ChannelConfig channels={channels} onSave={handleChannelConfigSave} />
    </div>
  );
}

export default App;