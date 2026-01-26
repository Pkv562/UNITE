/**
 * Feature Flags Utility
 * 
 * Manages feature flags for gradual migration from v1.0 to v2.0.
 * Allows controlled rollout of new features without breaking existing functionality.
 * 
 * Usage:
 * ```tsx
 * import { useV2RequestFlow } from '@/utils/featureFlags';
 * 
 * function MyComponent() {
 *   const isV2Enabled = useV2RequestFlow();
 *   
 *   if (isV2Enabled) {
 *     // Use v2.0 logic
 *   } else {
 *     // Use v1.0 logic
 *   }
 * }
 * ```
 * 
 * @version 2.0
 * @author UNITE Development Team
 */

import { useState, useEffect } from 'react';

// ============================================================================
// FEATURE FLAG CONFIGURATION
// ============================================================================

/**
 * Feature flag definitions
 * 
 * These can be controlled via:
 * 1. Environment variables (build-time)
 * 2. localStorage (runtime, user-specific)
 * 3. Backend API (dynamic, role-based)
 */
export enum FeatureFlag {
  // Request Flow v2.0
  V2_REQUEST_FLOW = 'v2_request_flow',
  
  // Permission-Based UI Gates
  PERMISSION_BASED_UI = 'permission_based_ui',
  
  // Broadcast Visibility Model
  BROADCAST_VISIBILITY = 'broadcast_visibility',
  
  // Identity-Based Reschedule Loop
  IDENTITY_RESCHEDULE = 'identity_reschedule',
}

/**
 * Default flag states
 * Can be overridden by environment variables or localStorage
 */
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  [FeatureFlag.V2_REQUEST_FLOW]: false, // Disabled by default for safety
  [FeatureFlag.PERMISSION_BASED_UI]: false,
  [FeatureFlag.BROADCAST_VISIBILITY]: false,
  [FeatureFlag.IDENTITY_RESCHEDULE]: false,
};

// Snapshot build-time envs with static keys so Next.js can inline values.
const ENV_FLAG_VALUES: Record<FeatureFlag, string | undefined> = {
  [FeatureFlag.V2_REQUEST_FLOW]: process.env.NEXT_PUBLIC_FEATURE_V2_REQUEST_FLOW,
  [FeatureFlag.PERMISSION_BASED_UI]: process.env.NEXT_PUBLIC_FEATURE_PERMISSION_BASED_UI,
  [FeatureFlag.BROADCAST_VISIBILITY]: process.env.NEXT_PUBLIC_FEATURE_BROADCAST_VISIBILITY,
  [FeatureFlag.IDENTITY_RESCHEDULE]: process.env.NEXT_PUBLIC_FEATURE_IDENTITY_RESCHEDULE,
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_PREFIX = 'unite_feature_';

function getStorageKey(flag: FeatureFlag): string {
  return `${STORAGE_PREFIX}${flag}`;
}

// ============================================================================
// FEATURE FLAG FUNCTIONS
// ============================================================================

/**
 * Get feature flag value
 * 
 * Priority order:
 * 1. localStorage (user override)
 * 2. Environment variable
 * 3. Default value
 * 
 * @param flag - Feature flag to check
 * @returns True if feature is enabled
 */
export function getFeatureFlag(flag: FeatureFlag): boolean {
  // Check localStorage first (user/testing override)
  if (typeof window !== 'undefined') {
    const storedValue = localStorage.getItem(getStorageKey(flag));
    if (storedValue !== null) {
      console.log(`[FeatureFlags] localStorage override: ${flag} = ${storedValue}`);
      return storedValue === 'true';
    }
  }

  // Check environment variables (build-time configuration)
  const envValue = ENV_FLAG_VALUES[flag];
  if (envValue !== undefined) {
    console.log(`[FeatureFlags] env var: NEXT_PUBLIC_FEATURE_${flag.toUpperCase()} = ${envValue}`);
    return envValue === 'true';
  }

  // Fall back to default
  const defaultValue = DEFAULT_FLAGS[flag];
  const envKey = `NEXT_PUBLIC_FEATURE_${flag.toUpperCase()}`;
  console.log(`[FeatureFlags] env var not found: ${envKey}, using default: ${flag} = ${defaultValue}`);
  return defaultValue;
}

/**
 * Set feature flag value (localStorage only, for testing/debugging)
 * 
 * @param flag - Feature flag to set
 * @param enabled - Enable or disable the feature
 */
export function setFeatureFlag(flag: FeatureFlag, enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(flag), String(enabled));
    
    // Dispatch event to notify other components
    window.dispatchEvent(
      new CustomEvent('unite:feature-flag-changed', {
        detail: { flag, enabled },
      })
    );
  }
}

