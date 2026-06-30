import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { CustomAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { authAPI, googleAPI } from '../services/api';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { useAdaptiveLayout } from '../theme/layout';
import { useLoginStyles } from '../theme/loginStyles';
import { darkColors } from '../theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { login } = useAuth();

  // Force dark mode colors to match the pitch black splash screen background
  const theme = darkColors;
  const styles = useLoginStyles(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the Google Client ID configured in your .env file
    const clientID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

    GoogleSignin.configure({
      webClientId: clientID,
      offlineAccess: false,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      await GoogleSignin.hasPlayServices();

      const signInResponse = await GoogleSignin.signIn();
      const idToken = signInResponse.data?.idToken || (signInResponse as any).idToken;

      if (!idToken) {
        throw new Error('Failed to retrieve ID Token from Google SDK.');
      }

      // 2. Validate the native token with your Spring Boot backend validation endpoint
      await googleAPI.googleTokenValidation(idToken);

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
        const errMsg = getFriendlyErrorMessage(err, 'Google sign-in failed. Please try again.');
        setError(errMsg);
        CustomAlert.alert('Login Failed', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safeArea, layout.screenPadding, { backgroundColor: '#000000' }]}>


      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardFrame}
        keyboardVerticalOffset={insets.top + 60}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingHorizontal: layout.horizontalPadding },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, layout.centeredContent]}>
            {/* Title Brand Section */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <Text style={[styles.brandName, { color: '#ffffff', fontSize: 26 }]}>Welcome to 1Klik</Text>
              <Text style={[styles.brandTagline, { color: '#94a3b8', fontSize: 15 }]}>
                Sign in to access your trading dashboard
              </Text>
            </View>
            {/* Login Options Card */}
            <View style={[styles.formCard, { backgroundColor: '#111827', borderColor: '#374151' }]}>
              {error ? (
                <View style={styles.errorAlert}>
                  <Ionicons name="alert-circle-outline" size={20} color={theme.danger} />
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
                  <ActivityIndicator size="small" color={theme.textPrimary} />
                ) : (
                  <View style={styles.googleButtonContent}>
                    <View style={styles.googleIconCircle}>
                      <Ionicons name="logo-google" size={18} color="#e04f3f" />
                    </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
