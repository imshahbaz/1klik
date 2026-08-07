import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { CustomAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { zerodhaAPI, rupeezyAPI } from '../../services/api';
import { getFriendlyErrorMessage } from '../../utils/errorMessage';
import { useAdaptiveLayout } from '../../theme/layout';
import { getSafeBottomPadding } from '../../theme/safeArea';
import { useZerodhaStyles } from '../../theme/zerodhaStyles';
import ZerodhaCard from '../../components/brokers/ZerodhaCard';
import RupeezyCard from '../../components/brokers/RupeezyCard';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { getBrokerStatusDisplay } from '../../components/brokers/brokerStatus';

export default function BrokersConfigScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { user, appLoading } = useAuth();
  const { isDarkMode, theme } = useTheme();
  const styles = useZerodhaStyles(isDarkMode);
  
  const [activeBrokerTab, setActiveBrokerTab] = useState<'zerodha' | 'rupeezy'>('zerodha');

  useRequireAuth();

  // Zerodha States
  const [zerodhaUser, setZerodhaUser] = useState<any>(null);
  const [zerodhaLoading, setZerodhaLoading] = useState(true);
  const [zerodhaError, setZerodhaError] = useState<string | null>(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [is404Error, setIs404Error] = useState(false);
  const [autoConnectLoading, setAutoConnectLoading] = useState(false);
  
  // Zerodha Config States
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [enableAutoLogin, setEnableAutoLogin] = useState(false);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Rupeezy Connection States
  const [rupeezyUser, setRupeezyUser] = useState<any>(null);
  const [rupeezyLoading, setRupeezyLoading] = useState(true);
  const [showRupeezyWebView, setShowRupeezyWebView] = useState(false);
  const [isRupeezyTokenExpired, setIsRupeezyTokenExpired] = useState(false);
  const [isRupeezy404Error, setIsRupeezy404Error] = useState(false);

  // Rupeezy Config States
  const [rupeezyAppId, setRupeezyAppId] = useState('');
  const [rupeezyApiSecret, setRupeezyApiSecret] = useState('');
  const [rupeezySaving, setRupeezySaving] = useState(false);
  const [rupeezyError, setRupeezyError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against setState-after-unmount and unbounded background polling.
  const isMountedRef = useRef(true);
  const isAuthenticatingZerodhaRef = useRef(false);
  const isAuthenticatingRupeezyRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  const fetchZerodhaProfile = async () => {
    try {
      setZerodhaLoading(true);
      setZerodhaError(null);
      setIs404Error(false);
      setIsTokenExpired(false);
      const res = await zerodhaAPI.getMe();
      const payload = res.data;
      
      if (payload?.success === true) {
        setZerodhaUser(payload.data);
      } else {
        setZerodhaError("Your Kite session is disconnected. Please reconnect.");
        setIsTokenExpired(true);
        if (typeof payload?.data === 'string') {
          setApiKey(payload.data);
        }
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.message || '';
      
      if (status === 401) {
        // Handled globally usually
      } else if (status === 404) {
        setZerodhaError("No linked Zerodha account found.");
        setIs404Error(true);
      } else if (status === 409 && typeof detail === 'string' && detail.includes('E002')) {
        setZerodhaError("Auto-login in progress...");
        setIsTokenExpired(true);
        setAutoConnectLoading(true);
        pollGetMe();
      } else if (status === 409) {
        setZerodhaError("Your Kite session has a conflict. Please reconnect.");
        setIsTokenExpired(true);
      } else {
        setZerodhaError("Kite Connect session is disconnected.");
        setIsTokenExpired(true);
      }
    } finally {
      setZerodhaLoading(false);
    }
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const pollGetMe = async () => {
    if (!isMountedRef.current) return;
    try {
      const res = await zerodhaAPI.getMe();
      if (!isMountedRef.current) return;
      stopPolling();
      setAutoConnectLoading(false);
      if (res.data?.success === true) {
        fetchZerodhaProfile();
      } else {
        setShowWebView(true);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.message || '';
      if (status === 409 && typeof detail === 'string' && detail.includes('E002')) {
        pollingRef.current = setTimeout(pollGetMe, 30000);
        return;
      }
      stopPolling();
      setAutoConnectLoading(false);
      if (status === 409) {
        CustomAlert.alert("Auto-Login Failed", getFriendlyErrorMessage(err, "Auto-login couldn’t be completed. Please try connecting again."));
      }
      setShowWebView(true);
    }
  };

  const handleConnectKite = async () => {
    const finalApiKey = apiKey || process.env.EXPO_PUBLIC_ZERODHA_API_KEY;
    if (!finalApiKey) {
      CustomAlert.alert("Missing API Key", "No saved API Key found. Please save your API config first.");
      return;
    }

    try {
      setAutoConnectLoading(true);
      const res = await zerodhaAPI.autoConnect();
      if (res.data?.success === false) {
        setAutoConnectLoading(false);
        setShowWebView(true);
        return;
      }
      if (res.status === 200 || res.status === 409) {
        pollGetMe();
      } else {
        setAutoConnectLoading(false);
        setShowWebView(true);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.message || '';
      if (status === 409 && typeof detail === 'string' && detail.includes('Request already exists')) {
        pollGetMe();
      } else {
        setAutoConnectLoading(false);
        if (status === 409) {
          CustomAlert.alert("Auto-Login Failed", getFriendlyErrorMessage(err, "Auto-login couldn’t be completed. Please try connecting again."));
        }
        setShowWebView(true);
      }
    }
  };

  const checkZerodhaAuthUrl = async (url: string) => {
    if (isAuthenticatingZerodhaRef.current) return;
    // Only trust a request_token that arrives over https (the Kite redirect is
    // always https); ignore tokens on any non-secure/arbitrary navigation.
    if (url?.startsWith('https://') && url.includes('request_token=')) {
      const tokenMatch = /[?&]request_token=([^&]+)/.exec(url);
      if (tokenMatch?.[1]) {
        isAuthenticatingZerodhaRef.current = true;
        const requestToken = tokenMatch[1];
        setShowWebView(false);

        try {
          setZerodhaLoading(true);
          setZerodhaError(null);
          setIsTokenExpired(false);
          const loginRes = await zerodhaAPI.login(requestToken, user?.id || user?.userId || '');
          if (loginRes.data?.success === false) {
            throw new Error(loginRes.data.message || "Login failed on backend.");
          }
          await fetchZerodhaProfile();
          CustomAlert.alert(
            "Connection Successful",
            "Your Zerodha Kite session has been successfully established and authenticated!"
          );
        } catch (err: any) {
          CustomAlert.alert("Authentication Failed", getFriendlyErrorMessage(err, "We couldn’t complete the Zerodha connection. Please try again."));
          setIsTokenExpired(true);
        } finally {
          setZerodhaLoading(false);
          isAuthenticatingZerodhaRef.current = false;
        }
      }
    }
  };

  const handleNavigationChange = (navState: any) => checkZerodhaAuthUrl(navState.url);
  const handleZerodhaWebViewError = (e: any) => {
    if (e.nativeEvent?.url) {
      checkZerodhaAuthUrl(e.nativeEvent.url);
    }
  };

  const handleSaveZerodhaConfig = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setFormError("Both API Key and API Secret are required.");
      return;
    }
    if (enableAutoLogin) {
      if (!userName.trim() || !password.trim() || !totpSecret.trim()) {
        setFormError("User Name, Password, and TOTP Secret are required when Auto Login is enabled.");
        return;
      }
    }
    try {
      setSavingConfig(true);
      setFormError(null);
      await zerodhaAPI.saveConfig({
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        enableAutoLogin,
        userName: userName.trim(),
        password: password.trim(),
        totpSecret: totpSecret.trim(),
      });
      CustomAlert.alert(
        "Configuration Saved",
        "Your Zerodha Kite API credentials have been successfully updated.",
        [{ text: "OK", onPress: () => {
          setIs404Error(false);
          fetchZerodhaProfile();
        } }]
      );
    } catch (err: any) {
      setFormError(getFriendlyErrorMessage(err, "Could not save your configuration. Please try again."));
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchRupeezyProfile = async () => {
    try {
      setRupeezyLoading(true);
      setRupeezyError(null);
      setIsRupeezy404Error(false);
      setIsRupeezyTokenExpired(false);
      const res = await rupeezyAPI.getMe();
      const payload = res.data;

      if (payload?.success === true) {
        setRupeezyUser(payload.data);
      } else {
        setRupeezyError("Your Rupeezy session is disconnected. Please reconnect.");
        setIsRupeezyTokenExpired(true);
        setRupeezyAppId(payload.data);
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        setRupeezyError("No linked Rupeezy account found.");
        setIsRupeezy404Error(true);
      } else if (status >= 500) {
        setRupeezyError("Rupeezy is temporarily unavailable. Please try again shortly.");
        setIsRupeezyTokenExpired(true);
      } else {
        setRupeezyError("Rupeezy session is disconnected.");
        setIsRupeezyTokenExpired(true);
      }
    } finally {
      setRupeezyLoading(false);
    }
  };

  const checkRupeezyAuthUrl = async (url: string) => {
    if (isAuthenticatingRupeezyRef.current) return;
    // Only trust an auth token that arrives over https.
    if (url?.startsWith('https://') && url.includes('auth=')) {
      const tokenMatch = /[?&]auth=([^&]+)/.exec(url);
      if (tokenMatch?.[1]) {
        isAuthenticatingRupeezyRef.current = true;
        const auth = tokenMatch[1];
        setShowRupeezyWebView(false);

        try {
          setRupeezyLoading(true);
          setRupeezyError(null);
          setIsRupeezyTokenExpired(false);
          const loginRes = await rupeezyAPI.login(auth, user?.id || user?.userId || '');
          if (loginRes.data?.success === false) {
            throw new Error(loginRes.data.message || "Login failed on backend.");
          }
          await fetchRupeezyProfile();
          CustomAlert.alert(
            "Connection Successful",
            "Your Rupeezy session has been successfully established and authenticated!"
          );
        } catch (err: any) {
          CustomAlert.alert("Authentication Failed", getFriendlyErrorMessage(err, "We couldn’t complete the Rupeezy connection. Please try again."));
          setIsRupeezyTokenExpired(true);
        } finally {
          setRupeezyLoading(false);
          isAuthenticatingRupeezyRef.current = false;
        }
      }
    }
  };

  const handleRupeezyNavigationChange = (navState: any) => checkRupeezyAuthUrl(navState.url);
  const handleRupeezyWebViewError = (e: any) => {
    if (e.nativeEvent?.url) {
      checkRupeezyAuthUrl(e.nativeEvent.url);
    }
  };

  const handleSaveRupeezyConfig = async () => {
    if (!rupeezyAppId.trim() || !rupeezyApiSecret.trim()) {
      setRupeezyError("Both App ID and API Secret are required.");
      return;
    }
    try {
      setRupeezySaving(true);
      setRupeezyError(null);
      await rupeezyAPI.saveConfig({ appId: rupeezyAppId.trim(), apiSecret: rupeezyApiSecret.trim() });
      CustomAlert.alert("Configuration Saved", "Your Rupeezy credentials have been securely stored.",
        [{ text: "OK", onPress: () => {
          setIsRupeezy404Error(false);
          fetchRupeezyProfile();
        } }]
      );
    } catch (err: any) {
      setRupeezyError(getFriendlyErrorMessage(err, "Could not save your configuration. Please try again."));
    } finally {
      setRupeezySaving(false);
    }
  };

  // Fetch the currently-selected broker's profile on mount, whenever the active
  // tab changes, and when the screen regains focus. The inactive broker is
  // fetched lazily when its tab is selected (its card isn't rendered until then).
  useEffect(() => {
    const fetchActiveBroker = () => {
      if (activeBrokerTab === 'rupeezy') {
        fetchRupeezyProfile();
      } else {
        fetchZerodhaProfile();
      }
    };

    fetchActiveBroker();
    const unsubscribe = navigation.addListener('focus', fetchActiveBroker);
    return unsubscribe;
    // fetchZerodhaProfile/fetchRupeezyProfile only touch state setters and refs,
    // so they're stable for this effect's purposes; re-running on tab/focus only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrokerTab, navigation]);

  if (appLoading) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: getSafeBottomPadding(insets.bottom) }]}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Verifying secure session...</Text>
        </View>
      </View>
    );
  }

  if (!user) return null;

  if (showWebView) {
    const finalApiKey = apiKey || process.env.EXPO_PUBLIC_ZERODHA_API_KEY;
    return (
      <View style={[styles.webViewContainer, { paddingTop: insets.top, paddingBottom: getSafeBottomPadding(insets.bottom) }]}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity style={styles.webViewCloseButton} onPress={() => setShowWebView(false)}>
            <Ionicons name="close-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.webViewHeaderTitle}>Kite Secure Login</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          source={{ uri: `https://kite.zerodha.com/connect/login?v=3&api_key=${finalApiKey}` }}
          onNavigationStateChange={handleNavigationChange}
          onError={handleZerodhaWebViewError}
          onHttpError={handleZerodhaWebViewError}
          style={{ flex: 1 }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          renderLoading={() => (
            <View style={styles.webViewLoaderContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}
        />
      </View>
    );
  }

  if (showRupeezyWebView) {
    const finalAppId = rupeezyAppId;
    return (
      <View style={[styles.webViewContainer, { paddingTop: insets.top, paddingBottom: getSafeBottomPadding(insets.bottom) }]}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity style={styles.webViewCloseButton} onPress={() => setShowRupeezyWebView(false)}>
            <Ionicons name="close-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.webViewHeaderTitle}>Rupeezy Secure Login</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          source={{ uri: `https://flow.rupeezy.in?applicationId=${finalAppId}` }}
          onNavigationStateChange={handleRupeezyNavigationChange}
          onError={handleRupeezyWebViewError}
          onHttpError={handleRupeezyWebViewError}
          style={{ flex: 1 }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          renderLoading={() => (
            <View style={styles.webViewLoaderContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}
        />
      </View>
    );
  }

  const {
    color: zerodhaStatusColor,
    text: zerodhaConnectionText,
    content: zerodhaStatusContent,
  } = getBrokerStatusDisplay(zerodhaLoading, zerodhaError, zerodhaUser, theme, styles);

  const {
    color: rupeezyStatusColor,
    text: rupeezyConnectionText,
    content: rupeezyStatusContent,
  } = getBrokerStatusDisplay(rupeezyLoading, rupeezyError, rupeezyUser, theme, styles);

  return (
    <View style={[styles.safeArea, layout.screenPadding]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardFrame}
        keyboardVerticalOffset={insets.top + 60}
      >
        <KeyboardAwareScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContentContainer,
            layout.centeredContent,
            { paddingHorizontal: layout.horizontalPadding, paddingBottom: layout.tabBarHeight + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Switcher */}
          <View style={[styles.tabContainer, { marginBottom: 24 }] as any}>
            <TouchableOpacity
              style={[styles.tabButton, activeBrokerTab === 'zerodha' && styles.activeTabButton] as any}
              onPress={() => setActiveBrokerTab('zerodha')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonLabel, activeBrokerTab === 'zerodha' && styles.activeTabButtonLabel] as any}>ZERODHA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeBrokerTab === 'rupeezy' && styles.activeTabButton] as any}
              onPress={() => setActiveBrokerTab('rupeezy')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonLabel, activeBrokerTab === 'rupeezy' && styles.activeTabButtonLabel] as any}>RUPEEZY</Text>
            </TouchableOpacity>
          </View>

          {activeBrokerTab === 'zerodha' && (
            <ZerodhaCard
              styles={styles}
              theme={theme}
              zerodhaStatusColor={zerodhaStatusColor}
              zerodhaStatusContent={zerodhaStatusContent}
              zerodhaConnectionText={zerodhaConnectionText}
              zerodhaError={zerodhaError}
              is404Error={is404Error}
              setIs404Error={setIs404Error}
              isTokenExpired={isTokenExpired}
              autoConnectLoading={autoConnectLoading}
              handleConnectKite={handleConnectKite}
              apiKey={apiKey}
              setApiKey={setApiKey}
              apiSecret={apiSecret}
              setApiSecret={setApiSecret}
              enableAutoLogin={enableAutoLogin}
              setEnableAutoLogin={setEnableAutoLogin}
              userName={userName}
              setUserName={setUserName}
              password={password}
              setPassword={setPassword}
              totpSecret={totpSecret}
              setTotpSecret={setTotpSecret}
              formError={formError}
              setFormError={setFormError}
              savingConfig={savingConfig}
              handleSaveZerodhaConfig={handleSaveZerodhaConfig}
            />
          )}

          {activeBrokerTab === 'rupeezy' && (
            <RupeezyCard
              styles={styles}
              theme={theme}
              rupeezyStatusColor={rupeezyStatusColor}
              rupeezyStatusContent={rupeezyStatusContent}
              rupeezyConnectionText={rupeezyConnectionText}
              rupeezyError={rupeezyError}
              isRupeezy404Error={isRupeezy404Error}
              setIsRupeezy404Error={setIsRupeezy404Error}
              isRupeezyTokenExpired={isRupeezyTokenExpired}
              rupeezyAppId={rupeezyAppId}
              setRupeezyAppId={setRupeezyAppId}
              rupeezyApiSecret={rupeezyApiSecret}
              setRupeezyApiSecret={setRupeezyApiSecret}
              setShowRupeezyWebView={setShowRupeezyWebView}
              rupeezySaving={rupeezySaving}
              handleSaveRupeezyConfig={handleSaveRupeezyConfig}
              setRupeezyError={setRupeezyError}
            />
          )}

        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
