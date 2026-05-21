import { Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useScreenerStyles } from '../theme/screenerStyles';
import { strategyAPI } from '../services/api';
import { getSafeBottomPadding } from '../theme/safeArea';

interface Strategy {
  name: string;
  scanClause: string;
  active: boolean;
}

export default function ScreenerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, theme } = useTheme();
  const styles = useScreenerStyles(isDarkMode);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scan Results State
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      fetchStrategies();
    }, [])
  );

  const handleStrategyPress = async (strategyName: string) => {
    setSelectedStrategy(strategyName);
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

  const renderStrategyItem = ({ item }: { item: Strategy }) => {
    const isSelected = selectedStrategy === item.name;
    return (
      <TouchableOpacity 
        style={[
          styles.strategyCard,
          isSelected && styles.selectedStrategyCard
        ]}
        activeOpacity={0.85}
        onPress={() => handleStrategyPress(item.name)}
      >
        <View style={[
          styles.iconCircle,
          isSelected && styles.selectedIconCircle
        ]}>
          <Ionicons 
            name="git-branch-outline" 
            size={20} 
            color={isSelected ? theme.background : theme.textPrimary} 
          />
        </View>
        <Text 
          style={[
            styles.strategyName,
            isSelected && styles.selectedStrategyName
          ]} 
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStockResultItem = ({ item }: { item: any }) => {
    // Support robust matching for flexible backend payloads
    const symbol = item.symbol || item.nsecode || item.nseCode || item.stockName || item.name || 'N/A';
    const companyName = item.name || item.companyName || item.stockDescription || '';
    
    // Parse price safely
    const rawPrice = item.ltp || item.close || item.lastPrice || item.price;
    const priceText = typeof rawPrice === 'number' 
      ? `₹${rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
      : rawPrice ? `₹${rawPrice}` : '—';

    // Parse change percent
    const rawChange = item.changePercent || item.percentChange || item.change || 0;
    const changeVal = typeof rawChange === 'number' ? rawChange : parseFloat(rawChange) || 0;
    const isPositive = changeVal >= 0;
    const changeText = isPositive ? `+${changeVal.toFixed(2)}%` : `${changeVal.toFixed(2)}%`;

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
      <View style={styles.stockResultCard}>
        <View style={styles.stockLeft}>
          <Text style={styles.stockSymbol} numberOfLines={1}>{symbol}</Text>
          {companyName ? <Text style={styles.stockCompany} numberOfLines={1}>{companyName}</Text> : null}
          {hasMargin ? (
            <View style={styles.marginBadge}>
              <Text style={styles.marginBadgeText}>{marginStr.toUpperCase()} MARGIN</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.stockRight}>
          <Text style={styles.stockPrice}>{priceText}</Text>
          <Text style={[styles.stockChange, { color: isPositive ? theme.success : theme.danger }]}>
            {changeText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: getSafeBottomPadding(insets.bottom) }]}>
      {/* Custom Navigation Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screener</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        {/* Top Section: Subtitle & Horizontal Carousel */}
        <View style={styles.topSection}>
          <View style={styles.introContainer}>
            <Text style={styles.subtext}>
              Monitor and review algorithmic scanning equations for high-probability setups.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Strategies</Text>
          </View>

          <View style={styles.carouselContainer}>
            {loading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={theme.textPrimary} />
                <Text style={styles.loadingText}>Loading Strategies...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerLoading}>
                <Ionicons name="alert-circle-outline" size={24} color={theme.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <FlatList
                data={strategies}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => item.name + index}
                renderItem={renderStrategyItem}
                contentContainerStyle={styles.listContainer}
                snapToInterval={182} // 170 width + 12 gap
                decelerationRate="fast"
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No strategies found.</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>

        {/* Slate Divider */}
        <View style={styles.divider} />

        {/* Bottom Section: Scan Results List */}
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            {selectedStrategy ? `Scan Results: ${selectedStrategy}` : 'Scan Results'}
          </Text>

          {scanLoading ? (
            <View style={styles.resultsLoading}>
              <ActivityIndicator size="large" color={theme.textPrimary} />
              <Text style={styles.resultsStateText}>Scanning market for setups...</Text>
            </View>
          ) : scanError ? (
            <View style={styles.resultsPlaceholder}>
              <Ionicons name="alert-circle-outline" size={36} color={theme.danger} />
              <Text style={styles.resultsErrorText}>{scanError}</Text>
            </View>
          ) : !selectedStrategy ? (
            <View style={styles.resultsPlaceholder}>
              <Ionicons name="trending-up-outline" size={40} color={theme.iconMuted} />
              <Text style={styles.resultsPlaceholderText}>
                Select a strategy card above to scan the live market.
              </Text>
            </View>
          ) : scanResults.length === 0 ? (
            <View style={styles.resultsPlaceholder}>
              <Ionicons name="filter-outline" size={40} color={theme.iconMuted} />
              <Text style={styles.resultsPlaceholderText}>
                No stocks currently matching this scan criteria.
              </Text>
            </View>
          ) : (
            <FlatList
              data={scanResults}
              keyExtractor={(item, index) => (item.symbol || item.nsecode || item.name || index.toString()) + index}
              renderItem={renderStockResultItem}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </View>
  );
}


