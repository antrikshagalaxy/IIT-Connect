const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
  
  getMentors: (exam) => {
    const q = exam ? `?exam=${encodeURIComponent(exam)}` : '';
    return request(`/mentors${q}`);
  },

  getMentor: (id) => request(`/mentors/${id}`),

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
