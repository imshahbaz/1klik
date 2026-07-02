import api from './client';
import { BrokerType, Id } from './types';

const APP_KEY = process.env.EXPO_PUBLIC_TRUECALLER_APP_KEY;
const APP_NAME = '1Klik';

const HOLDINGS_BROKER: BrokerType = 'ZERODHA';

export const authAPI = {
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
  clientConfig: () => api.get('/api/config/client/active'),
};

export const userPreferenceAPI = {
  updateUsername: (userId: Id, username: string, password: string) =>
    api.patch('/api/user/username', { userId, username, password }),
  updateTheme: (theme: string) => api.patch('/api/user/theme', { theme }),
};

export const userAPI = {
  signup: (email: string, password: string, confirmPassword: string) =>
    api.post('/api/auth/signup', { email, password, confirmPassword }),
  verifyOtp: (email: string, otp: string) => api.post('/api/auth/verify-otp', { email, otp }),
  linkEmail: (userId: string, email: string, password: string, confirmPassword: string) =>
    api.post('/api/user/send-update-otp', { userId, email, password, confirmPassword }),
  verifyUpdateOtp: (email: string, otp: string) =>
    api.post('/api/user/verify-update-otp', { email, otp }),
};

export const strategyAPI = {
  getStrategies: () => api.get('/api/strategy'),
  fetchWithMargin: (strategyName: string) =>
    api.get(`/api/chartink/fetchWithMargin?strategy=${encodeURIComponent(strategyName)}`),
  fetchChartData: (symbol: string) =>
    api.get(`/api/nse/history?symbol=${encodeURIComponent(symbol)}`),
  createStrategy: (strategyData: unknown) => api.post('/api/strategy', strategyData),
  updateStrategy: (strategyData: unknown) => api.put('/api/strategy', strategyData),
  deleteStrategy: (id: Id) => api.delete('/api/strategy', { params: { id } }),
  getStrategiesAdmin: () => api.get('/api/strategy/admin'),
  getAllIndices: () => api.get('/api/nse/allindices'),
};

export const marginAPI = {
  getAllMargins: () => api.get('/api/margin/all'),
  loadFromCsv: (formData: FormData) => api.post('/api/margin/load-from-csv', formData),
  getOptions: () => api.get('/api/margin/options'),
};

export const configAPI = {
  getConfig: () => api.get('/api/config/active'),
  updateConfig: (configData: unknown) => api.patch('/api/config/update', configData),
  reloadConfig: () => api.post('/api/config/reload'),
};

export const priceActionAPI = {
  createOrderBlock: (obReq: unknown) => api.post('/api/price-action/ob', obReq),
  deleteOrderBlock: (obReq: unknown) => api.delete('/api/price-action/ob', { data: obReq }),
  getPriceActionBySymbol: (symbol: string) =>
    api.get(`/api/price-action/${encodeURIComponent(symbol)}`),
  updateOrderBlock: (obReq: unknown) => api.patch('/api/price-action/ob', obReq),
  checkOrderBlock: () => api.get('/api/price-action/ob/mitigation'),
  refreshMitigationData: () => api.post('/api/price-action/ob/check'),

  createFVG: (fvgReq: unknown) => api.post('/api/price-action/fvg', fvgReq),
  deleteFVG: (fvgReq: unknown) => api.delete('/api/price-action/fvg', { data: fvgReq }),
  updateFVG: (fvgReq: unknown) => api.patch('/api/price-action/fvg', fvgReq),
  checkFVGMitigation: () => api.get('/api/price-action/fvg/mitigation'),
  refreshFvgMitigationData: () => api.post('/api/price-action/fvg/check'),

  runAutomation: () => api.post('/api/price-action/automate'),
  cleanUpActions: () => api.post('/api/price-action/cleanup'),
};

