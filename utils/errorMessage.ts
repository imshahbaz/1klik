/**
 * Converts any thrown error (axios error, network failure, etc.) into a
 * user-friendly message suitable for a modal or banner.
 *
 * Raw backend payloads (`response.data.message` / `.detail` / `.error`) are
 * intentionally NOT surfaced — they often contain developer-facing codes
 * ("E002", stack traces, internal identifiers). Instead we map by HTTP status
 * to a clean, human message. Callers pass a context-specific `fallback` for the
 * cases (400/404/409/validation) where the right wording depends on the action.
 */
export function getFriendlyErrorMessage(
  error: any,
  fallback = 'Something went wrong. Please try again.'
): string {
  // No HTTP response → network / timeout / client-side failure.
  if (!error?.response) {
    const code = error?.code;
    const msg = String(error?.message || '').toLowerCase();
    if (code === 'ECONNABORTED' || msg.includes('timeout')) {
      return 'The request timed out. Please check your connection and try again.';
    }
    if (msg.includes('network')) {
      return 'No internet connection. Please check your network and try again.';
    }
    return fallback;
  }

  const status: number = error.response.status;

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You don’t have permission to perform this action.';
  if (status === 408) return 'The request timed out. Please try again.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'Our servers are having trouble right now. Please try again in a little while.';

  // 400 / 404 / 409 / 422 and anything else: the caller's context-specific
  // friendly message is the most helpful, and never leaks backend internals.
  return fallback;
}
