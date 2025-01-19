import React, { useState, useEffect } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import type { ChannelListProps } from '../types';
import { t } from '../locales';

const CHANNELS_PER_LIST_PAGE = 30;

export function ChannelList({ 
  channels, 
  validChannelIds, 
  hideInvalidChannels,
  onChannelSelect,
  language 
}: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredChannels = channels
    .filter(ch => 
      (!hideInvalidChannels || !validChannelIds || validChannelIds.includes(ch.id)) &&
      (ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       ch.group?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const totalPages = Math.ceil(filteredChannels.length / CHANNELS_PER_LIST_PAGE);
  const startIndex = (currentPage - 1) * CHANNELS_PER_LIST_PAGE;
  const endIndex = startIndex + CHANNELS_PER_LIST_PAGE;
  const currentPageChannels = filteredChannels.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Preload adjacent pages data
  useEffect(() => {
    // Preload previous page
    if (currentPage > 1) {
      const prevStartIndex = (currentPage - 2) * CHANNELS_PER_LIST_PAGE;
      const prevEndIndex = prevStartIndex + CHANNELS_PER_LIST_PAGE;
      filteredChannels.slice(prevStartIndex, prevEndIndex);
    }
    // Preload next page
    if (currentPage < totalPages) {
      const nextStartIndex = currentPage * CHANNELS_PER_LIST_PAGE;
      const nextEndIndex = nextStartIndex + CHANNELS_PER_LIST_PAGE;
      filteredChannels.slice(nextStartIndex, nextEndIndex);
    }
  }, [currentPage, filteredChannels, totalPages]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(language, 'searchPlaceholder')}
          className="w-full px-10 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentPageChannels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel)}
            className="flex items-center gap-3 p-3 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-left group"
          >
            <div className="relative">
              {channel.logo && (
                <img src={channel.logo} alt="" className="w-8 h-8 object-contain" />
              )}
              {validChannelIds && validChannelIds.includes(channel.id) && (
                <CheckCircle className="w-4 h-4 text-green-500 absolute -top-1 -right-1" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">{channel.name}</div>
              {channel.group && (
                <div className="text-gray-400 text-sm truncate">{channel.group}</div>
              )}
            </div>
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t(language, 'prevPage')}
          </button>
          <span className="px-4 py-2 text-white">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t(language, 'nextPage')}
          </button>
        </div>
      )}
    </div>
  );
} 