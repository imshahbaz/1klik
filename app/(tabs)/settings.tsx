import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AppState, KeyboardAvoidingView, Linking, Platform, View } from 'react-native';
import { Card, Text as PaperText, TextInput as PaperTextInput, Button as PaperButton, Switch as PaperSwitch, Avatar, ActivityIndicator, Surface, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { CustomAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationAPI, userPreferenceAPI } from '../../services/api';
import { getFriendlyErrorMessage } from '../../utils/errorMessage';
import { checkNotificationPermission, getFCMToken, requestUserPermission } from '../../services/notificationService';
import { useAdaptiveLayout } from '../../theme/layout';
import { useSettingsStyles } from '../../theme/settingsStyles';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { user, refreshUserData } = useAuth();
  const { isDarkMode, theme } = useTheme();
  const styles = useSettingsStyles(isDarkMode);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  const syncNotificationPermission = async () => {
    try {
      const isEnabled = await checkNotificationPermission();
      setNotificationsEnabled(isEnabled);
    } catch (err) {
      console.error('Settings: Failed to check notification permission:', err);
    } finally {
      setCheckingPermission(false);
    }
  };

  useEffect(() => {
    syncNotificationPermission();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncNotificationPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const enableNotifications = async () => {
    const granted = await requestUserPermission();
    if (granted) {
      setNotificationsEnabled(true);
      try {
        const token = await getFCMToken();
        if (token) {
          await notificationAPI.saveToken(token);
        }
      } catch (tokenErr) {
        console.error('Settings: Failed to save FCM token:', tokenErr);
      }
    } else {
      setNotificationsEnabled(false);
      CustomAlert.alert(
        'Notifications Blocked',
        'Push notifications are disabled for this app. Please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const disableNotifications = () => {
    CustomAlert.alert(
      'Disable Notifications',
      'To disable notifications, please turn them off in your device system settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
  };

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      disableNotifications();
    } else {
      await enableNotifications();
    }
  };

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  const validateUsername = (val: string) => {
    if (!val) {
      return 'Username cannot be empty';
    }
    if (!/^[a-zA-Z]/.test(val)) {
      return 'Username must start with a letter';
    }
    if (!/^[a-zA-Z0-9]+$/.test(val)) {
      return 'Username can only contain letters and numbers';
    }
    return null;
  };

  const handleUsernameChange = (text: string) => {
    const cleanText = text.replace(/\s/g, '');
    setUsername(cleanText);

    if (cleanText.length > 0) {
      setValidationError(validateUsername(cleanText));
    } else {
      setValidationError(null);
    }
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSave = async () => {
    const error = validateUsername(username);
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const userId = user?.id || user?.userId;
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      await userPreferenceAPI.updateUsername(userId, username, '');
      await refreshUserData();
      setSuccessMessage('Username updated successfully!');
    } catch (err: any) {
      console.error('Failed to update username:', err);
      setErrorMessage(getFriendlyErrorMessage(err, 'Could not update your username. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safeArea, layout.screenPadding]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardFrame}
        keyboardVerticalOffset={insets.top + 60}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingHorizontal: layout.horizontalPadding, paddingBottom: layout.tabBarHeight + 24 },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          extraKeyboardSpace={64}
        >
          <View style={[styles.container, layout.centeredContent, { gap: 16 }]}>
            {/* Profile Info Summary Card */}
            <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8, elevation: 3 }}>
              <Card.Content style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {user?.profile ? (
                  <Avatar.Image size={56} source={{ uri: user.profile }} />
                ) : (
                  <Avatar.Icon size={56} icon="account" style={{ backgroundColor: theme.primaryBackground }} color={theme.primary} />
                )}
                <View style={{ flex: 1 }}>
                  <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }} numberOfLines={1}>
                    {user?.name || '1Klik User'}
                  </PaperText>
                  <PaperText variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                    {user?.email || 'No email associated'}
                  </PaperText>
                </View>
              </Card.Content>
            </Card>

            {/* Username Customization Card */}
            <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8, elevation: 3 }}>
              <Card.Content style={{ gap: 12 }}>
                <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
                  Account Customization
                </PaperText>
                <PaperText variant="bodySmall" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                  Update your account details and username. Changes will reflect on your home dashboard.
                </PaperText>

                <PaperTextInput
                  mode="outlined"
                  label="Username"
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="enter_username"
                  placeholderTextColor={theme.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  editable={!loading}
                  textColor={theme.textPrimary}
                  outlineColor={validationError ? theme.danger : theme.border}
                  activeOutlineColor={theme.primary}
                  left={<PaperTextInput.Affix text="@" />}
                  right={
                    username.length > 0 && !loading ? (
                      <PaperTextInput.Icon icon="close-circle" onPress={() => handleUsernameChange('')} />
                    ) : undefined
                  }
                  style={{ backgroundColor: theme.card }}
                />

                {validationError ? (
                  <HelperText type="error" visible={true}>
                    {validationError}
                  </HelperText>
                ) : (
                  <HelperText type="info" visible={true}>
                    Only letters and numbers are allowed. Must start with a letter.
                  </HelperText>
                )}

                {successMessage && (
                  <Surface style={{ padding: 12, borderRadius: 12, backgroundColor: theme.successBackground, flexDirection: 'row', alignItems: 'center', gap: 8 }} elevation={0}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={theme.success} />
                    <PaperText variant="bodyMedium" style={{ color: theme.success, fontWeight: '700' }}>{successMessage}</PaperText>
                  </Surface>
                )}

                {errorMessage && (
                  <Surface style={{ padding: 12, borderRadius: 12, backgroundColor: theme.dangerBackground, flexDirection: 'row', alignItems: 'center', gap: 8 }} elevation={0}>
                    <Ionicons name="warning-outline" size={18} color={theme.danger} />
                    <PaperText variant="bodyMedium" style={{ color: theme.danger, fontWeight: '700' }}>{errorMessage}</PaperText>
                  </Surface>
                )}

                <PaperButton
                  mode="contained"
                  onPress={handleSave}
                  disabled={loading || !!validationError || !username}
                  loading={loading}
                  buttonColor={theme.primary}
                  textColor="#ffffff"
                  icon={({ size }) => <Ionicons name="save-outline" size={size || 18} color="#ffffff" />}
                  style={{ borderRadius: 14, marginTop: 8 }}
                  contentStyle={{ height: 50 }}
                  labelStyle={{ fontSize: 15, fontWeight: '700' }}
                >
                  Update Username
                </PaperButton>
              </Card.Content>
            </Card>

            {/* App Preferences Card */}
            <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8, elevation: 3 }}>
              <Card.Content style={{ gap: 12 }}>
                <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
                  App Preferences
                </PaperText>
                <PaperText variant="bodySmall" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                  Customize your push notifications and system preferences.
                </PaperText>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                  <PaperText variant="bodyMedium" style={{ color: theme.textPrimary, fontWeight: '700' }}>
                    Push Notifications
                  </PaperText>
                  {checkingPermission ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <PaperSwitch
                      value={notificationsEnabled}
                      onValueChange={handleNotificationToggle}
                      color={theme.primary}
                    />
                  )}
                </View>
              </Card.Content>
            </Card>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
