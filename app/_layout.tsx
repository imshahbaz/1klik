import { Ionicons } from '@expo/vector-icons';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AlertProvider } from '../context/AlertContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MarginProvider } from '../context/MarginContext';
import NetInfo from '@react-native-community/netinfo';
import { StrategyProvider } from '../context/StrategyContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SecurityProvider } from '../context/SecurityContext';
import { appUpdateInfo } from '../services/api';
import { displayNotification, ensureDefaultChannel, isFirebaseInitialized } from '../services/notificationService';
import ErrorBoundary from '../components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => { });

if (isFirebaseInitialized()) {
  try {
    ensureDefaultChannel().catch(() => { });

    setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
      if (remoteMessage.notification) return;

      const title = String(remoteMessage.data?.title || 'Notification');
      const body = String(remoteMessage.data?.body || '');
      if (!body && !remoteMessage.data?.title) return;

      await displayNotification(title, body, remoteMessage.data);
    });
  } catch (error) {
    console.warn('Firebase background messaging failed to initialize:', error);
  }
}


function AppContent() {
  const { isDarkMode, theme, themeLoaded } = useTheme();
  const { appLoading, bootProgress } = useAuth();
  const [updateNeeded, setUpdateNeeded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide the native splash screen immediately when our custom JS component mounts
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: bootProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [bootProgress, progressAnim]);

  useEffect(() => {
    if (!appLoading && themeLoaded && isConnected !== false) {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setSplashVisible(false);
      });
    } else if (isConnected === false && !splashVisible) {
      // Re-show splash if internet disconnects? Optional, but let's just stick to the modal.
    }
  }, [appLoading, splashOpacity, themeLoaded, isConnected, splashVisible]);

  useEffect(() => {
    if (appUpdateInfo.updateNeeded) {
      setUpdateNeeded(true);
      setDownloadUrl(appUpdateInfo.downloadUrl);
    }

    const subscription = DeviceEventEmitter.addListener('app-update-required', (info) => {
      setUpdateNeeded(info.updateNeeded);
      setDownloadUrl(info.downloadUrl);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const navTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.card,
      text: theme.textPrimary,
      border: theme.border,
    },
  };

  return (
    <NavigationThemeProvider value={navTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="calculator" options={{ headerShown: false }} />
        <Stack.Screen name="chartPage" options={{ headerShown: false }} />
      </Stack>
      <StyledStatusBar />

      {/* No Internet Connection — blocking, so it is not dismissible */}
      <Modal
        visible={isConnected === false && themeLoaded}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { }}
      >
        <View style={[modalStyles.overlay, { backgroundColor: theme.overlay }]}>
          <View style={[modalStyles.card, { backgroundColor: theme.surface }]}>
            <View style={[modalStyles.iconCircle, { backgroundColor: theme.chipBackground }]}>
              <Ionicons name="cloud-offline-outline" size={26} color={theme.textSecondary} />
            </View>
            <Text style={[modalStyles.title, { color: theme.textPrimary }]}>
              No connection
            </Text>
            <Text style={[modalStyles.subtitle, { color: theme.textSecondary }]}>
              Turn on mobile data or connect to Wi-Fi. Live quotes and orders need a connection.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Forced update — also blocking, with a single action */}
      <Modal
        visible={updateNeeded && themeLoaded}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { }}
      >
        <View style={[modalStyles.overlay, { backgroundColor: theme.overlay }]}>
          <View style={[modalStyles.card, { backgroundColor: theme.surface }]}>
            <View style={[modalStyles.iconCircle, { backgroundColor: theme.primaryBackground }]}>
              <Ionicons name="cloud-download-outline" size={26} color={theme.primary} />
            </View>
            <Text style={[modalStyles.title, { color: theme.textPrimary }]}>
              Update required
            </Text>
            <Text style={[modalStyles.subtitle, { color: theme.textSecondary }]}>
              A newer version of 1Klik is available. Update to continue trading.
            </Text>
            <View style={modalStyles.actions}>
              <TouchableOpacity
                style={modalStyles.action}
                onPress={async () => {
                  const targetUrl = downloadUrl;
                  try {
                    await Linking.openURL(targetUrl);
                  } catch (err) {
                    console.error("Failed to open update URL:", err);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[modalStyles.actionText, { color: theme.primary }]}>UPDATE NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Splash Screen with Progress Bar */}
      {splashVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              // splash-icon.png is opaque with a near-black backdrop baked in,
              // so this must stay black to hide the tile edge — and must match
              // the expo-splash-screen backgroundColor in app.json, along with
              // the 200dp image size, so the native splash hands over to this
              // one without the logo jumping.
              backgroundColor: '#000000',
              opacity: splashOpacity,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99999,
            },
          ]}
        >
          <Image
            source={require('../assets/images/splash-icon.png')}
            contentFit="contain"
            style={{ width: 200, height: 200 }}
          />
          <View
            style={{
              width: 200,
              height: 4,
              backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0',
              borderRadius: 2,
              marginTop: 24,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: theme.primary || '#3b82f6',
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>
        </Animated.View>
      )}
    </NavigationThemeProvider>
  );
}

function StyledStatusBar() {
  const { isDarkMode } = useTheme();
  return <StatusBar style={isDarkMode ? "light" : "dark"} />;
}

import { PaperProvider } from 'react-native-paper';

function PaperWrapper({ children }: { children: React.ReactNode }) {
  const { paperTheme } = useTheme();
  return <PaperProvider theme={paperTheme}>{children}</PaperProvider>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <ThemeProvider>
              <PaperWrapper>
                <AlertProvider>
                  <SecurityProvider>
                    <MarginProvider>
                      <StrategyProvider>
                        <AppContent />
                      </StrategyProvider>
                    </MarginProvider>
                  </SecurityProvider>
                </AlertProvider>
              </PaperWrapper>
            </ThemeProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    paddingTop: 24,
    elevation: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
  },
  action: {
    minWidth: 72,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

