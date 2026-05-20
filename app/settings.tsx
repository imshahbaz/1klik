import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { userPreferenceAPI } from '../services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, refreshUserData } = useAuth() as any;
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
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
                    <Ionicons name="person" size={28} color="#4f46e5" />
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
                <Ionicons name="at-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="enter_username"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  editable={!loading}
                />
                {username.length > 0 && !loading && (
                  <TouchableOpacity onPress={() => handleUsernameChange('')}>
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Real-time validation message / guidance */}
              {validationError ? (
                <View style={styles.helperRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#f43f5e" />
                  <Text style={[styles.helperText, styles.errorText]}>{validationError}</Text>
                </View>
              ) : (
                <View style={styles.helperRow}>
                  <Ionicons name="information-circle-outline" size={14} color="#64748b" />
                  <Text style={styles.helperText}>
                    Only letters and numbers are allowed. Must start with a letter.
                  </Text>
                </View>
              )}

              {/* Status Feedbacks */}
              {successMessage && (
                <View style={[styles.alertBox, styles.successAlert]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
                  <Text style={styles.successAlertText}>{successMessage}</Text>
                </View>
              )}

              {errorMessage && (
                <View style={[styles.alertBox, styles.errorAlert]}>
                  <Ionicons name="warning-outline" size={18} color="#f43f5e" />
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
                    <Ionicons name="save-outline" size={18} color="#ffffff" />
                    <Text style={styles.saveButtonText}>Update Username</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  customHeader: {
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  infoEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#f8fafc',
  },
  inputWrapperError: {
    borderColor: '#f43f5e',
    backgroundColor: '#fff1f2',
  },
  inputWrapperSuccess: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  errorText: {
    color: '#f43f5e',
    fontWeight: '600',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
    gap: 10,
  },
  successAlert: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successAlertText: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorAlertText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#0f172a',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
