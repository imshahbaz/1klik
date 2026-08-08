import React from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, Button as PaperButton, Chip, Divider, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface CalculatorResultsProps {
  readonly styles: any;
  readonly theme: any;
  readonly results: any;
  readonly setView: (val: 'form' | 'results') => void;
  readonly resetForm: () => void;
  readonly formatCurrency: (val: string) => string;
}

export default function CalculatorResults({
  theme,
  results,
  setView,
  resetForm,
  formatCurrency
}: CalculatorResultsProps) {
  return (
    <View style={{ gap: 16 }}>
      {/* Headline ROI Card */}
      <Card
        style={{
          backgroundColor: results.isProfit ? theme.successBackground : theme.dangerBackground,
          borderRadius: 24,
          elevation: 4,
          padding: 8,
        }}
      >
        <Card.Content style={{ alignItems: 'center' }}>
          <Surface
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: results.isProfit ? theme.success : theme.danger,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
            elevation={2}
          >
            <Ionicons name={results.isProfit ? "trending-up" : "trending-down"} size={28} color="#ffffff" />
          </Surface>

          <PaperText variant="labelLarge" style={{ color: theme.textSecondary, fontWeight: '700' }}>
            Net P&L Result
          </PaperText>
          <PaperText variant="headlineLarge" style={{ fontWeight: '900', color: results.isProfit ? theme.success : theme.danger, marginVertical: 4 }}>
            ₹{results.net}
          </PaperText>

          <Chip
            style={{
              backgroundColor: results.isProfit ? theme.success : theme.danger,
              marginTop: 4,
              marginBottom: 16,
            }}
            textStyle={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}
          >
            {results.roi}% ROI
          </Chip>

          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <PaperButton
              mode="outlined"
              onPress={() => setView('form')}
              icon={({ size }) => <Ionicons name="create-outline" size={size || 16} color={theme.textPrimary} />}
              textColor={theme.textPrimary}
              style={{ flex: 1, borderRadius: 12, borderColor: theme.border }}
            >
              Adjust
            </PaperButton>
            <PaperButton
              mode="contained"
              onPress={resetForm}
              icon={({ size }) => <Ionicons name="refresh-outline" size={size || 16} color="#ffffff" />}
              buttonColor={theme.primary}
              textColor="#ffffff"
              style={{ flex: 1, borderRadius: 12 }}
            >
              Reset
            </PaperButton>
          </View>
        </Card.Content>
      </Card>

      {/* Position Summary Paper Card */}
      <Card style={{ backgroundColor: theme.card, borderRadius: 24, elevation: 2 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="wallet-outline" size={20} color={theme.secondary} />
            <PaperText variant="titleMedium" style={{ marginLeft: 8, fontWeight: '800', color: theme.textPrimary }}>
              Position Summary
            </PaperText>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
            <PaperText style={{ color: theme.textSecondary }}>Stock Symbol</PaperText>
            <PaperText style={{ color: theme.textPrimary, fontWeight: '800' }}>{results.symbol}</PaperText>
          </View>
          <Divider style={{ backgroundColor: theme.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
            <PaperText style={{ color: theme.textSecondary }}>Shares Quantity</PaperText>
            <PaperText style={{ color: theme.textPrimary, fontWeight: '700' }}>{results.shares} shares</PaperText>
          </View>
          <Divider style={{ backgroundColor: theme.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
            <PaperText style={{ color: theme.textSecondary }}>Total Position Value</PaperText>
            <PaperText style={{ color: theme.textPrimary, fontWeight: '700' }}>{formatCurrency(results.totalValue)}</PaperText>
          </View>
          <Divider style={{ backgroundColor: theme.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
            <PaperText style={{ color: theme.textSecondary }}>Required Capital</PaperText>
            <PaperText style={{ color: theme.textPrimary, fontWeight: '800' }}>{formatCurrency(results.margin)}</PaperText>
          </View>
          <Divider style={{ backgroundColor: theme.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
            <PaperText style={{ color: theme.textSecondary }}>Exit Target Price</PaperText>
            <PaperText style={{ color: theme.textPrimary, fontWeight: '700' }}>{formatCurrency(results.sellPrice)}</PaperText>
          </View>
        </Card.Content>
      </Card>

      {/* Cost Breakdown Paper Card */}
      <Card style={{ backgroundColor: theme.card, borderRadius: 24, elevation: 2 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="receipt-outline" size={20} color={theme.danger} />
            <PaperText variant="titleMedium" style={{ marginLeft: 8, fontWeight: '800', color: theme.textPrimary }}>
              Cost Breakdown
            </PaperText>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
            <PaperText style={{ color: theme.textSecondary }}>Gross Profit / Loss</PaperText>
            <PaperText style={{ color: results.isProfit ? theme.success : theme.danger, fontWeight: '700' }}>
              {formatCurrency(results.gross)}
            </PaperText>
          </View>
          <Divider style={{ backgroundColor: theme.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
            <PaperText style={{ color: theme.textSecondary }}>MTF Interest (15% p.a.)</PaperText>
            <PaperText style={{ color: theme.textPrimary, fontWeight: '700' }}>{formatCurrency(results.interest)}</PaperText>
          </View>
          <Divider style={{ backgroundColor: theme.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
            <PaperText style={{ color: theme.textSecondary }}>Total Charges & Taxes</PaperText>
            <PaperText style={{ color: theme.textPrimary, fontWeight: '800' }}>{formatCurrency(results.charges)}</PaperText>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}
