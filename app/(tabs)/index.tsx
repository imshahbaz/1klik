import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { angelOneApi } from '../../services/api';
import { useIndexStyles } from '../../theme/globalStyles';
import { useAdaptiveLayout } from '../../theme/layout';
import { getSafeBottomPadding } from '../../theme/safeArea';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { user, appLoading, logout } = useAuth() as any;
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const styles = useIndexStyles(isDarkMode);
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
      if (appLoading) return;

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
    }, [appLoading])
  );

  if (appLoading) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: getSafeBottomPadding(insets.bottom) }]}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={theme.textPrimary} />
        </View>
      </View>
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
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: getSafeBottomPadding(insets.bottom) }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.homeScrollContent,
          layout.centeredContent,
          { paddingHorizontal: layout.horizontalPadding },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.welcomeText}>Welcome{displayName ? ',' : ""}</Text>
            {displayName ? <Text style={styles.nameText} numberOfLines={1} adjustsFontSizeToFit>{displayName}</Text> : null}
          </View>
          <TouchableOpacity
            style={[styles.profileButton, user?.profile ? styles.profileButtonWithImage : null]}
            onPress={() => setShowProfileMenu(true)}
            activeOpacity={0.7}
          >
            {user?.profile ? (
              <Image
                source={{ uri: user.profile }}
                contentFit="cover"
                transition={120}
                style={styles.headerAvatar}
              />
            ) : (
              <Ionicons
                name={user ? "person-circle" : "person-circle-outline"}
                size={32}
                color={user ? theme.secondary : theme.textPrimary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Market Status Card */}
        {cardLoading && !marketData ? (
          <View style={[styles.card, styles.centeredCard]}>
            <ActivityIndicator size="small" color={theme.iconMuted} />
            <Text style={styles.loadingText}>Fetching Live Market Status...</Text>
          </View>
        ) : error && !marketData ? (
          <View style={[styles.card, styles.centeredCard]}>
            <Ionicons name="alert-circle-outline" size={24} color={theme.danger} />
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
        )}

        {/* Quick Actions Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '800' }}>Quick Actions</Text>
        </View>

        {/* Quick Actions Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingRight: 20 }}
          style={{ marginHorizontal: -layout.horizontalPadding, paddingHorizontal: layout.horizontalPadding }}
        >
          <TouchableOpacity
            style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, width: 140, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}
            activeOpacity={0.8}
            onPress={() => router.push('/screener')}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="filter" size={22} color={theme.primary || '#3b82f6'} />
            </View>
            <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>Screener</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Live market scans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, width: 140, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}
            activeOpacity={0.8}
            onPress={() => router.push('/zerodha')}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="pulse" size={22} color={theme.success || '#10b981'} />
            </View>
            <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>Trade</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Auto algorithms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, width: 140, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}
            activeOpacity={0.8}
            onPress={() => router.push('/calculator')}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="calculator" size={22} color="#f59e0b" />
            </View>
            <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>Calculator</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>MTF Leverage</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>

      {/* Side Menu Drawer overlay (Matching Screener Screen Layout!) */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowProfileMenu(false)}
      >
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
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
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
                        contentFit="cover"
                        transition={120}
                        style={styles.drawerAvatar}
                      />
                    ) : (
                      <Ionicons name="person" size={36} color={theme.secondary} />
                    )}
                  </View>
                  <Text style={styles.profileLabel}>Logged In As</Text>
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {user.name || user.email || user.mobile || user.username || 'User'}
                  </Text>
                  <View style={styles.profileDivider} />

                  <View style={styles.themeToggleRow}>
                    <Text style={styles.themeToggleLabel}>Dark Mode</Text>
                    <Switch
                      value={isDarkMode}
                      onValueChange={toggleTheme}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor={theme.card}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.drawerSettingsButton}
                    onPress={() => {
                      setShowProfileMenu(false);
                      router.push('/settings');
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="settings-outline" size={18} color={theme.textPrimary} />
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
                    <Ionicons name="person-outline" size={36} color={theme.iconMuted} />
                  </View>
                  <Text style={styles.profileLabel}>Account Status</Text>
                  <Text style={styles.profileEmail}>Not logged in</Text>
                  <Text style={styles.profileSubtext}>
                    Log in to unlock custom algorithmic strategies, live market status metrics, and portfolio integrations.
                  </Text>
                  <View style={styles.profileDivider} />

                  <View style={styles.themeToggleRow}>
                    <Text style={styles.themeToggleLabel}>Dark Mode</Text>
                    <Switch
                      value={isDarkMode}
                      onValueChange={toggleTheme}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor={theme.card}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.drawerLoginButton}
                    onPress={() => {
                      setShowProfileMenu(false);
                      router.push('/login');
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="log-in-outline" size={18} color={theme.darkCardText} />
                    <Text style={styles.loginButtonText}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
