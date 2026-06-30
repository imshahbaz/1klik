import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface HoldingCardProps {
  readonly holding: any;
  readonly theme: any;
  readonly isExpanded: boolean;
  readonly onToggle: (symbol: string) => void;
  readonly onEditDetail: (symbol: string, detail: any) => void;
  readonly onDeleteDetail: (symbol: string, detailId: number) => void;
  readonly onDeleteHolding: (symbol: string) => void;
}

const formatINR = (value: number) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * A single portfolio holding row with its expandable MTF breakdown.
 *
 * All per-holding derived values (P&L, MTF interest, buy/sell charges,
 * break-even price) are computed in a single `useMemo` keyed on `holding`, so
 * the math only re-runs when that holding's data changes — not on every parent
 * render or when an unrelated row expands. Memoized with `React.memo` so rows
 * that didn't change skip re-rendering entirely.
 *
 * The financial formulas are preserved exactly as they were when inlined in
 * ZerodhaHoldings; only their location changed.
 */
function HoldingCardBase({
  holding,
  theme,
  isExpanded,
  onToggle,
  onEditDetail,
  onDeleteDetail,
  onDeleteHolding,
}: HoldingCardProps) {
  const metrics = useMemo(() => {
    const totalQty = holding.holdingDetails?.reduce((acc: number, detail: any) => acc + detail.quantity, 0) || 0;
    const totalCost = holding.holdingDetails?.reduce((acc: number, detail: any) => acc + (detail.quantity * detail.price), 0) || 0;
    const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;

    const ltp = holding.ltp || 0;
    const pnl = (ltp - avgPrice) * totalQty;
    const pnlPercent = avgPrice > 0 ? (pnl / (avgPrice * totalQty)) * 100 : 0;

    const leverage = holding.margin || 1;
    let totalInterest = 0;
    let totalMarginUsed = 0;
    let totalBuyCharges = 0;

    const detailsWithInterest = holding.holdingDetails?.map((detail: any) => {
      const totalValue = detail.quantity * detail.price;
      const marginUsed = totalValue / leverage;
      const fundedAmt = totalValue - marginUsed;

      totalMarginUsed += marginUsed;

      // Calculate Buy Side Charges
      const buyBrokerage = 20;
      const pledgeCharge = 15;
      const buySTT = totalValue * 0.001;
      const buyStamp = totalValue * 0.00015;
      const buyTrans = totalValue * 0.0000345;
      const buySebi = totalValue * 0.000001;
      const buyGst = 0.18 * (buyBrokerage + pledgeCharge + buyTrans + buySebi);
      const detailBuyCharges = buyBrokerage + pledgeCharge + buySTT + buyStamp + buyTrans + buySebi + buyGst;

      totalBuyCharges += detailBuyCharges;

      let days = 0;
      if (detail.buyDate) {
        const buyDate = new Date(detail.buyDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        buyDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - buyDate.getTime();
        days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }
      const interest = (fundedAmt * 0.15 * days) / 365;
      totalInterest += interest;

      return { ...detail, interest, days, detailBuyCharges };
    }) || [];

    // Calculate Estimated Sell Charges (based on current LTP)
    const currentSellAmount = totalQty * ltp;
    const sellBrokerage = 20;
    const unpledgeCharge = 15;
    const sellSTT = currentSellAmount * 0.001;
    const sellTrans = currentSellAmount * 0.0000345;
    const sellSebi = currentSellAmount * 0.000001;
    const sellGst = 0.18 * (sellBrokerage + unpledgeCharge + sellTrans + sellSebi);
    const estSellCharges = sellBrokerage + unpledgeCharge + sellSTT + sellTrans + sellSebi + sellGst;

    // Calculate Break-Even Target Price
    // Net = SellAmt - totalCost - totalInterest - totalBuyCharges - sellCharges
    // sellCharges = 41.3 + SellAmt * 0.00104189
    const totalFixedCosts = totalCost + totalInterest + totalBuyCharges + 41.3;
    const breakEvenSellAmount = totalFixedCosts / 0.99895811;
    const breakEvenPrice = totalQty > 0 ? breakEvenSellAmount / totalQty : 0;

    return {
      totalQty,
      avgPrice,
      ltp,
      pnl,
      pnlPercent,
      leverage,
      totalInterest,
      totalMarginUsed,
      totalBuyCharges,
      detailsWithInterest,
      estSellCharges,
      breakEvenPrice,
    };
  }, [holding]);

  const {
    totalQty,
    avgPrice,
    ltp,
    pnl,
    pnlPercent,
    leverage,
    totalInterest,
    totalMarginUsed,
    totalBuyCharges,
    detailsWithInterest,
    estSellCharges,
    breakEvenPrice,
  } = metrics;

  const isProfit = pnl >= 0;

  return (
    <View style={{
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isExpanded ? (isProfit ? theme.success : theme.danger) : theme.borderLight,
      borderLeftWidth: 4,
      borderLeftColor: isProfit ? theme.success : theme.danger,
      borderRadius: 16,
      backgroundColor: theme.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden'
    }}>
      <TouchableOpacity
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'transparent' }}
        onPress={() => onToggle(holding.symbol)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1, paddingRight: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '600' }} numberOfLines={1} ellipsizeMode="tail">
              {holding.symbol}
            </Text>
            {leverage > 1 && (
              <View style={{ marginLeft: 8, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: theme.primary, fontSize: 9, fontWeight: '700' }}>{leverage}x MTF</Text>
              </View>
            )}
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
            {totalQty} Shares
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '600' }}>
            ₹{formatINR(ltp)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: isProfit ? theme.success : theme.danger, fontSize: 12, fontWeight: '500' }}>
              {isProfit ? '+' : ''}₹{formatINR(pnl)} ({pnlPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, backgroundColor: 'transparent', borderTopWidth: 1, borderTopColor: theme.borderLight }}>
          <View style={{ flexDirection: 'row', marginTop: 16, marginBottom: 16, backgroundColor: theme.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.borderLight }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Avg. Price</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700' }}>₹{formatINR(avgPrice)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: theme.borderLight, marginHorizontal: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Invested Margin</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700' }}>₹{formatINR(totalMarginUsed)}</Text>
            </View>
          </View>

          <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>Break-Even Target</Text>
              <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '800' }}>
                ₹{formatINR(breakEvenPrice)}
              </Text>
            </View>

            {totalBuyCharges > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '500' }}>Past Buy Charges</Text>
                <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '600' }}>
                  - ₹{formatINR(totalBuyCharges)}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '500' }}>Est. Sell Charges</Text>
              <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '600' }}>
                - ₹{formatINR(estSellCharges)}
              </Text>
            </View>

            {totalInterest > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(245, 158, 11, 0.1)' }}>
                <Text style={{ color: theme.warning || '#F59E0B', fontSize: 12, fontWeight: '700' }}>Accrued MTF Interest</Text>
                <Text style={{ color: theme.warning || '#F59E0B', fontSize: 12, fontWeight: '800' }}>
                  - ₹{formatINR(totalInterest)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Holding Breakdown
            </Text>

            {detailsWithInterest.map((detail: any, dIndex: number) => {
              const buyDateStr = detail.buyDate ? new Date(detail.buyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A';
              return (
                <View key={detail.id || dIndex} style={{ paddingVertical: 10, borderBottomWidth: dIndex === detailsWithInterest.length - 1 ? 0 : 1, borderBottomColor: theme.borderLight }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 2 }}>
                        {buyDateStr} {detail.days > 0 ? `(${detail.days}d)` : ''}
                      </Text>
                      <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>
                        {detail.quantity} @ ₹{detail.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                        {detail.interest > 0 && (
                          <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                            Int: <Text style={{ color: theme.warning || '#F59E0B' }}>₹{formatINR(detail.interest)}</Text>
                          </Text>
                        )}
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                          Chg: <Text style={{ color: theme.danger }}>₹{detail.detailBuyCharges?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4, marginRight: 4 }}>
                      <TouchableOpacity
                        onPress={() => onEditDetail(holding.symbol, detail)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="pencil" size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDeleteDetail(holding.symbol, detail.id)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          <TouchableOpacity
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}
            onPress={() => onDeleteHolding(holding.symbol)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={theme.danger} style={{ marginRight: 6 }} />
            <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 13 }}>Delete Holding</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const HoldingCard = React.memo(HoldingCardBase);
export default HoldingCard;
