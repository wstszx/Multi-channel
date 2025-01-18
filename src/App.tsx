import { useState, useCallback, useEffect } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import type { Channel } from './types';
import { parseM3U } from './utils/m3uParser';

const DEFAULT_M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';
const CHANNELS_PER_PAGE = 9;

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [m3uUrl, setM3uUrl] = useState(DEFAULT_M3U_URL);
  const [tempUrl, setTempUrl] = useState(DEFAULT_M3U_URL);

  const loadChannels = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const m3uChannels = await parseM3U(url);
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
      setCurrentPage(0);
    } catch (error) {
      console.error('Error loading channels:', error);
      alert('加载频道列表失败，请检查链接是否正确');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels(m3uUrl);
  }, [loadChannels, m3uUrl]);

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

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => (prev + 1) % Math.ceil(channels.length / CHANNELS_PER_PAGE));
  }, [channels.length]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => {
      const totalPages = Math.ceil(channels.length / CHANNELS_PER_PAGE);
      return (prev - 1 + totalPages) % totalPages;
    });
  }, [channels.length]);

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setM3uUrl(tempUrl);
    setShowUrlInput(false);
  }, [tempUrl]);

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
            onClick={() => {
              setTempUrl(m3uUrl);
              setShowUrlInput(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            设置M3U链接
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
      {showUrlInput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-xl">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label htmlFor="m3u-url" className="block text-white mb-2">
                  M3U 链接地址
                </label>
                <input
                  type="url"
                  id="m3u-url"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入 M3U 链接地址"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  确定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;