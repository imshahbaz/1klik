import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

interface SecurityContextType {
  isAppLocked: boolean;
  unlockApp: () => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

/** Re-lock the app after this much time spent in the background. */
const LOCK_TIMEOUT = 10 * 60 * 1000;

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAppLocked, setIsAppLocked] = useState(true);
  const appState = useRef(AppState.currentState);
  const lastBackgroundTime = useRef<number | null>(null);
  // Guards against firing a second biometric prompt while one is already open
  // (the unlock effect can re-run before authenticateAsync resolves).
  const unlockingRef = useRef(false);
  const { user, appLoading } = useAuth();
  const { theme } = useTheme();

  const unlockApp = useCallback(async () => {
    if (unlockingRef.current) return;
    unlockingRef.current = true;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsAppLocked(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock 1Klik',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAppLocked(false);
      }
    } catch (err) {
      console.error('Failed to authenticate:', err);
    } finally {
      unlockingRef.current = false;
    }
  }, []);

  // Handle initial lock and logout lock state
  useEffect(() => {
    // If we've finished loading and the user is logged in but locked, trigger prompt
    if (!appLoading && user && isAppLocked) {
      unlockApp();
    } else if (!appLoading && !user) {
      // If we've finished loading and there's no user, disable the lock
      setIsAppLocked(false);
    }
  }, [appLoading, user, isAppLocked]);

  // Handle background/foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        if (lastBackgroundTime.current && user) {
          const timeInBackground = Date.now() - lastBackgroundTime.current;
          if (timeInBackground > LOCK_TIMEOUT) {
            setIsAppLocked(true);
          }
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        lastBackgroundTime.current = Date.now();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  const securityValue = useMemo(
    () => ({ isAppLocked, unlockApp }),
    [isAppLocked, unlockApp]
  );

  return (
    <SecurityContext.Provider value={securityValue}>
      {children}
      {isAppLocked && user && (
        <Modal transparent={false} animationType="fade" visible={isAppLocked}>
          <View style={[styles.container, { backgroundColor: '#000000' }]}>
            <Image
              source={require('../assets/images/splash-icon.png')}
              contentFit="contain"
              style={{ width: 200, height: 200 }}
            />
            <TouchableOpacity
              style={styles.retryButton}
              onPress={unlockApp}
              activeOpacity={0.8}
            >
              <Ionicons name="finger-print-outline" size={24} color={theme.primary} />
              <Text style={[styles.retryText, { color: theme.primary }]}>Tap to Unlock</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
