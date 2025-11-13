export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  // Browser-only helper: use token from localStorage / sessionStorage and
  // always include credentials so servers using cookies still work.
  const token = typeof window !== 'undefined' ? (localStorage.getItem('unite_token') || sessionStorage.getItem('unite_token')) : null;
  const headers: Record<string, any> = { 'Content-Type': 'application/json', ...(init.headers || {}) } as any;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(input, { credentials: 'include', ...init, headers });
  return res;
}

export async function fetchJsonWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const res = await fetchWithAuth(input, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || res.statusText || 'Request failed';
    const err: any = new Error(msg);
    err.response = res;
    err.body = body;
    throw err;
  }
  return body;
}

export default fetchWithAuth;
