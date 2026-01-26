/**
 * useRequestActionsV2 Hook
 * 
 * React hook for executing actions on event requests using the v2.0 API.
 * Provides unified action execution with permission-based access control,
 * automatic cache invalidation, and event dispatching for real-time updates.
 * 
 * Key Features:
 * - Permission-based action validation (no role checks)
 * - Unified action handler for all transitions
 * - Automatic cache invalidation
 * - Real-time event dispatching
 * - Loading and error state management
 * 
 * @version 2.0
 * @author UNITE Development Team
 */

import { useState, useCallback } from 'react';
import { executeRequestActionV2 } from '@/services/eventRequestsV2Service';
import { invalidateCache } from '@/utils/requestCache';
import type { V2RequestAction } from '@/services/eventRequestsV2Service';

// ============================================================================
// TYPES
// ============================================================================

export interface ExecuteActionOptions {
  note?: string;
  proposedDate?: string;
}

export interface UseRequestActionsV2Result {
  executeAction: (requestId: string, action: string, options?: ExecuteActionOptions) => Promise<any>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for executing actions on event requests (v2.0)
 * 
 * @returns Action execution functions and state
 * 
 * @example
 * ```tsx
 * const { executeAction, loading, error } = useRequestActionsV2();
 * 
 * // Accept request
 * await executeAction(requestId, 'accept');
 * 
 * // Reject with note
 * await executeAction(requestId, 'reject', { note: 'Conflict with existing event' });
 * 
 * // Reschedule with new date
 * await executeAction(requestId, 'reschedule', { 
 *   proposedDate: '2026-02-15',
 *   note: 'Original date unavailable'
 * });
 * ```
 */
export function useRequestActionsV2(): UseRequestActionsV2Result {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Execute an action on a request
   */
  const executeAction = useCallback(async (
    requestId: string,
    action: string,
    options: ExecuteActionOptions = {}
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      if (!action) {
        throw new Error('Action is required');
      }

      // Validate reschedule action requirements
      if (action === 'reschedule' && !options.proposedDate) {
        throw new Error('Proposed date is required for reschedule action');
      }

      // Execute action via v2.0 service
      const result = await executeRequestActionV2(requestId, {
        action: action as any,
        note: options.note,
        proposedDate: options.proposedDate,
      });

      // Invalidate cache
      invalidateCache(/event-requests/);

      // Dispatch event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('unite:requests-changed', {
            detail: {
              requestId,
              action,
              timestamp: Date.now(),
              shouldRefresh: true,
              forceRefresh: true,
            },
          })
        );

        // Also dispatch force-refresh event
        window.dispatchEvent(
          new CustomEvent('unite:force-refresh-requests', {
            detail: {
              requestId,
              reason: `${action}-action`,
            },
          })
        );
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || `Failed to execute action: ${action}`;
      setError(errorMessage);
      
      console.error('[useRequestActionsV2] Error:', {
        requestId,
        action,
        error: err,
      });

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeAction,
    loading,
    error,
    clearError,
  };
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook for accepting a request
 * 
 * @example
 * ```tsx
 * const { accept, loading } = useAcceptRequest();
 * await accept(requestId);
 * ```
 */
export function useAcceptRequest() {
  const { executeAction, loading, error, clearError } = useRequestActionsV2();

  const accept = useCallback(
    async (requestId: string) => {
      return executeAction(requestId, 'accept');
    },
    [executeAction]
  );

  return { accept, loading, error, clearError };
}

/**
 * Hook for rejecting a request
 * 
 * @example
 * ```tsx
 * const { reject, loading } = useRejectRequest();
 * await reject(requestId, { note: 'Reason for rejection' });
 * ```
 */
export function useRejectRequest() {
  const { executeAction, loading, error, clearError } = useRequestActionsV2();

  const reject = useCallback(
    async (requestId: string, options?: { note?: string }) => {
      return executeAction(requestId, 'reject', options);
    },
    [executeAction]
  );

  return { reject, loading, error, clearError };
}

/**
 * Hook for rescheduling a request
 * 
 * @example
 * ```tsx
 * const { reschedule, loading } = useRescheduleRequest();
 * await reschedule(requestId, {
 *   proposedDate: '2026-02-15',
 *   note: 'Conflict with existing event'
 * });
 * ```
 */
export function useRescheduleRequest() {
  const { executeAction, loading, error, clearError } = useRequestActionsV2();

  const reschedule = useCallback(
    async (
      requestId: string,
      options: { proposedDate: string; note?: string }
    ) => {
      return executeAction(requestId, 'reschedule', options);
    },
    [executeAction]
  );

  return { reschedule, loading, error, clearError };
}

/**
 * Hook for confirming a reschedule proposal
 * 
 * @example
 * ```tsx
 * const { confirm, loading } = useConfirmReschedule();
 * await confirm(requestId);
 * ```
 */
export function useConfirmReschedule() {
  const { executeAction, loading, error, clearError } = useRequestActionsV2();

  const confirm = useCallback(
    async (requestId: string) => {
      return executeAction(requestId, 'confirm');
    },
    [executeAction]
  );

  return { confirm, loading, error, clearError };
}

/**
 * Hook for declining a reschedule proposal
 * 
 * @example
 * ```tsx
 * const { decline, loading } = useDeclineReschedule();
 * await decline(requestId, { note: 'Proposed date not suitable' });
 * ```
 */
export function useDeclineReschedule() {
  const { executeAction, loading, error, clearError } = useRequestActionsV2();

  const decline = useCallback(
    async (requestId: string, options?: { note?: string }) => {
      return executeAction(requestId, 'decline', options);
    },
    [executeAction]
  );

  return { decline, loading, error, clearError };
}

/**
 * Hook for cancelling a request
 * 
 * @example
 * ```tsx
 * const { cancel, loading } = useCancelRequest();
 * await cancel(requestId);
 * ```
 */
export function useCancelRequest() {
  const { executeAction, loading, error, clearError } = useRequestActionsV2();

  const cancel = useCallback(
    async (requestId: string) => {
      return executeAction(requestId, 'cancel');
    },
    [executeAction]
  );

  return { cancel, loading, error, clearError };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useRequestActionsV2;
