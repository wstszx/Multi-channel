import type { M3UChannel } from '../types';

interface ChannelMap {
  [key: string]: {
    name: string;
    logo: string;
    group: string;
    urls: string[];
  };
}

export async function parseM3U(url: string): Promise<M3UChannel[]> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');
    const channelMap: ChannelMap = {};
    
    let currentChannel: Partial<M3UChannel> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        // Parse the EXTINF line
        const matches = {
          name: line.match(/tvg-name="([^"]*)"/) ?? [],
          logo: line.match(/tvg-logo="([^"]*)"/) ?? [],
          group: line.match(/group-title="([^"]*)"/) ?? [],
          displayName: line.match(/,([^,]*)$/) ?? []
        };
        
        currentChannel = {
          name: matches.name[1] || matches.displayName[1] || 'Unknown Channel',
          logo: matches.logo[1] || '',
          group: matches.group[1] || 'Uncategorized'
        };
      } else if (line.startsWith('http')) {
        // This is the URL line
        if (currentChannel.name) {
          const channelKey = currentChannel.name;
          
          if (!channelMap[channelKey]) {
            channelMap[channelKey] = {
              name: currentChannel.name,
              logo: currentChannel.logo || '',
              group: currentChannel.group || 'Uncategorized',
              urls: []
            };
          }
          
          channelMap[channelKey].urls.push(line);
          currentChannel = {};
        }
      }
    }
    
    // Convert the map back to an array format
    return Object.values(channelMap).map(channel => ({
      name: channel.name,
      logo: channel.logo,
      group: channel.group,
      url: channel.urls[0] // Return first URL for compatibility
    }));
  } catch (error) {
    console.error('Error parsing M3U file:', error);
    return [];
  }
} 