const BASE = '/api/admin';

function getToken() {
  return localStorage.getItem('admin_token') ?? '';
}

export async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin';
    return null;
  }
  return res.json();
}
