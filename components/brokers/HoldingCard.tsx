import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';

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
 * Style factory keyed on theme. Sizes use the `@ms` (moderateScale) suffix so
 * text and spacing adapt to screen size, consistent with the rest of the app's
 * theme files. Per-row dynamic colors (profit/loss) are applied inline on top.
 */
const createStyles = (theme: any) =>
  ScaledSheet.create({
    card: {
      marginBottom: '16@ms',
      borderWidth: 1,
      borderLeftWidth: 4,
      borderRadius: '16@ms',
      backgroundColor: theme.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16@ms',
      backgroundColor: 'transparent',
    },
    headerLeft: {
      flex: 1,
      paddingRight: '12@ms',
    },
    symbolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '4@ms',
    },
    symbolText: {
      color: theme.textPrimary,
      fontSize: '15@ms',
      fontWeight: '600',
      flexShrink: 1,
    },
    mtfBadge: {
      marginLeft: '8@ms',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      paddingHorizontal: '6@ms',
      paddingVertical: '2@ms',
      borderRadius: '4@ms',
    },
    mtfBadgeText: {
      color: theme.primary,
      fontSize: '9@ms',
      fontWeight: '700',
    },
    sharesText: {
      color: theme.textSecondary,
      fontSize: '12@ms',
    },
    headerRight: {
      flexShrink: 1,
      alignItems: 'flex-end',
    },
    ltpText: {
      color: theme.textPrimary,
      fontSize: '15@ms',
      fontWeight: '600',
    },
    pnlText: {
      fontSize: '12@ms',
      fontWeight: '500',
      marginTop: '4@ms',
    },
    expanded: {
      paddingHorizontal: '16@ms',
      paddingBottom: '16@ms',
      backgroundColor: 'transparent',
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    statBox: {
      flexDirection: 'row',
      marginTop: '16@ms',
      marginBottom: '16@ms',
      backgroundColor: theme.card,
      borderRadius: '12@ms',
      padding: '12@ms',
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    statCol: { flex: 1 },
    statLabel: {
      color: theme.textSecondary,
      fontSize: '11@ms',
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: '4@ms',
    },
    statValue: {
      color: theme.textPrimary,
      fontSize: '15@ms',
      fontWeight: '700',
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.borderLight,
      marginHorizontal: '12@ms',
    },
    breakEvenBox: {
      backgroundColor: 'rgba(245, 158, 11, 0.05)',
      borderRadius: '12@ms',
      padding: '12@ms',
      marginBottom: '16@ms',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    breakEvenRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8@ms',
    },
    breakEvenLabel: {
      color: theme.textSecondary,
      fontSize: '12@ms',
      fontWeight: '600',
      flexShrink: 1,
      paddingRight: '8@ms',
    },
    breakEvenValue: {
      color: theme.primary,
      fontSize: '16@ms',
      fontWeight: '800',
    },
    chargeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: '4@ms',
    },
    chargeLabel: {
      color: theme.textSecondary,
      fontSize: '12@ms',
      fontWeight: '500',
      flexShrink: 1,
      paddingRight: '8@ms',
    },
    chargeValue: {
      color: theme.danger,
      fontSize: '12@ms',
      fontWeight: '600',
    },
    interestRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: '4@ms',
      paddingTop: '8@ms',
      borderTopWidth: 1,
      borderTopColor: 'rgba(245, 158, 11, 0.1)',
    },
    interestLabel: {
      fontSize: '12@ms',
      fontWeight: '700',
      flexShrink: 1,
      paddingRight: '8@ms',
    },
    interestValue: {
      fontSize: '12@ms',
      fontWeight: '800',
    },
    breakdownLabel: {
      color: theme.textSecondary,
      fontSize: '11@ms',
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: '8@ms',
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    detailDate: {
      color: theme.textSecondary,
      fontSize: '12@ms',
      marginBottom: '2@ms',
    },
    detailQty: {
      color: theme.textPrimary,
      fontSize: '14@ms',
      fontWeight: '600',
    },
    detailMetaRow: {
      flexDirection: 'row',
      gap: '12@ms',
      marginTop: '4@ms',
      flexWrap: 'wrap',
    },
    detailMetaText: {
      color: theme.textSecondary,
      fontSize: '11@ms',
    },
    detailActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: '16@ms',
      marginTop: '4@ms',
      marginLeft: '8@ms',
    },
    deleteButton: {
      marginTop: '12@ms',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10@ms',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: '8@ms',
    },
    deleteButtonText: {
      color: theme.danger,
      fontWeight: '700',
      fontSize: '13@ms',
      marginLeft: '6@ms',
    },
  });

