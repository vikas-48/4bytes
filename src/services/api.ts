import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Interceptor to add token to headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface Customer {
    _id: string;
    phoneNumber: string;
    name?: string;
    email?: string;
    khataBalance?: number;
    isLocal?: boolean;
}

export const authApi = {
    login: (data: Record<string, unknown>) => api.post('/auth/login', data),
    register: (data: Record<string, unknown>) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
};

export const productApi = {
    getAll: () => api.get('/products'),
    create: (data: Record<string, unknown>) => api.post('/products', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/products/${id}`, data),
};

export const customerApi = {
    getAll: () => api.get('/customers'),
    getByPhone: (phone: string) => api.get(`/customers/${phone}`),
    search: (query: string) => api.get(`/customers/search?q=${query}`),
    create: (data: any) => api.post('/customers', data),
    update: (id: string, data: any) => api.patch(`/customers/${id}`, data),
};

export const billApi = {
    getAll: () => api.get('/bills'),
    create: (data: { customerPhoneNumber: string; items: Array<{ productId: string; quantity: number; price: number }>; paymentType: string }) =>
        api.post('/bills', data),
};

export const ledgerApi = {
    getCustomerLedger: (customerId: string) => api.get(`/ledger/customer/${customerId}`),
    recordPayment: (data: { customerId: string; amount: number; paymentMode: string }) =>
        api.post('/ledger/payment', data),
};

export const groupBuyApi = {
    getAll: () => api.get('/group-buy'),
    create: (data: any) => api.post('/group-buy', data),
    join: (id: string, customerId: string, units: number = 1) => api.patch(`/group-buy/${id}/join`, { customerId, units }),
};

export default api;
