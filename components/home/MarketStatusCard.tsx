import React from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, ActivityIndicator, Divider, Button as PaperButton, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface MarketStatusCardProps {
  readonly styles: any;
  readonly theme: any;
  readonly cardLoading: boolean;
  readonly marketData: any;
  readonly error: string | null;
  readonly fetchMarketStatus: (showLoader?: boolean) => void;
  readonly isBullish: boolean;
  readonly symbol: string;
  readonly ltp: number;
  readonly change: number;
  readonly changePercent: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
}

export default function MarketStatusCard({
  styles,
  theme,
  cardLoading,
  marketData,
  error,
  fetchMarketStatus,
  isBullish,
  symbol,
  ltp,
  change,
  changePercent,
  open,
  high,
  low
}: MarketStatusCardProps) {
  if (cardLoading && !marketData) {
    return (
      <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16 }}>
        <Card.Content style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
          <ActivityIndicator size="small" color={theme.iconMuted} />
          <PaperText style={[styles.loadingText, { marginTop: 12, color: theme.textSecondary }]}>Fetching Live Market Status...</PaperText>
        </Card.Content>
      </Card>
    );
  }

  if (error && !marketData) {
    return (
      <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16 }}>
        <Card.Content style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
          <Ionicons name="alert-circle-outline" size={28} color={theme.danger} />
          <PaperText style={{ color: theme.danger, marginVertical: 8, textAlign: 'center', fontWeight: '600' }}>{error}</PaperText>
          <PaperButton mode="contained" onPress={() => fetchMarketStatus(true)} buttonColor={theme.primary}>
            Retry
          </PaperButton>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: theme.card, borderRadius: 24, elevation: 3 }} onPress={() => fetchMarketStatus(true)}>
      <Card.Content>
        {/* Card Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="analytics-outline" size={18} color={theme.iconMuted} />
            <PaperText variant="titleSmall" style={{ marginLeft: 6, fontWeight: '700', color: theme.textSecondary }}>
              Market Status
            </PaperText>
          </View>
          <Chip
            compact
            style={{
              backgroundColor: isBullish ? theme.successBackground : theme.dangerBackground,
              borderRadius: 12,
            }}
            textStyle={{
              color: isBullish ? theme.success : theme.danger,
              fontSize: 11,
              fontWeight: '800',
            }}
          >
            {isBullish ? 'BULLISH' : 'BEARISH'}
          </Chip>
        </View>

        {/* Card Body */}
        <View style={{ marginBottom: 16 }}>
          <PaperText variant="titleMedium" style={{ fontWeight: '700', color: theme.textSecondary }}>
            {symbol}
          </PaperText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
            <PaperText variant="headlineMedium" style={{ fontWeight: '900', color: theme.textPrimary }}>
              {ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </PaperText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={isBullish ? "caret-up" : "caret-down"}
                size={16}
                color={isBullish ? theme.success : theme.danger}
              />
              <PaperText style={{ color: isBullish ? theme.success : theme.danger, fontWeight: '700', marginLeft: 4 }}>
                {isBullish ? '+' : ''}
                {change.toFixed(2)} ({changePercent.toFixed(2)}%)
              </PaperText>
            </View>
          </View>
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 12 }} />

        {/* Card Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '600' }}>OPEN</PaperText>
            <PaperText variant="bodyMedium" style={{ color: theme.textPrimary, fontWeight: '700', marginTop: 2 }}>
              {open.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </PaperText>
          </View>
          <View style={{ alignItems: 'center' }}>
            <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '600' }}>HIGH</PaperText>
            <PaperText variant="bodyMedium" style={{ color: theme.textPrimary, fontWeight: '700', marginTop: 2 }}>
              {high.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </PaperText>
          </View>
          <View style={{ alignItems: 'center' }}>
            <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '600' }}>LOW</PaperText>
            <PaperText variant="bodyMedium" style={{ color: theme.textPrimary, fontWeight: '700', marginTop: 2 }}>
              {low.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </PaperText>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}
