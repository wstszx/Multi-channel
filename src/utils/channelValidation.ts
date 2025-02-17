import Hls from 'hls.js';
import type { Channel } from '../types';

export interface ValidationResult {
  channelId: string;
  isValid: boolean;
  error?: string;
}

export interface ValidationProgress {
  total: number;
  completed: number;
  validCount: number;
  results: ValidationResult[];
}

export async function validateChannel(channel: Channel): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const result: ValidationResult = {
      channelId: channel.id,
      isValid: false,
    };

    if (!channel.urls.length) {
      result.error = 'No URLs available';
      resolve(result);
      return;
    }

    const video = document.createElement('video');
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
    });

    let timeoutId: number;
    let isResolved = false;

    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (hls) hls.destroy();
      video.remove();
    };

    const resolveWithResult = (isValid: boolean, error?: string) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve({ ...result, isValid, error });
      }
    };

    // Set timeout for validation
    timeoutId = window.setTimeout(() => {
      resolveWithResult(false, 'Timeout');
    }, 10000); // 10 seconds timeout

    try {
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(channel.urls[0]);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        resolveWithResult(true);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          resolveWithResult(false, data.type);
        }
      });
    } catch (error) {
      resolveWithResult(false, 'Initialization error');
    }
  });
}

export async function validateChannels(
  channels: Channel[],
  onProgress?: (progress: ValidationProgress) => void,
  concurrency: number = 5
): Promise<ValidationProgress> {
  const progress: ValidationProgress = {
    total: channels.length,
    completed: 0,
    validCount: 0,
    results: [],
  };

  const updateProgress = (result: ValidationResult) => {
    progress.completed++;
    if (result.isValid) progress.validCount++;
    progress.results.push(result);
    onProgress?.(progress);
  };

  // Process channels in batches
  for (let i = 0; i < channels.length; i += concurrency) {
    const batch = channels.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(validateChannel));
    results.forEach(updateProgress);
  }

  return progress;
}
