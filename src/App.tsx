import React, { useState, useEffect, useCallback } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelValidator } from './components/ChannelValidator';
import { Shuffle, Grid, List, Search } from 'lucide-react';
import type { Channel, Language, M3UChannel } from './types';
import { t } from './locales';
import { useStore } from './store/useStore';
import { parseM3U } from './utils/m3uParser';
import { Settings } from './components/Settings';

const DEFAULT_M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';
const DEFAULT_CHANNELS_PER_PAGE = 9;
const MIN_CHANNELS_PER_PAGE = 1;
const MAX_CHANNELS_PER_PAGE = 9;
const LANGUAGE_STORAGE_KEY = 'preferred_language';
const M3U_URL_STORAGE_KEY = 'last_m3u_url';
const CHANNELS_PER_PAGE_KEY = 'channels_per_page';

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [m3uUrl, setM3uUrl] = useState(() => {
    const savedUrl = localStorage.getItem(M3U_URL_STORAGE_KEY);
    return savedUrl || DEFAULT_M3U_URL;
  });
  const [tempUrl, setTempUrl] = useState(m3uUrl);
  const [pageInput, setPageInput] = useState('1');
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [randomChannels, setRandomChannels] = useState<Channel[]>([]);
  const [channelsPerPage, setChannelsPerPage] = useState(() => {
    const saved = localStorage.getItem(CHANNELS_PER_PAGE_KEY);
    const parsed = saved ? parseInt(saved) : DEFAULT_CHANNELS_PER_PAGE;
    return parsed >= MIN_CHANNELS_PER_PAGE && parsed <= MAX_CHANNELS_PER_PAGE 
      ? parsed 
      : DEFAULT_CHANNELS_PER_PAGE;
  });
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (savedLanguage === 'en' || savedLanguage === 'zh') ? savedLanguage : 'zh';
  });
  const [showChannelList, setShowChannelList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelListPage, setChannelListPage] = useState(1);
  const CHANNELS_PER_LIST_PAGE = 15;

  const store = useStore();

  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  // Save M3U URL when it changes
  useEffect(() => {
    localStorage.setItem(M3U_URL_STORAGE_KEY, m3uUrl);
  }, [m3uUrl]);

  // Save channels per page when it changes
  useEffect(() => {
    localStorage.setItem(CHANNELS_PER_PAGE_KEY, channelsPerPage.toString());
  }, [channelsPerPage]);

  const loadChannels = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const m3uChannels = await parseM3U(url);
      const formattedChannels: Channel[] = m3uChannels.map((channel: M3UChannel, index: number) => ({
        id: String(index + 1),
        name: channel.name,
        urls: [channel.url],
        volume: 0,
        logo: channel.logo,
        group: channel.group,
        currentSourceIndex: 0
      }));
      store.setChannels(formattedChannels);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error loading channels:', error);
      alert(t(language, 'loadError'));
      // If loading fails with saved URL, try loading with default URL
      if (url !== DEFAULT_M3U_URL) {
        setM3uUrl(DEFAULT_M3U_URL);
      }
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadChannels(m3uUrl);
  }, [loadChannels, m3uUrl]);

  const handleVolumeChange = useCallback((channelId: string, volume: number) => {
    const updatedChannels = store.channels.map(channel => 
      channel.id === channelId ? { ...channel, volume } : channel
    );
    store.setChannels(updatedChannels);
  }, [store]);

  const handleFullscreenClick = useCallback((id: string) => {
    setFullscreenId(prev => (prev === id ? null : id));
  }, []);

  const handleSourceChange = useCallback((channelId: string, sourceIndex: number) => {
    const updatedChannels = store.channels.map(channel => 
      channel.id === channelId ? { ...channel, currentSourceIndex: sourceIndex } : channel
    );
    store.setChannels(updatedChannels);
  }, [store]);

  const handleRandomChannel = useCallback((channelId: string) => {
    const availableChannels = store.hideInvalidChannels && store.validChannelIds.length > 0
      ? store.channels.filter(ch => store.validChannelIds.includes(ch.id))
      : store.channels;
    
    const currentIndex = availableChannels.findIndex(ch => ch.id === channelId);
    const nextIndex = (currentIndex + 1) % availableChannels.length;
    const nextChannel = availableChannels[nextIndex];
    
    if (nextChannel) {
      handleChannelSwitch(channelId, nextChannel);
    }
  }, [store]);

  const handleChannelsPerPageChange = useCallback((value: number) => {
    if (value >= MIN_CHANNELS_PER_PAGE && value <= MAX_CHANNELS_PER_PAGE) {
      setChannelsPerPage(value);
      setCurrentPage(0); // Reset to first page when changing the number of channels per page
      if (isRandomMode) {
        const shuffled = [...store.channels].sort(() => Math.random() - 0.5);
        const selectedChannels = shuffled.slice(0, value).map(channel => {
          const originalChannel = store.channels.find(c => c.id === channel.id);
          return originalChannel || channel;
        });
        setRandomChannels(selectedChannels);
      }
    }
  }, [store.channels, isRandomMode]);

  const toggleRandomMode = useCallback(() => {
    if (!isRandomMode) {
      const shuffled = [...store.channels].sort(() => Math.random() - 0.5);
      const selectedChannels = shuffled.slice(0, channelsPerPage).map(channel => {
        const originalChannel = store.channels.find(c => c.id === channel.id);
        return originalChannel || channel;
      });
      setRandomChannels(selectedChannels);
    }
    setIsRandomMode(!isRandomMode);
  }, [store.channels, isRandomMode, channelsPerPage]);

  const handleNextPage = useCallback(() => {
    if (isRandomMode) {
      const shuffled = [...store.channels].sort(() => Math.random() - 0.5);
      const selectedChannels = shuffled.slice(0, channelsPerPage).map(channel => {
        const originalChannel = store.channels.find(c => c.id === channel.id);
        return originalChannel || channel;
      });
      setRandomChannels(selectedChannels);
    } else {
      setCurrentPage(prev => (prev + 1) % Math.ceil(store.channels.length / channelsPerPage));
    }
  }, [store.channels.length, isRandomMode, store.channels, channelsPerPage]);

  const handlePrevPage = useCallback(() => {
    if (isRandomMode) {
      const shuffled = [...store.channels].sort(() => Math.random() - 0.5);
      const selectedChannels = shuffled.slice(0, channelsPerPage).map(channel => {
        const originalChannel = store.channels.find(c => c.id === channel.id);
        return originalChannel || channel;
      });
      setRandomChannels(selectedChannels);
    } else {
      setCurrentPage(prev => {
        const totalPages = Math.ceil(store.channels.length / channelsPerPage);
        return (prev - 1 + totalPages) % totalPages;
      });
    }
  }, [store.channels.length, isRandomMode, store.channels, channelsPerPage]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  }, []);

  const handlePageSubmit = useCallback(() => {
    const value = parseInt(pageInput);
    if (!isNaN(value) && value > 0) {
      const totalPages = Math.ceil(store.channels.length / channelsPerPage);
      const newPage = Math.min(value - 1, totalPages - 1);
      setCurrentPage(newPage);
    }
  }, [pageInput, store.channels.length, channelsPerPage]);

  useEffect(() => {
    setPageInput((currentPage + 1).toString());
  }, [currentPage]);

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setM3uUrl(tempUrl);
    setShowUrlInput(false);
  }, [tempUrl]);

  const filteredChannels = store.channels.filter(channel => 
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.group?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalListPages = Math.ceil(filteredChannels.length / CHANNELS_PER_LIST_PAGE);
  const startIndex = (channelListPage - 1) * CHANNELS_PER_LIST_PAGE;
  const endIndex = startIndex + CHANNELS_PER_LIST_PAGE;
  const currentPageChannels = filteredChannels.slice(startIndex, endIndex);

  // Preload adjacent pages data
  useEffect(() => {
    if (showChannelList) {
      // Preload previous page
      if (channelListPage > 1) {
        const prevStartIndex = (channelListPage - 2) * CHANNELS_PER_LIST_PAGE;
        const prevEndIndex = prevStartIndex + CHANNELS_PER_LIST_PAGE;
        filteredChannels.slice(prevStartIndex, prevEndIndex);
      }
      // Preload next page
      if (channelListPage < totalListPages) {
        const nextStartIndex = channelListPage * CHANNELS_PER_LIST_PAGE;
        const nextEndIndex = nextStartIndex + CHANNELS_PER_LIST_PAGE;
        filteredChannels.slice(nextStartIndex, nextEndIndex);
      }
    }
  }, [channelListPage, showChannelList, filteredChannels, totalListPages]);

  // Reset page when search query changes
  useEffect(() => {
    setChannelListPage(1);
  }, [searchQuery]);

  const getPageForChannel = useCallback((channelId: string) => {
    const channelIndex = store.channels.findIndex(c => c.id === channelId);
    if (channelIndex === -1) return 0;
    return Math.floor(channelIndex / channelsPerPage);
  }, [store.channels, channelsPerPage]);

  const handleChannelClick = useCallback((channelId: string) => {
    const targetPage = getPageForChannel(channelId);
    setCurrentPage(targetPage);
    setShowChannelList(false);
  }, [getPageForChannel]);

  const handleChannelSwitch = useCallback((fromChannelId: string, toChannel: Channel) => {
    const updatedChannels = store.channels.map(channel =>
      channel.id === fromChannelId ? { ...toChannel, id: fromChannelId, volume: channel.volume } : channel
    );
    store.setChannels(updatedChannels);
  }, [store]);

  const handleValidationComplete = useCallback((validIds: string[]) => {
    store.setValidChannelIds(validIds);
  }, [store]);

  if (loading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">{t(language, 'loading')}</div>
      </div>
    );
  }

  const totalPages = Math.ceil(store.channels.length / channelsPerPage);
  const displayedChannels = isRandomMode
    ? randomChannels
    : store.channels.slice(
        currentPage * channelsPerPage,
        (currentPage + 1) * channelsPerPage
      );

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      <div className="max-w-[1920px] w-full mx-auto px-4 md:px-6 py-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex gap-2 items-center">
              <button
                onClick={handlePrevPage}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 shrink-0"
              >
                {t(language, 'prevPage')}
              </button>
              <button
                onClick={handleNextPage}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 shrink-0"
              >
                {t(language, 'nextPage')}
              </button>
              {!isRandomMode && (
                <div className="flex items-center gap-2 text-white shrink-0">
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
            </div>

            <div className="h-6 w-px bg-gray-700 mx-2" />

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 text-white">
                <Grid className="w-5 h-5" />
                <select
                  value={channelsPerPage}
                  onChange={(e) => handleChannelsPerPageChange(parseInt(e.target.value))}
                  className="bg-gray-800 rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1"
                >
                  {Array.from({ length: MAX_CHANNELS_PER_PAGE }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} {t(language, 'channelsPerPage')}
                    </option>
                  ))}
                </select>
              </div>
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
              <button
                onClick={() => setShowChannelList(true)}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                title={t(language, 'showAllChannels')}
              >
                <List className="w-5 h-5" />
                {t(language, 'allChannels')}
              </button>
            </div>

            <div className="h-6 w-px bg-gray-700 mx-2" />

            <div className="text-white shrink-0">
              {t(language, 'totalChannels', { count: store.channels.length })}
              {isRandomMode && t(language, 'randomDisplay', { count: channelsPerPage })}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <ChannelValidator
              channels={store.channels}
              language={language}
              onValidationComplete={handleValidationComplete}
            />
            <Settings
              language={language}
              onLanguageChange={() => setLanguage(prev => prev === 'zh' ? 'en' : 'zh')}
              onM3uUrlClick={() => {
                setTempUrl(m3uUrl);
                setShowUrlInput(true);
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1920px] w-full mx-auto px-4 md:px-6">
          <div className={`h-full flex flex-col ${
            channelsPerPage === 1 ? '' :
            channelsPerPage === 2 ? 'md:grid-cols-2' :
            channelsPerPage === 3 ? 'md:grid-cols-3' :
            channelsPerPage === 4 ? 'md:grid-cols-2 lg:grid-cols-2' :
            channelsPerPage <= 6 ? 'md:grid-cols-2 lg:grid-cols-3' :
            channelsPerPage <= 8 ? 'md:grid-cols-2 lg:grid-cols-4' :
            'md:grid-cols-3 lg:grid-cols-3'
          }`}>
            <div className="flex-1 min-h-0">
              <div className={`grid h-full gap-4 auto-rows-fr grid-cols-1 ${
                channelsPerPage === 1 ? '' :
                channelsPerPage === 2 ? 'md:grid-cols-2' :
                channelsPerPage === 3 ? 'md:grid-cols-3' :
                channelsPerPage === 4 ? 'md:grid-cols-2 lg:grid-cols-2' :
                channelsPerPage <= 6 ? 'md:grid-cols-2 lg:grid-cols-3' :
                channelsPerPage <= 8 ? 'md:grid-cols-2 lg:grid-cols-4' :
                'md:grid-cols-3 lg:grid-cols-3'
              }`}>
                {displayedChannels.map(channel => (
                  <VideoPlayer
                    key={channel.id}
                    channel={channel}
                    isFullscreen={channel.id === fullscreenId}
                    onVolumeChange={handleVolumeChange}
                    onFullscreenClick={handleFullscreenClick}
                    onSourceChange={handleSourceChange}
                    onRandomChannel={handleRandomChannel}
                    onChannelSwitch={handleChannelSwitch}
                    isRandomMode={isRandomMode}
                    language={language}
                    allChannels={store.channels}
                  />
                ))}
              </div>
            </div>
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
      {showChannelList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-semibold">
                {t(language, 'allChannels')} ({filteredChannels.length})
              </h2>
              <button
                onClick={() => {
                  setShowChannelList(false);
                  setChannelListPage(1);
                }}
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
            <div className="flex-1 flex flex-col h-[calc(90vh-180px)]">
              <div className="flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                  {currentPageChannels.map((channel, index) => {
                    const page = Math.floor((startIndex + index) / channelsPerPage) + 1;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => handleChannelClick(channel.id)}
                        className="flex items-center gap-3 p-3 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-left"
                      >
                        {channel.logo && (
                          <img src={channel.logo} alt="" className="w-8 h-8 object-contain" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">{channel.name}</div>
                          <div className="text-gray-400 text-sm truncate">
                            {t(language, 'pageInfo', { page })}
                            {channel.group && ` · ${channel.group}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {totalListPages > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => setChannelListPage(prev => Math.max(1, prev - 1))}
                    disabled={channelListPage === 1}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t(language, 'prevPage')}
                  </button>
                  <span className="px-4 py-2 text-white">
                    {channelListPage} / {totalListPages}
                  </span>
                  <button
                    onClick={() => setChannelListPage(prev => Math.min(totalListPages, prev + 1))}
                    disabled={channelListPage === totalListPages}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t(language, 'nextPage')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;