
import React from 'react';
import { Language, t } from '../locales';

interface ValidationStatusBadgeProps {
  status: 'pending' | 'success' | 'error';
}

export function ValidationStatusBadge({ status, language }: ValidationStatusBadgeProps) {
  return (
    <span className={inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium }>
      {t(language,
        status === 'pending' ? 'validatingStatus' :
        status === 'success' ? 'validStatus' :
        'invalidStatus'
      )}
    </span>
  );
}
