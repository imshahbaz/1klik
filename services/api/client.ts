import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { DeviceEventEmitter } from 'react-native';
import { ApiEvents, AppUpdateInfo, RemoteConfig } from './types';

const CACHED_BASE_URL_KEY = '@backend_base_url';
const REMOTE_CONFIG_URL =
  'https://gist.githubusercontent.com/imshahbaz/38a85817cd970cbac322998b1d817cb9/raw/urls.json';
const REMOTE_CONFIG_TIMEOUT_MS = 5000;

const api = axios.create({
  withCredentials: true,
  timeout: 20000,
});

export const appUpdateInfo: AppUpdateInfo = {
  updateNeeded: false,
  downloadUrl: '',
};

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

const applyUpdateRequirement = (updateNeeded: boolean, downloadUrl = '') => {
  appUpdateInfo.updateNeeded = updateNeeded;
  appUpdateInfo.downloadUrl = updateNeeded ? downloadUrl : '';
  DeviceEventEmitter.emit(ApiEvents.APP_UPDATE_REQUIRED, { ...appUpdateInfo });
};

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

let sessionProbeInFlight = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    if (error.response?.status === 401) {
      if (url.includes('/auth/me')) {
        DeviceEventEmitter.emit(ApiEvents.AUTH_EXPIRED);
        return Promise.resolve({ data: null });
      }
      if (!sessionProbeInFlight) {
        sessionProbeInFlight = true;
        api.get('/api/auth/me').catch(() => { }).finally(() => {
          sessionProbeInFlight = false;
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
