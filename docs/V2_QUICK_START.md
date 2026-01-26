# V2.0 Migration - Quick Start Guide

## How to Use Chunk 1 Infrastructure

This guide shows how to use the new v2.0 infrastructure in your components.

---

## 1. Basic Request List Fetch

```typescript
import { useEventRequestsV2 } from '@/hooks/useEventRequestsV2';
import { useV2RequestFlow } from '@/utils/featureFlags';

function RequestsList() {
  const isV2 = useV2RequestFlow();
  
  if (isV2) {
    // ✅ V2.0 - Uses jurisdiction-based filtering
    const { requests, loading, error, refresh } = useEventRequestsV2({
      filters: { 
        status: 'pending-review',
        municipalityId: userMunicipalityId 
      },
      enableCache: true,
    });

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;

    return (
      <div>
        <button onClick={refresh}>Refresh</button>
        {requests.map(req => (
          <RequestCard key={req._id} request={req} />
        ))}
      </div>
    );
  } else {
    // Legacy v1.0 logic (unchanged)
    // ... existing code
  }
}
```

---

## 2. Request Details Modal

```typescript
import { useRequestDetailsV2 } from '@/hooks/useEventRequestsV2';
import { useV2RequestFlow } from '@/utils/featureFlags';

interface RequestDetailsProps {
  requestId: string;
}

function RequestDetailsModal({ requestId }: RequestDetailsProps) {
  const isV2 = useV2RequestFlow();
  
  if (isV2) {
    // ✅ V2.0 - Automatic caching and refresh
    const { request, loading, error, refresh } = useRequestDetailsV2({
      requestId,
      enableCache: true,
    });

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;
    if (!request) return <NotFound />;

    return (
      <Modal>
        <h2>{request.Event_Title}</h2>
        <p>Status: {request.status}</p>
        
        {/* Show broadcast visibility */}
        {request.validCoordinators && (
          <div>
            <h3>Valid Reviewers ({request.validCoordinators.length})</h3>
            {request.validCoordinators.map(reviewer => (
              <div key={reviewer._id}>{reviewer.fullName}</div>
            ))}
          </div>
        )}
        
        {/* Show active responder */}
        {request.activeResponder && (
          <div>
            Waiting for: {request.activeResponder.relationship}
          </div>
        )}
      </Modal>
    );
  } else {
    // Legacy v1.0 logic
    // ... existing code
  }
}
```

---

## 3. Execute Request Action

```typescript
import { executeRequestActionV2 } from '@/services/eventRequestsV2Service';
import { useV2RequestFlow } from '@/utils/featureFlags';

function ActionButtons({ requestId }: { requestId: string }) {
  const isV2 = useV2RequestFlow();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!isV2) {
      // Legacy v1.0 logic
      return;
    }

    try {
      setLoading(true);
      
      // ✅ V2.0 - Standardized action execution
      await executeRequestActionV2(requestId, {
        action: 'accept',
      });

      // Invalidate cache and refresh
      window.dispatchEvent(
        new CustomEvent('unite:requests-changed', {
          detail: { requestId },
        })
      );

      toast.success('Request accepted!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (proposedDate: string, note: string) => {
    if (!isV2) {
      // Legacy v1.0 logic
      return;
    }

    try {
      setLoading(true);
      
      // ✅ V2.0 - Identity-based reschedule
      await executeRequestActionV2(requestId, {
        action: 'reschedule',
        proposedDate,
        note,
      });

      window.dispatchEvent(
        new CustomEvent('unite:requests-changed', {
          detail: { requestId },
        })
      );

      toast.success('Reschedule proposal sent!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleAccept} disabled={loading}>
        Accept
      </Button>
      <Button onClick={() => handleReschedule('2026-02-15', 'Conflict')}>
        Reschedule
      </Button>
    </div>
  );
}
```

---

## 4. Create New Request (Broadcast Model)

```typescript
import { createEventRequestV2 } from '@/services/eventRequestsV2Service';
import { useV2RequestFlow } from '@/utils/featureFlags';

function CreateRequestForm() {
  const isV2 = useV2RequestFlow();

  const handleSubmit = async (data: any) => {
    if (isV2) {
      // ✅ V2.0 - No manual coordinator selection!
      const requestData = {
        Event_Title: data.title,
        Event_Description: data.description,
        Location: data.location,
        Start_Date: data.startDate,
        municipalityId: data.municipalityId,
        organizationType: data.organizationType,
        Category: data.category,
      };

      try {
        const newRequest = await createEventRequestV2(requestData);
        
        // All reviewers with matching jurisdiction will see it automatically
        toast.success('Request created! Visible to all valid reviewers.');
        
        // Refresh list
        window.dispatchEvent(
          new CustomEvent('unite:requests-changed', {})
        );
      } catch (error: any) {
        toast.error(error.message);
      }
    } else {
      // Legacy v1.0 - requires manual coordinator selection
      // ... existing code
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {/* V1.0 shows coordinator selector, v2.0 doesn't need it */}
      {!isV2 && (
        <CoordinatorSelector 
          label="Select Coordinator (Required)" 
        />
      )}
      
      <Button type="submit">
        {isV2 ? 'Create Request (Broadcast)' : 'Create Request'}
      </Button>
    </form>
  );
}
```

