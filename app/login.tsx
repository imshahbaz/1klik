import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Card, Button as PaperButton, Text as PaperText, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
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
  const { refreshUserData, user } = useAuth();

  const theme = darkColors;
  const styles = useLoginStyles(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  useEffect(() => {
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

      await googleAPI.googleTokenValidation(idToken);
      await getMeWithRetry(2, 100);
      await refreshUserData();
    } catch (err: any) {
      console.error('Native Google Sign-In Error Details:', err);

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

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getMeWithRetry = async (retries = 2, delayMs = 100) => {
    let finalErr = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await authAPI.getMe();
        return response;
      } catch (error) {
        const err = error as any;
        const is401 = err.response?.status === 401;

        if (is401 && attempt < retries) {
          await delay(delayMs);
          continue;
        }

        finalErr = err;
      }
    }
    throw finalErr;
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
            { paddingHorizontal: layout.horizontalPadding, justifyContent: 'center', minHeight: '100%' },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, layout.centeredContent, { width: '100%', maxWidth: 400, alignSelf: 'center' }]}>
            {/* Simple Clean Header */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <PaperText variant="headlineLarge" style={{ color: '#ffffff', fontWeight: '800', textAlign: 'center', fontSize: moderateScale(26) }}>
                Welcome to 1Klik
              </PaperText>
              <PaperText variant="bodyMedium" style={{ color: '#94a3b8', textAlign: 'center', marginTop: 8, fontSize: moderateScale(14) }}>
                Sign in to access your trading dashboard
              </PaperText>
            </View>

            {/* Simple Card */}
            <Card style={{ backgroundColor: '#1c1c1e', borderColor: '#2c2c2e', borderWidth: 1, borderRadius: 20, padding: 12, elevation: 0 }}>
              <Card.Content style={{ gap: 16 }}>
                {error ? (
                  <Surface style={[styles.errorAlert, { backgroundColor: theme.dangerBackground, borderRadius: 12, padding: 12 }]} elevation={0}>
                    <Ionicons name="alert-circle-outline" size={20} color={theme.danger} />
                    <PaperText style={{ color: theme.danger, marginLeft: 8, flex: 1, fontWeight: '600', fontSize: 13 }}>{error}</PaperText>
                  </Surface>
                ) : null}

                <PaperButton
                  mode="contained"
                  onPress={handleGoogleLogin}
                  disabled={loading}
                  loading={loading}
                  buttonColor="#ffffff"
                  textColor="#000000"
                  icon={({ size }) => <Ionicons name="logo-google" size={size || 18} color="#e04f3f" />}
                  contentStyle={{ height: 50 }}
                  labelStyle={{ fontSize: 16, fontWeight: '700' }}
                  style={{ borderRadius: 14 }}
                >
                  Continue with Google
                </PaperButton>
              </Card.Content>
            </Card>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
