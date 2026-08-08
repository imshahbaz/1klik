import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { CustomAlert } from '../../context/AlertContext';
import BrokerConnectionStatus from './BrokerConnectionStatus';
import Button from '../ui/Button';
import { Field } from '../ui/Field';
import { Notice } from '../ui/Feedback';
import { Panel, SectionHeader } from '../ui/Panel';
import { space } from '../../theme/tokens';

interface RupeezyCardProps {
  readonly styles?: any;
  readonly theme: any;
  readonly rupeezyStatusColor: string;
  readonly rupeezyStatusContent: React.ReactNode;
  readonly rupeezyConnectionText: string;
  readonly rupeezyError: string | null;
  readonly isRupeezy404Error: boolean;
  readonly setIsRupeezy404Error: (val: boolean) => void;
  readonly isRupeezyTokenExpired: boolean;
  readonly rupeezyAppId: string;
  readonly setRupeezyAppId: (val: string) => void;
  readonly rupeezyApiSecret: string;
  readonly setRupeezyApiSecret: (val: string) => void;
  readonly setShowRupeezyWebView: (val: boolean) => void;
  readonly rupeezySaving: boolean;
  readonly handleSaveRupeezyConfig: () => void;
  readonly setRupeezyError: (val: string | null) => void;
}

export default function RupeezyCard({
  theme,
  rupeezyStatusColor,
  rupeezyStatusContent,
  rupeezyConnectionText,
  rupeezyError,
  isRupeezy404Error,
  setIsRupeezy404Error,
  isRupeezyTokenExpired,
  rupeezyAppId,
  setRupeezyAppId,
  rupeezyApiSecret,
  setRupeezyApiSecret,
  rupeezySaving,
  handleSaveRupeezyConfig,
  setRupeezyError,
  setShowRupeezyWebView,
}: RupeezyCardProps) {
  return (
    <View>
      <SectionHeader title="Session" />
      <BrokerConnectionStatus
        theme={theme}
        statusColor={rupeezyStatusColor}
        statusContent={rupeezyStatusContent}
        connectionText={rupeezyConnectionText}
        error={rupeezyError}
        idleSubtitle="Rupeezy Flow · orders route through this session"
        onToggleConfig={() => setIsRupeezy404Error(!isRupeezy404Error)}
      />

      {!isRupeezy404Error && isRupeezyTokenExpired && (
        <View style={{ marginTop: space.md }}>
          <Panel style={{ gap: space.md }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
              Reconnect required
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19 }}>
              Your Rupeezy session has expired. Re-authenticate to resume placing orders.
            </Text>
            <Button
              label="Connect to Rupeezy"
              icon="flash-outline"
              onPress={() => {
                if (!rupeezyAppId) {
                  CustomAlert.alert(
                    'Missing App ID',
                    'No saved App ID found. Please save your API config first.'
                  );
                  return;
                }
                setShowRupeezyWebView(true);
              }}
            />
          </Panel>
        </View>
      )}

      {isRupeezy404Error && (
        <>
          <SectionHeader title="Rupeezy API credentials" />
          <Panel style={{ gap: space.lg }}>
            <Field
              label="App ID"
              icon="apps-outline"
              placeholder="Rupeezy application ID"
              value={rupeezyAppId}
              onChangeText={(text) => {
                setRupeezyAppId(text);
                setRupeezyError(null);
              }}
            />

            <Field
              label="API secret"
              icon="lock-closed-outline"
              placeholder="Rupeezy API secret"
              value={rupeezyApiSecret}
              onChangeText={(text) => {
                setRupeezyApiSecret(text);
                setRupeezyError(null);
              }}
              secureTextEntry
            />

            {rupeezyError ? <Notice tone="down" message={rupeezyError} /> : null}

            <Button
              label="Save credentials"
              icon="checkmark-circle-outline"
              onPress={handleSaveRupeezyConfig}
              loading={rupeezySaving}
              disabled={rupeezySaving}
            />
          </Panel>
        </>
      )}
    </View>
  );
}
