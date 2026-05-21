import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

const AlertContext = createContext<any>(null);

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
  }, []);

  const showNotificationBanner = () => {
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
  };

  const hideNotificationBanner = () => {
    Animated.timing(notificationY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotificationVisible(false);
    });
  };

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

  // Custom Alert buttons styling & layout
  const renderAlertButtons = () => {
    const buttons = alertConfig?.buttons || [{ text: 'OK', style: 'default' }];
    const isRowLayout = buttons.length === 2;

    const renderButton = (btn: AlertButton, index: number) => {
      let btnBg = theme.primary;
      let textCol = '#ffffff';
      let borderStyle = {};

      if (btn.style === 'cancel') {
        btnBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
        textCol = theme.textSecondary;
        borderStyle = {
          borderWidth: 1.5,
          borderColor: theme.border,
        };
      } else if (btn.style === 'destructive') {
        btnBg = theme.danger;
        textCol = '#ffffff';
      }

      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.alertButton,
            { backgroundColor: btnBg, flex: isRowLayout ? 1 : undefined },
            borderStyle
          ]}
          onPress={() => handleAlertButtonPress(btn.onPress)}
          activeOpacity={0.8}
        >
          <Text style={[styles.alertButtonText, { color: textCol }]}>
            {btn.text || 'OK'}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={[styles.buttonsContainer, isRowLayout ? styles.buttonsRow : styles.buttonsColumn]}>
        {buttons.map((btn, idx) => renderButton(btn, idx))}
      </View>
    );
  };

  return (
    <AlertContext.Provider value={{}}>
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
            style={[
              styles.alertCard, 
              { 
                backgroundColor: theme.card,
                borderColor: theme.border
              }
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header Icon base on style */}
            <View style={styles.alertHeaderRow}>
              <View style={[styles.alertIconCircle, { backgroundColor: theme.primaryBackground }]}>
                <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              </View>
              <Text style={[styles.alertTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                {alertConfig?.title || 'Alert'}
              </Text>
            </View>

            {alertConfig?.message ? (
              <ScrollView style={styles.messageScrollView} showsVerticalScrollIndicator={true}>
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
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  alertIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.2,
  },
  messageScrollView: {
    maxHeight: 180,
    marginBottom: 20,
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonsColumn: {
    flexDirection: 'column',
  },
  alertButton: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  alertButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  notificationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
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
