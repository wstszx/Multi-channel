import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Hls from 'hls.js';
import { t } from '../locales';
import type { Channel } from '../types';

interface ChannelValidatorProps {
  channels: Channel[];
  language: string;
  onValidationComplete: (validChannelIds: string[]) => void;
}

export function ChannelValidator({ channels, language, onValidationComplete }: ChannelValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const [validChannelIds, setValidChannelIds] = useState<string[]>([]);
  const [hideInvalidChannels, setHideInvalidChannels] = useState(false);

  const validateChannel = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Hls.isSupported()) {
        const hls = new Hls();
        let timeoutId: NodeJS.Timeout;

        const cleanup = () => {
          clearTimeout(timeoutId);
          hls.destroy();
        };

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          cleanup();
          resolve(true);
        });

        hls.on(Hls.Events.ERROR, () => {
          cleanup();
          resolve(false);
        });

        timeoutId = setTimeout(() => {
          cleanup();
          resolve(false);
        }, 5000);

        hls.loadSource(url);
      } else {
        // Fallback for browsers that don't support HLS.js
        const video = document.createElement('video');
        let timeoutId: NodeJS.Timeout;

        const cleanup = () => {
          clearTimeout(timeoutId);
          video.remove();
        };

        video.onloadeddata = () => {
          cleanup();
          resolve(true);
        };

        video.onerror = () => {
          cleanup();
          resolve(false);
        };

        timeoutId = setTimeout(() => {
          cleanup();
          resolve(false);
        }, 5000);

        video.src = url;
      }
    });
  };

  const startValidation = async () => {
    setIsValidating(true);
    setCheckedCount(0);
    setValidChannelIds([]);

    const batchSize = 5; // Number of concurrent validations
    const validIds: string[] = [];

    for (let i = 0; i < channels.length; i += batchSize) {
      const batch = channels.slice(i, i + batchSize);
      const validationPromises = batch.map(async (channel) => {
        // Try each URL for the channel until one works
        for (const url of channel.urls) {
          try {
            const isValid = await validateChannel(url);
            if (isValid) {
              validIds.push(channel.id);
              return;
            }
          } catch (error) {
            console.error(`Error validating channel ${channel.name}:`, error);
          }
        }
      });

      await Promise.all(validationPromises);
      setCheckedCount(Math.min(channels.length, i + batchSize));
    }

    setValidChannelIds(validIds);
    setIsValidating(false);
    onValidationComplete(validIds);
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={startValidation}
        disabled={isValidating}
        className={`px-4 py-2 rounded-md ${
          isValidating
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500'
        } text-white flex items-center gap-2 whitespace-nowrap`}
      >
        {isValidating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t(language, 'validating')}
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            {t(language, 'startValidation')}
          </>
        )}
      </button>
      {(isValidating || validChannelIds.length > 0) && (
        <div className="flex items-center gap-4">
          <div className="text-white whitespace-nowrap">
            {isValidating ? (
              t(language, 'validationProgress', {
                checked: checkedCount,
                total: channels.length
              })
            ) : (
              t(language, 'validChannelsCount', {
                valid: validChannelIds.length,
                total: channels.length
              })
            )}
          </div>
          {validChannelIds.length > 0 && (
            <label className="flex items-center gap-2 text-white whitespace-nowrap">
              <input
                type="checkbox"
                checked={hideInvalidChannels}
                onChange={(e) => setHideInvalidChannels(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              {t(language, 'hideInvalidChannels')}
            </label>
          )}
        </div>
      )}
    </div>
  );
} 