import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, Switch, AppState, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettingsStyles } from '../theme/settingsStyles';
import { userPreferenceAPI, notificationAPI } from '../services/api';
import { checkNotificationPermission, requestUserPermission, getFCMToken } from '../services/notificationService';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, refreshUserData } = useAuth() as any;
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

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestUserPermission();
      if (granted) {
        setNotificationsEnabled(true);
        try {
          const token = await getFCMToken();
          if (token) {
            await notificationAPI.saveToken(token);
            console.log('Settings: FCM token saved successfully to backend');
          }
        } catch (tokenErr) {
          console.error('Settings: Failed to save FCM token:', tokenErr);
        }
      } else {
        setNotificationsEnabled(false);
        Alert.alert(
          'Notifications Blocked',
          'Push notifications are disabled for this app. Please enable them in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      Alert.alert(
        'Disable Notifications',
        'To disable notifications, please turn them off in your device system settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  // Validates username: must start with letter, only letters and numbers
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
    // Strip spaces immediately
    const cleanText = text.replace(/\s/g, '');
    setUsername(cleanText);

    // Perform validation
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

      // Password can be empty/null for Google sign-in users
      await userPreferenceAPI.updateUsername(userId, username, '');

      // Refresh AuthContext data
      await refreshUserData();

      setSuccessMessage('Username updated successfully!');
    } catch (err: any) {
      console.error('Failed to update username:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update username';
      setErrorMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Custom Header (Matches other app screens!) */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header Description */}
            <Text style={styles.sectionTitle}>Account Customization</Text>
            <Text style={styles.sectionSubtitle}>
              Update your account details and username. Changes will reflect on your home dashboard greeting.
            </Text>

            {/* Profile Info Summary Card */}
            <View style={styles.infoCard}>
              <View style={styles.avatarContainer}>
                {user?.profile ? (
                  <View style={styles.avatarImageWrapper}>
                    {/* Placeholder image tag with profile URL */}
                    <Text style={styles.avatarInitial}>{user.name?.[0]?.toUpperCase() || 'U'}</Text>
                  </View>
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={28} color={theme.iconMuted} />
                  </View>
                )}
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoName} numberOfLines={1}>
                  {user?.name || '1Klik User'}
                </Text>
                <Text style={styles.infoEmail} numberOfLines={1}>
                  {user?.email || 'No email associated'}
                </Text>
              </View>
            </View>

            {/* Form Container */}
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Username</Text>

              <View style={[
                styles.inputWrapper,
                validationError ? styles.inputWrapperError : null,
                !validationError && username ? styles.inputWrapperSuccess : null
              ]}>
                <Ionicons name="at-outline" size={20} color={theme.iconMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="enter_username"
                  placeholderTextColor={theme.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  editable={!loading}
                />
                {username.length > 0 && !loading && (
                  <TouchableOpacity onPress={() => handleUsernameChange('')}>
                    <Ionicons name="close-circle" size={18} color={theme.iconMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Real-time validation message / guidance */}
              {validationError ? (
                <View style={styles.helperRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={theme.danger} />
                  <Text style={[styles.helperText, styles.errorText]}>{validationError}</Text>
                </View>
              ) : (
                <View style={styles.helperRow}>
                  <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
                  <Text style={styles.helperText}>
                    Only letters and numbers are allowed. Must start with a letter.
                  </Text>
                </View>
              )}

              {/* Status Feedbacks */}
              {successMessage && (
                <View style={[styles.alertBox, styles.successAlert]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={theme.success} />
                  <Text style={styles.successAlertText}>{successMessage}</Text>
                </View>
              )}

              {errorMessage && (
                <View style={[styles.alertBox, styles.errorAlert]}>
                  <Ionicons name="warning-outline" size={18} color={theme.danger} />
                  <Text style={styles.errorAlertText}>{errorMessage}</Text>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loading || !!validationError || !username ? styles.saveButtonDisabled : null
                ]}
                onPress={handleSave}
                disabled={loading || !!validationError || !username}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color={theme.darkCardText} />
                    <Text style={styles.saveButtonText}>Update Username</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* App Settings Container */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>App Preferences</Text>
              <Text style={styles.sectionSubtitle}>
                Customize your app experience.
              </Text>



              <View style={styles.themeToggleRow}>
                <Text style={styles.themeToggleLabel}>Push Notifications</Text>
                {checkingPermission ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={theme.card}
                  />
                )}
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
