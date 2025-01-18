import { useState, useCallback, useEffect } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelConfig } from './components/ChannelConfig';
import type { Channel } from './types';
import { parseM3U } from './utils/m3uParser';

const M3U_URL = 'https://raw.githubusercontent.com/wstszx/TV/refs/heads/master/output/result.m3u';
const CHANNELS_PER_PAGE = 9;

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    async function loadChannels() {
      try {
        const m3uChannels = await parseM3U(M3U_URL);
        const formattedChannels: Channel[] = m3uChannels.map((channel, index) => ({
          id: String(index + 1),
          name: channel.name,
          urls: [channel.url],
          volume: 0,
          logo: channel.logo,
          group: channel.group,
          currentSourceIndex: 0
        }));
        setChannels(formattedChannels);
      } catch (error) {
        console.error('Error loading channels:', error);
      } finally {
        setLoading(false);
      }
    }

    loadChannels();
  }, []);

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

  const handleSourceChange = useCallback((id: string, sourceIndex: number) => {
    setChannels(prev =>
      prev.map(channel =>
        channel.id === id ? { ...channel, currentSourceIndex: sourceIndex } : channel
      )
    );
  }, []);

  const handleChannelConfigSave = useCallback((updatedChannels: Channel[]) => {
    setChannels(updatedChannels);
    setShowConfig(false);
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => (prev + 1) % Math.ceil(channels.length / CHANNELS_PER_PAGE));
  }, [channels.length]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => {
      const totalPages = Math.ceil(channels.length / CHANNELS_PER_PAGE);
      return (prev - 1 + totalPages) % totalPages;
    });
  }, [channels.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading channels...</div>
      </div>
    );
  }

  const totalPages = Math.ceil(channels.length / CHANNELS_PER_PAGE);
  const currentChannels = channels.slice(
    currentPage * CHANNELS_PER_PAGE,
    (currentPage + 1) * CHANNELS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6 relative">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              上一页
            </button>
            <button
              onClick={handleNextPage}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              下一页
            </button>
            <span className="text-white px-4 py-2">
              {currentPage + 1} / {totalPages} 页
            </span>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            频道设置
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentChannels.map(channel => (
            <VideoPlayer
              key={channel.id}
              channel={channel}
              isFullscreen={channel.id === fullscreenId}
              onVolumeChange={handleVolumeChange}
              onFullscreenClick={handleFullscreenClick}
              onSourceChange={handleSourceChange}
            />
          ))}
        </div>
      </div>
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
          <div className="max-w-4xl mx-auto my-8 bg-gray-900 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-semibold">频道设置</h2>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-400 hover:text-white"
              >
                关闭
              </button>
            </div>
            <ChannelConfig channels={channels} onSave={handleChannelConfigSave} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;