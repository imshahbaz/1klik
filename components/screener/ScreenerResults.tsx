import React from 'react';
import { View, FlatList } from 'react-native';
import { Card, Text as PaperText, Button as PaperButton, Surface } from 'react-native-paper';
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
      <View style={{ marginBottom: 12 }}>
        <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
          {selectedStrategy ? `Scan results: ${selectedStrategy}` : 'Scan Results'}
        </PaperText>
      </View>

      {(() => {
        if (scanLoading) {
          return renderStockSkeletons();
        }
        if (scanError) {
          return (
            <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16 }}>
              <Card.Content style={{ alignItems: 'center' }}>
                <Surface style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.dangerBackground, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }} elevation={0}>
                  <Ionicons name="alert-circle-outline" size={32} color={theme.danger} />
                </Surface>
                <PaperText variant="titleMedium" style={{ color: theme.textPrimary, fontWeight: '800' }}>Scan Failed</PaperText>
                <PaperText variant="bodyMedium" style={{ color: theme.danger, marginVertical: 8, textAlign: 'center' }}>{scanError}</PaperText>
                <PaperButton mode="contained" buttonColor={theme.primary} onPress={() => handleStrategyPress(selectedStrategy || '')}>
                  Retry Scan
                </PaperButton>
              </Card.Content>
            </Card>
          );
        }
        if (!selectedStrategy) {
          return (
            <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16 }}>
              <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Surface style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primaryBackground, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }} elevation={0}>
                  <Ionicons name="search-outline" size={32} color={theme.primary} />
                </Surface>
                <PaperText variant="titleMedium" style={{ color: theme.textPrimary, fontWeight: '800' }}>Ready to Scan</PaperText>
                <PaperText variant="bodySmall" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4 }}>
                  Select a strategy above to query the market and find your next setup.
                </PaperText>
              </Card.Content>
            </Card>
          );
        }
        if (scanResults.length === 0) {
          return (
            <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16 }}>
              <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Surface style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }} elevation={0}>
                  <Ionicons name="filter-outline" size={32} color={theme.iconMuted} />
                </Surface>
                <PaperText variant="titleMedium" style={{ color: theme.textPrimary, fontWeight: '800' }}>No Matches Found</PaperText>
                <PaperText variant="bodySmall" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4 }}>
                  No stocks currently match the {selectedStrategy} criteria.
                </PaperText>
              </Card.Content>
            </Card>
          );
        }
        return (
          <FlatList
            data={scanResults}
            keyExtractor={(item, index) => String(item.symbol || item.nsecode || item.name || index)}
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
