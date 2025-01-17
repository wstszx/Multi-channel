export interface M3U8Channel {
  name: string;
  url: string;
}

export function parseM3U8Playlist(content: string): M3U8Channel[] {
  const lines = content.split('\n');
  const channels: M3U8Channel[] = [];
  let currentChannel: Partial<M3U8Channel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Extract channel name from EXTINF line
      const nameMatch = line.match(/,(.+)$/);
      if (nameMatch) {
        currentChannel.name = nameMatch[1].trim();
      }
    } else if (line.startsWith('http')) {
      // This is a URL line
      currentChannel.url = line;
      
      if (currentChannel.name && currentChannel.url) {
        channels.push(currentChannel as M3U8Channel);
        currentChannel = {};
      }
    }
  }

  return channels;
}