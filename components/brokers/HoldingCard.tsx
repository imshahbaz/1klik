import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { buyCharges, sellCharges, mtfInterest, breakEvenSellAmount } from '../../utils/charges';
import type { Holding } from '../../services/api/types';
import { Tag } from '../ui/Feedback';
import { Stat } from '../ui/Price';
import Button from '../ui/Button';
import { numeric, radius, space } from '../../theme/tokens';

interface HoldingCardProps {
  readonly holding: Holding;
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
 * A position in the portfolio table. Collapsed it shows the four numbers that
 * matter — quantity, average, last price, P&L — on two lines; expanding reveals
 * the cost breakdown and per-lot entries.
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
    const details = (holding.holdingDetails ?? []).map((d: any) => ({
      ...d,
      quantity: Number(d?.quantity) || 0,
      price: Number(d?.price) || 0,
    }));

    const totalQty = details.reduce((acc: number, detail: any) => acc + detail.quantity, 0);
    const totalCost = details.reduce((acc: number, detail: any) => acc + detail.quantity * detail.price, 0);
    const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;

    const ltp = Number(holding.ltp) || 0;
    const pnl = (ltp - avgPrice) * totalQty;
    const pnlPercent = avgPrice > 0 ? (pnl / (avgPrice * totalQty)) * 100 : 0;

    const leverage = Number(holding.margin) || 1;
    let totalInterest = 0;
    let totalMarginUsed = 0;
    let totalBuyCharges = 0;

    const detailsWithInterest = details.map((detail: any) => {
      const totalValue = detail.quantity * detail.price;
      const marginUsed = totalValue / leverage;
      const fundedAmt = totalValue - marginUsed;

      totalMarginUsed += marginUsed;

      const detailBuyCharges = buyCharges(totalValue);
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
      const interest = mtfInterest(fundedAmt, days);
      totalInterest += interest;

      return { ...detail, interest, days, detailBuyCharges };
    });

    const estSellCharges = sellCharges(totalQty * ltp);
    const breakEven = breakEvenSellAmount(totalCost + totalInterest + totalBuyCharges);
    const breakEvenPrice = totalQty > 0 ? breakEven / totalQty : 0;

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
  const tint = isProfit ? theme.up : theme.down;

