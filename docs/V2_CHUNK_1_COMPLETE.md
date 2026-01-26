# CHUNK 1 IMPLEMENTATION COMPLETE ✅

## Frontend Infrastructure and Service Layer (v2.0)

**Status:** ✅ Complete  
**Date:** January 27, 2026  
**Chunk:** 1 of 5

---

## 📋 Overview

This chunk establishes the foundational infrastructure for the v2.0 Request Flow migration. It creates the bridge between the frontend and the `/api/v2/` endpoints while maintaining backward compatibility with v1.0.

### Architecture Principles Applied

1. **Permission-First**: No hardcoded role checks
2. **Standardized Responses**: All APIs return `{ success, message, data }`
3. **Broadcast Visibility**: Jurisdiction-based reviewer discovery
4. **Feature Flags**: Gradual migration without breaking changes
5. **Type Safety**: Comprehensive TypeScript types

---

## 🗂️ Files Created

### 1. **Service Layer**
**File:** `UNITE/services/eventRequestsV2Service.ts`

**Purpose:** API client for v2.0 endpoints

**Key Functions:**
- `fetchEventRequestsV2(filters)` - List requests with jurisdiction filtering
- `fetchRequestDetailsV2(requestId)` - Get single request details
- `getValidReviewersV2(requestId)` - Get broadcast visibility reviewers
- `executeRequestActionV2(requestId, action)` - Execute request actions
- `createEventRequestV2(data)` - Create new request (broadcast model)
- `updateEventRequestV2(requestId, data)` - Update request
- `deleteEventRequestV2(requestId)` - Delete request

**Response Handling:**
```typescript
// All v2.0 endpoints return standardized format
interface V2ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: { page, limit, total, pages };
}

// Service automatically extracts data and throws on error
function handleV2Response<T>(response: V2ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'API request failed');
  }
  return response.data as T;
}
```

---

### 2. **React Hooks**
**File:** `UNITE/hooks/useEventRequestsV2.ts`

**Purpose:** Data fetching and state management hooks

**Hooks Provided:**

#### `useEventRequestsV2(options)`
Fetches request list with automatic caching and real-time updates.

```typescript
const { requests, loading, error, pagination, refresh, invalidate } = useEventRequestsV2({
  filters: { status: 'pending-review', municipalityId: '123' },
  enableCache: true,
  autoRefresh: false,
});
```

**Features:**
- ✅ Automatic cache management
- ✅ Loading and error states
- ✅ Pagination support
- ✅ Real-time refresh via custom events
- ✅ Auto-refresh interval (optional)

#### `useRequestDetailsV2(options)`
Fetches single request details with caching.

```typescript
const { request, loading, error, refresh, invalidate } = useRequestDetailsV2({
  requestId: 'req_123456',
  enableCache: true,
});
```

**Features:**
- ✅ Request-specific caching
- ✅ Automatic refresh on events
- ✅ Loading and error states

---

### 3. **Feature Flags**
**File:** `UNITE/utils/featureFlags.ts`

**Purpose:** Gradual migration control without breaking v1.0

**Feature Flags:**
- `V2_REQUEST_FLOW` - Enable v2.0 request flow
- `PERMISSION_BASED_UI` - Enable permission-based UI gates
- `BROADCAST_VISIBILITY` - Enable broadcast visibility model
- `IDENTITY_RESCHEDULE` - Enable identity-based reschedule loop

**Hooks:**
```typescript
import { useV2RequestFlow } from '@/utils/featureFlags';

function CampaignPage() {
  const isV2Enabled = useV2RequestFlow();
  
  if (isV2Enabled) {
    // Use v2.0 logic
    const { requests } = useEventRequestsV2({ filters });
  } else {
    // Use v1.0 logic
    await fetchRequests();
  }
}
```

**Developer Utilities (Browser Console):**
```javascript
// Enable all v2.0 features for testing
window.enableV2Features();

// Disable all v2.0 features
window.disableV2Features();

// Reset to defaults
window.resetV2Features();

// Show current flag states
window.showFeatureFlags();
```

---

### 4. **TypeScript Types**
**File:** `UNITE/types/v2.types.ts`

**Purpose:** Comprehensive type definitions for v2.0

**Key Types:**
```typescript
// API Response
interface V2ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: V2Pagination;
}

// Event Request
interface V2EventRequest {
  _id: string;
  Event_Title: string;
  status: V2RequestStatus;
  activeResponder?: V2ActiveResponder;
  validCoordinators?: V2Reviewer[];
  // ... full request structure
}

// Request States (Simplified)
type V2RequestStatus =
  | 'pending-review'
  | 'approved'
  | 'rejected'
  | 'review-rescheduled'
  | 'cancelled';

// Request Actions
type V2RequestAction =
  | 'accept'
  | 'reject'
  | 'reschedule'
  | 'confirm'
  | 'decline'
  | 'cancel';

// Permission Capability
type V2Capability = `${resource}.${action}`; // e.g., "request.review"
```

---

## 🔄 Integration Points

### Cache Integration
Uses existing `@/utils/requestCache` for consistent caching:
```typescript
import { getCachedResponse, cacheResponse, invalidateCache } from '@/utils/requestCache';
```

