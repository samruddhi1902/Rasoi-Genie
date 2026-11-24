export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/register', {
      method: 'POST',
      body: userData,
    });
  }

  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: credentials,
    });
  }

  // Preferences
  async savePreferences(preferences, token) {
    return this.request('/preferences', {
      method: 'POST',
      body: preferences,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getPreferences(token) {
    return this.request('/preferences', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Menu Generation
  async generateMenu(token, regenerateRequest = null) {
    return this.request('/generate-menu', {
      method: 'POST',
      body: regenerateRequest || {},
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getCurrentMenu(token) {
    return this.request('/current-menu', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async regenerateMeal(token, menuId, day, meal) {
    return this.request('/regenerate-meal', {
      method: 'POST',
      body: {
        menu_id: menuId,
        day: day,
        meal: meal,
      },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getRecipe(token, dish, servings = 4) {
    return this.request('/recipe', {
      method: 'POST',
      body: { dish, servings },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getGroceryList(token, menuId, servings = 4) {
    return this.request('/grocery-list', {
      method: 'POST',
      body: { menu_id: menuId, servings },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getMenuHistory(token, limit = 10) {
    return this.request(`/menu-history?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
}

export const apiService = new ApiService();
