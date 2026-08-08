import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, ActivityIndicator, Chip, Surface, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStrategies } from '../../context/StrategyContext';
import { useTheme } from '../../context/ThemeContext';
import { strategyAPI } from '../../services/api';
import { useAdaptiveLayout } from '../../theme/layout';
import { useScreenerStyles } from '../../theme/screenerStyles';
import ScreenerResults from '../../components/screener/ScreenerResults';
import StrategyModal from '../../components/screener/StrategyModal';

export default function ScreenerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { isDarkMode, theme } = useTheme();
  const styles = useScreenerStyles(isDarkMode);

  const {
    strategies,
    loadingStrategies,
    strategiesError,
    refreshStrategies,
  } = useStrategies();

  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleStrategyPress = useCallback(async (strategyName: string) => {
    setSelectedStrategy(strategyName);
    setDropdownVisible(false);
    setScanLoading(true);
    setScanError(null);
    setScanResults([]);

    try {
      const res = await strategyAPI.fetchWithMargin(strategyName);
      const payload = res.data.data;
      if (Array.isArray(payload)) {
        setScanResults(payload);
      } else {
        setScanError('No data found for this strategy');
      }
    } catch (err: any) {
      console.error('Failed to fetch scanner results:', err);
      setScanError('Connection issue. Please try again.');
    } finally {
      setScanLoading(false);
    }
  }, []);

  const getStrategyMetadata = (name: string) => {
    const lowerName = name.toLowerCase();
    let iconName: keyof typeof Ionicons.glyphMap = "bar-chart-outline";
    let badgeText = "SCAN";

    if (lowerName.includes('rsi')) {
      iconName = "analytics-outline";
      badgeText = "RSI";
    } else if (lowerName.includes('macd')) {
      iconName = "git-compare-outline";
      badgeText = "MACD";
    }

    if (lowerName.includes('15')) {
      badgeText += " 15M";
    } else if (lowerName.includes('5')) {
      badgeText += " 5M";
    }

    return { iconName, badgeText };
  };

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
            <ActivityIndicator size="small" color={theme.primary} />
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const activeMetadata = selectedStrategy ? getStrategyMetadata(selectedStrategy) : null;

  return (
    <View style={[styles.safeArea, layout.screenPadding]}>
      <View style={[styles.container, layout.centeredContent, { paddingHorizontal: layout.horizontalPadding }]}>
        <View style={styles.topSection}>
          <View style={{ marginBottom: 8 }}>
            <PaperText variant="titleMedium" style={{ color: theme.textPrimary, fontWeight: '800' }}>
              Select Strategy
            </PaperText>
          </View>

          {/* Dropdown Select Box Trigger */}
          {(() => {
            if (loadingStrategies) {
              return (
                <Card style={{ backgroundColor: theme.card, borderRadius: 16 }}>
                  <Card.Content style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <PaperText style={{ marginLeft: 8, color: theme.textSecondary }}>Loading strategies...</PaperText>
                  </Card.Content>
                </Card>
              );
            }
            if (strategiesError) {
              return (
                <Card style={{ backgroundColor: theme.card, borderRadius: 16, borderColor: theme.danger, borderWidth: 1 }} onPress={refreshStrategies}>
                  <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="alert-circle" size={20} color={theme.danger} />
                      <PaperText style={{ marginLeft: 8, color: theme.danger, fontWeight: '700' }}>Failed to load. Tap to retry.</PaperText>
                    </View>
                    <Ionicons name="refresh" size={16} color={theme.danger} />
                  </Card.Content>
                </Card>
              );
            }
            return (
              <Card
                style={{
                  backgroundColor: theme.card,
                  borderRadius: 16,
                  borderColor: selectedStrategy ? theme.primary : theme.border,
                  borderWidth: 1,
                  elevation: 2,
                }}
                onPress={() => setDropdownVisible(true)}
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
                        <Chip compact textStyle={{ fontSize: 10, fontWeight: '800', color: theme.primary }} style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                          {activeMetadata.badgeText}
                        </Chip>
                      </View>
                    ) : (
                      <PaperText variant="bodyMedium" style={{ color: theme.textSecondary, fontWeight: '600' }}>
                        Select a scanning strategy...
                      </PaperText>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={18} color={theme.iconMuted} />
                </Card.Content>
              </Card>
            );
          })()}
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 16 }} />

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

      {/* Dropdown Menu Modal */}
      <StrategyModal
        styles={styles}
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
}
