/**
 * Maps the MTF order API (`POST /api/order`, `PUT /api/order/:id`, `DELETE /api/order/:id`)
 * response into a user-facing modal/alert result. Every backend scenario documented for
 * the order endpoints is translated here into a clean `{ title, message }` pair — the raw
 * HTTP status and ProblemDetail fields are never surfaced to the user.
 */
import type { ProblemDetail } from '../services/api';

export interface OrderResult {
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

export function getOrderResult(
  error: any,
  fallbackMessage = 'Something went wrong. Please try again.'
): OrderResult {
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
    return { title: 'Order Not Placed', message: fallbackMessage };
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
      if (hasDetail(problem, 'margin')) {
        return {
          title: 'Symbol Not Found',
          message: 'We could not find margin details for this symbol. Please pick another stock and try again.',
        };
      }
      if (hasDetail(problem, 'user not found')) {
        return {
          title: 'Account Not Found',
          message: 'We could not find your account. Please sign out and sign back in, then try again.',
        };
      }
      return {
        title: 'Not Found',
        message: 'We could not find what you were looking for. Please try again.',
      };

    case 409:
      return {
        title: 'Duplicate Order',
        message: 'An order for this symbol on the selected date already exists. Choose another date or symbol.',
      };

    case 400:
      // Date parsing / cutoff violation.
      if (hasDetail(problem, 'cannot be placed') || hasDetail(problem, 'date format')) {
        return {
          title: 'Date Not Available',
          message: 'Orders cannot be placed or edited for this date. Please choose a valid trading date.',
        };
      }
      // Strategy validation failures.
      if (hasDetail(problem, 'target percentage is required')) {
        return {
          title: 'Target % Required',
          message: 'Please enter a target percentage for the TARGET PROFIT strategy.',
        };
      }
      if (hasDetail(problem, 'target percentage should be between')) {
        return {
          title: 'Check Target %',
          message: 'Target percentage must be between 0.4 and 20.',
        };
      }
      if (hasDetail(problem, 'invalid order strategy')) {
        return {
          title: 'Invalid Strategy',
          message: 'Please select a valid strategy before placing the order.',
        };
      }
      // Broker registration failures.
      if (hasDetail(problem, 'zerodha is not registered')) {
        return {
          title: 'Zerodha Not Registered',
          message: 'Connect your Zerodha account in the Brokers tab before placing an order.',
        };
      }
      if (hasDetail(problem, 'rupeezy is not registered')) {
        return {
          title: 'Rupeezy Not Registered',
          message: 'Connect your Rupeezy account in the Brokers tab before placing an order.',
        };
      }
      // Malformed request body.
      if (hasDetail(problem, 'malformed') || hasDetail(problem, 'unreadable')) {
        return {
          title: 'Invalid Order',
          message: 'The order details could not be read. Please review the form and try again.',
        };
      }
      // Field validation errors (MethodArgumentNotValidException).
      if (problem?.detail) {
        return {
          title: 'Check Your Order',
          message: 'Some order details are missing or invalid. Please review the highlighted fields and try again.',
        };
      }
      return { title: 'Order Not Placed', message: fallbackMessage };

    default:
      // 5xx and anything else — unhandled server exception.
      return {
        title: 'Something Went Wrong',
        message: 'Our servers hit a problem placing your order. Please try again in a few minutes.',
      };
  }
}

/**
 * Maps the MTF order DELETE (`DELETE /api/order/:id`) response into a user-facing
 * alert result.
 */
export function getDeleteOrderResult(
  error: any,
  fallbackMessage = 'Something went wrong. Please try again.'
): OrderResult {
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
    return { title: 'Order Not Deleted', message: fallbackMessage };
  }

  const status: number = error.response.status;
  const problem = readProblem(error);

  switch (status) {
    case 401:
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again and try again.',
      };

    case 404:
      return {
        title: 'Order Not Found',
        message: 'This order no longer exists. It may have already been cancelled.',
      };

    case 400:
      // Trading-hours deletion restriction.
      if (hasDetail(problem, 'cannot be deleted')) {
        return {
          title: 'Cannot Delete During Market Hours',
          message: 'Orders cannot be deleted while the market is open (9:00 AM – 3:30 PM IST). Please try again after market hours.',
        };
      }
      // Blank/invalid path variable or any other validation failure.
      if (problem?.detail) {
        return {
          title: 'Check Your Order',
          message: 'We could not process this deletion. Please try again.',
        };
      }
      return { title: 'Order Not Deleted', message: fallbackMessage };

    default:
      // 5xx and anything else — unhandled server exception.
      return {
        title: 'Something Went Wrong',
        message: 'Our servers hit a problem cancelling your order. Please try again in a few minutes.',
      };
  }
}
