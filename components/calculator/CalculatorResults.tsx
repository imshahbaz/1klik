import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Button from '../ui/Button';
import { Panel, SectionHeader } from '../ui/Panel';
import { numeric, radius, space } from '../../theme/tokens';

interface CalculatorResultsProps {
  readonly styles?: any;
  readonly theme: any;
  readonly results: any;
  readonly setView: (val: 'form' | 'results') => void;
  readonly resetForm: () => void;
  readonly formatCurrency: (val: string) => string;
}

/**
 * Outcome screen. The net P&L is the single dominant number, tinted by
 * direction, with everything that produced it laid out as a plain ledger below.
 */
export default function CalculatorResults({
  theme,
  results,
  setView,
  resetForm,
  formatCurrency,
}: CalculatorResultsProps) {
  const tint = results.isProfit ? theme.up : theme.down;

  return (
    <View>
      <SectionHeader title="Net result" />
      <Panel padded={false}>
        <View style={[styles.headline, { borderBottomColor: theme.divider }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: theme.textTertiary }}>
            {results.isProfit ? 'NET PROFIT' : 'NET LOSS'}
          </Text>
          <Text style={[numeric, { fontSize: 38, fontWeight: '700', color: tint, marginTop: space.sm }]}>
            {results.isProfit ? '+' : '−'}₹{String(results.net).replace('-', '')}
          </Text>
          <View style={[styles.roi, { backgroundColor: results.isProfit ? theme.upBackground : theme.downBackground }]}>
            <Text style={[numeric, { fontSize: 13, fontWeight: '700', color: tint }]}>
              {results.roi}% return on capital
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button label="Adjust" variant="outlined" compact onPress={() => setView('form')} style={{ flex: 1 }} />
          <Button label="New calculation" compact onPress={resetForm} style={{ flex: 1.4 }} />
        </View>
      </Panel>

      <SectionHeader title="Position" />
      <Panel padded={false}>
        <Line theme={theme} label="Symbol" value={results.symbol} />
        <Line theme={theme} label="Shares" value={`${results.shares}`} mono />
        <Line theme={theme} label="Position value" value={formatCurrency(results.totalValue)} mono />
        <Line theme={theme} label="Capital required" value={formatCurrency(results.margin)} mono />
        <Line theme={theme} label="Funded by broker" value={formatCurrency(results.funding)} mono />
        <Line theme={theme} label="Exit price" value={formatCurrency(results.sellPrice)} mono last />
      </Panel>

      <SectionHeader title="Cost breakdown" />
      <Panel padded={false}>
        <Line theme={theme} label="Gross P&L" value={formatCurrency(results.gross)} mono tint={tint} />
        <Line theme={theme} label="MTF interest (15% p.a.)" value={`−${formatCurrency(results.interest)}`} mono tint={theme.down} />
        <Line theme={theme} label="Charges & taxes" value={`−${formatCurrency(results.charges)}`} mono tint={theme.down} last />
      </Panel>
    </View>
  );
}

function Line({
  theme,
  label,
  value,
  mono = false,
  tint,
  last = false,
}: {
  readonly theme: any;
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
  readonly tint?: string;
  readonly last?: boolean;
}) {
  return (
    <View
      style={[
        styles.line,
        { borderBottomColor: theme.divider, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
      ]}
    >
      <Text style={{ fontSize: 13, color: theme.textSecondary }}>{label}</Text>
      <Text
        style={[
          mono && numeric,
          { fontSize: 13.5, fontWeight: '700', color: tint || theme.textPrimary, marginLeft: space.md },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: {
    alignItems: 'center',
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  roi: {
    marginTop: space.md,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
