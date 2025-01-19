import { Language } from './locales';

export type Language = 'zh' | 'en';

export interface Channel {
  id: string;
  name: string;
  group?: string;
  logo?: string;
  urls: string[];
  volume: number;
  currentSourceIndex?: number;
}

export interface PlayerProps {
  channel: Channel;
  isFullscreen: boolean;
  onVolumeChange: (channelId: string, volume: number) => void;
  onFullscreenClick: (channelId: string) => void;
  onSourceChange?: (channelId: string, sourceIndex: number) => void;
  onRandomChannel?: (channelId: string) => void;
  onChannelSwitch: (fromChannelId: string, toChannel: Channel) => void;
  isRandomMode: boolean;
  language: Language;
  allChannels: Channel[];
}

export interface M3UChannel {
  name: string;
  logo: string;
  group: string;
  url: string;
}

export interface ChannelListProps {
  channels: Channel[];
  validChannelIds?: string[];
  hideInvalidChannels: boolean;
  onChannelSelect: (channel: Channel) => void;
  language: Language;
}