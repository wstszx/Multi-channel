export interface Channel {
  id: string;
  name: string;
  url: string;
  volume: number;
}

export interface PlayerProps {
  channel: Channel;
  isFullscreen: boolean;
  onVolumeChange: (id: string, volume: number) => void;
  onFullscreenClick: (id: string) => void;
}