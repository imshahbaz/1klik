import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { authAPI, googleAPI } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth() as any;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the Google Client ID configured in your .env file
    const clientID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

    console.log("Configuring native-only Google Sign-In with Web Client ID:", clientID);

    GoogleSignin.configure({
      webClientId: clientID,
      offlineAccess: false,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Authenticate with Google natively on the device
      console.log("Triggering native Google SDK account picker...");
      await GoogleSignin.hasPlayServices();

      const signInResponse = await GoogleSignin.signIn();
      const idToken = signInResponse.data?.idToken || (signInResponse as any).idToken;

      if (!idToken) {
        throw new Error('Failed to retrieve ID Token from Google SDK.');
      }

      console.log("Native ID Token obtained successfully! Sending to Spring Boot backend...");

      // 2. Validate the native token with your Spring Boot backend validation endpoint
      const backendResponse = await googleAPI.googleTokenValidation(idToken);

      // 3. Fetch the full user details using the secure session cookie
      const meResponse = await authAPI.getMe();
      const meData = meResponse.data?.data || meResponse.data;

      if (!meData) {
        throw new Error("Failed to load user profile from validation context.");
      }


      // 5. Update global AuthContext state & redirect home
      login(meData);
      router.replace('/');

    } catch (err: any) {
      console.error('Native Google Sign-In Error Details:', err);

      // Handle user cancellation (12501) gracefully
      if (err.code === '12501' || err.message?.includes('Sign_in_cancel')) {
        setError("Sign-in canceled.");
      } else {
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Google Sign-In failed. Please try again.';
        setError(errMsg);
        Alert.alert('Login Failed', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Custom Header (Matches Screener Screen Layout!) */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Title Brand Section */}
            <View style={styles.titleSection}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="flash-outline" size={32} color="#ffffff" />
              </View>
              <Text style={styles.brandName}>1Klik Trading</Text>
              <Text style={styles.brandTagline}>
                Securely sign in using your Google account to unlock advanced scanners, custom logic equations, and real-time market action alerts.
              </Text>
            </View>

            {/* Login Options Card */}
            <View style={styles.formCard}>
              {error ? (
                <View style={styles.errorAlert}>
                  <Ionicons name="alert-circle-outline" size={20} color="#f43f5e" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Google Sign In Button (Strictly Native Google Sign-In!) */}
              <TouchableOpacity
                style={styles.googleButton}
                activeOpacity={0.85}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <View style={styles.googleButtonContent}>
                    <View style={styles.googleIconCircle}>
                      <Ionicons name="logo-google" size={18} color="#e04f3f" />
                    </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                Requires native Google Play Services. Authentication runs securely through the on-device native Google Sign-In SDK.
              </Text>
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
    justifyContent: 'center',
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    width: '100%',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    height: 54,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 8,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  termsText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 24,
    paddingHorizontal: 8,
  },
});
