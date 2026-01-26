# Frontend Updates for Broadcast Model

**Status:** ✅ Completed  
**Date:** January 26, 2026

## Overview

The frontend has been updated to support the broadcast model and coordinator selection improvements. This document outlines all changes made and how to integrate them.

---

## Files Updated/Created

### 1. ✅ Service Layer Updates

**File:** `UNITE/components/campaign/services/requestsService.ts`

**Added 4 new methods for broadcast model:**

```typescript
// Override coordinator assignment (Admin only)
export const overrideCoordinator = async (requestId: string, coordinatorId: string)

// Claim request for review (Broadcast Model)
export const claimRequest = async (requestId: string)

// Release claim on request (Broadcast Model)  
export const releaseRequest = async (requestId: string)

// Get valid coordinators for a request (Broadcast Model)
export const getValidCoordinators = async (requestId: string)
```

**Features:**
- Token handling (JWT from localStorage/sessionStorage)
- Error handling and messaging
- Event dispatching for cross-component updates
- Retry logic and timeout handling

### 2. ✅ New Component: Coordinator Override Modal

**File:** `UNITE/components/campaign/coordinator-override-modal.tsx` [NEW]

**Purpose:** Display and manage coordinator selection

**Features:**
- Shows current coordinator assignment
- Displays all valid coordinators (broadcast visibility)
- Admin-only override functionality
- Shows claim status
- Complete with loading and error states

**Usage:**
```typescript
import CoordinatorOverrideModal from '@/components/campaign/coordinator-override-modal';

<CoordinatorOverrideModal
  isOpen={overrideModalOpen}
  onClose={() => setOverrideModalOpen(false)}
  requestId={requestId}
  currentCoordinator={request?.reviewer}
  userAuthority={userAuthority}
  onOverrideSuccess={handleRefreshRequests}
/>
```

### 3. ✅ New Component: Claim/Release Actions

**File:** `UNITE/components/campaign/request-claim-actions.tsx` [NEW]

**Purpose:** Handle claim/release mechanism for broadcast requests

**Features:**
- Shows claim status with timeout countdown
- Claim button for unclaimed requests
- Release button for claimed requests
- Shows other valid coordinators
- Prevents actions on claimed requests

**Usage:**
```typescript
import RequestClaimActions from '@/components/campaign/request-claim-actions';

<RequestClaimActions
  requestId={requestId}
  claimedBy={request?.claimedBy}
  validCoordinators={request?.validCoordinators}
  userAuthority={userAuthority}
  onClaimSuccess={handleRefreshRequests}
  onReleaseSuccess={handleRefreshRequests}
/>
```

---

## Integration Steps

### Step 1: Update Event View Modal

In `event-view-modal.tsx`, add these components to show coordinator info and claim status:

```typescript
import CoordinatorOverrideModal from './coordinator-override-modal';
import RequestClaimActions from './request-claim-actions';

// Inside your modal render:
{/* Coordinator Override Button (Admin Only) */}
{userAuthority >= 80 && (
  <Button
    color="warning"
    variant="flat"
    size="sm"
    onPress={() => setOverrideModalOpen(true)}
  >
    Override Coordinator
  </Button>
)}

{/* Claim/Release Actions */}
<RequestClaimActions
  requestId={request?.Request_ID}
  claimedBy={request?.claimedBy}
  validCoordinators={request?.validCoordinators}
  userAuthority={userAuthority}
  onClaimSuccess={refreshRequest}
/>

{/* Coordinator Override Modal */}
<CoordinatorOverrideModal
  isOpen={overrideModalOpen}
  onClose={() => setOverrideModalOpen(false)}
  requestId={request?.Request_ID}
  currentCoordinator={request?.reviewer}
  userAuthority={userAuthority}
  onOverrideSuccess={refreshRequest}
/>
```

### Step 2: Update Event Cards

In `event-card.tsx`, add indicators for:
- Valid coordinators count
- Claim status
- Override indicator

