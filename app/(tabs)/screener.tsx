import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, ActivityIndicator, Chip, Surface, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { strategyAPI } from '../../services/api';
import { useScreenerStyles } from '../../theme/screenerStyles';
import { useAdaptiveLayout } from '../../theme/layout';
import { useTheme } from '../../context/ThemeContext';
import { getSafeBottomPadding } from '../../theme/safeArea';
import StrategyModal from '../../components/screener/StrategyModal';
import ScreenerResults from '../../components/screener/ScreenerResults';

const STRATEGY_ICONS: Record<string, { iconName: any; badgeText: string }> = {
  RSI15MIN: { iconName: 'flash-outline', badgeText: '15 MIN SCAN' },
  DAILY: { iconName: 'calendar-outline', badgeText: 'DAILY SCAN' },
  SWING: { iconName: 'trending-up-outline', badgeText: 'SWING SCAN' },
  WEEKLY: { iconName: 'time-outline', badgeText: 'WEEKLY SCAN' },
  MONTHLY: { iconName: 'analytics-outline', badgeText: 'MONTHLY SCAN' },
};

export default function ScreenerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { isDarkMode, theme } = useTheme();
  const styles = useScreenerStyles(isDarkMode);

  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

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
    setDropdownVisible(false);
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

  const renderStockResultItem = useCallback(({ item }: { item: any }) => {
    const symbol = item.symbol || item.nsecode || item.nseCode || item.stockName || item.name || 'N/A';
    const companyName = item.name || item.companyName || item.stockDescription || '';

    const rawPrice = item.ltp || item.close || item.lastPrice || item.price;
    let priceText = '—';
    if (typeof rawPrice === 'number') {
      priceText = `₹${rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (rawPrice) {
      priceText = `₹${rawPrice}`;
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
      <Card
        style={{ backgroundColor: theme.card, borderRadius: 16, marginBottom: 8, elevation: 2 }}
        onPress={() => {
          if (symbol !== 'N/A') {
            router.push(`/chartPage?symbol=${encodeURIComponent(symbol)}`);
          }
        }}
      >
        <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
                {symbol}
              </PaperText>
              <Chip compact style={{ backgroundColor: theme.primaryBackground }} textStyle={{ color: theme.primary, fontSize: 10, fontWeight: '800' }}>
                {marginStr.toUpperCase()}
              </Chip>
            </View>
            {companyName ? (
              <PaperText variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {companyName}
              </PaperText>
            ) : null}
          </View>

          <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
            {priceText}
          </PaperText>
        </Card.Content>
      </Card>
    );
  }, [theme, router]);

  const renderStockSkeletons = () => (
    <View style={styles.skeletonRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} style={{ backgroundColor: theme.card, borderRadius: 16, marginBottom: 8, height: 60, opacity: 0.6 }}>
          <Card.Content style={{ justifyContent: 'center', flex: 1 }}>
            <View style={{ width: '40%', height: 16, backgroundColor: theme.borderLight, borderRadius: 4 }} />
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const activeMetadata = selectedStrategy ? getStrategyMetadata(selectedStrategy) : null;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: getSafeBottomPadding(insets.bottom) }]}>
      <View style={[styles.container, layout.centeredContent, { paddingHorizontal: layout.horizontalPadding }]}>
        {/* Title */}
        <View style={{ marginVertical: 8 }}>
          <PaperText variant="headlineMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
            Screener
          </PaperText>
          <PaperText variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 4 }}>
            Scan markets with automated quantitative strategies
          </PaperText>
        </View>

        {/* Strategy Selector Container + Floating Dropdown Overlay */}
        <View style={{ zIndex: 1000, marginVertical: 12 }}>
          {(() => {
            if (strategiesLoading) {
              return (
                <Card style={{ backgroundColor: theme.card, borderRadius: 16, padding: 12 }}>
                  <Card.Content style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <PaperText variant="bodyMedium" style={{ color: theme.textSecondary }}>Loading strategies...</PaperText>
                  </Card.Content>
                </Card>
              );
            }
            if (strategiesError) {
              return (
                <Card style={{ backgroundColor: theme.card, borderRadius: 16, padding: 12 }} onPress={fetchStrategies}>
                  <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <PaperText variant="bodyMedium" style={{ color: theme.danger }}>{strategiesError}</PaperText>
                    <Ionicons name="refresh" size={16} color={theme.danger} />
                  </Card.Content>
                </Card>
              );
            }
            return (
              <View style={{ zIndex: 1000, position: 'relative' }}>
                <Card
                  style={{
                    backgroundColor: theme.card,
                    borderRadius: 16,
                    borderColor: selectedStrategy ? theme.primary : theme.border,
                    borderWidth: 1,
                    elevation: 2,
                  }}
                  onPress={() => setDropdownVisible(!dropdownVisible)}
                >
                  <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <Surface style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primaryBackground, alignItems: 'center', justifyContent: 'center' }} elevation={0}>
                        <Ionicons name={activeMetadata ? activeMetadata.iconName : "funnel-outline"} size={16} color={theme.primary} />
                      </Surface>
                      {selectedStrategy && activeMetadata ? (
                        <View style={{ flex: 1 }}>
                          <PaperText variant="titleSmall" style={{ color: theme.textPrimary, fontWeight: '800' }} numberOfLines={1}>
                            {selectedStrategy}
                          </PaperText>
                        </View>
                      ) : (
                        <PaperText variant="bodyMedium" style={{ color: theme.textSecondary, fontWeight: '600' }}>
                          Select a scanning strategy...
                        </PaperText>
                      )}
                    </View>
                    <Ionicons name={dropdownVisible ? "chevron-up" : "chevron-down"} size={18} color={theme.iconMuted} />
                  </Card.Content>
                </Card>

                {/* Attached Inline Dropdown Menu */}
                <StrategyModal
                  theme={theme}
                  dropdownVisible={dropdownVisible}
                  setDropdownVisible={setDropdownVisible}
                  strategies={strategies}
                  selectedStrategy={selectedStrategy}
                  handleStrategyPress={handleStrategyPress}
                  getStrategyMetadata={getStrategyMetadata}
                />
              </View>
            );
          })()}
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 12 }} />

        {/* Scan Results Area */}
        <ScreenerResults
          styles={styles}
          theme={theme}
          layout={layout}
          selectedStrategy={selectedStrategy}
          scanLoading={scanLoading}
          scanError={scanError}
          scanResults={scanResults}
          renderStockSkeletons={renderStockSkeletons}
          handleStrategyPress={handleStrategyPress}
          renderStockResultItem={renderStockResultItem}
        />
      </View>
    </View>
  );
}
