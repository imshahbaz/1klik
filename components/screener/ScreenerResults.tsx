import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { EmptyState } from '../ui/Feedback';
import { overline, space } from '../../theme/tokens';

interface ScreenerResultsProps {
  readonly styles?: any;
  readonly theme: any;
  readonly layout: any;
  readonly selectedStrategy: string | null;
  readonly scanLoading: boolean;
  readonly scanError: string | null;
  readonly scanResults: any[];
  readonly renderStockSkeletons: () => any;
  readonly handleStrategyPress: (name: string) => void;
  readonly renderStockResultItem: ({ item }: { item: any }) => any;
  /** Bottom padding so the last row clears the navigation bar. */
  readonly bottomInset: number;
}

/**
 * Scan output as a continuous, hairline-separated table with a sticky column
 * header — the layout a broker uses for a watchlist, which fits roughly twice
 * as many instruments on screen as the previous stack of rounded cards.
 */
export default function ScreenerResults({
  theme,
  selectedStrategy,
  scanLoading,
  scanError,
  scanResults,
  renderStockSkeletons,
  handleStrategyPress,
  renderStockResultItem,
  bottomInset,
}: ScreenerResultsProps) {
  if (scanLoading) {
    return <View style={{ flex: 1 }}>{renderStockSkeletons()}</View>;
  }

  if (scanError) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Scan failed"
        message={scanError}
        actionLabel="Retry scan"
        onAction={() => handleStrategyPress(selectedStrategy || '')}
        tone="error"
      />
    );
  }

  if (!selectedStrategy) {
    return (
      <EmptyState
        icon="scan-outline"
        title="Pick a strategy"
        message="Choose a scan above to query the market for matching setups."
      />
    );
  }

  if (scanResults.length === 0) {
    return (
      <EmptyState
        icon="funnel-outline"
        title="No matches"
        message={`Nothing currently satisfies the ${selectedStrategy} criteria.`}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.columns, { borderBottomColor: theme.divider, backgroundColor: theme.background }]}>
        <Text style={[overline, { color: theme.textTertiary }]}>Symbol</Text>
        <Text style={[overline, { color: theme.textTertiary }]}>LTP</Text>
      </View>

      <FlatList
        data={scanResults}
        keyExtractor={(item, index) => String(item.symbol || item.nsecode || item.name || index)}
        renderItem={renderStockResultItem}
        contentContainerStyle={{ paddingBottom: bottomInset }}
        initialNumToRender={14}
        maxToRenderPerBatch={14}
        windowSize={7}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