### Event System
Listens to existing custom events:
- `unite:requests-changed` - Request was modified
- `unite:force-refresh-requests` - Force refresh requested

### Authentication
Uses existing `fetchWithAuth` and `fetchJsonWithAuth`:
```typescript
import { fetchJsonWithAuth } from '@/utils/fetchWithAuth';
```

---

## 🛡️ Safety Mechanisms

### 1. **Feature Flag Protection**
All v2.0 code is behind feature flags - v1.0 remains default:
```typescript
const isV2Enabled = useV2RequestFlow(); // Default: false
```

### 2. **Backward Compatibility**
- v1.0 files untouched
- v2.0 files in separate locations
- No breaking changes to existing components

### 3. **Error Handling**
Comprehensive try-catch with fallbacks:
```typescript
try {
  const result = await fetchEventRequestsV2(filters);
} catch (err) {
  console.error('[fetchEventRequestsV2] Error:', err);
  // Component handles error state
}
```

### 4. **Type Safety**
All functions fully typed with strict TypeScript:
```typescript
// Compile-time error if wrong type passed
executeRequestActionV2(requestId, { 
  action: 'invalid' // ❌ TypeScript error
});
```

---

## 🧪 Testing Guide

### 1. **Enable v2.0 Features**
```javascript
// In browser console
window.enableV2Features();
// Reload page
```

### 2. **Test Data Fetching**
```typescript
// In a test component
const { requests, loading, error } = useEventRequestsV2({
  filters: { status: 'pending-review' },
});

console.log('Requests:', requests);
console.log('Loading:', loading);
console.log('Error:', error);
```

### 3. **Test Feature Flag**
```typescript
const isV2 = useV2RequestFlow();
console.log('V2 enabled:', isV2); // Should be true after enableV2Features()
```

### 4. **Verify API Calls**
Check network tab for calls to:
- `GET /api/v2/event-requests` (not `/api/event-requests`)
- Response format: `{ success: true, data: [...] }`

---

## 📊 Performance Considerations

### 1. **Caching Strategy**
- Default cache TTL: 5 minutes (from `requestCache.ts`)
- Cache key format: `event-requests-v2-${JSON.stringify(filters)}`
- Automatic invalidation on mutations

### 2. **Optimistic Updates**
Hooks support immediate UI updates:
```typescript
const { refresh, invalidate } = useEventRequestsV2();

// After mutation
await executeRequestActionV2(requestId, { action: 'accept' });
invalidate(); // Clear cache
await refresh(); // Fetch fresh data
```

### 3. **Pagination**
Server-side pagination support:
```typescript
const { requests, pagination } = useEventRequestsV2({
  filters: { page: 1, limit: 10 },
});

console.log(pagination); // { page: 1, limit: 10, total: 50, pages: 5 }
```

---

## 🚨 Edge Cases Handled

### 1. **Token Expiry**
`fetchWithAuth` handles token expiration automatically:
- Checks token before request
- Clears tokens if expired
- Redirects to login if needed

### 2. **Unmounted Components**
Hooks use `mountedRef` to prevent state updates:
```typescript
useEffect(() => {
  return () => {
    mountedRef.current = false; // Cleanup
  };
}, []);
```

### 3. **Race Conditions**
Filters are memoized to prevent redundant fetches:
```typescript
const getCacheKey = useCallback((): string => {
  return `event-requests-v2-${JSON.stringify(filters)}`;
}, [filters]); // Only re-run if filters change
```

### 4. **Network Failures**
Graceful error handling with user feedback:
```typescript
catch (err: any) {
  setError(err.message || 'Failed to fetch event requests');
  setRequests([]); // Clear stale data
}
```

---

## 📝 Next Steps (Chunk 2)

**Focus:** Feature Flags and List Migration

**Tasks:**
1. Update Campaign Toolbar to use `useV2RequestFlow()` flag
2. Modify request list fetch to conditionally use `useEventRequestsV2`
3. Test dual-mode operation (v1.0 + v2.0 coexisting)
4. Add UI indicator for which mode is active

**Files to Modify:**
- `UNITE/app/dashboard/campaign/page.tsx`
- `UNITE/components/campaign/campaign-toolbar.tsx`

---

## ✅ Verification Checklist

- [x] Service layer created with standardized response handling
- [x] Hooks created with cache management and real-time updates
- [x] Feature flags implemented with developer utilities
- [x] TypeScript types defined for all v2.0 structures
- [x] No modifications to v1.0 files
- [x] Documentation complete
- [x] Safety mechanisms in place
- [x] Performance optimizations applied

---

## 🔗 References

- **Architecture Guide:** `backend-docs/V2.0_ARCHITECTURE_GUIDE.md`
- **Implementation Plan:** `backend-docs/V2.0_IMPLEMENTATION_PLAN.md`
- **Backend Services:** `src/services/v2.0_eventServices/`
- **Backend Routes:** `src/routes/v2.0_eventRoutes.js`

---

**Implementation Complete:** ✅  
**Ready for Chunk 2:** ✅
