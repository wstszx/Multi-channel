export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    loading: '加载频道中...',
    prevPage: '上一页',
    nextPage: '下一页',
    jumpTo: '跳转到:',
    page: '页',
    jump: '跳转',
    randomMode: '随机播放模式',
    normalMode: '返回普通模式',
    totalChannels: '共 {count} 个频道',
    randomDisplay: '(随机显示9个)',
    setM3uUrl: '设置M3U链接',
    m3uUrlLabel: 'M3U 链接地址',
    m3uUrlPlaceholder: '请输入 M3U 链接地址',
    cancel: '取消',
    confirm: '确定',
    channelList: '频道列表',
    currentPageChannels: '当前页频道列表',
    switchSource: '源',
    sourceDisplay: '源 {current}/{total}',
    randomSwitch: '随机切换频道',
    networkError: '网络错误，正在尝试切换源...',
    loadError: '加载频道列表失败，请检查链接是否正确',
    language: 'English'
  },
  en: {
    loading: 'Loading channels...',
    prevPage: 'Previous',
    nextPage: 'Next',
    jumpTo: 'Jump to:',
    page: 'Page',
    jump: 'Go',
    randomMode: 'Random Mode',
    normalMode: 'Normal Mode',
    totalChannels: 'Total {count} channels',
    randomDisplay: '(Random 9)',
    setM3uUrl: 'Set M3U URL',
    m3uUrlLabel: 'M3U URL',
    m3uUrlPlaceholder: 'Please enter M3U URL',
    cancel: 'Cancel',
    confirm: 'Confirm',
    channelList: 'Channel List',
    currentPageChannels: 'Current Page Channels',
    switchSource: 'Source',
    sourceDisplay: 'Source {current}/{total}',
    randomSwitch: 'Random Switch',
    networkError: 'Network error, trying to switch source...',
    loadError: 'Failed to load channel list, please check the URL',
    language: '中文'
  }
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Language, key: TranslationKey, params: Record<string, string | number> = {}): string {
  let text = translations[lang][key];
  Object.entries(params).forEach(([key, value]) => {
    text = text.replace(`{${key}}`, String(value));
  });
  return text;
} 