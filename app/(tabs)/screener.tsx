import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { strategyAPI } from '../../services/api';
import { useAdaptiveLayout } from '../../theme/layout';
import { useScreenerStyles } from '../../theme/screenerStyles';

interface Strategy {
  name: string;
  scanClause: string;
  active: boolean;
}

export default function ScreenerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { isDarkMode, theme } = useTheme();
  const styles = useScreenerStyles(isDarkMode);

  // Strategies list states
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scan Results State
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Dropdown visibility state
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await strategyAPI.getStrategies();
      const payload = res.data?.data || res.data;
      if (Array.isArray(payload)) {
        setStrategies(payload);
      } else {
        setError('Invalid response structure');
      }
    } catch (err: any) {
      console.error('Failed to load strategies:', err);
      setError('Failed to fetch strategies');
    } finally {
      setLoading(false);
    }
  };

  const isNavigatingToChart = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (isNavigatingToChart.current) {
        // We are returning from the chart page, do not clear data.
        isNavigatingToChart.current = false;
        return;
      }
      // Initial load or returning from a different tab
      fetchStrategies();
      setScanResults([]);
      setSelectedStrategy(null);
      setScanError(null);
    }, [])
  );

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

  const handleRefreshActiveScan = async () => {
    if (!selectedStrategy) {
      fetchStrategies();
      return;
    }

    setScanLoading(true);
    setScanError(null);
    try {
      const res = await strategyAPI.fetchWithMargin(selectedStrategy);
      const payload = res.data?.data || res.data;
      if (Array.isArray(payload)) {
        setScanResults(payload);
      } else {
        setScanError('No data found for this strategy');
      }
    } catch (err: any) {
      console.error('Failed to refresh scanner results:', err);
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
    const priceText = typeof rawPrice === 'number'
      ? `₹${rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : rawPrice ? `₹${rawPrice}` : '—';

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
            isNavigatingToChart.current = true;
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
          {loading ? (
            <View style={styles.dropdownTrigger}>
              <View style={styles.dropdownLeft}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.dropdownPlaceholder}>Loading strategies...</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={theme.iconMuted} />
            </View>
          ) : error ? (
            <TouchableOpacity
              style={[styles.dropdownTrigger, { borderColor: theme.danger }]}
              onPress={fetchStrategies}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownLeft}>
                <Ionicons name="alert-circle" size={20} color={theme.danger} />
                <Text style={[styles.dropdownPlaceholder, { color: theme.danger }]}>Failed to load. Tap to retry.</Text>
              </View>
              <Ionicons name="refresh" size={16} color={theme.danger} />
            </TouchableOpacity>
          ) : (
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
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Scan Results Area */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeaderRow}>
            <Text style={styles.resultsTitle}>
              {selectedStrategy ? `Scan results: ${selectedStrategy}` : 'Scan Results'}
            </Text>
          </View>

          {scanLoading ? (
            renderStockSkeletons()
          ) : scanError ? (
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
          ) : !selectedStrategy ? (
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyStateIconWrapper, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="search-outline" size={32} color={theme.primary} />
              </View>
              <Text style={styles.emptyStateTitle}>Ready to Scan</Text>
              <Text style={styles.emptyStateSubtext}>
                Select a strategy above to query the market and find your next setup.
              </Text>
            </View>
          ) : scanResults.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyStateIconWrapper, { backgroundColor: theme.borderLight }]}>
                <Ionicons name="filter-outline" size={32} color={theme.iconMuted} />
              </View>
              <Text style={styles.emptyStateTitle}>No Matches Found</Text>
              <Text style={styles.emptyStateSubtext}>
                No stocks currently match the {selectedStrategy} criteria.
              </Text>
            </View>
          ) : (
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
          )}
        </View>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View
            style={styles.dropdownMenuCard}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.dropdownMenuHeader}>
              <Text style={styles.dropdownMenuTitle}>Select Strategy</Text>
              <TouchableOpacity
                style={styles.dropdownCloseBtn}
                onPress={() => setDropdownVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dropdownOptionsList}>
              {strategies.map((item, index) => {
                const isSelected = selectedStrategy === item.name;
                const metadata = getStrategyMetadata(item.name);
                return (
                  <TouchableOpacity
                    key={item.name + index}
                    style={[
                      styles.dropdownOptionRow,
                      isSelected && styles.selectedDropdownOptionRow
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleStrategyPress(item.name)}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[
                        styles.iconCircleSmall,
                        isSelected && styles.selectedIconCircleSmall
                      ]}>
                        <Ionicons
                          name={metadata.iconName}
                          size={14}
                          color={isSelected ? '#ffffff' : theme.textSecondary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.optionNameText,
                          isSelected && styles.selectedOptionNameText
                        ]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[
                          styles.optionIntervalText,
                          isSelected && styles.selectedOptionIntervalText
                        ]}>
                          {metadata.badgeText}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
