import { isTokenExpired, clearAuthTokens } from './tokenManager';

function getApiBase(): string {
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_URL
  ) {
    return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    return `${window.location.protocol}//${window.location.host}`;
  }

  return "http://localhost:6700";
}

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {},
) {
  // Browser-only helper: use token from localStorage / sessionStorage and
  // always include credentials so servers using cookies still work.
  let resolvedInput: RequestInfo = input;

  if (typeof input === "string") {
    const str = input;

    if (!isAbsoluteUrl(str)) {
      const base = getApiBase();
      // ensure leading slash
      const path = str.startsWith("/") ? str : `/${str}`;

      resolvedInput = `${base}${path}`;
    }
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("unite_token") ||
        sessionStorage.getItem("unite_token")
      : null;
  
  // Check if token is expired before making the request
  if (token && isTokenExpired(token)) {
    console.warn('[FetchWithAuth] Token expired, clearing and redirecting to login');
    clearAuthTokens();
    
    // Redirect to login page if not already there
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth/signin';
    }
    
    // Return a rejected response
    return Promise.reject(new Error('Token expired'));
  }
  
  const headers: Record<string, any> = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  } as any;

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(resolvedInput, {
    credentials: "include",
    ...init,
    headers,
  });

  return res;
}

export async function fetchJsonWithAuth(
  input: RequestInfo,
  init: RequestInit = {},
) {
  const res = await fetchWithAuth(input, init);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (body && (body.message || body.error)) ||
      res.statusText ||
      "Request failed";
    const err: any = new Error(msg);

    err.response = res;
    err.body = body;
    err.status = res.status;
    
    // For 401/403 errors, mark as authentication error for easier handling
    if (res.status === 401 || res.status === 403) {
      err.isAuthError = true;
      
      // Get token to check if user was authenticated
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("unite_token") ||
            sessionStorage.getItem("unite_token")
          : null;
      const hasToken = token ? true : false;
      
      if (hasToken) {
        const isPermissionError = res.status === 403 || (msg && (
          msg.toLowerCase().includes("permission denied") ||
          msg.toLowerCase().includes("permission")
        ));

        if (res.status === 401 && !isPermissionError) {
          // Token invalid/expired – clear and redirect
          console.warn('[FetchWithAuth] Authentication error - token may be expired or invalid');
          clearAuthTokens();
          console.error(`Request failed (${res.status}):`, msg);
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
            setTimeout(() => {
              window.location.href = '/auth/signin';
            }, 100);
          }
        } else {
          // Permission error or explicit 403: keep token, surface error
          console.warn('[FetchWithAuth] Permission denied for this resource');
        }
      }
      // If no token, don't log - it's expected for public access
    } else {
      // Don't log validation warnings (400) for stakeholder creation if they mention capabilities
      // Also don't log "Email already exists" or duplicate key errors - they will be shown in the modal
      const isValidationWarning = res.status === 400 && 
        msg && (
          msg.toLowerCase().includes("capabilities") ||
          msg.toLowerCase().includes("must include") ||
          msg.toLowerCase().includes("email already exists") ||
          msg.toLowerCase().includes("duplicate key") ||
          msg.toLowerCase().includes("e11000")
        );
      
      if (!isValidationWarning) {
        // Log other errors normally
        console.error(`Request failed (${res.status}):`, msg);
      }
    }
    
    throw err;
  }

  return body;
}

export default fetchWithAuth;
