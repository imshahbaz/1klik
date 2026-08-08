import React from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, Button as PaperButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '../../context/AlertContext';
import FormInput from '../common/FormInput';
import BrokerConnectionStatus from './BrokerConnectionStatus';

interface RupeezyCardProps {
  readonly styles: any;
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
  styles,
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
  setShowRupeezyWebView
}: RupeezyCardProps) {
  return (
    <View style={{ gap: 16 }}>
      <BrokerConnectionStatus
        styles={styles}
        theme={theme}
        statusColor={rupeezyStatusColor}
        statusContent={rupeezyStatusContent}
        connectionText={rupeezyConnectionText}
        error={rupeezyError}
        idleSubtitle="Secured Rupeezy Connection"
        onToggleConfig={() => setIsRupeezy404Error(!isRupeezy404Error)}
      />

      {/* Login Action Card if disconnected but config exists */}
      {!isRupeezy404Error && isRupeezyTokenExpired && (
        <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8 }}>
          <Card.Content style={{ gap: 8 }}>
            <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
              Reconnect Required
            </PaperText>
            <PaperText variant="bodySmall" style={{ color: theme.textSecondary }}>
              Your Rupeezy session has expired. Click below to re-authenticate.
            </PaperText>

            <PaperButton
              mode="contained"
              onPress={() => {
                if (!rupeezyAppId) {
                  CustomAlert.alert("Missing App ID", "No saved App ID found. Please save your API config first.");
                  return;
                }
                setShowRupeezyWebView(true);
              }}
              buttonColor={theme.primary}
              textColor="#ffffff"
              icon={({ size }) => <Ionicons name="flash-outline" size={size || 18} color="#ffffff" />}
              style={{ borderRadius: 12, marginTop: 8 }}
              contentStyle={{ height: 48 }}
            >
              Connect to Rupeezy
            </PaperButton>
          </Card.Content>
        </Card>
      )}

      {/* Config Form */}
      {isRupeezy404Error && (
        <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8 }}>
          <Card.Content style={{ gap: 12 }}>
            <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
              Rupeezy Configuration
            </PaperText>
            <PaperText variant="bodySmall" style={{ color: theme.textSecondary, marginBottom: 8 }}>
              Enter your App ID and API Secret below.
            </PaperText>

            <FormInput
              styles={styles}
              theme={theme}
              label="APP ID *"
              icon="apps-outline"
              placeholder="Enter App ID"
              value={rupeezyAppId}
              onChangeText={(text) => { setRupeezyAppId(text); setRupeezyError(null); }}
            />

            <FormInput
              styles={styles}
              theme={theme}
              label="API SECRET *"
              icon="lock-closed-outline"
              placeholder="Enter API Secret"
              value={rupeezyApiSecret}
              onChangeText={(text) => { setRupeezyApiSecret(text); setRupeezyError(null); }}
              secureTextEntry
            />

            {rupeezyError && (
              <PaperText variant="bodySmall" style={{ color: theme.danger, fontWeight: '600' }}>
                {rupeezyError}
              </PaperText>
            )}

            <PaperButton
              mode="contained"
              onPress={handleSaveRupeezyConfig}
              disabled={rupeezySaving}
              loading={rupeezySaving}
              buttonColor={theme.primary}
              textColor="#ffffff"
              icon={({ size }) => <Ionicons name="checkmark-circle-outline" size={size || 18} color="#ffffff" />}
              style={{ borderRadius: 12, marginTop: 8 }}
              contentStyle={{ height: 48 }}
            >
              Save Rupeezy Config
            </PaperButton>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}
