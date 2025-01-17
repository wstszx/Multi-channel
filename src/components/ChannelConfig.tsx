import React, { useState, useCallback } from 'react';
import { Settings, X, Upload } from 'lucide-react';
import type { Channel } from '../types';
import { parseM3U8Playlist } from '../utils/m3u8Parser';

interface ChannelConfigProps {
  channels: Channel[];
  onSave: (channels: Channel[]) => void;
}

export const ChannelConfig: React.FC<ChannelConfigProps> = ({ channels, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');

  const handleImportPlaylist = useCallback(async () => {
    try {
      const response = await fetch(playlistUrl);
      if (!response.ok) throw new Error('Failed to fetch playlist');
      
      const content = await response.text();
      const importedChannels = parseM3U8Playlist(content);
      
      const newChannels = importedChannels.slice(0, 9).map((channel, index) => ({
        id: (index + 1).toString(),
        name: channel.name,
        url: channel.url,
        volume: 0
      }));

      onSave(newChannels);
      setPlaylistUrl('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error importing playlist:', error);
      alert('Failed to import playlist. Please check the URL and try again.');
    }
  }, [playlistUrl, onSave]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors"
      >
        <Settings className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Import M3U8 Playlist</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            <p className="text-gray-300 text-sm">Enter the URL of your M3U8 playlist. The first 9 channels will be imported.</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="Enter M3U8 playlist URL"
                className="flex-1 bg-gray-800 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleImportPlaylist}
                disabled={!playlistUrl}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};