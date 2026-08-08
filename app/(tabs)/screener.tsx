import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { strategyAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { numeric, size, space } from '../../theme/tokens';
import StrategyChips from '../../components/screener/StrategyChips';
import ScreenerResults from '../../components/screener/ScreenerResults';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import { Skeleton, Tag } from '../../components/ui/Feedback';

const STRATEGY_ICONS: Record<string, { iconName: any; badgeText: string }> = {
  RSI15MIN: { iconName: 'flash-outline', badgeText: '15 MIN SCAN' },
  DAILY: { iconName: 'today-outline', badgeText: 'DAILY SCAN' },
  SWING: { iconName: 'trending-up-outline', badgeText: 'SWING SCAN' },
  WEEKLY: { iconName: 'calendar-outline', badgeText: 'WEEKLY SCAN' },
  MONTHLY: { iconName: 'stats-chart-outline', badgeText: 'MONTHLY SCAN' },
};

export default function ScreenerScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  const [strategiesLoading, setStrategiesLoading] = useState(true);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);

  const [scanResults, setScanResults] = useState<any[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const fetchStrategies = useCallback(async () => {
    try {
      setStrategiesLoading(true);
      setStrategiesError(null);
      const res = await strategyAPI.getStrategies();
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setStrategies(list);
      }
    } catch (err: any) {
      console.error('Failed to fetch strategies:', err);
      setStrategiesError('Failed to load strategies');
    } finally {
      setStrategiesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStrategies();
    }, [fetchStrategies])
  );

  const handleStrategyPress = useCallback(async (strategyName: string) => {
    setSelectedStrategy(strategyName);
    try {
      setScanLoading(true);
      setScanError(null);
      const res = await strategyAPI.fetchWithMargin(strategyName);
      const stocks = res.data?.data || res.data || [];
      setScanResults(Array.isArray(stocks) ? stocks : []);
    } catch (err: any) {
      console.error(`Failed to scan strategy ${strategyName}:`, err);
      setScanError(`Scan failed for ${strategyName}`);
    } finally {
      setScanLoading(false);
    }
  }, []);

  const getStrategyMetadata = useCallback((name: string) => {
    const key = name?.toUpperCase() || '';
    for (const [k, v] of Object.entries(STRATEGY_ICONS)) {
      if (key.includes(k)) return v;
    }
    return { iconName: 'analytics-outline', badgeText: 'STRATEGY SCAN' };
  }, []);

  const renderStockResultItem = useCallback(
    ({ item }: { item: any }) => {
      const symbol = item.symbol || item.nsecode || item.nseCode || item.stockName || item.name || 'N/A';
      const companyName = item.name || item.companyName || item.stockDescription || '';

      const rawPrice = item.ltp || item.close || item.lastPrice || item.price;
      let priceText = '—';
      if (typeof rawPrice === 'number') {
        priceText = rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else if (rawPrice) {
        priceText = String(rawPrice);
      }

      const rawMargin = item.margin || item.leverage || item.marginAllowed || '';
      let marginStr = rawMargin.toString().trim();
      const parsedMargin = Number.parseFloat(marginStr);
      if (Number.isNaN(parsedMargin) || parsedMargin <= 0) {
        marginStr = '1x';
      } else {
        const suffix = marginStr.endsWith('%') ? '%' : 'x';
        marginStr = `${parsedMargin.toFixed(2)}${suffix}`;
      }

      return (
        <TouchableRipple
          rippleColor={theme.ripple}
          onPress={() => {
            if (symbol !== 'N/A') {
              router.push(`/chartPage?symbol=${encodeURIComponent(symbol)}`);
            }
          }}
        >
          <View style={[styles.quoteRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.quoteLeft}>
              <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '700', color: theme.textPrimary }}>
                {symbol}
              </Text>
              {companyName ? (
                <Text numberOfLines={1} style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 2 }}>
                  {companyName}
                </Text>
              ) : null}
            </View>

            <View style={styles.quoteRight}>
              <Text style={[numeric, { fontSize: 14.5, fontWeight: '700', color: theme.textPrimary }]}>
                {priceText}
              </Text>
              <Tag label={marginStr.toUpperCase()} tone="accent" style={{ marginTop: 3 }} />
            </View>
          </View>
        </TouchableRipple>
      );
    },
    [theme, router]
  );

  const renderStockSkeletons = () => (
    <View>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <View key={i} style={[styles.quoteRow, { borderBottomColor: theme.divider }]}>
          <View style={styles.quoteLeft}>
            <Skeleton width="45%" height={13} />
            <View style={{ height: 6 }} />
            <Skeleton width="70%" height={10} />
          </View>
          <Skeleton width={62} height={13} />
        </View>
      ))}
    </View>
  );

  return (
    <Screen
      scroll={false}
      gutter={false}
      header={
        <TopBar
          title="Screener"
          subtitle={selectedStrategy ? `${scanResults.length} matches` : 'Quantitative market scans'}
          actions={[
            {
              icon: 'refresh-outline',
              onPress: () => (selectedStrategy ? handleStrategyPress(selectedStrategy) : fetchStrategies()),
              accessibilityLabel: 'Rerun scan',
            },
          ]}
          bottom={
            <StrategyChips
              strategies={strategies}
              selectedStrategy={selectedStrategy}
              onSelect={handleStrategyPress}
              loading={strategiesLoading}
              error={strategiesError}
              onRetry={fetchStrategies}
              getStrategyMetadata={getStrategyMetadata}
            />
          }
        />
      }
    >
      <ScreenerResults
        theme={theme}
        layout={null}
        selectedStrategy={selectedStrategy}
        scanLoading={scanLoading}
        scanError={scanError}
        scanResults={scanResults}
        renderStockSkeletons={renderStockSkeletons}
        handleStrategyPress={handleStrategyPress}
        renderStockResultItem={renderStockResultItem}
        bottomInset={space.xxl}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  quoteRow: {
    minHeight: size.row,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  quoteLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: space.md,
  },
  quoteRight: {
    alignItems: 'flex-end',
  },
});
