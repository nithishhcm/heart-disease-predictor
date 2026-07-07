import axios from 'axios';

// ---------------------------------------------------------------------------
// API Base URL Configuration
// ---------------------------------------------------------------------------
// In production builds, VITE_API_URL is baked in from .env.production.
// For local development, .env supplies the same variable pointing at localhost.
// The hardcoded fallback ensures the production Render backend is always reached
// even if the environment variable is missing (e.g. .env is gitignored).
// ---------------------------------------------------------------------------
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://heart-disease-predictor-mwgp.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30-second timeout for Render cold starts
});

// ---------------------------------------------------------------------------
// Request Interceptor: Attach access token to headers
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor: Handle token expiration (401) + rolling refresh
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // --- 401 Unauthorized: attempt silent token refresh ------------------
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const newAccess = refreshRes.data.access_token;
          const newRefresh = refreshRes.data.refresh_token;

          localStorage.setItem('token', newAccess);
          if (newRefresh) {
            localStorage.setItem('refresh_token', newRefresh);
          }

          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Helper: classify an Axios error into a human-readable message
// ---------------------------------------------------------------------------
export function classifyError(err) {
  // No response at all — network / CORS / server down
  if (!err.response) {
    if (err.code === 'ECONNABORTED') {
      return 'Request timed out — the backend may be starting up. Please retry in a moment.';
    }
    return 'Backend unavailable — unable to reach the server. Please check your connection or try again later.';
  }

  const status = err.response.status;
  const detail = err.response.data?.detail;

  if (status === 401) return 'Authentication failed — invalid credentials or session expired.';
  if (status === 403) return 'Access denied — you do not have permission for this action.';
  if (status === 404) return 'Endpoint not found — the requested resource does not exist.';
  if (status === 422) {
    // FastAPI validation error
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join('; ');
    }
    return typeof detail === 'string' ? detail : 'Validation error — please check your inputs.';
  }
  if (status >= 500) return `Server error (${status}) — something went wrong on the backend.`;

  // Generic fallback
  return typeof detail === 'string' ? detail : 'An unexpected error occurred.';
}

export default api;
