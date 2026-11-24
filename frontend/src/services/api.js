import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('payflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('payflow_token');
      localStorage.removeItem('payflow_user');
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject({ message, status: error.response?.status, data: error.response?.data });
  }
);

// Health API
export const checkHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

// Auth APIs
export const registerUser = async (data) => {
  const response = await api.post('/api/auth/register', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post('/api/auth/login', data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// User Admin APIs
export const getUsers = async (page = 0, size = 10) => {
  const response = await api.get(`/api/users?page=${page}&size=${size}`);
  return response.data;
};

// Customer APIs
export const getCustomers = async (search = '', status = '', page = 0, size = 10) => {
  const params = new URLSearchParams({ page, size });
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  const response = await api.get(`/api/customers?${params.toString()}`);
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await api.get(`/api/customers/${id}`);
  return response.data;
};

export const createCustomer = async (data) => {
  const response = await api.post('/api/customers', data);
  return response.data;
};

export const updateCustomer = async (id, data) => {
  const response = await api.put(`/api/customers/${id}`, data);
  return response.data;
};

export const updateCustomerStatus = async (id, status) => {
  const response = await api.patch(`/api/customers/${id}/status`, { status });
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/api/customers/${id}`);
  return response.data;
};

// Payment APIs
export const getPayments = async (reference = '', status = '', currency = '', page = 0, size = 10, customerId = '') => {
  let ref = reference;
  let st = status;
  let curr = currency;
  let pg = page;
  let sz = size;
  let cId = customerId;

  // Support object parameters as well: getPayments({ reference, status, currency, page, size, customerId })
  if (typeof reference === 'object' && reference !== null) {
    ref = reference.reference || '';
    st = reference.status || '';
    curr = reference.currency || '';
    pg = reference.page !== undefined ? reference.page : 0;
    sz = reference.size !== undefined ? reference.size : 10;
    cId = reference.customerId || '';
  }

  const params = new URLSearchParams({ page: pg, size: sz });
  if (ref) params.append('reference', ref);
  if (st) params.append('status', st);
  if (curr) params.append('currency', curr);
  if (cId) params.append('customerId', cId);
  const response = await api.get(`/api/payments?${params.toString()}`);
  return response.data;
};

export const getPaymentById = async (id) => {
  const response = await api.get(`/api/payments/${id}`);
  return response.data;
};

export const createPayment = async (data) => {
  const response = await api.post('/api/payments', data);
  return response.data;
};

export const authorizePayment = async (id) => {
  const response = await api.post(`/api/payments/${id}/authorize`);
  return response.data;
};

export const capturePayment = async (id) => {
  const response = await api.post(`/api/payments/${id}/capture`);
  return response.data;
};

export const cancelPayment = async (id) => {
  const response = await api.post(`/api/payments/${id}/cancel`);
  return response.data;
};

// Transaction APIs
export const getTransactions = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append('page', params.page);
  if (params.size !== undefined) query.append('size', params.size);
  if (params.type) query.append('type', params.type);
  if (params.status) query.append('status', params.status);
  if (params.currency) query.append('currency', params.currency);
  if (params.customerId) query.append('customerId', params.customerId);
  if (params.search) query.append('search', params.search);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const response = await api.get(`/api/transactions?${query.toString()}`);
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/api/transactions/${id}`);
  return response.data;
};

export const getTransactionByReference = async (reference) => {
  const response = await api.get(`/api/transactions/reference/${reference}`);
  return response.data;
};

export const getPaymentTransactions = async (paymentId) => {
  const response = await api.get(`/api/transactions/payment/${paymentId}`);
  return response.data;
};

// Refund APIs
export const getRefunds = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append('page', params.page);
  if (params.size !== undefined) query.append('size', params.size);
  if (params.status) query.append('status', params.status);
  if (params.currency) query.append('currency', params.currency);
  if (params.customerId) query.append('customerId', params.customerId);
  if (params.search) query.append('search', params.search);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const response = await api.get(`/api/refunds?${query.toString()}`);
  return response.data;
};

export const getRefundById = async (refundId) => {
  const response = await api.get(`/api/refunds/${refundId}`);
  return response.data;
};

export const getRefundableBalance = async (paymentId) => {
  const response = await api.get(`/api/payments/${paymentId}/refundable-amount`);
  return response.data;
};

export const processRefund = async (paymentId, data) => {
  const response = await api.post(`/api/payments/${paymentId}/refunds`, data);
  return response.data;
};

export const getPaymentRefunds = async (paymentId) => {
  const response = await api.get(`/api/payments/${paymentId}/refunds`);
  return response.data;
};

// Reconciliation APIs
export const importSettlementCsv = async (formData) => {
  const response = await api.post('/api/reconciliation/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const runReconciliation = async (batchId) => {
  const response = await api.post(`/api/reconciliation/run?batchId=${batchId}`);
  return response.data;
};

export const getReconciliationRecords = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append('page', params.page);
  if (params.size !== undefined) query.append('size', params.size);
  if (params.status) query.append('status', params.status);
  if (params.batchId) query.append('batchId', params.batchId);
  if (params.search) query.append('search', params.search);

  const response = await api.get(`/api/reconciliation/records?${query.toString()}`);
  return response.data;
};

export const getReconciliationRecordById = async (id) => {
  const response = await api.get(`/api/reconciliation/records/${id}`);
  return response.data;
};

export const getSettlementBatches = async (page = 0, size = 10) => {
  const response = await api.get(`/api/reconciliation/batches?page=${page}&size=${size}`);
  return response.data;
};

export const getReconciliationSummary = async (batchId = null) => {
  const url = batchId ? `/api/reconciliation/summary?batchId=${batchId}` : '/api/reconciliation/summary';
  const response = await api.get(url);
  return response.data;
};

export const exportReconciliationCsv = async (batchId = null) => {
  const url = batchId ? `/api/reconciliation/export?batchId=${batchId}` : '/api/reconciliation/export';
  const response = await api.get(url, {
    responseType: 'blob',
  });
  return response.data;
};

// Dashboard & Audit APIs
export const getDashboardStats = async () => {
  const response = await api.get('/api/dashboard/stats');
  return response.data;
};

export const getDashboardSummary = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.currency) query.append('currency', params.currency);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  const response = await api.get(`/api/dashboard/summary?${query.toString()}`);
  return response.data;
};

