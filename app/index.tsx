import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { angelOneApi } from '../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user, appLoading, login, logout } = useAuth() as any;
  const [marketData, setMarketData] = useState<any>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const refreshIntervalRef = useRef<any>(null);

  const fetchMarketStatus = async (showLoader = false) => {
    try {
      if (showLoader) setCardLoading(true);
      setError(null);

      const token = '99926033';
      const res = await angelOneApi.getLtp(token);

      // Axios response returns wrapped in res.data, backend returns { data: ... }
      const data = res.data?.data || res.data;
      if (data) {
        setMarketData(data);
      } else {
        setError('No data returned');
      }
    } catch (err: any) {
      console.error('Failed to fetch Market Status:', err);
      if (err.response?.status === 429) {
        setError('Rate limit hit. Auto-refresh paused.');
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      } else {
        setError('Failed to load status');
      }
    } finally {
      setCardLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Initial fetch with loader
      fetchMarketStatus(true);

      // Auto-refresh data silently every 30 seconds to mimic live updates
      refreshIntervalRef.current = setInterval(() => {
        fetchMarketStatus(false);
      }, 30000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }, [])
  );

  if (appLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      </SafeAreaView>
    );
  }

  const displayName = user?.name || user?.username || '';

  // Extract variables with fallback mock values to avoid crashes if API has an issue
  const ltp = marketData?.ltp || 0;
  const close = marketData?.close || marketData?.previousClose || ltp;
  const high = marketData?.high || 0;
  const low = marketData?.low || 0;
  const open = marketData?.open || 0;
  const symbol = marketData?.tradingSymbol || 'NIFTY';

  const change = ltp - close;
  const changePercent = close > 0 ? (change / close) * 100 : 0;
  const isBullish = change >= 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome{displayName ? ',' : ""}</Text>
            {displayName ? <Text style={styles.nameText}>{displayName}</Text> : null}
          </View>
          <TouchableOpacity
            style={[styles.profileButton, user?.profile ? styles.profileButtonWithImage : null]}
            onPress={() => setShowProfileMenu(true)}
            activeOpacity={0.7}
          >
            {user?.profile ? (
              <Image
                source={{ uri: user.profile }}
                style={styles.headerAvatar}
              />
            ) : (
              <Ionicons
                name={user ? "person-circle" : "person-circle-outline"}
                size={32}
                color={user ? "#4f46e5" : "#0f172a"}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Market Status Card */}
        {cardLoading && !marketData ? (
          <View style={[styles.card, styles.centeredCard]}>
            <ActivityIndicator size="small" color="#94a3b8" />
            <Text style={styles.loadingText}>Fetching Live Market Status...</Text>
          </View>
        ) : error && !marketData ? (
          <View style={[styles.card, styles.centeredCard]}>
            <Ionicons name="alert-circle-outline" size={24} color="#f43f5e" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchMarketStatus(true)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => fetchMarketStatus(true)} // Tap card to manually refresh
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="analytics-outline" size={18} color="#94a3b8" />
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
                <Text style={styles.indexPrice}>
                  {ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <View style={styles.changeContainer}>
                  <Ionicons
                    name={isBullish ? "caret-up" : "caret-down"}
                    size={16}
                    color={isBullish ? "#10b981" : "#f43f5e"}
                  />
                  <Text style={[styles.indexChange, { color: isBullish ? '#10b981' : '#f43f5e' }]}>
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
        )}

        {/* Screener Button */}
        <TouchableOpacity
          style={styles.screenerButton}
          activeOpacity={0.8}
          onPress={() => router.push('/screener')}
        >
          <View style={styles.screenerContent}>
            <Ionicons name="filter-outline" size={20} color="#ffffff" />
            <Text style={styles.screenerButtonText}>Screener</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Zerodha Dashboard Button/Card */}
        <TouchableOpacity
          style={styles.zerodhaButton}
          activeOpacity={0.8}
          onPress={() => router.push('/zerodha')}
        >
          <View style={styles.zerodhaContent}>
            <Ionicons name="pulse-outline" size={20} color="#ffffff" />
            <Text style={styles.zerodhaButtonText}>Zerodha Dashboard</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Calculator Button/Card */}
        <TouchableOpacity
          style={styles.calculatorButton}
          activeOpacity={0.8}
          onPress={() => router.push('/calculator')}
        >
          <View style={styles.calculatorContent}>
            <Ionicons name="calculator-outline" size={20} color="#ffffff" />
            <Text style={styles.calculatorButtonText}>Calculator</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Side Menu Drawer overlay (Matching Screener Screen Layout!) */}
      {showProfileMenu && (
        <View style={styles.sideMenuOverlay}>
          {/* Backdrop click dismiss */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowProfileMenu(false)}
          />

          {/* Drawer Panel */}
          <View style={styles.drawerPanel}>
            {/* Custom Navigation Header (Same style as Screener Screen!) */}
            <View style={styles.drawerHeader}>
              <TouchableOpacity style={styles.drawerBackButton} onPress={() => setShowProfileMenu(false)}>
                <Ionicons name="arrow-back" size={24} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.drawerHeaderTitle}>Profile</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Drawer Body (Same style as Screener Screen!) */}
            <View style={styles.drawerBody}>
              {user ? (
                <View style={styles.profileDetailsCard}>
                  <View style={styles.avatarCircle}>
                    {user.profile ? (
                      <Image
                        source={{ uri: user.profile }}
                        style={styles.drawerAvatar}
                      />
                    ) : (
                      <Ionicons name="person" size={36} color="#4f46e5" />
                    )}
                  </View>
                  <Text style={styles.profileLabel}>Logged In As</Text>
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {user.name || user.email || user.mobile || user.username || 'User'}
                  </Text>
                  <View style={styles.profileDivider} />

                  <TouchableOpacity
                    style={styles.drawerSettingsButton}
                    onPress={() => {
                      setShowProfileMenu(false);
                      router.push('/settings');
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="settings-outline" size={18} color="#ffffff" />
                    <Text style={styles.settingsButtonText}>Settings</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerLogoutButton}
                    onPress={async () => {
                      await logout();
                      setShowProfileMenu(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#ffffff" />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.profileDetailsCard}>
                  <View style={styles.avatarCircleGray}>
                    <Ionicons name="person-outline" size={36} color="#94a3b8" />
                  </View>
                  <Text style={styles.profileLabel}>Account Status</Text>
                  <Text style={styles.profileEmail}>Not logged in</Text>
                  <Text style={styles.profileSubtext}>
                    Log in to unlock custom algorithmic strategies, live market status metrics, and portfolio integrations.
                  </Text>
                  <View style={styles.profileDivider} />

                  <TouchableOpacity
                    style={styles.drawerLoginButton}
                    onPress={() => {
                      setShowProfileMenu(false);
                      router.push('/login');
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="log-in-outline" size={18} color="#ffffff" />
                    <Text style={styles.loginButtonText}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc', // Ultra modern light blue-gray background
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b', // Modern slate gray
    fontWeight: '500',
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  profileButton: {
    padding: 4,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
  },
  // Card Styles
  card: {
    backgroundColor: '#0f172a', // Premium dark slate card for amazing contrast
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  centeredCard: {
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    gap: 4,
  },
  bullishBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  bearishBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bullishDot: {
    backgroundColor: '#10b981',
  },
  bearishDot: {
    backgroundColor: '#f43f5e',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bullishBadgeText: {
    color: '#10b981',
  },
  bearishBadgeText: {
    color: '#f43f5e',
  },
  cardBody: {
    marginBottom: 20,
  },
  indexName: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  indexPrice: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  indexChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerCol: {
    alignItems: 'flex-start',
  },
  footerLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  footerVal: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  screenerButton: {
    backgroundColor: '#0f172a', // Deep black/slate to match market card
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  screenerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  screenerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  zerodhaButton: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  zerodhaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zerodhaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  calculatorButton: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  calculatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calculatorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sideMenuOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 99999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  drawerPanel: {
    width: '80%',
    height: '100%',
    backgroundColor: '#f8fafc',
    shadowColor: '#0f172a',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  drawerHeader: {
    paddingTop: 35,
    height: 95,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  drawerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  drawerHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  drawerBody: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  profileDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarCircleGray: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileSubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
    marginVertical: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  drawerLoginButton: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  drawerSettingsButton: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  drawerLogoutButton: {
    backgroundColor: '#f43f5e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileButtonWithImage: {
    padding: 0,
    overflow: 'hidden',
  },
  drawerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
});
