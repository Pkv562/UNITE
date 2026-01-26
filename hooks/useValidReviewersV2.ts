/**
 * useValidReviewersV2 Hook
 * 
 * React hook for fetching the list of valid reviewers for a request using the v2.0 API.
 * Implements the broadcast visibility model - returns all reviewers with matching
 * jurisdiction (Coverage Area + Organization Type).
 * 
 * Key Features:
 * - Automatic caching to prevent duplicate API calls
 * - Real-time updates via custom event listening
 * - Error handling and retry logic
 * - Loading and error states
 * 
 * @version 2.0
 * @author UNITE Development Team
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getValidReviewersV2 } from '@/services/eventRequestsV2Service';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidReviewer {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  organizationType?: string;
  coverageAreas?: Array<{
    _id: string;
    name: string;
  }>;
}

export interface UseValidReviewersV2Result {
  reviewers: ValidReviewer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry {
  data: ValidReviewer[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const reviewersCache = new Map<string, CacheEntry>();

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fetching valid reviewers for a request (v2.0)
 * 
 * @param requestId - Request ID to fetch reviewers for
 * @param enabled - Whether to auto-fetch (default: true)
 * @returns Reviewers list and refresh function
 * 
 * @example
 * ```tsx
 * const { reviewers, loading, refresh } = useValidReviewersV2(requestId);
 * 
 * return (
 *   <div>
 *     {loading && <Spinner />}
 *     {reviewers.map(r => (
 *       <div key={r._id}>{r.fullName}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useValidReviewersV2(
  requestId: string,
  enabled: boolean = true
): UseValidReviewersV2Result {
  const [reviewers, setReviewers] = useState<ValidReviewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch reviewers from cache or API
   */
  const fetchReviewers = useCallback(async () => {
    if (!requestId) {
      setReviewers([]);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Check cache first
      const cached = reviewersCache.get(requestId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (isMountedRef.current) {
          setReviewers(cached.data);
          setLoading(false);
        }
        return;
      }

      // Fetch from API
      const response = await getValidReviewersV2(requestId);
      const reviewersList = response.validReviewers || [];

      // Update cache
      reviewersCache.set(requestId, {
        data: reviewersList,
        timestamp: Date.now(),
      });

      if (isMountedRef.current) {
        setReviewers(reviewersList);
      }
    } catch (err: any) {
      console.error('[useValidReviewersV2] Error fetching reviewers:', err);
      const errorMessage = err?.message || 'Failed to fetch reviewers';

      if (isMountedRef.current) {
        setError(errorMessage);
        setReviewers([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [requestId]);

  /**
   * Auto-fetch on mount and when requestId changes
   */
  useEffect(() => {
    if (enabled && requestId) {
      fetchReviewers();
    }
  }, [requestId, enabled, fetchReviewers]);

  /**
   * Listen for request changes and invalidate cache
   */
  useEffect(() => {
    const handleRequestsChanged = (event: any) => {
      const { detail } = event;
      if (detail?.requestId === requestId) {
        // Invalidate cache for this request
        reviewersCache.delete(requestId);
        // Optionally refresh
        if (enabled) {
          fetchReviewers();
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('unite:requests-changed', handleRequestsChanged);
      return () => {
        window.removeEventListener('unite:requests-changed', handleRequestsChanged);
      };
    }
  }, [requestId, enabled, fetchReviewers]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    reviewers,
    loading,
    error,
    refresh: fetchReviewers,
  };
}

/**
 * Clear the reviewers cache (useful for testing)
 */
export function clearReviewersCache() {
  reviewersCache.clear();
}
