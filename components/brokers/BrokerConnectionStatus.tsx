import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface BrokerConnectionStatusProps {
  readonly styles: any;
  readonly theme: any;
  /** Accent color for the card's left border (reflects connection state). */
  readonly statusColor: string;
  /** Title row content (e.g. active session name or a loading indicator). */
  readonly statusContent: React.ReactNode;
  /** Badge label such as CONNECTED / LOADING / INACTIVE. */
  readonly connectionText: string;
  /** Error/subtitle text; falsy renders the default "secured" message. */
  readonly error: string | null;
  /** Fallback subtitle shown when there's no error. */
  readonly idleSubtitle: string;
  /** Toggles the config panel for this broker. */
  readonly onToggleConfig: () => void;
}

/**
 * Shared connection-status header used by every broker card. Previously this
 * ~30-line block was duplicated verbatim in ZerodhaCard and RupeezyCard.
 */
export default function BrokerConnectionStatus({
  styles,
  theme,
  statusColor,
  statusContent,
  connectionText,
  error,
  idleSubtitle,
  onToggleConfig,
}: BrokerConnectionStatusProps) {
  return (
    <View style={[styles.connectionCard, { borderLeftColor: statusColor }]}>
      <View style={{ gap: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={[styles.brandContainer, { marginRight: 0 }]}>
            <View style={styles.kiteLogoPlaceholder}>
              <Ionicons name="link-outline" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              {statusContent}
            </View>
          </View>
          <TouchableOpacity style={styles.blackCardConfigBtn} onPress={onToggleConfig}>
            <Ionicons name="settings-outline" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.borderLight, paddingTop: 8 }}>
          <Text style={[styles.connectionSubtitle, { marginTop: 0, flex: 1, marginRight: 12 }]} numberOfLines={2}>
            {error || idleSubtitle}
          </Text>
          <View style={error ? styles.inactiveStatusBadge : styles.activeStatusBadge}>
            <View style={error ? styles.inactiveDot : styles.activeDot} />
            <Text style={error ? styles.inactiveStatusText : styles.activeStatusText}>
              {connectionText}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
