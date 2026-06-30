/**
 * Public surface of the API layer.
 *
 * Structure:
 *  - `client.ts`    — axios instance, interceptors, remote-config/version boot
 *  - `endpoints.ts` — grouped, typed endpoint definitions
 *  - `types.ts`     — shared request/response types
 *
 * Import from `services/api` (this barrel); the internal split is an
 * implementation detail.
 */
import api from './client';

export { appUpdateInfo, initializeBaseUrl } from './client';
export * from './endpoints';
export * from './types';

export default api;
