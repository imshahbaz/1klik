import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, Chip, IconButton, Surface } from 'react-native-paper';

interface BrokerConnectionStatusProps {
  readonly styles: any;
  readonly theme: any;
  readonly statusColor: string;
  readonly statusContent: React.ReactNode;
  readonly connectionText: string;
  readonly error: string | null;
  readonly idleSubtitle: string;
  readonly onToggleConfig: () => void;
}

export default function BrokerConnectionStatus({
  theme,
  statusColor,
  statusContent,
  connectionText,
  error,
  idleSubtitle,
  onToggleConfig,
}: BrokerConnectionStatusProps) {
  return (
    <Card style={{ backgroundColor: theme.card, borderRadius: 24, borderLeftWidth: 6, borderLeftColor: statusColor, elevation: 3 }}>
      <Card.Content style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Surface style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primaryBackground, alignItems: 'center', justifyContent: 'center' }} elevation={0}>
              <Ionicons name="link-outline" size={20} color={theme.primary} />
            </Surface>
            <View style={{ flex: 1 }}>
              {statusContent}
            </View>
          </View>
          <IconButton
            icon={({ size, color }) => <Ionicons name="settings-outline" size={size || 18} color={color || theme.textSecondary} />}
            onPress={onToggleConfig}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.borderLight, paddingTop: 10 }}>
          <PaperText variant="bodySmall" style={{ color: theme.textSecondary, flex: 1, marginRight: 12 }} numberOfLines={2}>
            {error || idleSubtitle}
          </PaperText>
          <Chip
            compact
            style={{ backgroundColor: error ? theme.dangerBackground : theme.successBackground }}
            textStyle={{ color: error ? theme.danger : theme.success, fontWeight: '800', fontSize: 11 }}
          >
            {connectionText}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );
}