export const truecallerAPI = {
  getTruecallerStatus: (requestId: string) => api.get(`/api/auth/truecaller/status/${requestId}`),
  truecallerLogin: (requestId: string) =>
    `truecallersdk://truesdk/web_verify?type=btmsheet&requestNonce=${requestId}&partnerKey=${APP_KEY}&partnerName=${APP_NAME}&lang=en&title=logIn&skipOption=useanothernum`,
};

export const googleAPI = {
  googleCallback: (code: string, random: string) =>
    api.get('/api/auth/google/callback', { params: { code, state: random } }),
  googleTokenValidation: (token: string) =>
    api.post('/api/auth/google/token', null, {
      params: { code: token, state: 'validate' },
      headers: { nativeFlow: 'true' },
    }),
};

export const newsApi = {
  getTvNews: (symbol: string) => api.get(`/api/news/${symbol}`),
  getGenAiAnalysis: (symbol: string) => api.get(`/api/news/ai/${symbol}`),
};

export const zerodhaAPI = {
  login: (requestToken: string, userId: Id) =>
    api.post('/api/zerodha/login', { request_token: requestToken, user_id: userId }),
  getMe: () => api.get('/api/zerodha/me'),
  placeMTFOrder: (orderData: unknown) => api.post('/api/order', orderData),
  getUserOrders: (userId: Id) => api.get(`/api/order/user/${userId}`),
  updateOrder: (id: Id, orderData: unknown) => api.put(`/api/order/${id}`, orderData),
  deleteOrder: (id: Id) => api.delete(`/api/order/${id}`),
  saveConfig: (configData: unknown) => api.post('/api/zerodha/config', configData),
  autoConnect: () => api.post('/api/session-manager/zerodha-auto-connect'),
};

export const strategyOrderAPI = {
  placeOrder: (orderData: unknown) => api.post('/api/strategy-order', orderData),
  getMyOrders: () => api.get('/api/strategy-order/my'),
  updateOrder: (id: Id, orderData: unknown) => api.put(`/api/strategy-order/${id}`, orderData),
  deleteOrder: (id: Id) => api.delete(`/api/strategy-order/${id}`),
};

export const notificationAPI = {
  saveToken: (token: string) => api.patch('/api/user/fcm-token', { token }),
  removeToken: (token: string) => api.post('/api/user/fcm-token/remove', { token }),
};

export const mstockAPI = {
  login: (apiKey: string, password: string, username: string) =>
    api.post('/api/mstock/login', { apiKey, password, username }),
  getMe: () => api.get('/api/mstock/me'),
  verifyOtp: (otp: string) => api.post('/api/mstock/verify', { otp }),
  placeOrder: (orderData: unknown) => api.post('/api/mstock/order', orderData),
  refreshSession: () => api.post('/api/mstock/refresh'),
  logout: () => api.post('/api/mstock/logout'),
};

export const angelOneApi = {
  getLtp: (token: string) => api.get(`/api/angelone/ltp?token=${token}`),
};

export const rupeezyAPI = {
  login: (requestToken: string, userId: Id) =>
    api.post('/api/rupeezy/login', { request_token: requestToken, user_id: userId }),
  getMe: () => api.get('/api/rupeezy/me'),
  saveConfig: (config: unknown) => api.post('/api/rupeezy/config', config),
};

export const holdingsAPI = {
  getHoldings: () => api.get(`/api/holdings/all?brokerType=${HOLDINGS_BROKER}`),
  addHolding: (data: unknown) => api.post(`/api/holdings?brokerType=${HOLDINGS_BROKER}`, data),
  updateHolding: (data: unknown) => api.put(`/api/holdings?brokerType=${HOLDINGS_BROKER}`, data),
  deleteHolding: (symbol: string) =>
    api.delete(`/api/holdings/${symbol}?brokerType=${HOLDINGS_BROKER}`),
  deleteHoldingDetail: (symbol: string, id: Id) =>
    api.delete(`/api/holdings/detail/${symbol}/${id}?brokerType=${HOLDINGS_BROKER}`),
};
