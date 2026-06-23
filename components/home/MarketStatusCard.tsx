import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
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
      <View style={[styles.card, styles.centeredCard]}>
        <ActivityIndicator size="small" color={theme.iconMuted} />
        <Text style={styles.loadingText}>Fetching Live Market Status...</Text>
      </View>
    );
  }
  if (error && !marketData) {
    return (
      <View style={[styles.card, styles.centeredCard]}>
        <Ionicons name="alert-circle-outline" size={24} color={theme.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchMarketStatus(true)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => fetchMarketStatus(true)} // Tap card to manually refresh
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name="analytics-outline" size={18} color={theme.iconMuted} />
          <Text style={styles.cardTitle}>Market Status</Text>
        </View>
        <View style={[styles.badge, isBullish ? styles.bullishBadge : styles.bearishBadge]}>
          <View style={[styles.dot, isBullish ? styles.bullishDot : styles.bearishDot]} />
          <Text style={[styles.badgeText, isBullish ? styles.bullishBadgeText : styles.bearishBadgeText]}>
            {isBullish ? 'BULLISH' : 'BEARISH'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.indexName}>{symbol}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.indexPrice} numberOfLines={1} adjustsFontSizeToFit>
            {ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.changeContainer}>
            <Ionicons
              name={isBullish ? "caret-up" : "caret-down"}
              size={16}
              color={isBullish ? theme.success : theme.danger}
            />
            <Text style={[styles.indexChange, { color: isBullish ? theme.success : theme.danger }]}>
              {isBullish ? '+' : ''}
              {change.toFixed(2)} ({changePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>OPEN</Text>
          <Text style={styles.footerVal}>
            {open.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>HIGH</Text>
          <Text style={styles.footerVal}>
            {high.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>LOW</Text>
          <Text style={styles.footerVal}>
            {low.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
