import axios from 'axios'

const api = axios.create({
  // Support VITE_API_URL env var for pointing at staging/production API.
  // Falls back to same-origin (empty string) when not set — works when
  // frontend and backend are co-served, or via the Vite dev proxy.
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  timeout: 30000,
})

// ── Admin bearer token ─────────────────────────────────────────────
// The frontend (Vercel) and backend (Render) live on different domains, so a
// session cookie would be a blocked third-party cookie. Instead the admin login
// returns a signed token that we store and send as an Authorization header.
const ADMIN_TOKEN_KEY = 'bjp_admin_token'
export const getAdminToken = () => {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY)
  } catch {
    return null
  }
}
export const setAdminToken = (t) => {
  try {
    if (t) {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, t)
      localStorage.removeItem(ADMIN_TOKEN_KEY) // Auto-purge persistent storage for security
    } else {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY)
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
  } catch { /* ignore */ }
}

api.interceptors.request.use((cfg) => {
  const url = cfg.url || ''
  // Attach the bearer token to protected admin routes (not the login call).
  if (url.startsWith('/admin/api') && !url.includes('/admin/api/login')) {
    const token = getAdminToken()
    if (token) {
      cfg.headers = cfg.headers || {}
      cfg.headers.Authorization = `Bearer ${token}`
    }
  }
  return cfg
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Session invalid/expired — drop the stored admin token.
      if (error.response.status === 401) setAdminToken(null)
      const data = error.response.data
      const msg = (typeof data === 'object' && data?.message) ? data.message : (typeof data === 'string' && data) ? data : 'Invalid credentials or unauthorized access.'
      return Promise.reject(new Error(msg))
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please try again.'))
    }
    return Promise.reject(new Error('Network error. Please check your connection.'))
  }
)

// ── BJP Local Body Candidate Application flow ──────────────────────
export const chat = {
  sendOtp: (mobile) =>
    api.post('/api/send-otp', { mobile }),

  verifyOtp: (mobile, otp) =>
    api.post('/api/verify-otp', { mobile, otp }),

  lookupVoter: (epicNo) =>
    api.post('/api/lookup-voter', { epic_no: epicNo }),

  submitApplication: (data) =>
    api.post('/api/submit-application', data),

  getApplication: (applicationId) =>
    api.get(`/api/application/${applicationId}`),

  sendOrganiserMessage: (data) =>
    api.post('/api/organiser-message', data),

  uploadMedia: (formData) =>
    api.post('/api/upload/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Media (esp. video) can be large and mobile uploads are slow — override
      // the default 30s so uploads aren't silently cut off mid-transfer.
      timeout: 300000, // 5 minutes
    }),

  updateApplicationPhoto: (applicationId, formData) =>
    api.post(`/api/application/${encodeURIComponent(applicationId)}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
}

export const getApplication = (applicationId) =>
  api.get(`/api/application/${applicationId}`)



// ── Admin console API (Email OTP & Credentials + Bearer Token) ──
export const admin = {
  sendOtp: (email) =>
    api.post('/admin/api/send-otp', { email }),

  verifyOtp: async (email, otp) => {
    const data = await api.post('/admin/api/verify-otp', { email, otp })
    if (data && data.token) setAdminToken(data.token)
    return data
  },

  login: async (username, password) => {
    const data = await api.post('/admin/api/login', { username, password })
    if (data && data.token) setAdminToken(data.token)
    return data
  },

  logout: async () => {
    setAdminToken(null)
    api.post('/admin/api/logout').catch(() => {})
    return { success: true }
  },

  getSession: () =>
    api.get('/admin/api/session'),

  getStats: () =>
    api.get('/admin/api/stats'),

  getDistrictAnalytics: () =>
    api.get('/admin/api/district-analytics'),

  getReports: (params) =>
    api.get('/admin/api/reports', { params }),

  getApplications: (params) =>
    api.get('/admin/api/applications', { params }),

  getApplication: (id) =>
    api.get(`/admin/api/applications/${id}`),

  updateApplication: (id, data) =>
    api.put(`/admin/api/applications/${id}`, data),

  deleteApplication: (id) =>
    api.delete(`/admin/api/applications/${id}`),

  updatePhoto: (id, formData) =>
    api.post(`/admin/api/applications/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),

  updateMembershipId: (id, membership_id) =>
    api.post(`/admin/api/applications/${id}/membership`, { membership_id }),

  getAdminUsers: () =>
    api.get('/admin/api/users'),

  createAdminUser: (formData) =>
    api.post('/admin/api/users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),

  updateAdminUser: (username, data) =>
    api.put(`/admin/api/users/${username}`, data),

  deleteAdminUser: (username) =>
    api.delete(`/admin/api/users/${username}`),
}

export default api
