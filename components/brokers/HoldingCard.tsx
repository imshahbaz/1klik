import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, Text as PaperText, Chip, Button as PaperButton, Divider, Surface } from 'react-native-paper';
import { buyCharges, sellCharges, mtfInterest, breakEvenSellAmount } from '../../utils/charges';
import type { Holding } from '../../services/api/types';

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
    const totalCost = details.reduce((acc: number, detail: any) => acc + (detail.quantity * detail.price), 0);
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

  return (
    <Card
      style={{
        backgroundColor: theme.card,
        borderRadius: 20,
        marginBottom: 12,
        borderLeftWidth: 5,
        borderLeftColor: isProfit ? theme.success : theme.danger,
        elevation: 2,
      }}
      onPress={() => onToggle(holding.symbol)}
    >
      <Card.Content style={{ gap: 12 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
                {holding.symbol}
              </PaperText>
              {leverage > 1 && (
                <Chip compact style={{ backgroundColor: theme.primaryBackground }} textStyle={{ color: theme.primary, fontSize: 10, fontWeight: '800' }}>
                  {leverage}x MTF
                </Chip>
              )}
            </View>
            <PaperText variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 2 }}>
              {totalQty} Shares
            </PaperText>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
              ₹{formatINR(ltp)}
            </PaperText>
            <PaperText variant="bodySmall" style={{ color: isProfit ? theme.success : theme.danger, fontWeight: '700', marginTop: 2 }}>
              {isProfit ? '+' : ''}₹{formatINR(pnl)} ({pnlPercent.toFixed(2)}%)
            </PaperText>
          </View>
        </View>

        {isExpanded && (
          <View style={{ gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight }}>
            <Surface style={{ flexDirection: 'row', padding: 12, borderRadius: 14, backgroundColor: theme.borderLight }} elevation={0}>
              <View style={{ flex: 1 }}>
                <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '700' }}>AVG. PRICE</PaperText>
                <PaperText variant="titleSmall" style={{ color: theme.textPrimary, fontWeight: '800', marginTop: 2 }}>₹{formatINR(avgPrice)}</PaperText>
              </View>
              <Divider style={{ width: 1, height: '100%', marginHorizontal: 12 }} />
              <View style={{ flex: 1 }}>
                <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '700' }}>INVESTED MARGIN</PaperText>
                <PaperText variant="titleSmall" style={{ color: theme.textPrimary, fontWeight: '800', marginTop: 2 }}>₹{formatINR(totalMarginUsed)}</PaperText>
              </View>
            </Surface>

            {/* Break-even box */}
            <Surface style={{ padding: 12, borderRadius: 14, backgroundColor: theme.warningBackground, gap: 6 }} elevation={0}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <PaperText variant="bodyMedium" style={{ color: theme.textPrimary, fontWeight: '700' }}>Break-Even Target</PaperText>
                <PaperText variant="titleMedium" style={{ color: theme.primary, fontWeight: '900' }}>₹{formatINR(breakEvenPrice)}</PaperText>
              </View>
              {totalBuyCharges > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <PaperText variant="bodySmall" style={{ color: theme.textSecondary }}>Past Buy Charges</PaperText>
                  <PaperText variant="bodySmall" style={{ color: theme.danger, fontWeight: '700' }}>- ₹{formatINR(totalBuyCharges)}</PaperText>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <PaperText variant="bodySmall" style={{ color: theme.textSecondary }}>Est. Sell Charges</PaperText>
                <PaperText variant="bodySmall" style={{ color: theme.danger, fontWeight: '700' }}>- ₹{formatINR(estSellCharges)}</PaperText>
              </View>
              {totalInterest > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <PaperText variant="bodySmall" style={{ color: theme.warningText, fontWeight: '700' }}>Accrued MTF Interest</PaperText>
                  <PaperText variant="bodySmall" style={{ color: theme.warningText, fontWeight: '800' }}>- ₹{formatINR(totalInterest)}</PaperText>
                </View>
              )}
            </Surface>

            {/* Holding Breakdown */}
            <View>
              <PaperText variant="labelMedium" style={{ color: theme.textSecondary, fontWeight: '800', marginBottom: 8 }}>
                HOLDING BREAKDOWN
              </PaperText>
              {detailsWithInterest.map((detail: any, dIndex: number) => {
                const buyDateStr = detail.buyDate ? new Date(detail.buyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A';
                return (
                  <View key={detail.id || dIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.borderLight }}>
                    <View style={{ flex: 1 }}>
                      <PaperText variant="bodySmall" style={{ color: theme.textSecondary }}>
                        {buyDateStr} {detail.days > 0 ? `(${detail.days}d)` : ''}
                      </PaperText>
                      <PaperText variant="bodyMedium" style={{ color: theme.textPrimary, fontWeight: '700' }}>
                        {detail.quantity} @ ₹{detail.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </PaperText>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => onEditDetail(holding.symbol, detail)}>
                        <Ionicons name="pencil" size={18} color={theme.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onDeleteDetail(holding.symbol, detail.id)}>
                        <Ionicons name="trash-outline" size={18} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            <PaperButton
              mode="contained"
              buttonColor={theme.danger}
              onPress={() => onDeleteHolding(holding.symbol)}
              icon={({ size }) => <Ionicons name="trash-outline" size={size || 16} color="#ffffff" />}
              style={{ borderRadius: 12, marginTop: 8 }}
            >
              Delete Holding
            </PaperButton>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const HoldingCard = React.memo(HoldingCardBase);
export default HoldingCard;
