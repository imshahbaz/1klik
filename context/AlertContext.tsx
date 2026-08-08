import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  DeviceEventEmitter,
  Animated,
  Platform,
  StatusBar,
  ScrollView
} from 'react-native';
import { useTheme } from './ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

export interface NotificationConfig {
  title: string;
  body: string;
  data?: any;
}

// Global Event Triggers (usable inside and outside React)
export const CustomAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    DeviceEventEmitter.emit('show-custom-alert', { title, message, buttons, options });
  }
};

export const CustomNotification = {
  show: (title: string, body: string, data?: any) => {
    DeviceEventEmitter.emit('show-custom-notification', { title, body, data });
  }
};

/**
 * Global alert + notification banner host.
 *
 * Alerts are triggered imperatively from anywhere (including outside React)
 * via `CustomAlert.alert` / `CustomNotification.show`, which emit through a
 * DeviceEventEmitter bus. This provider simply mounts the themed Modal and the
 * in-app notification banner that listen to that bus — there is no context
 * value to consume.
 */
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  // Notification State
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig | null>(null);

  // Notification Animation
  const notificationY = useRef(new Animated.Value(-200)).current;
  const autoDismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideNotificationBanner = useCallback(() => {
    Animated.timing(notificationY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotificationVisible(false);
    });
  }, [notificationY]);

  const showNotificationBanner = useCallback(() => {
    if (autoDismissTimeout.current) {
      clearTimeout(autoDismissTimeout.current);
    }

    setNotificationVisible(true);
    Animated.spring(notificationY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    autoDismissTimeout.current = setTimeout(() => {
      hideNotificationBanner();
    }, 4500);
  }, [notificationY, hideNotificationBanner]);

  // Register listeners
  useEffect(() => {
    const alertSubscription = DeviceEventEmitter.addListener(
      'show-custom-alert',
      (config: AlertConfig) => {
        setAlertConfig(config);
        setAlertVisible(true);
      }
    );

    const notificationSubscription = DeviceEventEmitter.addListener(
      'show-custom-notification',
      (config: NotificationConfig) => {
        setNotificationConfig(config);
        showNotificationBanner();
      }
    );

    return () => {
      alertSubscription.remove();
      notificationSubscription.remove();
      if (autoDismissTimeout.current) {
        clearTimeout(autoDismissTimeout.current);
      }
    };
  }, [showNotificationBanner]);

  const handleAlertButtonPress = (onPressCallback?: () => void) => {
    setAlertVisible(false);
    if (onPressCallback) {
      setTimeout(() => {
        onPressCallback();
      }, 100);
    }
  };

  const handleAlertDismiss = () => {
    if (alertConfig?.options?.cancelable !== false) {
      setAlertVisible(false);
      if (alertConfig?.options?.onDismiss) {
        setTimeout(() => {
          alertConfig.options?.onDismiss?.();
        }, 100);
      }
    }
  };

  // Safe area positioning for notifications
  const topInset = Platform.OS === 'ios' 
    ? (insets.top || 20) 
    : (StatusBar.currentHeight || 0) + 12;

  // Material dialogs use text-only actions aligned to the bottom-right, with
  // the confirming action last — the reverse of the stacked filled buttons a
  // web modal would show.
  const renderAlertButtons = () => {
    const buttons = alertConfig?.buttons || [{ text: 'OK', style: 'default' }];

    const renderButton = (btn: AlertButton, index: number) => {
      let textCol = theme.primary;
      if (btn.style === 'cancel') textCol = theme.textSecondary;
      else if (btn.style === 'destructive') textCol = theme.danger;

      return (
        <TouchableOpacity
          key={index}
          style={styles.alertButton}
          onPress={() => handleAlertButtonPress(btn.onPress)}
          activeOpacity={0.7}
        >
          <Text style={[styles.alertButtonText, { color: textCol }]}>
            {(btn.text || 'OK').toUpperCase()}
          </Text>
        </TouchableOpacity>
      );
    };

    return <View style={styles.buttonsContainer}>{buttons.map((btn, idx) => renderButton(btn, idx))}</View>;
  };

  return (
    <>
      {children}
      {/* Global Theme-compliant Alert Modal */}
      <Modal
        visible={alertVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleAlertDismiss}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={handleAlertDismiss}
        >
          <View
            style={[styles.alertCard, { backgroundColor: theme.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.alertTitle, { color: theme.textPrimary }]} numberOfLines={3}>
              {alertConfig?.title || 'Alert'}
            </Text>

            {alertConfig?.message ? (
              <ScrollView style={styles.messageScrollView} showsVerticalScrollIndicator>
                <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>
                  {alertConfig.message}
                </Text>
              </ScrollView>
            ) : null}

            {renderAlertButtons()}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Global Foreground Notification Banner */}
      {notificationVisible && notificationConfig ? (
        <Animated.View
          style={[
            styles.notificationContainer,
            { 
              transform: [{ translateY: notificationY }],
              top: topInset 
            }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.notificationCard,
              { 
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: isDarkMode ? '#000000' : theme.textPrimary
              }
            ]}
            activeOpacity={0.9}
            onPress={hideNotificationBanner}
          >
            <View style={[styles.notificationIconCircle, { backgroundColor: theme.primaryBackground }]}>
              <Ionicons name="notifications-outline" size={20} color={theme.primary} />
            </View>

            <View style={styles.notificationTextContainer}>
              <Text style={[styles.notificationTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {notificationConfig.title}
              </Text>
              <Text style={[styles.notificationBody, { color: theme.textSecondary }]} numberOfLines={2}>
                {notificationConfig.body}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.notificationCloseBtn} 
              onPress={hideNotificationBanner}
            >
              <Ionicons name="close" size={16} color={theme.iconMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  alertCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '86%',
    // 28dp is the Material 3 dialog radius — one of the few places in the app
    // where a large corner is correct.
    borderRadius: 28,
    paddingTop: 24,
    elevation: 6,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: 24,
  },
  messageScrollView: {
    maxHeight: 220,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    paddingTop: 24,
  },
  alertButton: {
    minWidth: 72,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notificationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999999,
    paddingHorizontal: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    // Matches Android's heads-up notification shade: pill-ish, elevated, and
    // clearly floating over whatever screen is beneath it.
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  notificationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  notificationBody: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  notificationCloseBtn: {
    padding: 4,
  },
});
