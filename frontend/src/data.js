const API_BASE_URL = window.CARLES_API_URL || 'https://carles-farm-backend-production.up.railway.app/api';

function getAuthToken() {
  return localStorage.getItem('carles_auth_token');
}

function saveAuth(token, user) {
  localStorage.setItem('carles_auth_token', token);
  localStorage.setItem('carles_current_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('carles_auth_token');
  localStorage.removeItem('carles_current_user');
}

function qs(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '' && value !== null)
  ).toString();
  return query ? `?${query}` : '';
}

async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch (err) {
    throw new Error('Cannot reach the farm server. Check your internet connection or Railway backend URL.');
  }

  if (response.status === 401) {
    clearAuth();
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('Session expired. Please sign in again.');
  }

  let data = null;
  try { data = await response.json(); } catch (err) {}
  if (!response.ok) throw new Error((data && data.error) || 'Request failed. Please try again.');
  return data;
}

window.CarlesAPI = {
  login: async (username, pin) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, pin })
    });
    if (data.token) saveAuth(data.token, data.user);
    return data;
  },
  logout: () => {
    clearAuth();
    window.location.reload();
  },
  getCurrentUser: () => {
    try { return JSON.parse(localStorage.getItem('carles_current_user')); } catch (err) { return null; }
  },
  me: () => apiCall('/auth/me'),
  changePin: data => apiCall('/auth/change-pin', { method: 'POST', body: JSON.stringify(data) }),

  getAnimals: (params = {}) => apiCall(`/animals${qs(params)}`),
  getAnimal: id => apiCall(`/animals/${id}`),
  createAnimal: data => apiCall('/animals', { method: 'POST', body: JSON.stringify(data) }),
  updateAnimal: (id, data) => apiCall(`/animals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnimal: id => apiCall(`/animals/${id}`, { method: 'DELETE' }),
  addWeight: (id, data) => apiCall(`/animals/${id}/weight`, { method: 'POST', body: JSON.stringify(data) }),

  getIngredients: () => apiCall('/feed/ingredients'),
  createIngredient: data => apiCall('/feed/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  updateIngredient: (id, data) => apiCall(`/feed/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIngredient: id => apiCall(`/feed/ingredients/${id}`, { method: 'DELETE' }),
  getFormulas: () => apiCall('/feed/formulas'),
  createFormula: data => apiCall('/feed/formulas', { method: 'POST', body: JSON.stringify(data) }),
  deleteFormula: id => apiCall(`/feed/formulas/${id}`, { method: 'DELETE' }),
  getFeedingLogs: () => apiCall('/feed/logs'),
  createFeedingLog: data => apiCall('/feed/logs', { method: 'POST', body: JSON.stringify(data) }),

  getMedications: () => apiCall('/medications'),
  createMedication: data => apiCall('/medications', { method: 'POST', body: JSON.stringify(data) }),
  updateMedication: (id, data) => apiCall(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedication: id => apiCall(`/medications/${id}`, { method: 'DELETE' }),
  getMedicationLogs: () => apiCall('/medications/logs'),
  createMedicationLog: data => apiCall('/medications/logs', { method: 'POST', body: JSON.stringify(data) }),

  getBreedingRecords: () => apiCall('/breeding'),
  createBreedingRecord: data => apiCall('/breeding', { method: 'POST', body: JSON.stringify(data) }),
  updateBreedingRecord: (id, data) => apiCall(`/breeding/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBreedingRecord: id => apiCall(`/breeding/${id}`, { method: 'DELETE' }),

  getTransactions: (params = {}) => apiCall(`/finance${qs(params)}`),
  getFinanceSummary: () => apiCall('/finance/summary'),
  createTransaction: data => apiCall('/finance', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => apiCall(`/finance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: id => apiCall(`/finance/${id}`, { method: 'DELETE' }),

  getUsers: () => apiCall('/users'),
  createUser: data => apiCall('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => apiCall(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: id => apiCall(`/users/${id}`, { method: 'DELETE' }),

  report: name => apiCall(`/reports/${name}`)
};

window.SPECIES = ['Cow', 'Pig', 'Goat', 'Sheep', 'Chicken'];
window.SPECIES_META = {
  Cow: { plural: 'Cattle', accent: '#0D3B3E', gestation: 283 },
  Pig: { plural: 'Pigs', accent: '#FF6B6B', gestation: 114 },
  Goat: { plural: 'Goats', accent: '#14B8A6', gestation: 150 },
  Sheep: { plural: 'Sheep', accent: '#8B5CF6', gestation: 147 },
  Chicken: { plural: 'Chickens', accent: '#F5B642', gestation: 21 }
};
