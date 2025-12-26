import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE } from "../event-card.constants";

const getToken = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("unite_token") || sessionStorage.getItem("unite_token")
    : null;

/**
 * Perform an action on a request (accept, reject, reschedule, cancel)
 * Uses the unified /api/event-requests/:id/actions endpoint
 */
export const performRequestAction = async (
  requestId: string,
  action: "accept" | "reject" | "reschedule" | "cancel",
  note?: string,
  proposedDate?: string | null,
) => {
  const token = getToken();
  const headers: any = { "Content-Type": "application/json" };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const body: any = { action };
  
  // Only include note for reject and reschedule actions
  // Backend validator only allows note for reject/reschedule, not for accept/cancel
  if ((action === "reject" || action === "reschedule") && note) {
    body.note = note;
  }
  
  // For reschedule action, proposedDate is required by backend
  if (action === "reschedule") {
    if (!proposedDate) {
      throw new Error("proposedDate is required for reschedule action");
    }
    body.proposedDate = proposedDate;
  } else if (proposedDate) {
    // For other actions, include proposedDate if provided (optional)
    body.proposedDate = proposedDate;
  }

  console.log(`[performRequestAction] Sending ${action} action:`, {
    requestId,
    action,
    hasNote: !!note,
    hasProposedDate: !!body.proposedDate,
    proposedDate: body.proposedDate,
  });

  let res;

  if (token) {
    res = await fetchWithAuth(
      `${API_BASE}/api/event-requests/${encodeURIComponent(requestId)}/actions`,
      { method: "POST", body: JSON.stringify(body) },
    );
  } else {
    res = await fetch(
      `${API_BASE}/api/event-requests/${encodeURIComponent(requestId)}/actions`,
      { method: "POST", headers, body: JSON.stringify(body), credentials: "include" },
    );
  }

  const resp = await res.json();
  
  if (!res.ok) {
    console.error(`[performRequestAction] ${action} failed:`, {
      status: res.status,
      statusText: res.statusText,
      response: resp,
    });
    throw new Error(resp.message || resp.errors?.join(", ") || `Failed to perform action: ${action}`);
  }

  console.log(`[performRequestAction] ${action} succeeded:`, resp);

  try {
    window.dispatchEvent(new CustomEvent("unite:requests-changed", { detail: { requestId } }));
  } catch (e) {}

  return resp;
};

/**
 * Confirm a reviewer's decision (unified for all roles)
 * Uses the unified /api/event-requests/:id/actions endpoint with action: 'confirm'
 */
export const performConfirmAction = async (requestId: string, note?: string) => {
  const token = getToken();
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Don't include note for confirm actions - backend validator doesn't allow it
  const body: any = { action: "confirm" };

  let res;
  if (token) {
    res = await fetchWithAuth(
      `${API_BASE}/api/event-requests/${encodeURIComponent(requestId)}/actions`,
      { method: "POST", body: JSON.stringify(body) },
    );
  } else {
    res = await fetch(
      `${API_BASE}/api/event-requests/${encodeURIComponent(requestId)}/actions`,
      { method: "POST", headers, body: JSON.stringify(body), credentials: "include" },
    );
  }

  const resp = await res.json();
  if (!res.ok) throw new Error(resp.message || "Failed to confirm decision");

  try {
    window.dispatchEvent(new CustomEvent("unite:requests-changed", { detail: { requestId } }));
  } catch (e) {}

  return resp;
};

/**
 * Legacy function for backward compatibility - maps to performConfirmAction
 * @deprecated Use performConfirmAction instead
 */
export const performStakeholderConfirm = async (requestId: string, action: "Accepted" | "Rejected") => {
  return performConfirmAction(requestId);
};

/**
 * Legacy function for backward compatibility - maps to performConfirmAction
 * @deprecated Use performConfirmAction instead
 */
export const performCoordinatorConfirm = async (requestId: string, action: "Accepted" | "Rejected") => {
  return performConfirmAction(requestId);
};

/**
 * Fetch request details by ID
 * Uses the new /api/event-requests/:id endpoint
 */
export const fetchRequestDetails = async (requestId: string) => {
  const token = getToken();
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${API_BASE}/api/event-requests/${encodeURIComponent(requestId)}`;

  let res;
  if (token) {
    try {
      res = await fetchWithAuth(url, { method: "GET" });
    } catch (e) {
      res = await fetch(url, { headers });
    }
  } else {
    res = await fetch(url, { headers, credentials: "include" });
  }

  const body = await res.json().catch(() => ({}));
  // Handle new response format: { success, data: { request } }
  const data = body?.data?.request || body?.data || body?.request || body;
  return data;
};

/**
 * Delete a request (hard delete, for cancelled/rejected requests only)
 * Uses the new /api/event-requests/:id/delete endpoint
 */
export const deleteRequest = async (requestId: string) => {
  const token = getToken();
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  if (token) {
    res = await fetchWithAuth(`${API_BASE}/api/event-requests/${encodeURIComponent(requestId)}/delete`, { method: "DELETE" });
  } else {
    res = await fetch(`${API_BASE}/api/event-requests/${encodeURIComponent(requestId)}/delete`, { method: "DELETE", headers, credentials: "include" });
  }

  const resp = await res.json();
  if (!res.ok) throw new Error(resp.message || "Failed to delete request");

  try {
    window.dispatchEvent(new CustomEvent("unite:requests-changed", { detail: { requestId } }));
  } catch (e) {}

  return resp;
};

export default {};
