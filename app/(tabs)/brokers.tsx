import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { CustomAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { zerodhaAPI, rupeezyAPI } from '../../services/api';
import { useAdaptiveLayout } from '../../theme/layout';
import { getSafeBottomPadding } from '../../theme/safeArea';
import { useZerodhaStyles } from '../../theme/zerodhaStyles';

export default function BrokersConfigScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { user, appLoading, logout } = useAuth() as any;
  const { isDarkMode, theme } = useTheme();
  const styles = useZerodhaStyles(isDarkMode);
  
  const [activeBrokerTab, setActiveBrokerTab] = useState<'zerodha' | 'rupeezy'>('zerodha');

  useEffect(() => {
    if (!appLoading && !user) {
      router.replace('/login');
    }
  }, [user, appLoading]);

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
  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    return () => {
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
      
      if (payload && payload.success === true) {
        setZerodhaUser(payload.data);
      } else {
        setZerodhaError(payload?.message || "Kite Connect session is disconnected.");
        setIsTokenExpired(true);
        if (payload && typeof payload.data === 'string') {
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
        setZerodhaError(detail || "Kite Connect session conflict.");
        setIsTokenExpired(true);
      } else {
        setZerodhaError("Kite Connect session is disconnected.");
        setIsTokenExpired(true);
      }
    } finally {
      setZerodhaLoading(false);
    }
  };

  const pollGetMe = async () => {
    try {
      const res = await zerodhaAPI.getMe();
      if (res.data?.success) {
        if (pollingRef.current) clearTimeout(pollingRef.current);
        setAutoConnectLoading(false);
        fetchZerodhaProfile();
      } else {
        if (pollingRef.current) clearTimeout(pollingRef.current);
        setAutoConnectLoading(false);
        setShowWebView(true);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.message || '';
      if (status === 409 && typeof detail === 'string' && detail.includes('E002')) {
        pollingRef.current = setTimeout(pollGetMe, 30000);
      } else {
        if (pollingRef.current) clearTimeout(pollingRef.current);
        setAutoConnectLoading(false);
        if (status === 409) {
          CustomAlert.alert("Auto-Login Failed", detail || "Conflict occurred during login.");
        }
        setShowWebView(true);
      }
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
      if (res.data && res.data.success === false) {
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
          CustomAlert.alert("Auto-Login Failed", detail || "Conflict occurred during login.");
        }
        setShowWebView(true);
      }
    }
  };

  const checkZerodhaAuthUrl = async (url: string) => {
    if (url && url.includes('request_token=')) {
      const tokenMatch = url.match(/[?&]request_token=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const requestToken = tokenMatch[1];
        setShowWebView(false);

        try {
          setZerodhaLoading(true);
          setZerodhaError(null);
          setIsTokenExpired(false);
          const loginRes = await zerodhaAPI.login(requestToken, user?.id || user?.userId || '');
          if (loginRes.data && loginRes.data.success === false) {
            throw new Error(loginRes.data.message || "Login failed on backend.");
          }
          await fetchZerodhaProfile();
          CustomAlert.alert(
            "Connection Successful",
            "Your Zerodha Kite session has been successfully established and authenticated!"
          );
        } catch (err: any) {
          const errMsg = err.response?.data?.message || err.message || "Failed to authenticate session with the backend.";
          CustomAlert.alert("Authentication Failed", errMsg);
          setIsTokenExpired(true);
        } finally {
          setZerodhaLoading(false);
        }
      }
    }
  };

  const handleNavigationChange = (navState: any) => checkZerodhaAuthUrl(navState.url);
  const handleZerodhaWebViewError = (e: any) => {
    if (e.nativeEvent && e.nativeEvent.url) {
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
      setFormError(err.response?.data?.message || "Failed to update configuration. Please try again.");
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
      
      if (payload && payload.success) {
        setRupeezyUser(payload.data);
      } else {
        setRupeezyError(payload?.message || "Rupeezy session is disconnected.");
        setIsRupeezyTokenExpired(true);
        if (payload && typeof payload.data === 'string') {
          setRupeezyAppId(payload.data);
        } else if (payload && payload.data && payload.data.appId) {
          setRupeezyAppId(payload.data.appId);
        }
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        setRupeezyError("No linked Rupeezy account found.");
        setIsRupeezy404Error(true);
      } else if (status >= 500) {
        setRupeezyError(`Server Error (${status}). Retrying...`);
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
    if (url && url.includes('auth=')) {
      const tokenMatch = url.match(/[?&]auth=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const auth = tokenMatch[1];
        setShowRupeezyWebView(false);

        try {
          setRupeezyLoading(true);
          setRupeezyError(null);
          setIsRupeezyTokenExpired(false);
          const loginRes = await rupeezyAPI.login(auth, user?.id || user?.userId || '');
          if (loginRes.data && loginRes.data.success === false) {
            throw new Error(loginRes.data.message || "Login failed on backend.");
          }
          await fetchRupeezyProfile();
          CustomAlert.alert(
            "Connection Successful",
            "Your Rupeezy session has been successfully established and authenticated!"
          );
        } catch (err: any) {
          const errMsg = err.response?.data?.message || err.message || "Failed to authenticate session with the backend.";
          CustomAlert.alert("Authentication Failed", errMsg);
          setIsRupeezyTokenExpired(true);
        } finally {
          setRupeezyLoading(false);
        }
      }
    }
  };

  const handleRupeezyNavigationChange = (navState: any) => checkRupeezyAuthUrl(navState.url);
  const handleRupeezyWebViewError = (e: any) => {
    if (e.nativeEvent && e.nativeEvent.url) {
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
      setRupeezyError(err.response?.data?.message || "Failed to update configuration. Please try again.");
    } finally {
      setRupeezySaving(false);
    }
  };

  useEffect(() => {
    if (activeBrokerTab === 'rupeezy') {
      fetchRupeezyProfile();
    } else {
      fetchZerodhaProfile();
    }
  }, [activeBrokerTab]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (activeBrokerTab === 'rupeezy') {
        fetchRupeezyProfile();
      } else {
        fetchZerodhaProfile();
      }
    });
    return unsubscribe;
  }, [navigation, activeBrokerTab]);

  useEffect(() => {
    if (!appLoading && user && !hasFetchedProfile.current) {
      hasFetchedProfile.current = true;
      fetchZerodhaProfile();
      fetchRupeezyProfile();
    }
  }, [user?.id, appLoading]);

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
            <View>
              {/* Connection Status Card */}
              <View style={[styles.connectionCard, { borderLeftColor: zerodhaLoading ? theme.primary : zerodhaError ? theme.danger : theme.success }]}>
                <View style={{ gap: 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={[styles.brandContainer, { marginRight: 0 }]}>
                      <View style={styles.kiteLogoPlaceholder}>
                        <Ionicons name="link-outline" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        {zerodhaLoading ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={styles.connectionTitle}>Connecting...</Text>
                          </View>
                        ) : zerodhaError ? (
                          <Text style={[styles.connectionTitle, { color: theme.danger }]} numberOfLines={1}>
                            Connection Inactive
                          </Text>
                        ) : (
                          <Text style={styles.connectionTitle} numberOfLines={1}>
                            {typeof zerodhaUser === 'string' ? 'Active Session' : (zerodhaUser?.userName || zerodhaUser?.name || 'Active Session')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.blackCardConfigBtn as any} onPress={() => setIs404Error(!is404Error)}>
                      <Ionicons name="settings-outline" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.borderLight, paddingTop: 8 }}>
                    <Text style={[styles.connectionSubtitle, { marginTop: 0, flex: 1, marginRight: 12 }]} numberOfLines={2}>
                      {zerodhaError ? zerodhaError : 'Secured Zerodha Connection'}
                    </Text>
                    <View style={zerodhaError ? styles.inactiveStatusBadge : styles.activeStatusBadge}>
                      <View style={zerodhaError ? styles.inactiveDot : styles.activeDot} />
                      <Text style={zerodhaError ? styles.inactiveStatusText : styles.activeStatusText}>
                        {zerodhaLoading ? 'LOADING' : zerodhaError ? 'INACTIVE' : 'CONNECTED'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Login Action Card if disconnected but config exists */}
              {!is404Error && isTokenExpired && (
                <View style={[styles.formCard, { marginTop: 16 }]}>
                  <Text style={styles.formTitle}>Reconnect Required</Text>
                  <Text style={styles.formSubtitle}>Your Kite Connect session has expired. Click below to re-authenticate.</Text>
                  
                  <TouchableOpacity
                    style={[styles.submitButton, { marginTop: 16 }]}
                    onPress={handleConnectKite}
                    disabled={autoConnectLoading}
                  >
                    {autoConnectLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="flash-outline" size={20} color="#ffffff" />
                        <Text style={styles.submitButtonText}>Connect to Kite</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Config Form */}
              {is404Error && (
                <View style={[styles.formCard, { marginTop: 16 }]}>
                  <Text style={styles.formTitle}>Zerodha Configuration</Text>
                  <Text style={styles.formSubtitle}>Enter your Kite Connect API credentials below.</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>KITE API KEY *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="key-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput style={styles.textInput} placeholder="Enter your Kite API Key" placeholderTextColor={theme.placeholder} value={apiKey} onChangeText={(text) => { setApiKey(text); setFormError(null); }} autoCapitalize="none" autoCorrect={false} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>KITE API SECRET *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput style={styles.textInput} placeholder="Enter your Kite API Secret" placeholderTextColor={theme.placeholder} value={apiSecret} onChangeText={(text) => { setApiSecret(text); setFormError(null); }} autoCapitalize="none" autoCorrect={false} secureTextEntry />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="power-outline" size={18} color={theme.textSecondary} />
                      <Text style={[styles.inputLabel, { marginBottom: 0 }]}>ENABLE AUTOLOGIN</Text>
                    </View>
                    <Switch value={enableAutoLogin} onValueChange={setEnableAutoLogin} trackColor={{ false: theme.borderLight, true: theme.primary }} thumbColor="#ffffff" />
                  </View>

                  {enableAutoLogin && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>USER NAME *</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="person-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                          <TextInput style={styles.textInput} placeholder="Enter your Zerodha User Name" placeholderTextColor={theme.placeholder} value={userName} onChangeText={(text) => { setUserName(text); setFormError(null); }} autoCapitalize="none" autoCorrect={false} />
                        </View>
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>PASSWORD *</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                          <TextInput style={styles.textInput} placeholder="Enter your Password" placeholderTextColor={theme.placeholder} value={password} onChangeText={(text) => { setPassword(text); setFormError(null); }} autoCapitalize="none" autoCorrect={false} secureTextEntry />
                        </View>
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>TOTP SECRET *</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="keypad-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                          <TextInput style={styles.textInput} placeholder="Enter your TOTP Secret" placeholderTextColor={theme.placeholder} value={totpSecret} onChangeText={(text) => { setTotpSecret(text); setFormError(null); }} autoCapitalize="none" autoCorrect={false} secureTextEntry />
                        </View>
                      </View>
                    </>
                  )}

                  {formError && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
                      <Text style={styles.errorText}>{formError}</Text>
                    </View>
                  )}

                  <TouchableOpacity style={[styles.submitButton, savingConfig && styles.disabledButton]} onPress={handleSaveZerodhaConfig} disabled={savingConfig}>
                    {savingConfig ? <ActivityIndicator size="small" color="#ffffff" /> : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                        <Text style={styles.submitButtonText}>Save API Config</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeBrokerTab === 'rupeezy' && (
            <View>
              {/* Connection Status Card */}
              <View style={[styles.connectionCard, { borderLeftColor: rupeezyLoading ? theme.primary : rupeezyError ? theme.danger : theme.success }]}>
                <View style={{ gap: 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={[styles.brandContainer, { marginRight: 0 }]}>
                      <View style={styles.kiteLogoPlaceholder}>
                        <Ionicons name="link-outline" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        {rupeezyLoading ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={styles.connectionTitle}>Connecting...</Text>
                          </View>
                        ) : rupeezyError ? (
                          <Text style={[styles.connectionTitle, { color: theme.danger }]} numberOfLines={1}>
                            Connection Inactive
                          </Text>
                        ) : (
                          <Text style={styles.connectionTitle} numberOfLines={1}>
                            {typeof rupeezyUser === 'string' ? 'Active Session' : (rupeezyUser?.userName || rupeezyUser?.name || 'Active Session')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.blackCardConfigBtn as any} onPress={() => setIsRupeezy404Error(!isRupeezy404Error)}>
                      <Ionicons name="settings-outline" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.borderLight, paddingTop: 8 }}>
                    <Text style={[styles.connectionSubtitle, { marginTop: 0, flex: 1, marginRight: 12 }]} numberOfLines={2}>
                      {rupeezyError ? rupeezyError : 'Secured Rupeezy Connection'}
                    </Text>
                    <View style={rupeezyError ? styles.inactiveStatusBadge : styles.activeStatusBadge}>
                      <View style={rupeezyError ? styles.inactiveDot : styles.activeDot} />
                      <Text style={rupeezyError ? styles.inactiveStatusText : styles.activeStatusText}>
                        {rupeezyLoading ? 'LOADING' : rupeezyError ? 'INACTIVE' : 'CONNECTED'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Login Action Card if disconnected but config exists */}
              {!isRupeezy404Error && isRupeezyTokenExpired && (
                <View style={[styles.formCard, { marginTop: 16 }]}>
                  <Text style={styles.formTitle}>Reconnect Required</Text>
                  <Text style={styles.formSubtitle}>Your Rupeezy session has expired. Click below to re-authenticate.</Text>
                  
                  <TouchableOpacity
                    style={[styles.submitButton, { marginTop: 16 }]}
                    onPress={() => {
                      if (!rupeezyAppId) {
                        CustomAlert.alert("Missing App ID", "No saved App ID found. Please save your API config first.");
                        return;
                      }
                      setShowRupeezyWebView(true);
                    }}
                  >
                    <Ionicons name="flash-outline" size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Connect to Rupeezy</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Config Form */}
              {isRupeezy404Error && (
                <View style={[styles.formCard, { marginTop: 16 }]}>
                  <View style={styles.formHeaderContainer}>
                    <View style={styles.actionIconCircle}>
                      <Ionicons name="business-outline" size={22} color={theme.primary} />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.formTitle}>Rupeezy Configuration</Text>
                      <Text style={styles.formSubtitle}>Enter your App ID and API Secret below.</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>APP ID *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="apps-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput style={styles.textInput} placeholder="Enter App ID" placeholderTextColor={theme.placeholder} value={rupeezyAppId} onChangeText={(text) => { setRupeezyAppId(text); setRupeezyError(null); }} autoCapitalize="none" autoCorrect={false} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>API SECRET *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput style={styles.textInput} placeholder="Enter API Secret" placeholderTextColor={theme.placeholder} value={rupeezyApiSecret} onChangeText={(text) => { setRupeezyApiSecret(text); setRupeezyError(null); }} autoCapitalize="none" autoCorrect={false} secureTextEntry />
                    </View>
                  </View>

                  {rupeezyError && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
                      <Text style={styles.errorText}>{rupeezyError}</Text>
                    </View>
                  )}

                  <TouchableOpacity style={[styles.submitButton, rupeezySaving && styles.disabledButton]} onPress={handleSaveRupeezyConfig} disabled={rupeezySaving}>
                    {rupeezySaving ? <ActivityIndicator size="small" color="#ffffff" /> : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                        <Text style={styles.submitButtonText}>Save Rupeezy Config</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