/**
 * A single portfolio holding row with its expandable MTF breakdown.
 *
 * All per-holding derived values (P&L, MTF interest, buy/sell charges,
 * break-even price) are computed in a single `useMemo` keyed on `holding`, so
 * the math only re-runs when that holding's data changes. Memoized with
 * `React.memo` so rows that didn't change skip re-rendering entirely.
 *
 * The financial formulas are preserved exactly as they were; only the styling
 * changed — from hardcoded pixel values to screen-scaled (`@ms`) styles.
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
  const styles = useMemo(() => createStyles(theme), [theme]);

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
  const warningColor = theme.warning || '#F59E0B';

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: isExpanded ? (isProfit ? theme.success : theme.danger) : theme.borderLight,
          borderLeftColor: isProfit ? theme.success : theme.danger,
        },
      ]}
    >
      <TouchableOpacity style={styles.header} onPress={() => onToggle(holding.symbol)} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbolText} numberOfLines={1} ellipsizeMode="tail">
              {holding.symbol}
            </Text>
            {leverage > 1 && (
              <View style={styles.mtfBadge}>
                <Text style={styles.mtfBadgeText}>{leverage}x MTF</Text>
              </View>
            )}
          </View>
          <Text style={styles.sharesText}>{totalQty} Shares</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.ltpText} numberOfLines={1}>
            ₹{formatINR(ltp)}
          </Text>
          <Text
            style={[styles.pnlText, { color: isProfit ? theme.success : theme.danger }]}
            numberOfLines={1}
          >
            {isProfit ? '+' : ''}₹{formatINR(pnl)} ({pnlPercent.toFixed(2)}%)
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expanded}>
          <View style={styles.statBox}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Avg. Price</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>₹{formatINR(avgPrice)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Invested Margin</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>₹{formatINR(totalMarginUsed)}</Text>
            </View>
          </View>

          <View style={styles.breakEvenBox}>
            <View style={styles.breakEvenRow}>
              <Text style={styles.breakEvenLabel}>Break-Even Target</Text>
              <Text style={styles.breakEvenValue} numberOfLines={1}>
                ₹{formatINR(breakEvenPrice)}
              </Text>
            </View>

            {totalBuyCharges > 0 && (
              <View style={styles.chargeRow}>
                <Text style={styles.chargeLabel}>Past Buy Charges</Text>
                <Text style={styles.chargeValue} numberOfLines={1}>
                  - ₹{formatINR(totalBuyCharges)}
                </Text>
              </View>
            )}

            <View style={styles.chargeRow}>
              <Text style={styles.chargeLabel}>Est. Sell Charges</Text>
              <Text style={styles.chargeValue} numberOfLines={1}>
                - ₹{formatINR(estSellCharges)}
              </Text>
            </View>

            {totalInterest > 0 && (
              <View style={styles.interestRow}>
                <Text style={[styles.interestLabel, { color: warningColor }]}>Accrued MTF Interest</Text>
                <Text style={[styles.interestValue, { color: warningColor }]} numberOfLines={1}>
                  - ₹{formatINR(totalInterest)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ marginTop: moderateScale(8) }}>
            <Text style={styles.breakdownLabel}>Holding Breakdown</Text>

            {detailsWithInterest.map((detail: any, dIndex: number) => {
              const buyDateStr = detail.buyDate ? new Date(detail.buyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A';
              return (
                <View
                  key={detail.id || dIndex}
                  style={{
                    paddingVertical: moderateScale(10),
                    borderBottomWidth: dIndex === detailsWithInterest.length - 1 ? 0 : 1,
                    borderBottomColor: theme.borderLight,
                  }}
                >
                  <View style={styles.detailRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailDate}>
                        {buyDateStr} {detail.days > 0 ? `(${detail.days}d)` : ''}
                      </Text>
                      <Text style={styles.detailQty}>
                        {detail.quantity} @ ₹{detail.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </Text>
                      <View style={styles.detailMetaRow}>
                        {detail.interest > 0 && (
                          <Text style={styles.detailMetaText}>
                            Int: <Text style={{ color: warningColor }}>₹{formatINR(detail.interest)}</Text>
                          </Text>
                        )}
                        <Text style={styles.detailMetaText}>
                          Chg: <Text style={{ color: theme.danger }}>₹{detail.detailBuyCharges?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailActions}>
                      <TouchableOpacity
                        onPress={() => onEditDetail(holding.symbol, detail)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="pencil" size={moderateScale(16)} color={theme.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDeleteDetail(holding.symbol, detail.id)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={moderateScale(16)} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDeleteHolding(holding.symbol)} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={moderateScale(16)} color={theme.danger} />
            <Text style={styles.deleteButtonText}>Delete Holding</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const HoldingCard = React.memo(HoldingCardBase);
export default HoldingCard;
