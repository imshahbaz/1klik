import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';

const APP_KEY = process.env.EXPO_PUBLIC_TRUECALLER_APP_KEY;
const APP_NAME = "1Klik";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthMe = error.config?.url?.includes('/auth/me');
    if (error.response && error.response.status === 401) {
      DeviceEventEmitter.emit('auth-expired');
      if (isAuthMe) {
        return Promise.resolve({ data: null });
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
  clientConfig: () => api.get('/api/config/client/active')
};

export const userPreferenceAPI = {
  updateUsername: (userId, username, password) => api.patch('/api/user/username', { userId, username, password }),
  updateTheme: (theme) => api.patch('/api/user/theme', { theme }),
}

export const userAPI = {
  signup: (email, password, confirmPassword) => api.post('/api/auth/signup', { email, password, confirmPassword }),
  verifyOtp: (email, otp) => api.post('/api/auth/verify-otp', { email, otp }),
  linkEmail: (userId, email, password, confirmPassword) => api.post('/api/user/send-update-otp', { userId, email, password, confirmPassword }),
  verifyUpdateOtp: (email, otp) => api.post('/api/user/verify-update-otp', { email, otp }),
};

export const strategyAPI = {
  getStrategies: () => api.get('/api/strategy'),
  fetchWithMargin: (strategyName) => api.get(`/api/chartink/fetchWithMargin?strategy=${encodeURIComponent(strategyName)}`),
  fetchChartData: (symbol) => api.get(`/api/nse/history?symbol=${encodeURIComponent(symbol)}`),
  createStrategy: (strategyData) => api.post('/api/strategy', strategyData),
  updateStrategy: (strategyData) => api.put('/api/strategy', strategyData),
  deleteStrategy: (id) => api.delete('/api/strategy', {
    params: { id: id }
  }),
  getStrategiesAdmin: () => api.get('/api/strategy/admin'),
  getAllIndices: () => api.get('/api/nse/allindices'),
};

export const marginAPI = {
  getAllMargins: () => api.get('/api/margin/all'),
  loadFromCsv: (formData) => api.post('/api/margin/load-from-csv', formData),
  getOptions: () => api.get('/api/margin/options'),
};

export const configAPI = {
  getConfig: () => api.get('/api/config/active'),
  updateConfig: (configData) => api.patch('/api/config/update', configData),
  reloadConfig: () => api.post('/api/config/reload'),
};

export const priceActionAPI = {
  createOrderBlock: (obReq) => api.post('/api/price-action/ob', obReq),
  deleteOrderBlock: (obReq) => api.delete('/api/price-action/ob', { data: obReq }),
  getPriceActionBySymbol: (symbol) => api.get(`/api/price-action/${encodeURIComponent(symbol)}`),
  updateOrderBlock: (obReq) => api.patch('/api/price-action/ob', obReq),
  checkOrderBlock: () => api.get('/api/price-action/ob/mitigation'),
  refreshMitigationData: () => api.post('/api/price-action/ob/check'),

  createFVG: (fvgReq) => api.post('/api/price-action/fvg', fvgReq),
  deleteFVG: (fvgReq) => api.delete('/api/price-action/fvg', { data: fvgReq }),
  updateFVG: (fvgReq) => api.patch('/api/price-action/fvg', fvgReq),
  checkFVGMitigation: () => api.get('/api/price-action/fvg/mitigation'),
  refreshFvgMitigationData: () => api.post('/api/price-action/fvg/check'),

  runAutomation: () => api.post('/api/price-action/automate'),
  cleanUpActions: () => api.post('/api/price-action/cleanup'),
}

export const truecallerAPI = {
  getTruecallerStatus: (requestId) => api.get(`/api/auth/truecaller/status/${requestId}`),
  truecallerLogin: (requestId) => `truecallersdk://truesdk/web_verify?type=btmsheet&requestNonce=${requestId}&partnerKey=${APP_KEY}&partnerName=${APP_NAME}&lang=en&title=logIn&skipOption=useanothernum`,
}

export const googleAPI = {
  googleCallback: (code, random) => api.get("/api/auth/google/callback", {
    params: {
      code: code,
      state: random
    }
  }),
  googleTokenValidation: (token) => api.post("/api/auth/google/token", null, { 
    params: { code: token, state: "validate" },
    headers: { nativeFlow: 'true' }
  })
}

export const newsApi = {
  getTvNews: (symbol) => api.get(`/api/news/${symbol}`),
  getGenAiAnalysis: (symbol) => api.get(`/api/news/ai/${symbol}`),
}

export const zerodhaAPI = {
  login: (requestToken, userId) => api.post('/api/zerodha/login',
    { request_token: requestToken, user_id: userId },
  ),
  getMe: () => api.get('/api/zerodha/me'),
  placeMTFOrder: (orderData) => api.post('/api/order', orderData),
  getUserOrders: (userId) => api.get(`/api/order/user/${userId}`),
  updateOrder: (id, orderData) => api.put(`/api/order/${id}`, orderData),
  deleteOrder: (id) => api.delete(`/api/order/${id}`),
  saveConfig: (configData) => api.post('/api/zerodha/config', configData),
}
export const strategyOrderAPI = {
  placeOrder: (orderData) => api.post('/api/strategy-order', orderData),
  getMyOrders: () => api.get('/api/strategy-order/my'),
  updateOrder: (id, orderData) => api.put(`/api/strategy-order/${id}`, orderData),
  deleteOrder: (id) => api.delete(`/api/strategy-order/${id}`),
}

export const notificationAPI = {
  saveToken: (token) => api.patch('/api/user/fcm-token', { token: token }),
};

export const mstockAPI = {
  login: (apiKey, password, username) => api.post('/api/mstock/login',
    { apiKey: apiKey, password: password, username: username },
  ),
  getMe: () => api.get('/api/mstock/me'),
  verifyOtp: (otp) => api.post('/api/mstock/verify', { otp: otp }),
  placeOrder: (orderData) => api.post('/api/mstock/order', orderData),
  refreshSession: () => api.post('/api/mstock/refresh'),
  logout: () => api.post('/api/mstock/logout'),
}

export const angelOneApi = {
  getLtp: (token) => api.get(`/api/angelone/ltp?token=${token}`),
}

export default api;
