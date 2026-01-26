/**
 * Event Requests V2.0 Service Layer
 * 
 * This service layer bridges the frontend to the v2.0 backend API endpoints.
 * It follows the permission-first, role-agnostic architecture and handles
 * standardized response formats from /api/v2/ endpoints.
 * 
 * Key Features:
 * - Jurisdiction-based visibility (broadcast model)
 * - Standardized response format: { success, message, data }
 * - Permission-based access (no role checks)
 * - Identity-based reschedule loop
 * 
 * @version 2.0
 * @author UNITE Development Team
 */

import { fetchJsonWithAuth, fetchWithAuth } from "@/utils/fetchWithAuth";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Standardized API Response Format (v2.0)
 */
export interface V2ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Event Request Object (v2.0)
 */
export interface V2EventRequest {
  _id: string;
  Event_Title: string;
  Location: string;
  Date?: string;
  Start_Date?: string;
  End_Date?: string;
  status: string;
  Category?: string;
  organizationType?: string;
  district?: string;
  province?: string;
  municipalityId?: string;
  coverageAreaId?: string;
  organizationId?: string;
  requester?: {
    userId: string;
    name: string;
    email?: string;
  };
  validCoordinators?: Array<{
    _id: string;
    fullName: string;
    email: string;
  }>;
  activeResponder?: {
    relationship: 'requester' | 'reviewer';
  };
  rescheduleProposal?: {
    proposedBy: string;
    proposedDate: string;
    note?: string;
  };
  statusHistory?: Array<{
    status: string;
    timestamp: Date;
    actor?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request List Filters (v2.0)
 */
export interface V2RequestFilters {
  status?: string;
  organizationId?: string;
  coverageAreaId?: string;
  municipalityId?: string;
  district?: string;
  province?: string;
  category?: string;
  page?: number;
  limit?: number;
}

/**
 * Valid Reviewers Response (v2.0)
 */
export interface V2ValidReviewers {
  validReviewers: Array<{
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    organizationType?: string;
    coverageAreas?: Array<{
      _id: string;
      name: string;
    }>;
  }>;
}

/**
 * Request Action Payload (v2.0)
 */
export interface V2RequestAction {
  action: 'accept' | 'reject' | 'reschedule' | 'cancel' | 'confirm' | 'decline';
  note?: string;
  proposedDate?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get API base URL
 */
const getApiBase = (): string => {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return "http://localhost:6700";
};

const API_BASE = getApiBase();

/**
 * Handle v2.0 API response and extract data
 */
function handleV2Response<T>(response: V2ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'API request failed');
  }
  return response.data as T;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch event requests with jurisdiction-based filtering (v2.0)
 * 
 * @param filters - Filter options for requests
 * @returns List of requests with pagination
 */
export async function fetchEventRequestsV2(
  filters: V2RequestFilters = {}
): Promise<{ requests: V2EventRequest[]; pagination?: V2ApiResponse['pagination'] }> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.status) params.set('status', filters.status);
    if (filters.organizationId) params.set('organizationId', filters.organizationId);
    if (filters.coverageAreaId) params.set('coverageAreaId', filters.coverageAreaId);
    if (filters.municipalityId) params.set('municipalityId', filters.municipalityId);
    if (filters.district) params.set('district', filters.district);
    if (filters.province) params.set('province', filters.province);
    if (filters.category) params.set('category', filters.category);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const url = `${API_BASE}/api/v2/event-requests${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetchJsonWithAuth(url, {
      method: 'GET',
    });

    // Handle standardized response format
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch event requests');
    }

    // API returns: { success, message, data: { requests: [], pagination: {} } }
    const data = response.data || {};
    
    return {
      requests: Array.isArray(data.requests) ? data.requests : [],
      pagination: data.pagination || undefined
    };
  } catch (error: any) {
    console.error('[fetchEventRequestsV2] Error:', error);
    throw error;
  }
}

/**
 * Fetch a single event request by ID (v2.0)
 * 
 * @param requestId - Request ID
 * @returns Request details
 */
export async function fetchRequestDetailsV2(requestId: string): Promise<V2EventRequest> {
  try {
    const url = `${API_BASE}/api/v2/event-requests/${encodeURIComponent(requestId)}`;
    
    const response = await fetchJsonWithAuth(url, {
      method: 'GET',
    });

    return handleV2Response<V2EventRequest>(response);
  } catch (error: any) {
    console.error('[fetchRequestDetailsV2] Error:', error);
    throw error;
  }
}

/**
 * Get valid reviewers for a request (broadcast visibility)
 * 
 * This endpoint returns all reviewers who match the request's jurisdiction
 * based on Coverage Area + Organization Type.
 * 
 * @param requestId - Request ID
 * @returns List of valid reviewers
 */
export async function getValidReviewersV2(requestId: string): Promise<V2ValidReviewers> {
  try {
    const url = `${API_BASE}/api/v2/event-requests/${encodeURIComponent(requestId)}/reviewers`;
    
    const response = await fetchJsonWithAuth(url, {
      method: 'GET',
    });

    return handleV2Response<V2ValidReviewers>(response);
  } catch (error: any) {
    console.error('[getValidReviewersV2] Error:', error);
    throw error;
  }
}

/**
 * Execute an action on a request (v2.0)
 * 
 * Unified action handler for all request transitions:
 * - accept: Approve the request
 * - reject: Reject the request
 * - reschedule: Propose new date/time
 * - confirm: Confirm reschedule proposal
 * - decline: Decline reschedule proposal
 * - cancel: Cancel the request
 * 
 * @param requestId - Request ID
 * @param actionPayload - Action details
 * @returns Updated request
 */
export async function executeRequestActionV2(
  requestId: string,
  actionPayload: V2RequestAction
): Promise<V2EventRequest> {
  try {
    // Validation
    if (actionPayload.action === 'reschedule' && !actionPayload.proposedDate) {
      throw new Error('proposedDate is required for reschedule action');
    }

    const url = `${API_BASE}/api/v2/event-requests/${encodeURIComponent(requestId)}/actions`;
    
    const response = await fetchJsonWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(actionPayload),
    });

    // Handle standardized response format
    if (!response.success) {
      throw new Error(response.message || `Failed to execute action: ${actionPayload.action}`);
    }

    return handleV2Response<V2EventRequest>(response);
  } catch (error: any) {
    console.error('[executeRequestActionV2] Error:', error);
    throw error;
  }
}

/**
 * Create a new event request (v2.0)
 * 
 * Creates a request with broadcast visibility model - no manual coordinator
 * selection required. All reviewers with matching jurisdiction will see the request.
 * 
 * @param requestData - Request creation payload
 * @returns Created request
 */
export async function createEventRequestV2(requestData: any): Promise<V2EventRequest> {
  try {
    const url = `${API_BASE}/api/v2/event-requests`;
    
    const response = await fetchJsonWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    return handleV2Response<V2EventRequest>(response);
  } catch (error: any) {
    console.error('[createEventRequestV2] Error:', error);
    throw error;
  }
}

/**
 * Update an event request (v2.0)
 * 
 * @param requestId - Request ID
 * @param updateData - Fields to update
 * @returns Updated request
 */
export async function updateEventRequestV2(
  requestId: string,
  updateData: Partial<V2EventRequest>
): Promise<V2EventRequest> {
  try {
    const url = `${API_BASE}/api/v2/event-requests/${encodeURIComponent(requestId)}`;
    
    const response = await fetchJsonWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    return handleV2Response<V2EventRequest>(response);
  } catch (error: any) {
    console.error('[updateEventRequestV2] Error:', error);
    throw error;
  }
}

/**
 * Delete an event request (v2.0)
 * 
 * @param requestId - Request ID
 * @returns Success confirmation
 */
export async function deleteEventRequestV2(requestId: string): Promise<{ message: string }> {
  try {
    const url = `${API_BASE}/api/v2/event-requests/${encodeURIComponent(requestId)}`;
    
    const response = await fetchJsonWithAuth(url, {
      method: 'DELETE',
    });

    return handleV2Response<{ message: string }>(response);
  } catch (error: any) {
    console.error('[deleteEventRequestV2] Error:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  fetchEventRequestsV2,
  fetchRequestDetailsV2,
  getValidReviewersV2,
  executeRequestActionV2,
  createEventRequestV2,
  updateEventRequestV2,
  deleteEventRequestV2,
};
