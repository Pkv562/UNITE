/**
 * useEventRequestsV2 Hook
 * 
 * React hook for managing event requests using the v2.0 API.
 * Provides data fetching, caching, and state management with jurisdiction-based
 * visibility and permission-first access control.
 * 
 * Key Features:
 * - Automatic cache management with invalidation
 * - Loading and error states
 * - Pagination support
 * - Real-time updates via custom events
 * - Permission-based filtering
 * 
 * @version 2.0
 * @author UNITE Development Team
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  fetchEventRequestsV2,
  fetchRequestDetailsV2,
  V2EventRequest,
  V2RequestFilters,
  V2ApiResponse,
} from '@/services/eventRequestsV2Service';
import { getCachedResponse, cacheResponse, invalidateCache } from '@/utils/requestCache';

// ============================================================================
// TYPES
// ============================================================================

export interface UseEventRequestsV2Options {
  filters?: V2RequestFilters;
  enableCache?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export interface UseEventRequestsV2Result {
  requests: V2EventRequest[];
  loading: boolean;
  error: string | null;
  pagination: V2ApiResponse['pagination'] | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
}

export interface UseRequestDetailsV2Options {
  requestId: string;
  enableCache?: boolean;
  autoRefresh?: boolean;
}

export interface UseRequestDetailsV2Result {
  request: V2EventRequest | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for fetching and managing event requests list (v2.0)
 * 
 * @param options - Configuration options
 * @returns Request list with loading/error states and control functions
 * 
 * @example
 * ```tsx
 * const { requests, loading, error, refresh } = useEventRequestsV2({
 *   filters: { status: 'pending-review', municipalityId: '123' },
 *   enableCache: true,
 * });
 * ```
 */
