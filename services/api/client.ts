import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { DeviceEventEmitter } from 'react-native';
import { ApiEvents, AppUpdateInfo, RemoteConfig } from './types';

const CACHED_BASE_URL_KEY = '@backend_base_url';
const REMOTE_CONFIG_URL =
  'https://gist.githubusercontent.com/imshahbaz/38a85817cd970cbac322998b1d817cb9/raw/urls.json';
const REMOTE_CONFIG_TIMEOUT_MS = 5000;

/**
 * Shared axios instance. `baseURL` is resolved at boot from the remote config
 * (see {@link initializeBaseUrl}); cookies are sent for session auth.
 */
// `axios.create` is the documented factory on the default export; the lint rule
// flags it only because `create` is also a named export.
// eslint-disable-next-line import/no-named-as-default-member
const api = axios.create({
  withCredentials: true,
});

/**
 * App-wide update flag. Mutated by {@link initializeBaseUrl} and mirrored via
 * the `app-update-required` event so late subscribers can read current state.
 */
export const appUpdateInfo: AppUpdateInfo = {
  updateNeeded: false,
  downloadUrl: '',
};

/**
 * Compares two dotted semver-ish strings (major.minor.patch).
 * Returns -1 if v1 < v2, 1 if v1 > v2, 0 if equal or unknown.
 */
const compareVersions = (v1?: string, v2?: string): -1 | 0 | 1 => {
  if (!v1 || !v2) return 0;
  const parts1 = String(v1).split('.').map(Number);
  const parts2 = String(v2).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const p1 = Number.isNaN(parts1[i]) ? 0 : parts1[i];
    const p2 = Number.isNaN(parts2[i]) ? 0 : parts2[i];
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
};

/** Updates {@link appUpdateInfo} and broadcasts the result to subscribers. */
const applyUpdateRequirement = (updateNeeded: boolean, downloadUrl = '') => {
  appUpdateInfo.updateNeeded = updateNeeded;
  appUpdateInfo.downloadUrl = updateNeeded ? downloadUrl : '';
  DeviceEventEmitter.emit(ApiEvents.APP_UPDATE_REQUIRED, { ...appUpdateInfo });
};

/**
 * Resolves the backend base URL from the remote config Gist and evaluates the
 * minimum supported version. Always clears any stale cached URL first, and is
 * safe to call repeatedly (e.g. on app foreground). Returns the active base URL.
 */
export const initializeBaseUrl = async (): Promise<string | undefined> => {
  try {
    await AsyncStorage.removeItem(CACHED_BASE_URL_KEY);
  } catch (err) {
    console.warn('API: Failed to clear cached baseURL from AsyncStorage:', err);
  }

  try {
    const { data } = await axios.get<RemoteConfig>(REMOTE_CONFIG_URL, {
      timeout: REMOTE_CONFIG_TIMEOUT_MS,
      params: { t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });

    if (data?.min_version) {
      const currentVersion = Constants.expoConfig?.version;
      const needsUpdate = compareVersions(currentVersion, data.min_version) < 0;
      applyUpdateRequirement(needsUpdate, data.download_url ?? '');
    }

    if (data?.backend_url) {
      api.defaults.baseURL = data.backend_url;
      return data.backend_url;
    }
  } catch (err: any) {
    console.error('API: Failed to fetch dynamic baseURL from Gist:', err?.message ?? err);
  }

  return api.defaults.baseURL;
};

/**
 * Global response interceptor: on 401 we broadcast `auth-expired` so the auth
 * layer can tear down session state. `/auth/me` is treated as a soft probe and
 * resolves to a null payload instead of rejecting, keeping boot flows simple.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      DeviceEventEmitter.emit(ApiEvents.AUTH_EXPIRED);
      if (error.config?.url?.includes('/auth/me')) {
        return Promise.resolve({ data: null });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
