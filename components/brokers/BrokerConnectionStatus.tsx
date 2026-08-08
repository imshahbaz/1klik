import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { Panel } from '../ui/Panel';
import { Tag } from '../ui/Feedback';
import { radius, space } from '../../theme/tokens';

interface BrokerConnectionStatusProps {
  readonly styles?: any;
  readonly theme: any;
  readonly statusColor: string;
  readonly statusContent: React.ReactNode;
  readonly connectionText: string;
  readonly error: string | null;
  readonly idleSubtitle: string;
  readonly onToggleConfig: () => void;
}

/**
 * Session header for a broker. A status dot plus a leading keyline carries the
 * connection state at a glance; the gear toggles the credential form.
 */
export default function BrokerConnectionStatus({
  theme,
  statusColor,
  statusContent,
  connectionText,
  error,
  idleSubtitle,
  onToggleConfig,
}: BrokerConnectionStatusProps) {
  let tone: 'up' | 'down' | 'warn' = 'up';
  if (error) tone = 'down';
  else if (connectionText === 'LOADING') tone = 'warn';

  return (
    <Panel padded={false}>
      <View style={styles.head}>
        <View style={[styles.keyline, { backgroundColor: statusColor }]} />

        <View style={styles.headBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <View style={{ flex: 1, minWidth: 0 }}>{statusContent}</View>
            <Tag label={connectionText} tone={tone} />
          </View>

          <Text
            numberOfLines={2}
            style={{ fontSize: 12.5, color: theme.textSecondary, marginTop: 6 }}
          >
            {error || idleSubtitle}
          </Text>
        </View>

        <TouchableRipple
          onPress={onToggleConfig}
          borderless
          rippleColor={theme.ripple}
          style={styles.gear}
          accessibilityRole="button"
          accessibilityLabel="Toggle broker credentials"
        >
          <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
        </TouchableRipple>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyline: {
    width: 3,
    alignSelf: 'stretch',
  },
  headBody: {
    flex: 1,
    minWidth: 0,
    paddingLeft: space.lg,
    paddingVertical: space.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  gear: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.xs,
  },
});
