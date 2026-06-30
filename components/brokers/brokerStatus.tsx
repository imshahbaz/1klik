import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

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
  styles: any
): BrokerStatusDisplay {
  let color = theme.success;
  if (loading) color = theme.primary;
  else if (error) color = theme.danger;

  let text: BrokerStatusDisplay['text'] = 'CONNECTED';
  if (loading) text = 'LOADING';
  else if (error) text = 'INACTIVE';

  let content: React.ReactNode;
  if (loading) {
    content = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={styles.connectionTitle}>Connecting...</Text>
      </View>
    );
  } else if (error) {
    content = (
      <Text style={[styles.connectionTitle, { color: theme.danger }]} numberOfLines={1}>
        Connection Inactive
      </Text>
    );
  } else {
    content = (
      <Text style={styles.connectionTitle} numberOfLines={1}>
        {typeof user === 'string' ? 'Active Session' : (user?.userName || user?.name || 'Active Session')}
      </Text>
    );
  }

  return { color, text, content };
}