export const getPaymentTrends = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.period) query.append('period', params.period);
  if (params.currency) query.append('currency', params.currency);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  const response = await api.get(`/api/dashboard/payment-trends?${query.toString()}`);
  return response.data;
};

export const getTransactionStats = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  const response = await api.get(`/api/dashboard/transaction-stats?${query.toString()}`);
  return response.data;
};

export const getRefundStats = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.currency) query.append('currency', params.currency);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  const response = await api.get(`/api/dashboard/refund-stats?${query.toString()}`);
  return response.data;
};

export const getReconciliationStats = async () => {
  const response = await api.get('/api/dashboard/reconciliation-stats');
  return response.data;
};

// Audit Logs APIs
export const getAuditLogs = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append('page', params.page);
  if (params.size !== undefined) query.append('size', params.size);
  if (params.action) query.append('action', params.action);
  if (params.entityType) query.append('entityType', params.entityType);
  if (params.userId) query.append('userId', params.userId);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const response = await api.get(`/api/audit-logs?${query.toString()}`);
  return response.data;
};

export const getAuditLogById = async (id) => {
  const response = await api.get(`/api/audit-logs/${id}`);
  return response.data;
};

// Notification APIs
export const getNotifications = async (page = 0, size = 20) => {
  const response = await api.get(`/api/notifications?page=${page}&size=${size}`);
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get('/api/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/api/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/api/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/api/notifications/${id}`);
  return response.data;
};

export default api;
