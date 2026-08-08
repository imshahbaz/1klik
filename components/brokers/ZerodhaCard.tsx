import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import ZerodhaHoldings from './ZerodhaHoldings';
import BrokerConnectionStatus from './BrokerConnectionStatus';
import Button from '../ui/Button';
import { Field } from '../ui/Field';
import { Notice } from '../ui/Feedback';
import { Panel, SectionHeader } from '../ui/Panel';
import { space } from '../../theme/tokens';

interface ZerodhaCardProps {
  readonly styles?: any;
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
  handleSaveZerodhaConfig,
}: ZerodhaCardProps) {
  return (
    <View>
      <SectionHeader title="Session" />
      <BrokerConnectionStatus
        theme={theme}
        statusColor={zerodhaStatusColor}
        statusContent={zerodhaStatusContent}
        connectionText={zerodhaConnectionText}
        error={zerodhaError}
        idleSubtitle="Kite Connect · orders route through this session"
        onToggleConfig={() => setIs404Error(!is404Error)}
      />

      {!is404Error && isTokenExpired && (
        <View style={{ marginTop: space.md }}>
          <Panel style={{ gap: space.md }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
              Reconnect required
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19 }}>
              Your Kite Connect session has expired. Re-authenticate to resume placing orders.
            </Text>
            <Button
              label="Connect to Kite"
              icon="flash-outline"
              onPress={handleConnectKite}
              loading={autoConnectLoading}
              disabled={autoConnectLoading}
            />
          </Panel>
        </View>
      )}

      <ZerodhaHoldings styles={styles} theme={theme} />

      {is404Error && (
        <>
          <SectionHeader title="Kite API credentials" />
          <Panel style={{ gap: space.lg }}>
            <Field
              label="API key"
              icon="key-outline"
              placeholder="Kite Connect API key"
              value={apiKey}
              onChangeText={(text) => {
                setApiKey(text);
                setFormError(null);
              }}
            />

            <Field
              label="API secret"
              icon="lock-closed-outline"
              placeholder="Kite Connect API secret"
              value={apiSecret}
              onChangeText={(text) => {
                setApiSecret(text);
                setFormError(null);
              }}
              secureTextEntry
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Ionicons name="power-outline" size={18} color={theme.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary }}>
                  Auto-login
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
                  Renew the session without the Kite web flow
                </Text>
              </View>
              <Switch value={enableAutoLogin} onValueChange={setEnableAutoLogin} color={theme.primary} />
            </View>

            {enableAutoLogin && (
              <>
                <Field
                  label="Zerodha user ID"
                  icon="person-outline"
                  placeholder="e.g. AB1234"
                  value={userName}
                  onChangeText={(text) => {
                    setUserName(text);
                    setFormError(null);
                  }}
                  autoCapitalize="characters"
                />
                <Field
                  label="Password"
                  icon="lock-closed-outline"
                  placeholder="Kite password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setFormError(null);
                  }}
                  secureTextEntry
                />
                <Field
                  label="TOTP secret"
                  icon="keypad-outline"
                  placeholder="Authenticator seed"
                  value={totpSecret}
                  onChangeText={(text) => {
                    setTotpSecret(text);
                    setFormError(null);
                  }}
                  secureTextEntry
                />
              </>
            )}

            {formError ? <Notice tone="down" message={formError} /> : null}

            <Button
              label="Save credentials"
              icon="checkmark-circle-outline"
              onPress={handleSaveZerodhaConfig}
              loading={savingConfig}
              disabled={savingConfig}
            />
          </Panel>
        </>
      )}
    </View>
  );
}
