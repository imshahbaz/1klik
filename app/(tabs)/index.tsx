import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Card, Text as PaperText, ActivityIndicator, Avatar, TouchableRipple } from 'react-native-paper';
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
  const { user, appLoading, logout } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const styles = useIndexStyles(isDarkMode);
  const [marketData, setMarketData] = useState<any>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMarketStatus = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setCardLoading(true);
      setError(null);

      const token = '99926033';
      const res = await angelOneApi.getLtp(token);
      const data = res.data.data;
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (appLoading) return;
      fetchMarketStatus(true);
      refreshIntervalRef.current = setInterval(() => {
        fetchMarketStatus(false);
      }, 30000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }, [appLoading, fetchMarketStatus])
  );

  if (appLoading) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: getSafeBottomPadding(insets.bottom) }]}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  const displayName = user?.name || user?.username || '';
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
            <PaperText variant="titleMedium" style={{ color: theme.textSecondary, fontWeight: '600' }}>
              Welcome{displayName ? ',' : ""}
            </PaperText>
            {displayName ? (
              <PaperText variant="headlineSmall" style={{ color: theme.textPrimary, fontWeight: '800' }} numberOfLines={1}>
                {displayName}
              </PaperText>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.profileButton, user?.profile ? styles.profileButtonWithImage : null]}
            onPress={() => setShowProfileMenu(true)}
            activeOpacity={0.7}
          >
            {user?.profile ? (
              <Avatar.Image size={40} source={{ uri: user.profile }} />
            ) : (
              <Avatar.Icon size={40} icon="account" style={{ backgroundColor: theme.primaryBackground }} color={theme.primary} />
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

        {/* Quick Actions Paper Card */}
        <Card style={{ backgroundColor: theme.card, borderRadius: 24, marginTop: 20, marginBottom: 24, elevation: 3 }}>
          <Card.Content style={{ padding: 20 }}>
            <PaperText variant="titleMedium" style={{ color: theme.textPrimary, fontWeight: '800', marginBottom: 16 }}>
              Quick Actions
            </PaperText>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableRipple style={{ alignItems: 'center', flex: 1, paddingVertical: 8, borderRadius: 16 }} onPress={() => router.push('/screener')}>
                <View style={{ alignItems: 'center' }}>
                  <Avatar.Icon size={56} icon="filter-variant" style={{ backgroundColor: theme.primaryBackground, marginBottom: 8 }} color={theme.primary} />
                  <PaperText variant="labelMedium" style={{ color: theme.textPrimary, fontWeight: '700', textAlign: 'center' }}>
                    Screener
                  </PaperText>
                </View>
              </TouchableRipple>

              <TouchableRipple
                style={{ alignItems: 'center', flex: 1, paddingVertical: 8, borderRadius: 16 }}
                onPress={() => {
                  if (!user) {
                    router.push('/login');
                  } else {
                    router.push('/trade');
                  }
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Avatar.Icon size={56} icon="chart-line" style={{ backgroundColor: theme.successBackground, marginBottom: 8 }} color={theme.success} />
                  <PaperText variant="labelMedium" style={{ color: theme.textPrimary, fontWeight: '700', textAlign: 'center' }}>
                    Trade
                  </PaperText>
                </View>
              </TouchableRipple>

              <TouchableRipple style={{ alignItems: 'center', flex: 1, paddingVertical: 8, borderRadius: 16 }} onPress={() => router.push('/calculator')}>
                <View style={{ alignItems: 'center' }}>
                  <Avatar.Icon size={56} icon="calculator" style={{ backgroundColor: theme.warningBackground, marginBottom: 8 }} color={theme.warningText} />
                  <PaperText variant="labelMedium" style={{ color: theme.textPrimary, fontWeight: '700', textAlign: 'center' }}>
                    Calculator
                  </PaperText>
                </View>
              </TouchableRipple>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Side Menu Drawer overlay */}
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
