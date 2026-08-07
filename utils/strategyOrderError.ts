/**
 * Maps the strategy order API (`POST /api/strategy-order`, `PUT /api/strategy-order/:id`)
 * response into a user-facing modal result. Every backend scenario documented for the
 * strategy order endpoints is translated here into a clean `{ title, message }` pair —
 * the raw HTTP status and ProblemDetail fields are never surfaced to the user.
 */
import type { ProblemDetail } from '../services/api';

export interface StrategyOrderResult {
  title: string;
  message: string;
}

const readProblem = (error: any): ProblemDetail | null => {
  const data = error?.response?.data;
  if (data && typeof data === 'object' && 'detail' in data) return data as ProblemDetail;
  return null;
};

const hasDetail = (problem: ProblemDetail | null, fragment: string): boolean =>
  !!problem?.detail && problem.detail.toLowerCase().includes(fragment.toLowerCase());

export function getStrategyOrderResult(
  error: any,
  fallbackMessage = 'Something went wrong. Please try again.'
): StrategyOrderResult {
  // No HTTP response → network / timeout / client-side failure.
  if (!error?.response) {
    const code = error?.code;
    const msg = String(error?.message || '').toLowerCase();
    if (code === 'ECONNABORTED' || msg.includes('timeout')) {
      return {
        title: 'Request Timed Out',
        message: 'The request took too long. Please check your connection and try again.',
      };
    }
    if (msg.includes('network')) {
      return {
        title: 'Connection Problem',
        message: 'No internet connection. Please check your network and try again.',
      };
    }
    return { title: 'Strategy Order Not Placed', message: fallbackMessage };
  }

  const status: number = error.response.status;
  const problem = readProblem(error);

  switch (status) {
    case 401:
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again and retry the order.',
      };

    case 404:
      return {
        title: 'Account Not Found',
        message: 'We could not find your account. Please sign out and sign back in, then try again.',
      };

    case 409:
      return {
        title: 'Duplicate Strategy Order',
        message: 'A strategy order for this date already exists. Please choose a different date.',
      };

    case 400:
      // Date parsing / cutoff-time violation.
      if (hasDetail(problem, 'invalid date format')) {
        return {
          title: 'Date Not Available',
          message: 'Strategy orders cannot be scheduled for this date. Please choose a valid trading date.',
        };
      }
      // Broker registration failures.
      if (hasDetail(problem, 'zerodha is not registered')) {
        return {
          title: 'Zerodha Not Registered',
          message: 'Connect your Zerodha account in the Brokers tab before scheduling a strategy order.',
        };
      }
      if (hasDetail(problem, 'rupeezy is not registered')) {
        return {
          title: 'Rupeezy Not Registered',
          message: 'Connect your Rupeezy account in the Brokers tab before scheduling a strategy order.',
        };
      }
      // Malformed request body.
      if (hasDetail(problem, 'malformed') || hasDetail(problem, 'unreadable')) {
        return {
          title: 'Invalid Strategy Order',
          message: 'The order details could not be read. Please review the form and try again.',
        };
      }
      // Field validation errors (MethodArgumentNotValidException).
      if (problem?.detail) {
        return {
          title: 'Check Your Strategy Order',
          message: 'Some order details are missing or invalid. Please review the form and try again.',
        };
      }
      return { title: 'Strategy Order Not Placed', message: fallbackMessage };

    default:
      // 5xx and anything else — unhandled server exception.
      return {
        title: 'Something Went Wrong',
        message: 'Our servers hit a problem saving your strategy order. Please try again in a few minutes.',
      };
  }
}
