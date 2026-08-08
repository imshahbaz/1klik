import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

export interface BrokerStatusDisplay {
  color: string;
  text: 'CONNECTED' | 'LOADING' | 'INACTIVE';
  content: React.ReactNode;
}

/**
 * Derives the connection-status display (accent color, badge text, title row)
 * from a broker's loading/error/session state. Pure — previously this exact
 * block was duplicated for Zerodha and Rupeezy in the brokers screen render.
 */
export function getBrokerStatusDisplay(
  loading: boolean,
  error: string | null,
  user: any,
  theme: any,
  _styles?: any
): BrokerStatusDisplay {
  let color = theme.up;
  if (loading) color = theme.warningText;
  else if (error) color = theme.down;

  let text: BrokerStatusDisplay['text'] = 'CONNECTED';
  if (loading) text = 'LOADING';
  else if (error) text = 'INACTIVE';

  const title = { fontSize: 15, fontWeight: '700' as const, color: theme.textPrimary };

  let content: React.ReactNode;
  if (loading) {
    content = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ActivityIndicator size={14} color={theme.primary} />
        <Text style={title}>Connecting…</Text>
      </View>
    );
  } else if (error) {
    content = (
      <Text style={[title, { color: theme.down }]} numberOfLines={1}>
        Session inactive
      </Text>
    );
  } else {
    content = (
      <Text style={title} numberOfLines={1}>
        {typeof user === 'string' ? 'Active session' : user?.userName || user?.name || 'Active session'}
      </Text>
    );
  }

  return { color, text, content };
}
