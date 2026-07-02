/**
 * Single source of truth for Zerodha MTF/delivery brokerage, statutory charges,
 * and interest rates used across the app (holdings break-even + calculator).
 *
 * These were previously hand-coded as magic numbers in multiple files with
 * values that had begun to diverge. Keep every rate here so they can't drift.
 * The helpers reproduce the exact math that was previously inlined.
 */

export const BROKERAGE_PER_LEG = 20;              // ₹ per executed order leg
export const PLEDGE_CHARGE = 15;                  // ₹ pledge (buy) / unpledge (sell), MTF only
export const STT_DELIVERY_RATE = 0.001;           // 0.1% on turnover (delivery/MTF)
export const STT_INTRADAY_SELL_RATE = 0.00025;    // 0.025% on intraday sell value
export const STAMP_DELIVERY_RATE = 0.00015;       // buy-side stamp duty (delivery)
export const STAMP_INTRADAY_RATE = 0.00003;       // buy-side stamp duty (intraday)
export const TRANSACTION_RATE = 0.0000345;        // exchange transaction charge
export const SEBI_RATE = 0.000001;                // SEBI turnover fee
export const GST_RATE = 0.18;                     // 18% GST on brokerage + txn + sebi (+ pledge)
export const MTF_ANNUAL_INTEREST_RATE = 0.15;     // 15% p.a. on the funded amount
export const DAYS_PER_YEAR = 365;

/** MTF interest accrued on `fundedAmount` held for `days`. */
export const mtfInterest = (fundedAmount: number, days: number) =>
  (fundedAmount * MTF_ANNUAL_INTEREST_RATE * days) / DAYS_PER_YEAR;

/** Total buy-side charges for a single MTF/delivery leg of value `value`. */
export const buyCharges = (value: number) => {
  const stt = value * STT_DELIVERY_RATE;
  const stamp = value * STAMP_DELIVERY_RATE;
  const trans = value * TRANSACTION_RATE;
  const sebi = value * SEBI_RATE;
  const gst = GST_RATE * (BROKERAGE_PER_LEG + PLEDGE_CHARGE + trans + sebi);
  return BROKERAGE_PER_LEG + PLEDGE_CHARGE + stt + stamp + trans + sebi + gst;
};

/** Total sell-side charges for an MTF/delivery turnover of `value`. */
export const sellCharges = (value: number) => {
  const stt = value * STT_DELIVERY_RATE;
  const trans = value * TRANSACTION_RATE;
  const sebi = value * SEBI_RATE;
  const gst = GST_RATE * (BROKERAGE_PER_LEG + PLEDGE_CHARGE + trans + sebi);
  return BROKERAGE_PER_LEG + PLEDGE_CHARGE + stt + trans + sebi + gst;
};

/**
 * Sell charges decomposed for break-even math: `fixed + rate * sellAmount`.
 * Derived from the constants above (fixed = 41.3, rate = 0.00104189).
 */
export const SELL_FIXED_CHARGE =
  BROKERAGE_PER_LEG + PLEDGE_CHARGE + GST_RATE * (BROKERAGE_PER_LEG + PLEDGE_CHARGE);
export const SELL_VARIABLE_RATE =
  STT_DELIVERY_RATE + TRANSACTION_RATE + SEBI_RATE + GST_RATE * (TRANSACTION_RATE + SEBI_RATE);

/**
 * Break-even sell amount: the gross sell value at which
 * `sellAmount - sellCharges(sellAmount) === fixedCostsExclSell`
 * (i.e. covers cost + interest + buy charges).
 */
export const breakEvenSellAmount = (fixedCostsExclSell: number) =>
  (fixedCostsExclSell + SELL_FIXED_CHARGE) / (1 - SELL_VARIABLE_RATE);