  // The collapsed row is two side-by-side two-line stacks. If either secondary
  // line wrapped, that stack would grow taller than its neighbour and the two
  // would stop lining up — so both are pinned to one line and the type steps
  // down when the row gets tight. Divided by font scale as well as width,
  // since large system text starves the row the same way a small screen does.
  const { width, fontScale } = useWindowDimensions();
  const effectiveWidth = width / Math.max(fontScale, 1);
  const titleSize = effectiveWidth < 380 ? 14 : 15;
  const subSize = effectiveWidth < 380 ? 11 : 12;

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.divider }]}>
      <TouchableRipple onPress={() => onToggle(holding.symbol)} rippleColor={theme.ripple}>
        <View style={styles.summary}>
          <View style={styles.summaryLeft}>
            <View style={styles.symbolRow}>
              <Text numberOfLines={1} style={{ fontSize: titleSize, fontWeight: '700', color: theme.textPrimary }}>
                {holding.symbol}
              </Text>
              {leverage > 1 ? <Tag label={`${leverage}× MTF`} tone="accent" /> : null}
            </View>
            <Text
              numberOfLines={1}
              style={[numeric, { fontSize: subSize, color: theme.textSecondary, marginTop: 3 }]}
            >
              {totalQty} qty · avg ₹{formatINR(avgPrice)}
            </Text>
          </View>

          <View style={styles.summaryRight}>
            <Text
              numberOfLines={1}
              style={[numeric, { fontSize: titleSize, fontWeight: '700', color: theme.textPrimary }]}
            >
              ₹{formatINR(ltp)}
            </Text>
            <Text
              numberOfLines={1}
              style={[numeric, { fontSize: subSize, fontWeight: '700', color: tint, marginTop: 3 }]}
            >
              {isProfit ? '+' : '−'}₹{formatINR(Math.abs(pnl))} ({pnlPercent.toFixed(2)}%)
            </Text>
          </View>

          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.textTertiary}
            style={{ marginLeft: space.sm }}
          />
        </View>
      </TouchableRipple>

      {isExpanded && (
        <View style={[styles.detail, { borderTopColor: theme.divider }]}>
          <View style={[styles.metrics, { backgroundColor: theme.surfaceAlt }]}>
            <Stat label="AVG PRICE" value={`₹${formatINR(avgPrice)}`} />
            <Stat label="MARGIN USED" value={`₹${formatINR(totalMarginUsed)}`} align="center" />
            <Stat label="BREAK-EVEN" value={`₹${formatINR(breakEvenPrice)}`} align="flex-end" tint={theme.primary} />
          </View>

          {/* Everything that has to be earned back before the position is flat. */}
          <View style={{ gap: 6 }}>
            {totalBuyCharges > 0 ? (
              <CostLine theme={theme} label="Buy charges paid" value={totalBuyCharges} />
            ) : null}
            <CostLine theme={theme} label="Est. sell charges" value={estSellCharges} />
            {totalInterest > 0 ? (
              <CostLine theme={theme} label="Accrued MTF interest" value={totalInterest} warn />
            ) : null}
          </View>

          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: theme.textTertiary }}>
              LOTS
            </Text>
            {detailsWithInterest.map((detail: any, dIndex: number) => {
              const buyDateStr = detail.buyDate
                ? new Date(detail.buyDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })
                : 'N/A';
              return (
                <View
                  key={detail.id || dIndex}
                  style={[styles.lot, { borderBottomColor: theme.divider }]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[numeric, { fontSize: 13.5, fontWeight: '600', color: theme.textPrimary }]}>
                      {detail.quantity} @ ₹{formatINR(detail.price || 0)}
                    </Text>
                    <Text style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 2 }}>
                      {buyDateStr}
                      {detail.days > 0 ? ` · ${detail.days}d held` : ''}
                    </Text>
                  </View>

                  <TouchableRipple
                    borderless
                    rippleColor={theme.ripple}
                    onPress={() => onEditDetail(holding.symbol, detail)}
                    style={styles.lotAction}
                    accessibilityLabel="Edit lot"
                  >
                    <Ionicons name="pencil" size={16} color={theme.textSecondary} />
                  </TouchableRipple>
                  <TouchableRipple
                    borderless
                    rippleColor={theme.ripple}
                    onPress={() => onDeleteDetail(holding.symbol, detail.id)}
                    style={styles.lotAction}
                    accessibilityLabel="Delete lot"
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.danger} />
                  </TouchableRipple>
                </View>
              );
            })}
          </View>

          <Button
            label="Delete holding"
            variant="outlined"
            icon="trash-outline"
            compact
            onPress={() => onDeleteHolding(holding.symbol)}
          />
        </View>
      )}
    </View>
  );
}

function CostLine({
  theme,
  label,
  value,
  warn = false,
}: {
  readonly theme: any;
  readonly label: string;
  readonly value: number;
  readonly warn?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 12.5, color: warn ? theme.warningText : theme.textSecondary }}>{label}</Text>
      <Text style={[numeric, { fontSize: 12.5, fontWeight: '700', color: warn ? theme.warningText : theme.down }]}>
        −₹{formatINR(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  summaryLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: space.md,
  },
  summaryRight: {
    alignItems: 'flex-end',
    // Lets the P&L column give ground instead of squeezing the symbol/quantity
    // column until it truncates.
    flexShrink: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  detail: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
    gap: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metrics: {
    flexDirection: 'row',
    padding: space.md,
    borderRadius: radius.sm,
  },
  lot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    marginTop: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lotAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const HoldingCard = React.memo(HoldingCardBase);
export default HoldingCard;
