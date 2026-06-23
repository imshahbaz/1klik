import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '../../context/AlertContext';

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
      {/* Connection Status Card */}
      <View style={[styles.connectionCard, { borderLeftColor: rupeezyStatusColor }]}>
        <View style={{ gap: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={[styles.brandContainer, { marginRight: 0 }]}>
              <View style={styles.kiteLogoPlaceholder}>
                <Ionicons name="link-outline" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                {rupeezyStatusContent}
              </View>
            </View>
            <TouchableOpacity style={styles.blackCardConfigBtn} onPress={() => setIsRupeezy404Error(!isRupeezy404Error)}>
              <Ionicons name="settings-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.borderLight, paddingTop: 8 }}>
            <Text style={[styles.connectionSubtitle, { marginTop: 0, flex: 1, marginRight: 12 }]} numberOfLines={2}>
              {rupeezyError || 'Secured Rupeezy Connection'}
            </Text>
            <View style={rupeezyError ? styles.inactiveStatusBadge : styles.activeStatusBadge}>
              <View style={rupeezyError ? styles.inactiveDot : styles.activeDot} />
              <Text style={rupeezyError ? styles.inactiveStatusText : styles.activeStatusText}>
                {rupeezyConnectionText}
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
  );
}
