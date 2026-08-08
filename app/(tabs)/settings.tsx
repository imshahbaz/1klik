import { useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Switch, Text } from 'react-native-paper';
import { CustomAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationAPI, userPreferenceAPI } from '../../services/api';
import { getFriendlyErrorMessage } from '../../utils/errorMessage';
import { checkNotificationPermission, getFCMToken, requestUserPermission } from '../../services/notificationService';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Button from '../../components/ui/Button';
import ListRow from '../../components/ui/Row';
import { Field } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Feedback';
import { Hairline, Panel, SectionHeader } from '../../components/ui/Panel';
import { space } from '../../theme/tokens';

export default function SettingsScreen() {
  const { user, refreshUserData, logout } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();
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
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
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
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
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
    <Screen header={<TopBar title="Account" />}>
      <SectionHeader title="Signed in as" />
      <Panel>
        <View style={styles.identity}>
          {user?.profile ? (
            <Avatar.Image size={48} source={{ uri: user.profile }} />
          ) : (
            <Avatar.Icon
              size={48}
              icon="account"
              style={{ backgroundColor: theme.primaryBackground }}
              color={theme.primary}
            />
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary }}>
              {user?.name || '1Klik User'}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 12.5, color: theme.textSecondary, marginTop: 2 }}>
              {user?.email || 'No email associated'}
            </Text>
          </View>
        </View>
      </Panel>

      <SectionHeader title="Profile" />
      <Panel style={{ gap: space.lg }}>
        <Field
          label="Username"
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="username"
          prefix="@"
          maxLength={20}
          editable={!loading}
          error={validationError}
          hint="letters & numbers"
          onClear={() => handleUsernameChange('')}
        />

        {successMessage ? <Notice tone="up" message={successMessage} /> : null}
        {errorMessage ? <Notice tone="down" message={errorMessage} /> : null}

        <Button
          label="Save changes"
          icon="checkmark-outline"
          onPress={handleSave}
          loading={loading}
          disabled={loading || !!validationError || !username}
        />
      </Panel>

      <SectionHeader title="Preferences" />
      <Panel padded={false}>
        <ListRow
          title="Push notifications"
          subtitle="Order fills, strategy triggers and alerts"
          icon="notifications-outline"
          trailing={
            checkingPermission ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Switch value={notificationsEnabled} onValueChange={handleNotificationToggle} color={theme.primary} />
            )
          }
        />
        <Hairline inset={64} />
        <ListRow
          title="Dark theme"
          subtitle="Recommended for low-light trading"
          icon={isDarkMode ? 'moon-outline' : 'sunny-outline'}
          trailing={<Switch value={isDarkMode} onValueChange={() => toggleTheme()} color={theme.primary} />}
        />
      </Panel>

      <SectionHeader title="Session" />
      <Panel padded={false}>
        <ListRow
          title="Sign out"
          subtitle="You'll need to sign in again to trade"
          icon="log-out-outline"
          iconTint={theme.danger}
          iconBackground={theme.dangerBackground}
          onPress={() =>
            CustomAlert.alert('Sign out', 'Are you sure you want to sign out of 1Klik?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => logout() },
            ])
          }
        />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
});
