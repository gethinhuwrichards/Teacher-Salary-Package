const BASE_URL = '/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add admin token if available
  const token = localStorage.getItem('adminToken');
  if (token && path.startsWith('/admin')) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Countries
  getCountries: () => request('/countries'),
  getAllCountries: () => request('/countries/all'),
  getCountrySchools: (countryId) => request(`/countries/${countryId}/schools`),

  // Schools
  searchSchools: (q, limit = 15) => request(`/schools/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  getSchool: (id) => request(`/schools/${id}`),
  getSchoolSubmissions: (id) => request(`/schools/${id}/submissions`),

  // Submissions
  submitSalary: (data) => request('/submissions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Currency
  getRates: () => request('/currency/rates'),

  // Admin
  adminLogin: (password) => request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  getAdminSubmissions: (status = 'pending') => request(`/admin/submissions?status=${status}`),
  reviewSubmission: (id, action) => request(`/admin/submissions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  }),
  restoreSubmission: (id) => request(`/admin/submissions/${id}/restore`, {
    method: 'PATCH',
  }),
  matchSchool: (id, schoolId) => request(`/admin/submissions/${id}/match-school`, {
    method: 'PATCH',
    body: JSON.stringify({ school_id: schoolId }),
  }),
  getAllApprovedSubmissions: (schoolId) => {
    const params = schoolId ? `?school_id=${schoolId}` : '';
    return request(`/admin/submissions/all${params}`);
  },
  bulkUpdateStatus: (ids, status) => request('/admin/submissions/bulk-status', {
    method: 'PATCH',
    body: JSON.stringify({ ids, status }),
  }),
};
