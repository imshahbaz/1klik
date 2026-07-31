import api from './client';
import {
  AiAnalysis,
  AppConfig,
  ApiResponse,
  BrokerType,
  Holding,
  Id,
  MarketQuote,
  Margin,
  MtfOrder,
  NewsItem,
  NseCandle,
  ScanResult,
  Strategy,
  StrategyOrder,
  User,
} from './types';

const HOLDINGS_BROKER: BrokerType = 'ZERODHA';

export const authAPI = {
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get<ApiResponse<User | null>>('/api/auth/me'),
  clientConfig: () => api.get<ApiResponse<AppConfig>>('/api/config/client/active'),
};

export const userPreferenceAPI = {
  updateUsername: (userId: Id, username: string, password: string) =>
    api.patch('/api/user/username', { userId, username, password }),
  updateTheme: (theme: string) => api.patch('/api/user/theme', { theme }),
};

export const strategyAPI = {
  getStrategies: (timeFrame?: string) =>
    api.get<ApiResponse<Strategy[]>>('/api/strategy', { params: { timeFrame } }),
  fetchWithMargin: (strategyName: string) =>
    api.get<ApiResponse<ScanResult[]>>(
      `/api/chartink/fetchWithMargin?strategy=${encodeURIComponent(strategyName)}`
    ),
  fetchChartData: (symbol: string) =>
    api.get<ApiResponse<NseCandle[]>>(`/api/nse/history?symbol=${encodeURIComponent(symbol)}`),
};

export const marginAPI = {
  getAllMargins: () => api.get<ApiResponse<Margin[]>>('/api/margin/all'),
};

export const googleAPI = {
  googleTokenValidation: (token: string) =>
    api.post('/api/auth/google/token', null, {
      params: { code: token, state: 'validate' },
      headers: { nativeFlow: 'true' },
    }),
};

export const newsApi = {
  getTvNews: (symbol: string) =>
    api.get<ApiResponse<NewsItem[]>>(`/api/news/${symbol}`),
  getGenAiAnalysis: (symbol: string) =>
    api.get<ApiResponse<AiAnalysis>>(`/api/news/ai/${symbol}`),
};

export const zerodhaAPI = {
  login: (requestToken: string, userId: Id) =>
    api.post<ApiResponse<string>>('/api/zerodha/login', {
      request_token: requestToken,
      user_id: userId,
    }),
  getMe: () => api.get<ApiResponse<string>>('/api/zerodha/me'),
  placeMTFOrder: (orderData: unknown) => api.post('/api/order', orderData),
  getUserOrders: (userId: Id) =>
    api.get<ApiResponse<MtfOrder[]>>(`/api/order/user/${userId}`),
  updateOrder: (id: Id, orderData: unknown) => api.put(`/api/order/${id}`, orderData),
  deleteOrder: (id: Id) => api.delete<ApiResponse<string>>(`/api/order/${id}`),
  saveConfig: (configData: unknown) => api.post('/api/zerodha/config', configData),
  autoConnect: () => api.post<ApiResponse<boolean>>('/api/session-manager/zerodha-auto-connect'),
};

export const strategyOrderAPI = {
  placeOrder: (orderData: unknown) => api.post('/api/strategy-order', orderData),
  getMyOrders: () => api.get<ApiResponse<StrategyOrder[]>>('/api/strategy-order/my'),
  updateOrder: (id: Id, orderData: unknown) =>
    api.put(`/api/strategy-order/${id}`, orderData),
  deleteOrder: (id: Id) => api.delete<ApiResponse<string>>(`/api/strategy-order/${id}`),
};

export const notificationAPI = {
  saveToken: (token: string) => api.patch('/api/user/fcm-token', { token }),
  removeToken: (token: string) => api.post('/api/user/fcm-token/remove', { token }),
};

export const angelOneApi = {
  getLtp: (token: string) => api.get<ApiResponse<MarketQuote>>(`/api/angelone/ltp?token=${token}`),
};

export const rupeezyAPI = {
  login: (requestToken: string, userId: Id) =>
    api.post<ApiResponse<string>>('/api/rupeezy/login', {
      request_token: requestToken,
      user_id: userId,
    }),
  getMe: () => api.get<ApiResponse<string>>('/api/rupeezy/me'),
  saveConfig: (config: unknown) => api.post('/api/rupeezy/config', config),
};

export const holdingsAPI = {
  getHoldings: () => api.get<ApiResponse<Holding[]>>(`/api/holdings/all?brokerType=${HOLDINGS_BROKER}`),
  addHolding: (data: unknown) => api.post(`/api/holdings?brokerType=${HOLDINGS_BROKER}`, data),
  updateHolding: (data: unknown) => api.put(`/api/holdings?brokerType=${HOLDINGS_BROKER}`, data),
  deleteHolding: (symbol: string) =>
    api.delete(`/api/holdings/${symbol}?brokerType=${HOLDINGS_BROKER}`),
  deleteHoldingDetail: (symbol: string, id: Id) =>
    api.delete(`/api/holdings/detail/${symbol}/${id}?brokerType=${HOLDINGS_BROKER}`),
};