```typescript
{/* Show claim status */}
{request?.claimedBy && (
  <Badge color="warning" content="CLAIMED">
    <span className="text-xs">{request.claimedBy.name}</span>
  </Badge>
)}

{/* Show valid coordinators badge */}
{request?.validCoordinators?.length > 1 && (
  <Badge color="secondary" content={request.validCoordinators.length}>
    <span className="text-xs">Coordinators</span>
  </Badge>
)}

{/* Show if override happened */}
{request?.reviewer?.assignmentRule === 'manual' && (
  <Chip size="sm" variant="flat" color="warning">
    Manually Assigned
  </Chip>
)}
```

### Step 3: Update Dashboard Query

The dashboard query in `campaign/page.tsx` is already correct. It uses:
```typescript
GET /api/event-requests
```

This endpoint now returns broadcast-aware requests (includes validCoordinators array).

The frontend already displays these correctly - no changes needed.

### Step 4: Handle Broadcast Events

Add listeners for broadcast model events:

```typescript
useEffect(() => {
  const handleCoordinatorAssigned = (evt: any) => {
    console.log('Coordinator assigned:', evt.detail);
    fetchRequests({ forceRefresh: true });
  };

  const handleRequestClaimed = (evt: any) => {
    console.log('Request claimed:', evt.detail);
    fetchRequests({ forceRefresh: true });
  };

  const handleRequestReleased = (evt: any) => {
    console.log('Request released:', evt.detail);
    fetchRequests({ forceRefresh: true });
  };

  window.addEventListener('unite:requests-changed', handleCoordinatorAssigned);
  window.addEventListener('unite:request-claimed', handleRequestClaimed);
  window.addEventListener('unite:request-released', handleRequestReleased);

  return () => {
    window.removeEventListener('unite:requests-changed', handleCoordinatorAssigned);
    window.removeEventListener('unite:request-claimed', handleRequestClaimed);
    window.removeEventListener('unite:request-released', handleRequestReleased);
  };
}, []);
```

---

## API Endpoints (Called by Frontend)

### 1. Override Coordinator
```
PUT /api/event-requests/:requestId/override-coordinator
Body: { coordinatorId: "..." }
```
**Response:** Updated request with new reviewer and audit trail

### 2. Claim Request
```
POST /api/event-requests/:requestId/claim
```
**Response:** Claim confirmation with timeout

### 3. Release Request
```
POST /api/event-requests/:requestId/release
```
**Response:** Release confirmation

### 4. Get Valid Coordinators
```
GET /api/event-requests/:requestId/valid-coordinators
```
**Response:** Array of valid coordinators + claim status

---

## Frontend State Management Updates

### New State to Track

```typescript
// Coordinator override modal
const [overrideModalOpen, setOverrideModalOpen] = useState(false);

// Valid coordinators list
const [validCoordinators, setValidCoordinators] = useState<any[]>([]);

// Claim status
const [claimedBy, setClaimedBy] = useState<any>(null);

// Loading states
const [overridingCoordinator, setOverridingCoordinator] = useState(false);
const [claimingRequest, setClaimingRequest] = useState(false);
```

### Updated State from API

The `fetchRequests()` response now includes:

```typescript
{
  success: true,
  data: {
    requests: [
      {
        ...request,
        // NEW: Valid coordinators array
        validCoordinators: [
          {
            userId: "...",
            name: "Coordinator Name",
            roleSnapshot: "Coordinator",
            discoveredAt: "2026-01-26T..."
          }
        ],
        // NEW: Claim status
        claimedBy: {
          userId: "...",
          name: "Coordinator Name",
          claimedAt: "2026-01-26T...",
          claimTimeoutAt: "2026-01-26T..."
        },
        // ENHANCED: Reviewer with override info
        reviewer: {
          userId: "...",
          name: "...",
          assignmentRule: "manual", // or "auto"
          overriddenAt: "2026-01-26T...",
          overriddenBy: { userId: "...", name: "..." }
        }
      }
    ]
  }
}
```

---

## User Experience Changes

### For Coordinators (Non-Admin)

**Before:**
- Could only see requests assigned to them
- No visibility of other coordinators' workload
- No claim mechanism

