import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { strategyAPI } from '../services/api';

interface Strategy {
  name: string;
  scanClause: string;
  active: boolean;
}

export default function ScreenerScreen() {
  const router = useRouter();
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
            color={isSelected ? "#0f172a" : "#ffffff"} 
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
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Custom Navigation Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
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
                <ActivityIndicator size="small" color="#0f172a" />
                <Text style={styles.loadingText}>Loading Strategies...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerLoading}>
                <Ionicons name="alert-circle-outline" size={24} color="#f43f5e" />
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
              <ActivityIndicator size="large" color="#0f172a" />
              <Text style={styles.resultsStateText}>Scanning market for setups...</Text>
            </View>
          ) : scanError ? (
            <View style={styles.resultsPlaceholder}>
              <Ionicons name="alert-circle-outline" size={36} color="#f43f5e" />
              <Text style={styles.resultsErrorText}>{scanError}</Text>
            </View>
          ) : !selectedStrategy ? (
            <View style={styles.resultsPlaceholder}>
              <Ionicons name="trending-up-outline" size={40} color="#94a3b8" />
              <Text style={styles.resultsPlaceholderText}>
                Select a strategy card above to scan the live market.
              </Text>
            </View>
          ) : scanResults.length === 0 ? (
            <View style={styles.resultsPlaceholder}>
              <Ionicons name="filter-outline" size={40} color="#94a3b8" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introContainer: {
    marginVertical: 15,
  },
  subtext: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 20,
  },
  topSection: {
    paddingBottom: 5,
  },
  carouselContainer: {
    height: 140,
    justifyContent: 'center',
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  resultsSection: {
    flex: 1,
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  resultsLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  resultsStateText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  resultsPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultsPlaceholderText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  resultsErrorText: {
    fontSize: 13,
    color: '#f43f5e',
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsList: {
    gap: 10,
    paddingBottom: 20,
  },
  stockResultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  stockLeft: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  stockSymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.1,
  },
  stockCompany: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  marginBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  marginBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4f46e5',
    letterSpacing: 0.5,
  },
  stockRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stockPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  stockChange: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    paddingRight: 20,
    paddingVertical: 10,
    gap: 12,
  },
  strategyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    width: 170,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  selectedStrategyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#0f172a',
    borderWidth: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconCircle: {
    backgroundColor: '#0f172a',
  },
  strategyName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 18,
  },
  selectedStrategyName: {
    color: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 16,
  },
  stateText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