export function useEventRequestsV2(
  options: UseEventRequestsV2Options = {}
): UseEventRequestsV2Result {
  const {
    filters = {},
    enableCache = true,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [requests, setRequests] = useState<V2EventRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<V2ApiResponse['pagination'] | null>(null);

  const mountedRef = useRef<boolean>(true);
    const initialFetchDoneRef = useRef<boolean>(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate cache key from filters (useMemo to prevent recreating on every render)
  const cacheKey = useMemo((): string => {
    const filterString = JSON.stringify(filters);
    return `event-requests-v2-${filterString}`;
  }, [filters]);

  /**
   * Fetch requests from API or cache
   */
  const fetchRequests = useCallback(async (forceRefresh: boolean = false) => {
    // Reset mounted flag in case StrictMode/unmount toggled it before a new fetch begins
    mountedRef.current = true;
        const fetchId = Math.random().toString(36).substring(7);
        console.log(`[useEventRequestsV2:${fetchId}] Starting fetch`, { 
          cacheKey, 
          forceRefresh, 
          enableCache,
          currentLoading: loading,
        });
    
    try {
      setLoading(true);
      setError(null);


      // Try cache first if enabled and not forcing refresh
      if (enableCache && !forceRefresh) {
        const cached = getCachedResponse(cacheKey);
        if (cached) {
          console.log(`[useEventRequestsV2:${fetchId}] Using cached data, setting loading=false`);
          setRequests(Array.isArray(cached.requests) ? cached.requests : []);
          setPagination(cached.pagination || null);
          setLoading(false);
                    console.log(`[useEventRequestsV2:${fetchId}] Cache loaded, should be loading=false now`);
          return;
        }
      }

      // Fetch from API
      console.log(`[useEventRequestsV2:${fetchId}] No cache, fetching from API with filters:`, filters);
      const result = await fetchEventRequestsV2(filters);

      // Only update state if component is still mounted
      if (!mountedRef.current) {
        console.log(`[useEventRequestsV2:${fetchId}] Component unmounted, skipping state update`);
        return;
      }

      console.log(`[useEventRequestsV2:${fetchId}] Fetch successful`, {
        requestCount: result.requests.length,
        pagination: result.pagination,
      });

      setRequests(Array.isArray(result.requests) ? result.requests : []);
      setPagination(result.pagination || null);

      // Cache the result
      if (enableCache) {
        cacheResponse(cacheKey, result);
        console.log(`[useEventRequestsV2:${fetchId}] Result cached`);
      }
    } catch (err: any) {
      if (!mountedRef.current) {
        console.log(`[useEventRequestsV2:${fetchId}] Component unmounted during error, skipping`);
        return;
      }
      
      console.error(`[useEventRequestsV2:${fetchId}] Error fetching requests:`, err);
      setError(err.message || 'Failed to fetch event requests');
      setRequests([]);
      setPagination(null);
    } finally {
      if (mountedRef.current) {
          console.log(`[useEventRequestsV2:${fetchId}] Finally block: setting loading=false`);
        setLoading(false);
      }
    }
  }, [filters, enableCache, cacheKey]);

  /**
   * Refresh requests (force refresh from API)
   */
  const refresh = useCallback(async () => {
    await fetchRequests(true);
  }, [fetchRequests]);

  /**
   * Invalidate cache
   */
  const invalidate = useCallback(() => {
    invalidateCache(cacheKey);
  }, [cacheKey]);

  // Initial fetch
  useEffect(() => {
    // Only run initial fetch once on mount
    if (!initialFetchDoneRef.current) {
      console.log('[useEventRequestsV2] Running initial fetch (mount)');
      initialFetchDoneRef.current = true;
      fetchRequests();
    } else {
      // On subsequent changes to filters, fetch again
      console.log('[useEventRequestsV2] Filters changed, fetching updated data');
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]); // Only re-fetch when cacheKey changes (which includes filter changes)

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    refreshIntervalRef.current = setInterval(() => {
      fetchRequests(true);
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchRequests]);

  // Listen for custom refresh events
  useEffect(() => {
    const handleRefreshEvent = () => {
      fetchRequests(true);
    };

    window.addEventListener('unite:requests-changed', handleRefreshEvent);
    window.addEventListener('unite:force-refresh-requests', handleRefreshEvent);

    return () => {
      window.removeEventListener('unite:requests-changed', handleRefreshEvent);
      window.removeEventListener('unite:force-refresh-requests', handleRefreshEvent);
    };
  }, [fetchRequests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    requests,
    loading,
    error,
    pagination,
    refresh,
    invalidate,
  };
}

/**
 * Hook for fetching and managing a single request's details (v2.0)
 * 
 * @param options - Configuration options
 * @returns Request details with loading/error states and control functions
 * 
 * @example
 * ```tsx
 * const { request, loading, error, refresh } = useRequestDetailsV2({
 *   requestId: 'req_123456',
 *   enableCache: true,
 * });
 * ```
 */
export function useRequestDetailsV2(
  options: UseRequestDetailsV2Options
): UseRequestDetailsV2Result {
  const {
    requestId,
    enableCache = true,
    autoRefresh = false,
  } = options;

  const [request, setRequest] = useState<V2EventRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);

  const getCacheKey = useCallback((): string => {
    return `event-request-v2-${requestId}`;
  }, [requestId]);

  /**
   * Fetch request details from API or cache
   */
  const fetchDetails = useCallback(async (forceRefresh: boolean = false) => {
    if (!requestId) {
      setError('Request ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cacheKey = getCacheKey();

      // Try cache first if enabled and not forcing refresh
      if (enableCache && !forceRefresh) {
        const cached = getCachedResponse(cacheKey);
        if (cached) {
          setRequest(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const result = await fetchRequestDetailsV2(requestId);

      // Only update state if component is still mounted
      if (!mountedRef.current) return;

      setRequest(result);

      // Cache the result
      if (enableCache) {
        cacheResponse(cacheKey, result);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      
      console.error('[useRequestDetailsV2] Error fetching request details:', err);
      setError(err.message || 'Failed to fetch request details');
      setRequest(null);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [requestId, enableCache, getCacheKey]);

  /**
   * Refresh request details (force refresh from API)
   */
  const refresh = useCallback(async () => {
    await fetchDetails(true);
  }, [fetchDetails]);

  /**
   * Invalidate cache
   */
  const invalidate = useCallback(() => {
    const cacheKey = getCacheKey();
    invalidateCache(cacheKey);
  }, [getCacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Listen for custom refresh events for this specific request
  useEffect(() => {
    const handleRefreshEvent = (event: CustomEvent) => {
      // Check if this event is for the current request
      if (event.detail?.requestId === requestId) {
        fetchDetails(true);
      }
    };

    window.addEventListener('unite:requests-changed', handleRefreshEvent as EventListener);
    window.addEventListener('unite:force-refresh-requests', handleRefreshEvent as EventListener);

    return () => {
      window.removeEventListener('unite:requests-changed', handleRefreshEvent as EventListener);
      window.removeEventListener('unite:force-refresh-requests', handleRefreshEvent as EventListener);
    };
  }, [requestId, fetchDetails]);

  // Auto-refresh for specific request if needed
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDetails(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchDetails]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    request,
    loading,
    error,
    refresh,
    invalidate,
  };
}
