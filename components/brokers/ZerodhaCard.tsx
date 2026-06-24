import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ZerodhaHoldings from './ZerodhaHoldings';

interface ZerodhaCardProps {
  readonly styles: any;
  readonly theme: any;
  readonly zerodhaStatusColor: string;
  readonly zerodhaStatusContent: React.ReactNode;
  readonly zerodhaConnectionText: string;
  readonly zerodhaError: string | null;
  readonly is404Error: boolean;
  readonly setIs404Error: (val: boolean) => void;
  readonly isTokenExpired: boolean;
  readonly autoConnectLoading: boolean;
  readonly handleConnectKite: () => void;
  readonly apiKey: string;
  readonly setApiKey: (val: string) => void;
  readonly apiSecret: string;
  readonly setApiSecret: (val: string) => void;
  readonly enableAutoLogin: boolean;
  readonly setEnableAutoLogin: (val: boolean) => void;
  readonly userName: string;
  readonly setUserName: (val: string) => void;
  readonly password: string;
  readonly setPassword: (val: string) => void;
  readonly totpSecret: string;
  readonly setTotpSecret: (val: string) => void;
  readonly formError: string | null;
  readonly setFormError: (val: string | null) => void;
  readonly savingConfig: boolean;
  readonly handleSaveZerodhaConfig: () => void;
}

export default function ZerodhaCard({
  styles,
  theme,
  zerodhaStatusColor,
  zerodhaStatusContent,
  zerodhaConnectionText,
  zerodhaError,
  is404Error,
  setIs404Error,
  isTokenExpired,
  autoConnectLoading,
  handleConnectKite,
  apiKey,
  setApiKey,
  apiSecret,
  setApiSecret,
  enableAutoLogin,
  setEnableAutoLogin,
  userName,
  setUserName,
  password,
  setPassword,
  totpSecret,
  setTotpSecret,
  formError,
  setFormError,
  savingConfig,
  handleSaveZerodhaConfig
}: ZerodhaCardProps) {
  return (
    <View>
      {/* Connection Status Card */}
      <View style={[styles.connectionCard, { borderLeftColor: zerodhaStatusColor }]}>
        <View style={{ gap: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={[styles.brandContainer, { marginRight: 0 }]}>
              <View style={styles.kiteLogoPlaceholder}>
                <Ionicons name="link-outline" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                {zerodhaStatusContent}
              </View>
            </View>
            <TouchableOpacity style={styles.blackCardConfigBtn} onPress={() => setIs404Error(!is404Error)}>
              <Ionicons name="settings-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.borderLight, paddingTop: 8 }}>
            <Text style={[styles.connectionSubtitle, { marginTop: 0, flex: 1, marginRight: 12 }]} numberOfLines={2}>
              {zerodhaError || 'Secured Zerodha Connection'}
            </Text>
            <View style={zerodhaError ? styles.inactiveStatusBadge : styles.activeStatusBadge}>
              <View style={zerodhaError ? styles.inactiveDot : styles.activeDot} />
              <Text style={zerodhaError ? styles.inactiveStatusText : styles.activeStatusText}>
                {zerodhaConnectionText}
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

      {/* Holdings Section - always show */}
      <ZerodhaHoldings styles={styles} theme={theme} />

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
  );
}
