import React from 'react';
import { Settings as SettingsIcon, Globe2, Link } from 'lucide-react';
import type { Language } from '../types';
import { t } from '../locales';

interface SettingsProps {
  language: Language;
  onLanguageChange: () => void;
  onM3uUrlClick: () => void;
}

export function Settings({ language, onLanguageChange, onM3uUrlClick }: SettingsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-2"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg overflow-hidden z-50">
            <button
              onClick={() => {
                onLanguageChange();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center gap-2"
            >
              <Globe2 className="w-5 h-5" />
              {t(language, 'language')}
            </button>
            <button
              onClick={() => {
                onM3uUrlClick();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center gap-2"
            >
              <Link className="w-5 h-5" />
              {t(language, 'setM3uUrl')}
            </button>
          </div>
        </>
      )}
    </div>
  );
} 