// Carles Farm Management - Complete API Integration Layer
// This file handles ALL communication with the Railway backend

const API_BASE_URL = 'https://carles-farm-backend-production.up.railway.app/api';

// ═══════════════════════════════════════════════════════
// AUTHENTICATION & TOKEN MANAGEMENT
// ═══════════════════════════════════════════════════════

function getAuthToken() {
  return localStorage.getItem('carles_auth_token');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('carles_current_user');
  return userStr ? JSON.parse(userStr) : null;
}

function saveAuth(token, user) {
  localStorage.setItem('carles_auth_token', token);
  localStorage.setItem('carles_current_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('carles_auth_token');
  localStorage.removeItem('carles_current_user');
}

function isLoggedIn() {
  return !!getAuthToken();
}

// ═══════════════════════════════════════════════════════
// API HELPER FUNCTION
// ═══════════════════════════════════════════════════════

async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      clearAuth();
      window.location.reload();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════
// CARLES API - ALL ENDPOINTS
// ═══════════════════════════════════════════════════════

window.CarlesAPI = {
  
  // ─────────────────────────────────────────────────────
  // AUTHENTICATION
  // ─────────────────────────────────────────────────────
  
  login: async (username, pin) => {
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, pin })
      });
      
      if (data.token && data.user) {
        saveAuth(data.token, data.user);
        return { success: true, user: data.user };
      }
      
      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  logout: () => {
    clearAuth();
    window.location.reload();
  },
  
  getCurrentUser: getCurrentUser,
  isLoggedIn: isLoggedIn,
  
  changePin: async (currentPin, newPin) => {
    return await apiCall('/auth/change-pin', {
      method: 'POST',
      body: JSON.stringify({ currentPin, newPin })
    });
  },
  
  // ─────────────────────────────────────────────────────
  // ANIMALS
  // ─────────────────────────────────────────────────────
  
  getAnimals: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await apiCall(`/animals${params ? '?' + params : ''}`);
  },
  
  getAnimal: async (id) => {
    return await apiCall(`/animals/${id}`);
  },
  
  createAnimal: async (animalData) => {
    return await apiCall('/animals', {
      method: 'POST',
      body: JSON.stringify(animalData)
    });
  },
  
  updateAnimal: async (id, animalData) => {
    return await apiCall(`/animals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(animalData)
    });
  },
  
  deleteAnimal: async (id) => {
    return await apiCall(`/animals/${id}`, {
      method: 'DELETE'
    });
  },
  
  addAnimalWeight: async (id, weightData) => {
    return await apiCall(`/animals/${id}/weight`, {
      method: 'POST',
      body: JSON.stringify(weightData)
    });
  },
  
  getAnimalStats: async () => {
    return await apiCall('/animals/stats/summary');
  },
  
  // ─────────────────────────────────────────────────────
  // FEED
  // ─────────────────────────────────────────────────────
  
  getIngredients: async () => {
    return await apiCall('/feed/ingredients');
  },
  
  createIngredient: async (ingredientData) => {
    return await apiCall('/feed/ingredients', {
      method: 'POST',
      body: JSON.stringify(ingredientData)
    });
  },
  
  updateIngredient: async (id, ingredientData) => {
    return await apiCall(`/feed/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ingredientData)
    });
  },
  
  deleteIngredient: async (id) => {
    return await apiCall(`/feed/ingredients/${id}`, {
      method: 'DELETE'
    });
  },
  
  getFormulas: async () => {
    return await apiCall('/feed/formulas');
  },
  
  createFormula: async (formulaData) => {
    return await apiCall('/feed/formulas', {
      method: 'POST',
      body: JSON.stringify(formulaData)
    });
  },
  
  deleteFormula: async (id) => {
    return await apiCall(`/feed/formulas/${id}`, {
      method: 'DELETE'
    });
  },
  
  getFeedingLogs: async () => {
    return await apiCall('/feed/logs');
  },
  
  recordFeeding: async (feedingData) => {
    return await apiCall('/feed/logs', {
      method: 'POST',
      body: JSON.stringify(feedingData)
    });
  },
  
  // ─────────────────────────────────────────────────────
  // MEDICATIONS
  // ─────────────────────────────────────────────────────
  
  getMedications: async () => {
    return await apiCall('/medications');
  },
  
  createMedication: async (medicationData) => {
    return await apiCall('/medications', {
      method: 'POST',
      body: JSON.stringify(medicationData)
    });
  },
  
  updateMedication: async (id, medicationData) => {
    return await apiCall(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(medicationData)
    });
  },
  
  deleteMedication: async (id) => {
    return await apiCall(`/medications/${id}`, {
      method: 'DELETE'
    });
  },
  
  getMedicationDosages: async (medicationId) => {
    return await apiCall(`/medications/${medicationId}/dosages`);
  },
  
  createDosage: async (medicationId, dosageData) => {
    return await apiCall(`/medications/${medicationId}/dosages`, {
      method: 'POST',
      body: JSON.stringify(dosageData)
    });
  },
  
  getMedicationLogs: async () => {
    return await apiCall('/medications/logs');
  },
  
  recordMedication: async (medicationData) => {
    return await apiCall('/medications/logs', {
      method: 'POST',
      body: JSON.stringify(medicationData)
    });
  },
  
  // ─────────────────────────────────────────────────────
  // BREEDING
  // ─────────────────────────────────────────────────────
  
  getBreedingRecords: async () => {
    return await apiCall('/breeding');
  },
  
  createBreedingRecord: async (breedingData) => {
    return await apiCall('/breeding', {
      method: 'POST',
      body: JSON.stringify(breedingData)
    });
  },
  
  updateBreedingRecord: async (id, breedingData) => {
    return await apiCall(`/breeding/${id}`, {
      method: 'PUT',
      body: JSON.stringify(breedingData)
    });
  },
  
  deleteBreedingRecord: async (id) => {
    return await apiCall(`/breeding/${id}`, {
      method: 'DELETE'
    });
  },
  
  // ─────────────────────────────────────────────────────
  // FINANCE
  // ─────────────────────────────────────────────────────
  
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiCall(`/finance${query ? '?' + query : ''}`);
  },
  
  createTransaction: async (transactionData) => {
    return await apiCall('/finance', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
  },
  
  updateTransaction: async (id, transactionData) => {
    return await apiCall(`/finance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData)
    });
  },
  
  deleteTransaction: async (id) => {
    return await apiCall(`/finance/${id}`, {
      method: 'DELETE'
    });
  },
  
  getFinanceSummary: async () => {
    return await apiCall('/finance/summary');
  },
  
  // ─────────────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────────────
  
  getAnimalReport: async () => {
    return await apiCall('/reports/animals');
  },
  
  getBreedingReport: async () => {
    return await apiCall('/reports/breeding');
  },
  
  getHealthReport: async () => {
    return await apiCall('/reports/health');
  },
  
  getFinanceReport: async () => {
    return await apiCall('/reports/finance');
  },
  
  getFeedReport: async () => {
    return await apiCall('/reports/feed');
  },
  
  // ─────────────────────────────────────────────────────
  // USERS (Admin only)
  // ─────────────────────────────────────────────────────
  
  getUsers: async () => {
    return await apiCall('/users');
  },
  
  createUser: async (userData) => {
    return await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  updateUser: async (id, userData) => {
    return await apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },
  
  deleteUser: async (id) => {
    return await apiCall(`/users/${id}`, {
      method: 'DELETE'
    });
  }
};

// ═══════════════════════════════════════════════════════
// CONSTANTS FOR UI
// ═══════════════════════════════════════════════════════

window.SPECIES = ['Cow', 'Pig', 'Goat', 'Sheep', 'Chicken'];

window.SPECIES_META = {
  'Cow': { plural: 'Cattle', accent: '#0D3B3E', gestation: 283 },
  'Pig': { plural: 'Pigs', accent: '#FF6B6B', gestation: 114 },
  'Goat': { plural: 'Goats', accent: '#14B8A6', gestation: 150 },
  'Sheep': { plural: 'Sheep', accent: '#8B5CF6', gestation: 147 },
  'Chicken': { plural: 'Chickens', accent: '#F5B642', gestation: 21 }
};

window.ANIMAL_STATUSES = ['Healthy', 'Sick', 'Quarantine', 'Sold', 'Deceased'];

window.USER_ROLES = ['Admin', 'Manager', 'Worker', 'Veterinarian'];

window.TRANSACTION_TYPES = ['Income', 'Expense'];

window.BREEDING_STATUSES = ['Pending', 'Pregnant', 'Delivered', 'Failed'];

window.FEED_UNITS = ['kg', 'g', 'ml', 'l'];

window.MEDICATION_TYPES = ['Antibiotic', 'Vaccine', 'Antiparasitic', 'Vitamin', 'Supplement', 'Other'];

// ═══════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════

// Calculate expected delivery date based on species and breeding date
window.calculateDeliveryDate = function(species, breedingDate) {
  if (!species || !breedingDate) return null;
  
  const gestationDays = window.SPECIES_META[species]?.gestation || 0;
  if (gestationDays === 0) return null;
  
  const breeding = new Date(breedingDate);
  const delivery = new Date(breeding);
  delivery.setDate(delivery.getDate() + gestationDays);
  
  return delivery.toISOString().split('T')[0];
};

// Calculate days until delivery
window.daysUntilDelivery = function(expectedDeliveryDate) {
  if (!expectedDeliveryDate) return null;
  
  const today = new Date();
  const delivery = new Date(expectedDeliveryDate);
  const diff = Math.ceil((delivery - today) / (1000 * 60 * 60 * 24));
  
  return diff;
};

// Check if animal is near term (within 7 days)
window.isNearTerm = function(expectedDeliveryDate) {
  const days = window.daysUntilDelivery(expectedDeliveryDate);
  return days !== null && days >= 0 && days <= 7;
};

// ═══════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════

console.log('✅ Carles API initialized');
console.log('📡 Backend URL:', API_BASE_URL);
