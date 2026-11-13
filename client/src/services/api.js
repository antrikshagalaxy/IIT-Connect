const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// In-memory cache for ultra-fast instant transitions (0ms response)
const memoryCache = new Map();

function getCached(key) {
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  try {
    const raw = sessionStorage.getItem(`iit_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Valid for 10 minutes in session
      if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
        memoryCache.set(key, parsed.data);
        return parsed.data;
      }
    }
  } catch {}
  return null;
}

function setCached(key, data) {
  if (!data) return;
  memoryCache.set(key, data);
  try {
    sessionStorage.setItem(`iit_cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {}
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = localStorage.getItem('iit_connect_admin_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Public
  getConfig: () => request('/config'),

  // Instant cache read for zero-delay rendering
  getCachedMentors: (exam = '') => {
    const all = getCached('mentors_all');
    if (!all) return null;
    if (!exam) return all;
    return all.filter(m => m.exams?.some(e => e.toLowerCase().includes(exam.toLowerCase())));
  },

  getCachedMentor: (id) => {
    const single = getCached(`mentor_${id}`);
    if (single) return single;
    const all = getCached('mentors_all');
    if (all) {
      const found = all.find(m => m._id === id);
      if (found) return found;
    }
    return null;
  },
  
  // Fetches fresh data and refreshes cache
  getMentors: async (exam = '') => {
    const q = exam ? `?exam=${encodeURIComponent(exam)}` : '';
    const res = await request(`/mentors${q}`);
    if (res?.data) {
      if (!exam) {
        setCached('mentors_all', res.data);
        // Also populate individual mentor caches
        res.data.forEach(m => setCached(`mentor_${m._id}`, m));
      }
      setCached(`mentors_${exam || 'all'}`, res.data);
    }
    return res;
  },

  getMentor: async (id) => {
    const res = await request(`/mentors/${id}`);
    if (res?.data) {
      setCached(`mentor_${id}`, res.data);
    }
    return res;
  },

  getMentorSlots: (mentorId, date) => request(`/mentors/${mentorId}/slots?date=${encodeURIComponent(date)}`),

  createBooking: (payload) => request('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getBookingByCode: (code) => request(`/bookings/by-code/${encodeURIComponent(code)}`),

  trackBooking: (code, phone) => request(`/bookings/track?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phone)}`),

  // Admin
  adminLogin: (password) => request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  }),

  getAdminBookings: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);
    if (filters.mentorId) params.append('mentorId', filters.mentorId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/admin/bookings${qs}`);
  },

  updateAdminBooking: (id, payload) => request(`/admin/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  getAdminMentors: () => request('/admin/mentors'),

  createAdminMentor: (payload) => request('/admin/mentors', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateAdminMentor: (id, payload) => request(`/admin/mentors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  deactivateAdminMentor: (id) => request(`/admin/mentors/${id}`, {
    method: 'DELETE'
  })
};
