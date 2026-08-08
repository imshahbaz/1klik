import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { authAPI, googleAPI } from '../services/api';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { darkColors } from '../theme/colors';
import { radius, space } from '../theme/tokens';
import Button from '../components/ui/Button';
import { Notice } from '../components/ui/Feedback';

/** Sold on capability, not on chrome — three lines, no marketing card. */
const FEATURES = [
  { icon: 'scan-outline' as const, text: 'Quantitative screeners across the NSE universe' },
  { icon: 'flash-outline' as const, text: 'Scheduled MTF and automated strategy orders' },
  { icon: 'git-network-outline' as const, text: 'Zerodha Kite and Rupeezy in one place' },
];

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshUserData, user } = useAuth();

  // Sign-in is always presented dark: it is the app's brand moment, and the
  // user's stored theme isn't known until after authentication.
  const theme = darkColors;
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
        setError('Sign-in canceled.');
      } else {
        const errMsg = getFriendlyErrorMessage(err, 'Google sign-in failed. Please try again.');
        setError(errMsg);
        CustomAlert.alert('Login Failed', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    <View
      style={[
        styles.root,
        { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, space.lg) },
      ]}
    >
      <View style={styles.hero}>
        <Image source={require('../assets/images/icon.png')} style={styles.mark} resizeMode="contain" />
        <Text style={[styles.wordmark, { color: theme.textPrimary }]}>1Klik</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>
          Screen, schedule and execute — from one terminal.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature.text} style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: theme.primaryBackground }]}>
              <Ionicons name={feature.icon} size={16} color={theme.primary} />
            </View>
            <Text style={{ flex: 1, fontSize: 13.5, color: theme.textSecondary, lineHeight: 19 }}>
              {feature.text}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {error ? <Notice tone="down" message={error} /> : null}

        <Button
          label="Continue with Google"
          icon="logo-google"
          onPress={handleGoogleLogin}
          loading={loading}
          disabled={loading}
        />

        <Text style={[styles.legal, { color: theme.textTertiary }]}>
          By continuing you agree to 1Klik&apos;s terms of use. Trading involves risk of capital loss.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: space.xxl,
  },
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: space.xxl,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    marginBottom: space.xl,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: space.sm,
    maxWidth: 300,
  },
  features: {
    gap: space.lg,
    paddingVertical: space.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    paddingTop: space.xxl,
    gap: space.lg,
  },
  legal: {
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
  },
});
