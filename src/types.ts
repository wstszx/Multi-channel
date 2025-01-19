import { Language } from './locales';

export interface Channel {
  id: string;
  name: string;
  urls: string[];
  volume: number;
  logo?: string;
  group?: string;
  currentSourceIndex?: number;
}

export interface PlayerProps {
  channel: Channel;
  isFullscreen: boolean;
  onVolumeChange: (id: string, volume: number) => void;
  onFullscreenClick: (id: string) => void;
  onSourceChange?: (id: string, sourceIndex: number) => void;
  onRandomChannel?: (id: string) => void;
  onChannelSwitch: (playerId: string, newChannel: Channel) => void;
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