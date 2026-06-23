import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalculatorResultsProps {
  styles: any;
  theme: any;
  results: any;
  setView: (val: 'form' | 'results') => void;
  resetForm: () => void;
  formatCurrency: (val: string) => string;
}

export default function CalculatorResults({
  styles,
  theme,
  results,
  setView,
  resetForm,
  formatCurrency
}: CalculatorResultsProps) {
  return (
    <View style={styles.resultsContainer}>
      {/* Headline ROI card */}
      <View style={[styles.headlineCard, results.isProfit ? styles.headlineCardProfit : styles.headlineCardLoss]}>
        <View style={[styles.iconCircle, results.isProfit ? styles.iconCircleProfit : styles.iconCircleLoss]}>
          <Ionicons name={results.isProfit ? "trending-up" : "trending-down"} size={32} color="#ffffff" />
        </View>

        <Text style={styles.headlineLabel}>Net P&L Result</Text>
        <Text style={[styles.headlinePnLValue, results.isProfit ? styles.textProfit : styles.textLoss]}>
          ₹{results.net}
        </Text>

        <View style={[styles.roiBadge, results.isProfit ? styles.roiBadgeProfit : styles.roiBadgeLoss]}>
          <Text style={[styles.roiBadgeText, results.isProfit ? styles.roiBadgeTextProfit : styles.roiBadgeTextLoss]}>
            {results.roi}% ROI
          </Text>
        </View>

        {/* Reset options */}
        <View style={styles.resultActionsRow}>
          <TouchableOpacity
            style={styles.resultAdjustBtn}
            onPress={() => setView('form')}
          >
            <Ionicons name="create-outline" size={16} color={theme.textPrimary} />
            <Text style={styles.resultAdjustBtnText}>Adjust</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resultResetBtn}
            onPress={resetForm}
          >
            <Ionicons name="refresh-outline" size={16} color="#ffffff" />
            <Text style={styles.resultResetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section 1: Position Summary */}
      <View style={styles.resultsDetailCard}>
        <View style={styles.resultsHeaderRow}>
          <Ionicons name="wallet-outline" size={18} color={theme.secondary} />
          <Text style={styles.resultsDetailCardTitle}>Position Summary</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Stock Symbol</Text>
          <Text style={styles.detailValueBold} numberOfLines={1} adjustsFontSizeToFit>{results.symbol}</Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Shares Quantity</Text>
          <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>{results.shares} shares</Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Total Position Value</Text>
          <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.totalValue)}</Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Your Required Capital</Text>
          <Text style={styles.detailValueBold} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.margin)}</Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Exit Target Price</Text>
          <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.sellPrice)}</Text>
        </View>
      </View>

      {/* Section 2: Cost Breakdown */}
      <View style={styles.resultsDetailCard}>
        <View style={styles.resultsHeaderRow}>
          <Ionicons name="receipt-outline" size={18} color={theme.danger} />
          <Text style={styles.resultsDetailCardTitle}>Cost Breakdown</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Gross Profit / Loss</Text>
          <Text style={[styles.detailValue, results.isProfit ? styles.textProfit : styles.textLoss]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(results.gross)}
          </Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>MTF Interest (15% p.a.)</Text>
          <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.interest)}</Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Total Charges & Taxes</Text>
          <Text style={styles.detailValueBold} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.charges)}</Text>
        </View>
      </View>
    </View>
  );
}
