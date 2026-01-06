// API utility functions with authentication
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth-token')

  const headers: HeadersInit = {
    ...options.headers,
  }

  // Don't set Content-Type for FormData - let the browser set it
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

export const authenticatedFetch = apiRequest