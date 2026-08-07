/**
 * Pure formatting/normalization helpers for the Trade screen. Extracted from
 * trade.tsx so the screen holds orchestration, not data plumbing. No React or
 * component state — safe to unit test and reuse.
 */
import { formatDateString } from './date';

// Re-exported so Trade-screen modules can keep a single import source.
export { formatDateString, formatIsoDate } from './date';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Best-effort parse of a target-date string; falls back to "now" on failure. */
export const parseTargetDate = (dateStr: string): Date => {
  try {
    if (!dateStr) return new Date();
    const parsed = Date.parse(dateStr);
    if (!Number.isNaN(parsed)) return new Date(parsed);

    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const day = Number.parseInt(parts[0]);
      let monthIdx = MONTHS.findIndex(m => m.toLowerCase() === parts[1].toLowerCase().substring(0, 3));
      if (monthIdx === -1) {
        monthIdx = FULL_MONTHS.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
      }
      const year = Number.parseInt(parts[2]);
      if (!Number.isNaN(day) && monthIdx !== -1 && !Number.isNaN(year)) {
        return new Date(year, monthIdx, day);
      }
    }
    return new Date();
  } catch {
    return new Date();
  }
};

export interface FormattedMtfOrder {
  id: string;
  userId?: number;
  symbol: string;
  qty: number;
  price: number;
  time: string;
  status: string;
  orderStatus: string;
  statusLabel?: string;
  statusColor?: string;
  reason?: string;
  targetDate: string;
  strategyName: string;
  targetPercentage: string;
  broker: string;
}

export interface FormattedStrategyOrder {
  id: string;
  userId?: number;
  symbol: string;
  qty: number;
  price: number;
  time: string;
  status: string;
  reason?: string;
  strategyName: string;
  amount: number;
  date: string;
  broker: string;
}

/** Normalizes the MTF orders API payload into the shape the UI renders. */
export const formatMtfOrders = (rawData: any): FormattedMtfOrder[] => {
  const ordersArray = Array.isArray(rawData) ? rawData : [];
  return ordersArray.map((order: any, idx: number) => ({
    id: order.id || `m-api-${idx}`,
    userId: order.userId,
    symbol: order.symbol,
    qty: order.quantity ?? order.qty ?? 0,
    price: order.price ?? 0,
    time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: order.status || order.orderStatus || 'PENDING',
    orderStatus: order.orderStatus || order.status || 'PENDING',
    statusLabel: order.statusLabel || undefined,
    statusColor: order.statusColor || undefined,
    reason: order.reason || undefined,
    targetDate: order.date ? formatDateString(new Date(order.date)) : 'Today',
    strategyName: order.strategyName || 'TRAILING PROFIT',
    targetPercentage:
      order.targetPercentage !== undefined && order.targetPercentage !== null
        ? order.targetPercentage.toString()
        : '',
    broker: order.broker || 'ZERODHA',
  }));
};

/** Normalizes the strategy orders API payload into the shape the UI renders. */
export const formatStrategyOrders = (rawData: any): FormattedStrategyOrder[] => {
  const stratArray = Array.isArray(rawData) ? rawData : [];
  return stratArray.map((order: any, idx: number) => ({
    id: order.id || order._id || `s-api-${idx}`,
    userId: order.userId,
    symbol: order.symbol || 'AUTO',
    qty: order.quantity ?? order.qty ?? 0,
    price: order.price ?? 0,
    time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: order.status || 'COMPLETED',
    reason: order.reason || undefined,
    strategyName: order.strategyName || 'RSI15MIN',
    amount: order.amount || 0,
    // Display string ("6 Jul 2026"), same as the MTF section's targetDate. The
    // edit flow converts it back to ISO via parseTargetDate before it re-enters
    // the form, mirroring how MTF handles its date.
    date: order.date ? formatDateString(new Date(order.date)) : '',
    broker: order.broker || 'ZERODHA',
  }));
};
