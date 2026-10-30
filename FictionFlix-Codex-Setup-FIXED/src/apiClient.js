export async function apiRequest(path, options = {}) {
 const response = await fetch(path, {
  credentials: 'same-origin',
  ...options,
  headers: {
   ...(options.body instanceof FormData ? {} : {'Content-Type': 'application/json'}),
   ...options.headers,
  },
 });
 let result;
 try {
  result = await response.json();
 } catch {
  throw new Error('The server returned an invalid response. Please try again.');
 }
 if (!response.ok || result.status === 'error') {
  const error = new Error(result.message || 'The request could not be completed.');
  error.code = result.code;
  error.status = response.status;
  throw error;
 }
 return result;
}

export async function getCurrentUser() {
 const result = await apiRequest('/api/studio/access');
 return result.user;
}

export async function hasStudioAccess() {
 const result = await apiRequest('/api/studio/access');
 return Boolean(result.allowed);
}
