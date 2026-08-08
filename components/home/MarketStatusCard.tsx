import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, TouchableRipple } from 'react-native-paper';
import { Delta, Money, Stat, formatAmount } from '../ui/Price';
import { EmptyState, Tag } from '../ui/Feedback';
import { Panel } from '../ui/Panel';
import { numeric, radius, space } from '../../theme/tokens';

interface MarketStatusCardProps {
  readonly styles?: any;
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

/**
 * Primary index quote. Laid out like a broker's instrument header: exchange
 * keyline, oversized last-traded price in tabular figures, signed change, then
 * a hairline-separated OHLC strip.
 */
export default function MarketStatusCard({
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
  low,
}: MarketStatusCardProps) {
  if (cardLoading && !marketData) {
    return (
      <Panel style={{ minHeight: 168, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: space.md }}>
          Fetching live quote…
        </Text>
      </Panel>
    );
  }

  if (error && !marketData) {
    return (
      <Panel padded={false}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Quote unavailable"
          message={error}
          actionLabel="Retry"
          onAction={() => fetchMarketStatus(true)}
          tone="error"
        />
      </Panel>
    );
  }

  const prevClose = ltp - change;
  const tint = isBullish ? theme.up : theme.down;
  // Where the last price sits within the day's range, for the range bar.
  const span = Math.max(high - low, 0.0001);
  const position = Math.min(Math.max((ltp - low) / span, 0), 1);

  return (
    <Panel padded={false}>
      <TouchableRipple onPress={() => fetchMarketStatus(true)} rippleColor={theme.ripple}>
        <View>
          <View style={styles.head}>
            <View style={styles.headLeft}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }} numberOfLines={1}>
                {symbol}
              </Text>
              <Tag label="NSE" />
            </View>
            <View style={styles.live}>
              <View style={[styles.dot, { backgroundColor: tint }]} />
              <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.7, color: theme.textTertiary }}>
                LIVE
              </Text>
            </View>
          </View>

          <View style={styles.quote}>
            <Money value={ltp} size={34} weight="700" color={theme.textPrimary} />
            <View style={{ marginTop: space.xs }}>
              <Delta change={change} percent={changePercent} size={14} pill />
            </View>
          </View>

          {/* Day range: low ── marker ── high */}
          <View style={styles.range}>
            <Text style={[numeric, { fontSize: 11, color: theme.textTertiary }]}>{formatAmount(low)}</Text>
            <View style={[styles.rangeTrack, { backgroundColor: theme.surfaceSunken }]}>
              <View
                style={[
                  styles.rangeMarker,
                  { left: `${position * 100}%`, backgroundColor: tint, borderColor: theme.surface },
                ]}
              />
            </View>
            <Text style={[numeric, { fontSize: 11, color: theme.textTertiary }]}>{formatAmount(high)}</Text>
          </View>

          <View style={[styles.strip, { borderTopColor: theme.divider }]}>
            <Stat label="OPEN" value={formatAmount(open)} />
            <Stat label="HIGH" value={formatAmount(high)} align="center" tint={theme.up} />
            <Stat label="LOW" value={formatAmount(low)} align="center" tint={theme.down} />
            <Stat label="PREV CLOSE" value={formatAmount(prevClose)} align="flex-end" />
          </View>
        </View>
      </TouchableRipple>
    </Panel>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flex: 1,
    minWidth: 0,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  quote: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  range: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  rangeTrack: {
    flex: 1,
    height: 3,
    borderRadius: radius.pill,
  },
  rangeMarker: {
    position: 'absolute',
    top: -3.5,
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    borderWidth: 2,
    marginLeft: -5,
  },
  strip: {
    flexDirection: 'row',
    marginTop: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
