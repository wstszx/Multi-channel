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
          id: line.match(/tvg-id="([^"]*)"/) ?? [],
          name: line.match(/tvg-name="([^"]*)"/) ?? [],
          logo: line.match(/tvg-logo="([^"]*)"/) ?? [],
          group: line.match(/group-title="([^"]*)"/) ?? [],
          displayName: line.match(/,([^,]*)$/) ?? []
        };
        
        // Get the display name from the end of the line after the last comma
        const displayName = line.split(',').pop()?.trim() || 'Unknown Channel';
        
        currentChannel = {
          name: matches.name[1] || displayName,
          logo: matches.logo[1] || '',
          group: matches.group[1] || 'Undefined'
        };
      } else if (line.startsWith('http')) {
        // This is the URL line
        if (currentChannel.name) {
          const channelKey = currentChannel.name;
          
          if (!channelMap[channelKey]) {
            channelMap[channelKey] = {
              name: currentChannel.name,
              logo: currentChannel.logo || '',
              group: currentChannel.group || 'Undefined',
              urls: []
            };
          }
          
          // 只添加有效的URL
          if (line.includes('.m3u8')) {
            channelMap[channelKey].urls.push(line);
          }
          currentChannel = {};
        }
      }
    }
    
    // 过滤掉没有有效URL的频道
    return Object.values(channelMap)
      .filter(channel => channel.urls.length > 0)
      .map(channel => ({
        name: channel.name,
        logo: channel.logo,
        group: channel.group,
        url: channel.urls[0]
      }));
  } catch (error) {
    console.error('Error parsing M3U file:', error);
    return [];
  }
} 