import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Text, TouchableRipple } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { angelOneApi } from '../../services/api';
import { radius, space } from '../../theme/tokens';
import MarketStatusCard from '../../components/home/MarketStatusCard';
import ProfileMenu from '../../components/home/ProfileMenu';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import { Panel, SectionHeader, Hairline } from '../../components/ui/Panel';
import ListRow from '../../components/ui/Row';

/** Shortcut tiles under the quote — the actions traders reach for most. */
const SHORTCUTS = [
  { key: 'screener', label: 'Screener', icon: 'scan-outline' as const, route: '/screener', auth: false },
  { key: 'trade', label: 'Place order', icon: 'flash-outline' as const, route: '/trade', auth: true },
  { key: 'calculator', label: 'Margin calc', icon: 'calculator-outline' as const, route: '/calculator', auth: false },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, appLoading, logout } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();
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
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
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

  const go = (route: string, needsAuth: boolean) => {
    if (needsAuth && !user) router.push('/login');
    else router.push(route as any);
  };

  return (
    <>
      <Screen
        header={
          <TopBar
            title="1Klik"
            subtitle={displayName ? `Signed in as ${displayName}` : 'Not signed in'}
            actions={[
              {
                icon: isDarkMode ? 'sunny-outline' : 'moon-outline',
                onPress: () => toggleTheme(),
                accessibilityLabel: 'Toggle theme',
              },
            ]}
            trailing={
              <TouchableRipple
                onPress={() => setShowProfileMenu(true)}
                borderless
                rippleColor={theme.ripple}
                style={styles.avatarButton}
                accessibilityRole="button"
                accessibilityLabel="Open profile menu"
              >
                {user?.profile ? (
                  <Avatar.Image size={32} source={{ uri: user.profile }} />
                ) : (
                  <Avatar.Icon
                    size={32}
                    icon="account"
                    style={{ backgroundColor: theme.chipBackground }}
                    color={theme.textSecondary}
                  />
                )}
              </TouchableRipple>
            }
          />
        }
      >
        <SectionHeader title="Index" actionLabel="Refresh" onAction={() => fetchMarketStatus(true)} />

        <MarketStatusCard
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

        <SectionHeader title="Quick actions" />
        <View style={styles.shortcutRow}>
          {SHORTCUTS.map((shortcut) => (
            <Panel
              key={shortcut.key}
              padded={false}
              style={styles.shortcut}
              onPress={() => go(shortcut.route, shortcut.auth)}
            >
              <View style={styles.shortcutInner}>
                <View style={[styles.shortcutIcon, { backgroundColor: theme.primaryBackground }]}>
                  <Ionicons name={shortcut.icon} size={20} color={theme.primary} />
                </View>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 12, fontWeight: '600', color: theme.textPrimary, marginTop: space.sm }}
                >
                  {shortcut.label}
                </Text>
              </View>
            </Panel>
          ))}
        </View>

        <SectionHeader title="Your desk" />
        <Panel padded={false}>
          <ListRow
            title="Order book"
            subtitle="Scheduled MTF and strategy orders"
            icon="receipt-outline"
            iconTint={theme.primary}
            iconBackground={theme.primaryBackground}
            showChevron
            onPress={() => go('/trade', true)}
          />
          <Hairline inset={64} />
          <ListRow
            title="Broker connections"
            subtitle="Zerodha Kite · Rupeezy"
            icon="git-network-outline"
            iconTint={theme.infoText}
            iconBackground={theme.infoBackground}
            showChevron
            onPress={() => go('/brokers', true)}
          />
          <Hairline inset={64} />
          <ListRow
            title="Margin calculator"
            subtitle="Size a position before you place it"
            icon="calculator-outline"
            iconTint={theme.warningText}
            iconBackground={theme.warningBackground}
            showChevron
            onPress={() => go('/calculator', false)}
          />
        </Panel>
      </Screen>

      <ProfileMenu
        theme={theme}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        user={user}
        logout={logout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        router={router}
      />
    </>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  shortcut: {
    flex: 1,
  },
  shortcutInner: {
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
