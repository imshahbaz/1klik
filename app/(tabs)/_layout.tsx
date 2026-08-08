import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { radius, size } from '../../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Material 3 navigation-bar item: the active icon sits inside a filled pill
 * indicator, which is what distinguishes an Android bottom bar from the plain
 * tinted-icon row used on iOS and the web.
 */
function makeIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    const { theme } = useTheme();
    return (
      <View
        style={[
          styles.indicator,
          focused && { backgroundColor: theme.primaryBackground },
        ]}
      >
        <Ionicons name={focused ? active : inactive} size={22} color={color} />
      </View>
    );
  };
}

const HomeIcon = makeIcon('stats-chart', 'stats-chart-outline');
const ScreenerIcon = makeIcon('scan', 'scan-outline');
const TradeIcon = makeIcon('swap-vertical', 'swap-vertical-outline');
const BrokersIcon = makeIcon('git-network', 'git-network-outline');
const SettingsIcon = makeIcon('person-circle', 'person-circle-outline');

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const requireAuth = (e: { preventDefault: () => void }) => {
    if (!user) {
      e.preventDefault();
      router.push('/login');
    }
  };

  const bottomInset = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 16;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        // Android draws its own ripple on the bar; the default press opacity
        // would fight it.
        tabBarButton: undefined,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
          height: size.navBar + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          // Flat against the content — separation is the hairline, not a shadow.
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Markets', tabBarIcon: HomeIcon }} />
      <Tabs.Screen name="screener" options={{ title: 'Screener', tabBarIcon: ScreenerIcon }} />
      <Tabs.Screen
        name="trade"
        options={{ title: 'Orders', tabBarIcon: TradeIcon }}
        listeners={{ tabPress: requireAuth }}
      />
      <Tabs.Screen
        name="brokers"
        options={{ title: 'Brokers', tabBarIcon: BrokersIcon }}
        listeners={{ tabPress: requireAuth }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Account', tabBarIcon: SettingsIcon }}
        listeners={{ tabPress: requireAuth }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  indicator: {
    width: 56,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
