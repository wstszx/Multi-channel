import React, { useState } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import type { ChannelListProps } from '../types';
import { t } from '../locales';

export function ChannelList({ 
  channels, 
  validChannelIds, 
  hideInvalidChannels,
  onChannelSelect,
  language 
}: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChannels = channels
    .filter(ch => 
      (!hideInvalidChannels || !validChannelIds || validChannelIds.includes(ch.id)) &&
      (ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       ch.group?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
        {filteredChannels.map((channel) => (
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
    </div>
  );
} 