/**
 * Clear feature flag override (revert to environment/default)
 * 
 * @param flag - Feature flag to clear
 */
export function clearFeatureFlag(flag: FeatureFlag): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey(flag));
    
    // Dispatch event to notify other components
    window.dispatchEvent(
      new CustomEvent('unite:feature-flag-changed', {
        detail: { flag, enabled: getFeatureFlag(flag) },
      })
    );
  }
}

/**
 * Check if ALL specified flags are enabled
 * 
 * @param flags - Feature flags to check
 * @returns True if all flags are enabled
 */
export function allFlagsEnabled(...flags: FeatureFlag[]): boolean {
  return flags.every(flag => getFeatureFlag(flag));
}

/**
 * Check if ANY of the specified flags are enabled
 * 
 * @param flags - Feature flags to check
 * @returns True if any flag is enabled
 */
export function anyFlagEnabled(...flags: FeatureFlag[]): boolean {
  return flags.some(flag => getFeatureFlag(flag));
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * React hook for feature flag
 * Automatically re-renders when flag changes
 * 
 * @param flag - Feature flag to watch
 * @returns Current flag value
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [enabled, setEnabled] = useState(() => getFeatureFlag(flag));

  useEffect(() => {
    // Update state if flag changes
    const handleFlagChange = (event: CustomEvent) => {
      if (event.detail?.flag === flag) {
        setEnabled(event.detail.enabled);
      }
    };

    window.addEventListener('unite:feature-flag-changed', handleFlagChange as EventListener);

    return () => {
      window.removeEventListener('unite:feature-flag-changed', handleFlagChange as EventListener);
    };
  }, [flag]);

  return enabled;
}

/**
 * Hook for v2.0 Request Flow feature
 * 
 * @returns True if v2.0 request flow is enabled
 */
export function useV2RequestFlow(): boolean {
  return useFeatureFlag(FeatureFlag.V2_REQUEST_FLOW);
}

/**
 * Hook for Permission-Based UI feature
 * 
 * @returns True if permission-based UI is enabled
 */
export function usePermissionBasedUI(): boolean {
  return useFeatureFlag(FeatureFlag.PERMISSION_BASED_UI);
}

/**
 * Hook for Broadcast Visibility feature
 * 
 * @returns True if broadcast visibility is enabled
 */
export function useBroadcastVisibility(): boolean {
  return useFeatureFlag(FeatureFlag.BROADCAST_VISIBILITY);
}

/**
 * Hook for Identity-Based Reschedule feature
 * 
 * @returns True if identity-based reschedule is enabled
 */
export function useIdentityReschedule(): boolean {
  return useFeatureFlag(FeatureFlag.IDENTITY_RESCHEDULE);
}

// ============================================================================
// DEVELOPER UTILITIES
// ============================================================================

/**
 * Enable v2.0 features for testing (localStorage override)
 * Use in browser console: window.enableV2Features()
 */
if (typeof window !== 'undefined') {
  (window as any).enableV2Features = () => {
    Object.values(FeatureFlag).forEach(flag => {
      setFeatureFlag(flag, true);
    });
    console.log('✅ All v2.0 features enabled (localStorage override)');
    console.log('Reload the page to see changes.');
  };

  (window as any).disableV2Features = () => {
    Object.values(FeatureFlag).forEach(flag => {
      setFeatureFlag(flag, false);
    });
    console.log('❌ All v2.0 features disabled (localStorage override)');
    console.log('Reload the page to see changes.');
  };

  (window as any).resetV2Features = () => {
    Object.values(FeatureFlag).forEach(flag => {
      clearFeatureFlag(flag);
    });
    console.log('🔄 All v2.0 feature flags reset to defaults');
    console.log('Reload the page to see changes.');
  };

  (window as any).showFeatureFlags = () => {
    console.table(
      Object.values(FeatureFlag).map(flag => ({
        Flag: flag,
        Enabled: getFeatureFlag(flag),
        Source: localStorage.getItem(getStorageKey(flag)) !== null ? 'localStorage' : 'default',
      }))
    );
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  FeatureFlag,
  getFeatureFlag,
  setFeatureFlag,
  clearFeatureFlag,
  allFlagsEnabled,
  anyFlagEnabled,
  useFeatureFlag,
  useV2RequestFlow,
  usePermissionBasedUI,
  useBroadcastVisibility,
  useIdentityReschedule,
};
