/**
 * Version Indicator Component
 * 
 * Displays a badge showing which API version is currently active (v1.0 or v2.0).
 * Only visible when v2.0 feature flag is enabled for testing/debugging.
 * 
 * @version 2.0
 * @author UNITE Development Team
 */

import React from 'react';
import { useV2RequestFlow } from '@/utils/featureFlags';

interface VersionIndicatorProps {
  className?: string;
  showWhenV1?: boolean; // Show even when v1.0 is active
}

export function VersionIndicator({ className = '', showWhenV1 = false }: VersionIndicatorProps) {
  const isV2 = useV2RequestFlow();

  // Hide if v1.0 and not explicitly showing v1
  if (!isV2 && !showWhenV1) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
          ${
            isV2
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }
        `}
        title={isV2 ? 'Using v2.0 Permission-Based Request Flow' : 'Using v1.0 Role-Based Request Flow'}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span>{isV2 ? 'API v2.0' : 'API v1.0'}</span>
        {isV2 && (
          <span className="text-[10px] opacity-75">(Broadcast)</span>
        )}
      </span>

      {/* Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              if (isV2) {
                (window as any).disableV2Features?.();
              } else {
                (window as any).enableV2Features?.();
              }
              window.location.reload();
            }
          }}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          title="Toggle API version (dev only)"
        >
          {isV2 ? 'Switch to v1.0' : 'Switch to v2.0'}
        </button>
      )}
    </div>
  );
}

/**
 * Compact version indicator for toolbar
 */
export function CompactVersionIndicator({ className = '' }: { className?: string }) {
  const isV2 = useV2RequestFlow();

  if (!isV2) return null;

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
        bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700
        ${className}
      `}
      title="Using v2.0 Permission-Based Request Flow with Broadcast Visibility"
    >
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
      </svg>
      v2.0
    </span>
  );
}

export default VersionIndicator;
