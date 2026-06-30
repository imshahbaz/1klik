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

/** Normalizes the MTF orders API payload into the shape the UI renders. */
export const formatMtfOrders = (rawData: any) => {
  let ordersArray = [];
  if (Array.isArray(rawData)) {
    ordersArray = rawData;
  } else if (Array.isArray(rawData?.data)) {
    ordersArray = rawData.data;
  }
  return ordersArray.map((order: any, idx: number) => ({
    id: order.id || `m-api-${idx}`,
    symbol: order.symbol,
    qty: order.quantity || order.qty || 10,
    price: order.price || 2845.20,
    time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: order.status || 'COMPLETED',
    reason: order.reason || undefined,
    targetDate: order.date ? formatDateString(new Date(order.date)) : 'Today',
  }));
};

/** Normalizes the strategy orders API payload into the shape the UI renders. */
export const formatStrategyOrders = (rawData: any) => {
  let stratArray = [];
  if (Array.isArray(rawData)) {
    stratArray = rawData;
  } else if (Array.isArray(rawData?.data)) {
    stratArray = rawData.data;
  }
  return stratArray.map((order: any, idx: number) => ({
    id: order.id || order._id || `s-api-${idx}`,
    symbol: order.symbol || 'AUTO',
    qty: order.quantity || order.qty || 1,
    price: order.price || 0,
    time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: order.status || 'COMPLETED',
    reason: order.reason || undefined,
    strategyName: order.strategyName || 'RSI15MIN',
    amount: order.amount || 0,
    date: order.date || '',
  }));
};
