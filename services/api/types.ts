/**
 * Shared types for the API layer.
 *
 * The backend wraps successful payloads in an envelope: `{ data, message }`.
 * Response generics default to `any` so existing call sites that read
 * `res.data` / `res.data.data` keep compiling while new code can opt into
 * precise typing by passing a concrete `T`.
 */

/** Standard success envelope returned by the backend. */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
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
