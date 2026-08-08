import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, Button as PaperButton, Switch as PaperSwitch } from 'react-native-paper';
import ZerodhaHoldings from './ZerodhaHoldings';
import FormInput from '../common/FormInput';
import BrokerConnectionStatus from './BrokerConnectionStatus';

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
    <View style={{ gap: 16 }}>
      <BrokerConnectionStatus
        styles={styles}
        theme={theme}
        statusColor={zerodhaStatusColor}
        statusContent={zerodhaStatusContent}
        connectionText={zerodhaConnectionText}
        error={zerodhaError}
        idleSubtitle="Secured Zerodha Connection"
        onToggleConfig={() => setIs404Error(!is404Error)}
      />

      {/* Login Action Card if disconnected but config exists */}
      {!is404Error && isTokenExpired && (
        <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8 }}>
          <Card.Content style={{ gap: 8 }}>
            <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
              Reconnect Required
            </PaperText>
            <PaperText variant="bodySmall" style={{ color: theme.textSecondary }}>
              Your Kite Connect session has expired. Click below to re-authenticate.
            </PaperText>

            <PaperButton
              mode="contained"
              onPress={handleConnectKite}
              disabled={autoConnectLoading}
              loading={autoConnectLoading}
              buttonColor={theme.primary}
              textColor="#ffffff"
              icon={({ size }) => <Ionicons name="flash-outline" size={size || 18} color="#ffffff" />}
              style={{ borderRadius: 12, marginTop: 8 }}
              contentStyle={{ height: 48 }}
            >
              Connect to Kite
            </PaperButton>
          </Card.Content>
        </Card>
      )}

      {/* Holdings Section */}
      <ZerodhaHoldings styles={styles} theme={theme} />

      {/* Config Form */}
      {is404Error && (
        <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8 }}>
          <Card.Content style={{ gap: 12 }}>
            <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
              Zerodha Configuration
            </PaperText>
            <PaperText variant="bodySmall" style={{ color: theme.textSecondary, marginBottom: 8 }}>
              Enter your Kite Connect API credentials below.
            </PaperText>

            <FormInput
              styles={styles}
              theme={theme}
              label="KITE API KEY *"
              icon="key-outline"
              placeholder="Enter your Kite API Key"
              value={apiKey}
              onChangeText={(text) => { setApiKey(text); setFormError(null); }}
            />

            <FormInput
              styles={styles}
              theme={theme}
              label="KITE API SECRET *"
              icon="lock-closed-outline"
              placeholder="Enter your Kite API Secret"
              value={apiSecret}
              onChangeText={(text) => { setApiSecret(text); setFormError(null); }}
              secureTextEntry
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="power-outline" size={18} color={theme.textSecondary} />
                <PaperText variant="bodyMedium" style={{ fontWeight: '700', color: theme.textPrimary }}>
                  ENABLE AUTOLOGIN
                </PaperText>
              </View>
              <PaperSwitch value={enableAutoLogin} onValueChange={setEnableAutoLogin} color={theme.primary} />
            </View>

            {enableAutoLogin && (
              <>
                <FormInput
                  styles={styles}
                  theme={theme}
                  label="USER NAME *"
                  icon="person-outline"
                  placeholder="Enter your Zerodha User Name"
                  value={userName}
                  onChangeText={(text) => { setUserName(text); setFormError(null); }}
                />
                <FormInput
                  styles={styles}
                  theme={theme}
                  label="PASSWORD *"
                  icon="lock-closed-outline"
                  placeholder="Enter your Password"
                  value={password}
                  onChangeText={(text) => { setPassword(text); setFormError(null); }}
                  secureTextEntry
                />
                <FormInput
                  styles={styles}
                  theme={theme}
                  label="TOTP SECRET *"
                  icon="keypad-outline"
                  placeholder="Enter your TOTP Secret"
                  value={totpSecret}
                  onChangeText={(text) => { setTotpSecret(text); setFormError(null); }}
                  secureTextEntry
                />
              </>
            )}

            {formError && (
              <PaperText variant="bodySmall" style={{ color: theme.danger, fontWeight: '600' }}>
                {formError}
              </PaperText>
            )}

            <PaperButton
              mode="contained"
              onPress={handleSaveZerodhaConfig}
              disabled={savingConfig}
              loading={savingConfig}
              buttonColor={theme.primary}
              textColor="#ffffff"
              icon={({ size }) => <Ionicons name="checkmark-circle-outline" size={size || 18} color="#ffffff" />}
              style={{ borderRadius: 12, marginTop: 8 }}
              contentStyle={{ height: 48 }}
            >
              Save API Config
            </PaperButton>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}
