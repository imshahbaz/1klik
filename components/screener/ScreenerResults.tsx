import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScreenerResultsProps {
  readonly styles: any;
  readonly theme: any;
  readonly layout: any;
  readonly selectedStrategy: string | null;
  readonly scanLoading: boolean;
  readonly scanError: string | null;
  readonly scanResults: any[];
  readonly renderStockSkeletons: () => any;
  readonly handleStrategyPress: (name: string) => void;
  readonly renderStockResultItem: ({ item }: { item: any }) => any;
}

export default function ScreenerResults({
  styles,
  theme,
  layout,
  selectedStrategy,
  scanLoading,
  scanError,
  scanResults,
  renderStockSkeletons,
  handleStrategyPress,
  renderStockResultItem
}: ScreenerResultsProps) {
  return (
    <View style={styles.resultsSection}>
      <View style={styles.resultsHeaderRow}>
        <Text style={styles.resultsTitle}>
          {selectedStrategy ? `Scan results: ${selectedStrategy}` : 'Scan Results'}
        </Text>
      </View>

      {(() => {
        if (scanLoading) {
          return renderStockSkeletons();
        }
        if (scanError) {
          return (
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyStateIconWrapper, { backgroundColor: theme.danger + '15' }]}>
                <Ionicons name="alert-circle-outline" size={32} color={theme.danger} />
              </View>
              <Text style={styles.emptyStateTitle}>Scan Failed</Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.danger }]}>{scanError}</Text>
              <TouchableOpacity style={[styles.retryButton, { marginTop: 8 }]} onPress={() => handleStrategyPress(selectedStrategy || '')} activeOpacity={0.8}>
                <Text style={styles.retryText}>Retry Scan</Text>
              </TouchableOpacity>
            </View>
          );
        }
        if (!selectedStrategy) {
          return (
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyStateIconWrapper, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="search-outline" size={32} color={theme.primary} />
              </View>
              <Text style={styles.emptyStateTitle}>Ready to Scan</Text>
              <Text style={styles.emptyStateSubtext}>
                Select a strategy above to query the market and find your next setup.
              </Text>
            </View>
          );
        }
        if (scanResults.length === 0) {
          return (
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyStateIconWrapper, { backgroundColor: theme.borderLight }]}>
                <Ionicons name="filter-outline" size={32} color={theme.iconMuted} />
              </View>
              <Text style={styles.emptyStateTitle}>No Matches Found</Text>
              <Text style={styles.emptyStateSubtext}>
                No stocks currently match the {selectedStrategy} criteria.
              </Text>
            </View>
          );
        }
        return (
          <FlatList
            data={scanResults}
            keyExtractor={(item, index) => (item.symbol || item.nsecode || item.name || index.toString()) + index}
            renderItem={renderStockResultItem}
            contentContainerStyle={[styles.resultsList, { paddingBottom: layout.tabBarHeight + 24 }]}
            contentInsetAdjustmentBehavior="automatic"
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        );
      })()}
    </View>
  );
}
