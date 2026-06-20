import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth() as any;
  const router = useRouter();

  const requireAuth = (e: any) => {
    if (!user) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.iconMuted,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.card,
          borderTopColor: theme.borderLight,
          height: 70 + (insets.bottom > 0 ? insets.bottom : 24),
          paddingBottom: (insets.bottom > 0 ? insets.bottom : 24) + 5,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="screener"
        options={{
          title: 'Screener',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'filter' : 'filter-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: 'Trade',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'pulse' : 'pulse-outline'} size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: requireAuth }}
      />
      <Tabs.Screen
        name="brokers"
        options={{
          title: 'Brokers',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'link' : 'link-outline'} size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: requireAuth }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: requireAuth }}
      />
    </Tabs>
  );
}
