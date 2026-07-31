/**
 * Shared types for the API layer.
 *
 * The backend wraps successful payloads in an envelope: `{ data, message }`.
 * Response generics default to `any` so existing call sites that read
 * `res.data` / `res.data.data` keep compiling while new code can opt into
 * precise typing by passing a concrete `T`.
 */

/** Standard envelope returned by the backend. */
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data: T;
  error?: string;
}

/** User object returned by `GET /api/auth/me`. */
export interface User {
  id?: string | number;
  userId?: number;
  email?: string;
  username?: string;
  password?: string;
  role?: string;
  theme?: string;
  mobile?: number;
  name?: string;
  profile?: string;
}

/** Shape of the remote config document (hosted Gist) read at boot. */
export interface RemoteConfig {
  backend_url?: string;
  min_version?: string;
  download_url?: string;
}

/** Mutable, app-wide update state derived from the remote config. */
export interface AppUpdateInfo {
  updateNeeded: boolean;
  downloadUrl: string;
}

/** A scanning strategy returned by `GET /api/strategy`. */
export interface Strategy {
  name: string;
  scanClause: string;
  active: boolean;
  successRate?: number;
  timeFrame?: string;
}

/** A single scan hit returned by `GET /api/chartink/fetchWithMargin`. */
export interface ScanResult {
  name: string;
  symbol: string;
  margin?: number;
  rupeezyMargin?: number;
  close?: number;
}

/** Feature flags / client config controlling which auth methods are shown. */
export interface AppConfig {
  auth: {
    google: boolean;
    email: boolean;
    truecaller: boolean;
  };
  components: {
    heatMap: boolean;
  };
}

/** A margin row returned by `GET /api/margin/all`. */
export interface Margin {
  symbol: string;
  name?: string;
  requiredMargin?: number | string;
  token?: string;
  rupeezyMargin?: number;
}

/** A news headline returned by `GET /api/news/:symbol`. */
export interface NewsItem {
  title: string;
  published?: number;
}

/** AI analysis returned by `GET /api/news/ai/:symbol`. */
export interface AiAnalysis {
  action?: string;
  confidence?: number;
  reasoning?: string;
  trend?: string;
  tomorrow_high?: number;
  tomorrow_low?: number;
}

/** A daily candle returned by `GET /api/nse/history`. */
export interface NseCandle {
  chSymbol?: string;
  chOpeningPrice?: number | string;
  chTradeHighPrice?: number | string;
  chTradeLowPrice?: number | string;
  chClosingPrice?: number | string;
  mtimestamp?: string;
}

/** A scheduled MTF order returned by `GET /api/order/user/:userId`. */
export interface MtfOrder {
  id: string;
  userId?: number;
  symbol: string;
  quantity?: number;
  date?: string;
  broker?: string;
  orderStatus?: string;
  statusLabel?: string;
  statusColor?: string;
}

/** A scheduled strategy order returned by `GET /api/strategy-order/my`. */
export interface StrategyOrder {
  id: string;
  userId?: number;
  strategyName: string;
  date?: string;
  amount?: number;
  broker?: string;
}

/** Market quote returned by `GET /api/angelone/ltp`. */
export interface MarketQuote {
  exchange?: string;
  tradingSymbol?: string;
  symbolToken?: string;
  ltp?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

/** A single buy entry within a holding (one lot bought on one date). */
export interface HoldingDetail {
  id?: number;
  quantity: number;
  price: number;
  buyDate?: string;
}

/** A portfolio holding for one symbol, with its individual buy entries. */
export interface Holding {
  symbol: string;
  ltp?: number;
  margin?: number;
  holdingDetails?: HoldingDetail[];
}

/** Broker identifiers used across order/holdings endpoints. */
export type BrokerType = 'ZERODHA' | 'RUPEEZY' | 'MSTOCK';

/** Resource identifier. Backend IDs are numeric but are often held as strings. */
export type Id = string | number;

/** Events emitted on the global DeviceEventEmitter bus by the API layer. */
export const ApiEvents = {
  AUTH_EXPIRED: 'auth-expired',
  APP_UPDATE_REQUIRED: 'app-update-required',
} as const;