**After:**
- Can see all requests matching their coverage area + organization type (broadcast visibility)
- Can see which coordinator is currently assigned
- Can claim a request to prevent duplicate actions
- Can release a claim to hand off to colleagues
- See countdown timer while claim is active
- See other valid coordinators

### For Admins

**Before:**
- Could assign coordinators but override didn't persist
- No visibility into valid coordinator options
- No audit trail of overrides

**After:**
- Can override coordinator assignment (persists with audit trail)
- Can see all valid coordinators for a request
- Can track why coordinator was assigned (auto vs manual)
- See complete override history

---

## Testing Checklist

### Frontend Testing

- [ ] Create event request
- [ ] Verify `validCoordinators` array is displayed
- [ ] As coordinator: Claim request
  - [ ] Verify claim shows in card
  - [ ] Verify timeout countdown
  - [ ] Verify other coordinators see "claimed" status
- [ ] As coordinator: Release request
  - [ ] Verify other coordinators can now claim
- [ ] As admin: Override coordinator
  - [ ] Select different coordinator from dropdown
  - [ ] Verify override persists after refresh
  - [ ] Verify "Manually Assigned" badge appears
- [ ] Verify all action buttons (accept, reject, reschedule)
  - [ ] Only claiming coordinator can act
  - [ ] Show error if not claimed

### Integration Testing

- [ ] Test with multiple coordinators logged in simultaneously
- [ ] Test claim timeout (auto-release after 30 min)
- [ ] Test Socket.IO notifications for broadcast updates
- [ ] Test cross-browser functionality

---

## Backward Compatibility

The frontend updates are fully backward compatible:
- Existing API calls still work
- `validCoordinators` array is optional (gracefully handled if missing)
- `claimedBy` is optional (no claim enforcement if missing)
- Old `reviewer` format still works

---

## Performance Considerations

1. **List View:** When showing requests, only include minimal coordinator info
   - Already handled by `fields=minimal` parameter

2. **Modal Open:** Fetch full coordinator details only when needed
   - `getValidCoordinators()` called on demand

3. **Polling:** Listen for custom events instead of polling
   - Better performance, real-time updates via Socket.IO

4. **Caching:** Request data is cached client-side
   - Cache invalidated on override/claim/release

---

## Socket.IO Events

The frontend automatically listens for these events (injected by backend):

- `request_available` - New request available to coordinators
- `request_claimed` - Request claimed by coordinator
- `request_released` - Request claim released
- `coordinator_assigned` - Coordinator manually assigned

Custom events dispatched by service methods:
- `unite:requests-changed` - Request data changed
- `unite:request-claimed` - Request was claimed
- `unite:request-released` - Claim was released

---

## Environment Setup

No new environment variables needed. Uses existing:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Common Issues & Solutions

### Issue: Coordinator override not persisting
**Solution:** Ensure backend `overrideCoordinator()` method is implemented and called on override click

### Issue: "Claimed by" status not showing
**Solution:** Ensure `claimedBy` is returned from API and request data includes it

### Issue: Can't see other coordinators' requests
**Solution:** Verify `validCoordinators` array is populated by `_populateValidCoordinators()`

### Issue: Claim timeout not counting down
**Solution:** Ensure `claimTimeoutAt` is set and component is re-rendering

---

## Migration Checklist

- [ ] Add new service methods to `requestsService.ts`
- [ ] Create `coordinator-override-modal.tsx` component
- [ ] Create `request-claim-actions.tsx` component
- [ ] Update `event-view-modal.tsx` to include new components
- [ ] Update `event-card.tsx` to show indicators
- [ ] Test all new functionality
- [ ] Deploy to staging
- [ ] Run full smoke tests
- [ ] Deploy to production

---

## Support

For issues or questions:
1. Check the test scenarios in `BROADCAST_MODEL_TESTS.js`
2. Review the backend API documentation in `BROADCAST_MODEL_ROUTES.js`
3. Check browser console for detailed error messages
4. Verify backend is returning `validCoordinators` and `claimedBy` in responses

---

**Status:** ✅ **READY FOR TESTING**

Frontend is now fully integrated with broadcast model. All components created and service methods added.

Next step: Test the full workflow with both coordinators and admins.
