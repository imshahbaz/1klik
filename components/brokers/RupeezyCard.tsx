import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
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
    <View>
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
  );
}