---

## 5. Permission-Based UI Gates

```typescript
import { hasCapability } from '@/utils/permissionUtils';
import { usePermissionBasedUI } from '@/utils/featureFlags';

function RequestActions({ request, currentUser }: any) {
  const usePermissions = usePermissionBasedUI();

  // ✅ V2.0 - Permission-based (no role checks!)
  const canReview = usePermissions 
    ? hasCapability(currentUser, 'request.review')
    : currentUser.role === 'coordinator'; // Legacy fallback

  const canCreate = usePermissions
    ? hasCapability(currentUser, 'request.create')
    : currentUser.role === 'stakeholder' || currentUser.role === 'coordinator';

  return (
    <div>
      {canCreate && <CreateRequestButton />}
      {canReview && <ReviewRequestButton request={request} />}
    </div>
  );
}
```

---

## 6. Fetching Valid Reviewers (Broadcast Visibility)

```typescript
import { getValidReviewersV2 } from '@/services/eventRequestsV2Service';
import { useBroadcastVisibility } from '@/utils/featureFlags';

function ReviewersList({ requestId }: { requestId: string }) {
  const useBroadcast = useBroadcastVisibility();
  const [reviewers, setReviewers] = useState([]);

  useEffect(() => {
    if (useBroadcast) {
      // ✅ V2.0 - Jurisdiction-based discovery
      getValidReviewersV2(requestId).then((result) => {
        setReviewers(result.validReviewers);
      });
    } else {
      // Legacy v1.0 - single coordinator
      // ... existing code
    }
  }, [requestId, useBroadcast]);

  return (
    <div>
      <h3>
        {useBroadcast 
          ? `Valid Reviewers (${reviewers.length})`
          : 'Assigned Coordinator'
        }
      </h3>
      {reviewers.map(reviewer => (
        <div key={reviewer._id}>
          {reviewer.fullName} ({reviewer.email})
        </div>
      ))}
    </div>
  );
}
```

---

## 7. Testing in Development

### Enable v2.0 Features

```javascript
// In browser console (F12)
window.enableV2Features();
// Reload page
location.reload();
```

### Check Current State

```javascript
// Show all feature flags
window.showFeatureFlags();

// Output:
// ┌─────────────────────────┬─────────┬──────────────┐
// │ Flag                    │ Enabled │ Source       │
// ├─────────────────────────┼─────────┼──────────────┤
// │ v2_request_flow         │ true    │ localStorage │
// │ permission_based_ui     │ true    │ localStorage │
// │ broadcast_visibility    │ true    │ localStorage │
// │ identity_reschedule     │ true    │ localStorage │
// └─────────────────────────┴─────────┴──────────────┘
```

### Disable for Comparison

```javascript
window.disableV2Features();
location.reload();
```

---

## 8. Error Handling Pattern

```typescript
import { executeRequestActionV2 } from '@/services/eventRequestsV2Service';

async function performAction(requestId: string, action: string) {
  try {
    // ✅ Service handles response parsing and throws on error
    const result = await executeRequestActionV2(requestId, { action });
    
    // Success - result is already extracted from { success, data }
    toast.success(`Action ${action} completed!`);
    return result;
    
  } catch (error: any) {
    // Error already has user-friendly message from backend
    console.error('[performAction] Failed:', error);
    toast.error(error.message || 'Action failed');
    
    // Re-throw if caller needs to handle it
    throw error;
  }
}
```

---

## 9. Real-Time Updates

```typescript
// The hooks automatically listen to these events:
// - unite:requests-changed
// - unite:force-refresh-requests

// To trigger a refresh from anywhere in the app:
function notifyRequestChanged(requestId: string) {
  window.dispatchEvent(
    new CustomEvent('unite:requests-changed', {
      detail: { requestId, timestamp: Date.now() },
    })
  );
}

// All components using useEventRequestsV2 or useRequestDetailsV2
// will automatically refresh!
```

---

## 10. Gradual Rollout Pattern

```typescript
// Start with a single component
function CampaignPage() {
  const isV2 = useV2RequestFlow();
  
  // Only list view uses v2.0, actions still use v1.0
  const requests = isV2 
    ? useEventRequestsV2({ filters }).requests
    : legacyFetchRequests();
  
  // Actions still use v1.0
  const handleAction = async (requestId, action) => {
    await performRequestAction(requestId, action); // v1.0
  };
  
  return (
    <div>
      {requests.map(req => (
        <RequestCard 
          request={req} 
          onAction={handleAction} // v1.0
        />
      ))}
    </div>
  );
}
```

---

## Next: Chunk 2

Once Chunk 1 is stable, Chunk 2 will:
1. Update Campaign Toolbar to use feature flags
2. Modify request list fetch logic
3. Add UI indicator for v2.0 mode
4. Test dual-mode operation

---

**Status:** Ready for Implementation ✅  
**Safety:** All changes behind feature flags 🛡️  
**Backward Compatible:** v1.0 logic unchanged ✅
