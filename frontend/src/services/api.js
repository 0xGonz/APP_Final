import axios from 'axios';

// Create axios instance with base configuration
// Uses environment variable for flexibility across dev/production
// Production: VITE_API_URL should be set to full backend URL (e.g., https://backend.vercel.app/api)
// Development: defaults to http://localhost:3001/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API base URL for debugging
console.log('[API] Base URL:', api.defaults.baseURL);
console.log('[API] Environment:', import.meta.env.MODE);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// ============================================
// CLINIC ENDPOINTS
// ============================================

export const clinicsAPI = {
  // Get all clinics
  getAll: (params = {}) => api.get('/clinics', { params }),

  // Get single clinic
  getById: (clinicId) => api.get(`/clinics/${clinicId}`),

  // Get clinic P&L
  getPnL: (clinicId, params = {}) =>
    api.get(`/clinics/${clinicId}/pnl`, { params }),
};

// ============================================
// FINANCIAL DATA ENDPOINTS
// ============================================

export const financialsAPI = {
  // Get consolidated data
  getConsolidated: (params = {}) =>
    api.get('/financials/consolidated', { params }),

  // Compare clinics
  compare: (clinicIds, params = {}) =>
    api.get('/financials/compare', {
      params: { ...params, clinicIds: clinicIds.join(',') }
    }),

  // Compare time periods for a clinic
  periodCompare: (clinicId, periods) =>
    api.post('/financials/period-compare', { clinicId, periods }),

  // Get trends
  getTrends: (params = {}) =>
    api.get('/financials/trends', { params }),

  // Get line item details
  getLineItem: (category, params = {}) =>
    api.get(`/financials/line-item/${category}`, { params }),

  // Get summary
  getSummary: (params = {}) =>
    api.get('/financials/summary', { params }),
};

// ============================================
// METRICS ENDPOINTS
// ============================================

export const metricsAPI = {
  // Get KPIs
  getKPIs: (params = {}) =>
    api.get('/metrics/kpis', { params }),

  // Get growth metrics
  getGrowth: (params = {}) =>
    api.get('/metrics/growth', { params }),

  // Get margins
  getMargins: (params = {}) =>
    api.get('/metrics/margins', { params }),

  // Get efficiency metrics
  getEfficiency: (params = {}) =>
    api.get('/metrics/efficiency', { params }),
};

// ============================================
// EXPORT ENDPOINTS
// ============================================

export const exportAPI = {
  // Export to Excel
  exportExcel: async (data) => {
    const response = await api.post('/export/excel', data, {
      responseType: 'blob',
    });
    return response;
  },

  // Export to PDF
  exportPDF: (data) =>
    api.post('/export/pdf', data),

  // Export to CSV
  exportCSV: async (params = {}) => {
    const response = await api.get('/export/csv', {
      params,
      responseType: 'blob',
    });
    return response;
  },
};

// ============================================
// SYSTEM ENDPOINTS
// ============================================

export const systemAPI = {
  // Get available data range
  getDataRange: () => api.get('/system/data-range'),
};

// ============================================
// UPLOAD ENDPOINTS
// ============================================

export const uploadAPI = {
  // Upload CSV files
  uploadCSV: (formData, onUploadProgress) => {
    return api.post('/upload/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
      timeout: 120000, // 2 minute timeout for uploads
    });
  },

  // Get upload history
  getHistory: (params = {}) => api.get('/upload/history', { params }),

  // Get specific upload details
  getDetails: (uploadId) => api.get(`/upload/${uploadId}`),

  // Rollback to version
  rollback: (uploadId, versionId) =>
    api.post(`/upload/${uploadId}/rollback`, { versionId }),

  // Get version history for a clinic
  getVersions: (clinicId, params = {}) =>
    api.get(`/upload/versions/${clinicId}`, { params }),

  // Delete upload
  delete: (uploadId) => api.delete(`/upload/${uploadId}`),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;
