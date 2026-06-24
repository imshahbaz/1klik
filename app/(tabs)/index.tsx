import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { angelOneApi } from '../../services/api';
import { useIndexStyles } from '../../theme/globalStyles';
import { useAdaptiveLayout } from '../../theme/layout';
import { getSafeBottomPadding } from '../../theme/safeArea';
import MarketStatusCard from '../../components/home/MarketStatusCard';
import ProfileMenu from '../../components/home/ProfileMenu';

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
          { paddingHorizontal: layout.horizontalPadding, paddingBottom: layout.tabBarHeight + 24 },
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
        <MarketStatusCard
          styles={styles}
          theme={theme}
          cardLoading={cardLoading}
          marketData={marketData}
          error={error}
          fetchMarketStatus={fetchMarketStatus}
          isBullish={isBullish}
          symbol={symbol}
          ltp={ltp}
          change={change}
          changePercent={changePercent}
          open={open}
          high={high}
          low={low}
        />

        {/* Quick Actions Section */}
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginTop: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 }}>
          {/* Quick Actions Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '800' }}>Quick Actions</Text>
          </View>

          {/* Quick Actions Grid */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={{ alignItems: 'center', flex: 1 }} onPress={() => router.push('/screener')} activeOpacity={0.7}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(59, 130, 246, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="filter" size={30} color={theme.primary || '#3b82f6'} />
              </View>
              <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>Screener</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: 'center', flex: 1 }} onPress={() => {
              if (!user) {
                router.push('/login');
              } else {
                router.push('/trade');
              }
            }} activeOpacity={0.7}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(16, 185, 129, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="pulse" size={30} color={theme.success || '#10b981'} />
              </View>
              <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>Trade</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: 'center', flex: 1 }} onPress={() => router.push('/calculator')} activeOpacity={0.7}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(245, 158, 11, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="calculator" size={30} color="#f59e0b" />
              </View>
              <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>Calculator</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Side Menu Drawer overlay (Matching Screener Screen Layout!) */}
      <ProfileMenu
        styles={styles}
        theme={theme}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        user={user}
        logout={logout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        router={router}
      />
    </View>
  );
}
