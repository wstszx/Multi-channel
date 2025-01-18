import { useState, useCallback, useEffect } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { Shuffle, Globe2 } from 'lucide-react';
import type { Channel } from './types';
import { parseM3U } from './utils/m3uParser';
import { Language, t } from './locales';

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
  const [pageInput, setPageInput] = useState('1');
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [randomChannels, setRandomChannels] = useState<Channel[]>([]);
  const [language, setLanguage] = useState<Language>('zh');

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
      alert(t(language, 'loadError'));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadChannels(m3uUrl);
  }, [loadChannels, m3uUrl]);

  const handleVolumeChange = useCallback((id: string, volume: number) => {
    setChannels(prev =>
      prev.map(channel =>
        channel.id === id ? { ...channel, volume } : channel
      )
    );
    if (isRandomMode) {
      setRandomChannels(prev =>
        prev.map(channel =>
          channel.id === id ? { ...channel, volume } : channel
        )
      );
    }
  }, [isRandomMode]);

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

  const handleRandomChannel = useCallback((id: string) => {
    const availableChannels = channels.filter(c => c.id !== id);
    if (availableChannels.length > 0) {
      const randomChannel = availableChannels[Math.floor(Math.random() * availableChannels.length)];
      
      setChannels(prev =>
        prev.map(channel =>
          channel.id === id ? { ...randomChannel, id, volume: channel.volume } : channel
        )
      );

      if (isRandomMode) {
        setRandomChannels(prev =>
          prev.map(channel =>
            channel.id === id ? { ...randomChannel, id, volume: channel.volume } : channel
          )
        );
      }
    }
  }, [channels, isRandomMode]);

  const toggleRandomMode = useCallback(() => {
    if (!isRandomMode) {
      const shuffled = [...channels].sort(() => Math.random() - 0.5);
      const selectedChannels = shuffled.slice(0, CHANNELS_PER_PAGE).map(channel => {
        const originalChannel = channels.find(c => c.id === channel.id);
        return originalChannel || channel;
      });
      setRandomChannels(selectedChannels);
    }
    setIsRandomMode(!isRandomMode);
  }, [channels, isRandomMode]);

  const handleNextPage = useCallback(() => {
    if (isRandomMode) {
      const shuffled = [...channels].sort(() => Math.random() - 0.5);
      const selectedChannels = shuffled.slice(0, CHANNELS_PER_PAGE).map(channel => {
        const originalChannel = channels.find(c => c.id === channel.id);
        return originalChannel || channel;
      });
      setRandomChannels(selectedChannels);
    } else {
      setCurrentPage(prev => (prev + 1) % Math.ceil(channels.length / CHANNELS_PER_PAGE));
    }
  }, [channels.length, isRandomMode, channels]);

  const handlePrevPage = useCallback(() => {
    if (isRandomMode) {
      const shuffled = [...channels].sort(() => Math.random() - 0.5);
      const selectedChannels = shuffled.slice(0, CHANNELS_PER_PAGE).map(channel => {
        const originalChannel = channels.find(c => c.id === channel.id);
        return originalChannel || channel;
      });
      setRandomChannels(selectedChannels);
    } else {
      setCurrentPage(prev => {
        const totalPages = Math.ceil(channels.length / CHANNELS_PER_PAGE);
        return (prev - 1 + totalPages) % totalPages;
      });
    }
  }, [channels.length, isRandomMode, channels]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  }, []);

  const handlePageSubmit = useCallback(() => {
    const value = parseInt(pageInput);
    if (!isNaN(value) && value > 0) {
      const totalPages = Math.ceil(channels.length / CHANNELS_PER_PAGE);
      const newPage = Math.min(value - 1, totalPages - 1);
      setCurrentPage(newPage);
    }
  }, [pageInput, channels.length]);

  useEffect(() => {
    setPageInput((currentPage + 1).toString());
  }, [currentPage]);

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setM3uUrl(tempUrl);
    setShowUrlInput(false);
  }, [tempUrl]);

  if (loading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">{t(language, 'loading')}</div>
      </div>
    );
  }

  const totalPages = Math.ceil(channels.length / CHANNELS_PER_PAGE);
  const displayedChannels = isRandomMode
    ? randomChannels
    : channels.slice(
        currentPage * CHANNELS_PER_PAGE,
        (currentPage + 1) * CHANNELS_PER_PAGE
      );

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      <div className="max-w-[1920px] w-full mx-auto px-4 md:px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <button
              onClick={handlePrevPage}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              {t(language, 'prevPage')}
            </button>
            <button
              onClick={handleNextPage}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              {t(language, 'nextPage')}
            </button>
            {!isRandomMode && (
              <div className="flex items-center gap-2 text-white">
                <span>{t(language, 'jumpTo')}</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePageSubmit();
                    }
                  }}
                  className="w-16 px-2 py-1 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center"
                />
                <span>/ {totalPages} {t(language, 'page')}</span>
                <button
                  onClick={handlePageSubmit}
                  className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                  {t(language, 'jump')}
                </button>
              </div>
            )}
            <button
              onClick={toggleRandomMode}
              className={`px-4 py-2 rounded transition-colors ${
                isRandomMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-500' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
              title={isRandomMode ? t(language, 'normalMode') : t(language, 'randomMode')}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <div className="text-white ml-4">
              {t(language, 'totalChannels', { count: channels.length })}
              {isRandomMode && t(language, 'randomDisplay')}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage(prev => prev === 'zh' ? 'en' : 'zh')}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <Globe2 className="w-5 h-5" />
              {t(language, 'language')}
            </button>
            <button
              onClick={() => {
                setTempUrl(m3uUrl);
                setShowUrlInput(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              {t(language, 'setM3uUrl')}
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1920px] w-full mx-auto px-4 md:px-6">
          <div className="grid h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {displayedChannels.map(channel => (
              <VideoPlayer
                key={channel.id}
                channel={channel}
                isFullscreen={channel.id === fullscreenId}
                onVolumeChange={handleVolumeChange}
                onFullscreenClick={handleFullscreenClick}
                onSourceChange={handleSourceChange}
                onRandomChannel={handleRandomChannel}
                isRandomMode={isRandomMode}
                language={language}
              />
            ))}
          </div>
        </div>
      </div>
      {showUrlInput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-xl">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label htmlFor="m3u-url" className="block text-white mb-2">
                  {t(language, 'm3uUrlLabel')}
                </label>
                <input
                  type="url"
                  id="m3u-url"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder={t(language, 'm3uUrlPlaceholder')}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  {t(language, 'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  {t(language, 'confirm')}
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