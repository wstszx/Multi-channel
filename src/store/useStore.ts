import { create } from 'zustand';
import type { Channel } from '../types';

interface PlaylistInfo {
  url: string;
  name: string;
  timestamp: number;
}

interface Store {
  channels: Channel[];
  currentChannel: Channel | null;
  favorites: string[];
  playlists: PlaylistInfo[];
  loading: boolean;
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  toggleFavorite: (channelId: string) => void;
  addPlaylist: (playlist: PlaylistInfo) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  channels: [],
  currentChannel: null,
  favorites: [],
  playlists: [],
  loading: false,
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  toggleFavorite: (channelId) =>
    set((state) => ({
      favorites: state.favorites.includes(channelId)
        ? state.favorites.filter((id) => id !== channelId)
        : [...state.favorites, channelId],
    })),
  addPlaylist: (playlist) =>
    set((state) => ({
      playlists: [playlist, ...state.playlists.slice(0, 9)],
    })),
  setLoading: (loading) => set({ loading }),
})); 