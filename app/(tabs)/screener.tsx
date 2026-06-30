import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
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

  // Scan Results State
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Dropdown visibility state
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Scan results persist across tab switches and chart drill-downs — the page is
  // kept as the user left it (Groww-style); a new scan only happens when the
  // user picks a strategy.

  const handleStrategyPress = async (strategyName: string) => {
    setSelectedStrategy(strategyName);
    setDropdownVisible(false); // close dropdown modal
    setScanLoading(true);
    setScanError(null);
    setScanResults([]);

    try {
      const res = await strategyAPI.fetchWithMargin(strategyName);
      const payload = res.data?.data || res.data;
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
  };



  // Helper to determine strategy visual details
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

  const renderStockResultItem = ({ item }: { item: any }) => {
    const symbol = item.symbol || item.nsecode || item.nseCode || item.stockName || item.name || 'N/A';
    const companyName = item.name || item.companyName || item.stockDescription || '';

    // Parse price safely
    const rawPrice = item.ltp || item.close || item.lastPrice || item.price;
    let priceText = '—';
    if (typeof rawPrice === 'number') {
      priceText = `₹${rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (rawPrice) {
      priceText = `₹${rawPrice}`;
    }

    // Parse margin value
    const rawMargin = item.margin || item.leverage || item.marginAllowed || '';
    const marginStr = rawMargin.toString().trim();
    const hasMargin = marginStr &&
      marginStr !== '0' &&
      marginStr !== '0%' &&
      marginStr !== '0.0%' &&
      marginStr !== '0.0' &&
      marginStr.toLowerCase() !== '1x';

    return (
      <TouchableOpacity
        style={styles.stockResultCard}
        activeOpacity={0.7}
        onPress={() => {
          if (symbol !== 'N/A') {
            router.push(`/chartPage?symbol=${encodeURIComponent(symbol)}`);
          }
        }}
      >
        <View style={styles.stockLeft}>
          <View style={styles.stockHeader}>
            <Text style={styles.stockSymbol} numberOfLines={1}>{symbol}</Text>
            {hasMargin ? (
              <View style={styles.marginBadgeSmall}>
                <Text style={styles.marginBadgeSmallText}>{marginStr.toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
          {companyName ? <Text style={styles.stockCompany} numberOfLines={1}>{companyName}</Text> : null}
        </View>
        <View style={styles.stockRight}>
          <View style={styles.stockPriceContainer}>
            <Text style={styles.stockPrice}>{priceText}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStockSkeletons = () => (
    <View style={styles.skeletonRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.stockLeft}>
            <View style={styles.skeletonTextSymbol} />
            <View style={styles.skeletonTextDesc} />
          </View>
          <View style={styles.stockRight}>
            <View style={styles.stockPriceContainer}>
              <View style={styles.skeletonPrice} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // Retrieve active metadata for trigger display
  const activeMetadata = selectedStrategy ? getStrategyMetadata(selectedStrategy) : null;

  return (
    <View style={[styles.safeArea, layout.screenPadding]}>


      <View style={[
        styles.container,
        layout.centeredContent,
        { paddingHorizontal: layout.horizontalPadding },
      ]}>
        {/* Intro */}
        <View style={styles.topSection}>
          <View style={styles.introContainer}>
          </View>

          {/* Strategy Carousel Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Strategy</Text>
          </View>

          {/* Dropdown Select Box Trigger */}
          {(() => {
            if (loadingStrategies) {
              return (
            <View style={styles.dropdownTrigger}>
              <View style={styles.dropdownLeft}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.dropdownPlaceholder}>Loading strategies...</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={theme.iconMuted} />
            </View>
              );
            }
            if (strategiesError) {
              return (
            <TouchableOpacity
              style={[styles.dropdownTrigger, { borderColor: theme.danger }]}
              onPress={refreshStrategies}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownLeft}>
                <Ionicons name="alert-circle" size={20} color={theme.danger} />
                <Text style={[styles.dropdownPlaceholder, { color: theme.danger }]}>Failed to load. Tap to retry.</Text>
              </View>
              <Ionicons name="refresh" size={16} color={theme.danger} />
            </TouchableOpacity>
              );
            }
            return (
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                selectedStrategy && styles.selectedDropdownTrigger
              ]}
              onPress={() => {
                setDropdownVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownLeft}>
                {selectedStrategy && activeMetadata ? (
                  <>
                    <View style={[styles.iconCircleSmall, styles.selectedIconCircleSmall]}>
                      <Ionicons name={activeMetadata.iconName} size={14} color="#ffffff" />
                    </View>
                    <Text style={styles.selectedDropdownTriggerText} numberOfLines={1}>
                      {selectedStrategy}
                    </Text>
                    <Text style={[styles.dropdownTriggerInterval, styles.selectedDropdownTriggerInterval]}>
                      {activeMetadata.badgeText}
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.iconCircleSmall}>
                      <Ionicons name="funnel-outline" size={14} color={theme.textSecondary} />
                    </View>
                    <Text style={styles.dropdownPlaceholder}>
                      Select a scanning strategy...
                    </Text>
                  </>
                )}
              </View>
              <Ionicons
                name="chevron-down"
                size={18}
                color={selectedStrategy ? theme.primary : theme.iconMuted}
              />
            </TouchableOpacity>
            );
          })()}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

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
