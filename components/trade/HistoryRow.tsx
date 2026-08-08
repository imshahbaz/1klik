import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, Text, TouchableRipple } from 'react-native-paper';
import { Tag } from '../ui/Feedback';
import { numeric, space } from '../../theme/tokens';

interface HistoryRowProps {
  readonly styles?: any;
  readonly theme: any;
  readonly badgeLabel: string;
  readonly badgeContainerStyle?: any;
  readonly badgeTextStyle?: any;
  readonly title: string;
  readonly meta: string;
  readonly footerText: string;
  readonly broker?: string;
  readonly orderStatus?: string;
  readonly statusLabel?: string;
  readonly statusColor?: string;
  readonly strategyName?: string;
  readonly targetPercentage?: string;
  readonly reason?: string;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

type Tone = 'neutral' | 'up' | 'down' | 'warn';

function resolveTone(status: string | undefined): Tone {
  const upper = status?.toUpperCase();
  if (upper === 'PENDING' || upper === 'SCHEDULED') return 'warn';
  if (upper === 'EXECUTED' || upper === 'COMPLETED') return 'up';
  if (upper === 'REJECTED' || upper === 'CONFLICT' || upper === 'CANCELLED') return 'down';
  return 'neutral';
}

/**
 * One line of the order book. A coloured keyline on the leading edge encodes
 * status so the book can be skimmed vertically, and row actions live behind an
 * overflow menu — the Android list-item convention — instead of taking up two
 * permanent buttons per row.
 */
export default function HistoryRow({
  theme,
  badgeLabel,
  title,
  meta,
  footerText,
  broker,
  orderStatus,
  statusLabel,
  statusColor,
  strategyName,
  targetPercentage,
  reason,
  onEdit,
  onDelete,
}: HistoryRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayStatus = statusLabel || orderStatus;
  const tone = resolveTone(displayStatus);
  const keyline =
    statusColor ||
    { neutral: theme.border, up: theme.up, down: theme.down, warn: theme.warningText }[tone];

  const detail = [strategyName, targetPercentage ? `+${targetPercentage}%` : null, footerText]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.row, { borderBottomColor: theme.divider }]}>
      <View style={[styles.keyline, { backgroundColor: keyline }]} />

      <View style={styles.body}>
        <View style={styles.line}>
          <Tag label={badgeLabel} tone={badgeLabel === 'BUY' ? 'up' : 'accent'} />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 14.5, fontWeight: '700', color: theme.textPrimary }}>
            {title}
          </Text>
          <Text style={[numeric, { fontSize: 14, fontWeight: '700', color: theme.textPrimary }]}>
            {meta}
          </Text>
        </View>

        <View style={[styles.line, { marginTop: 5 }]}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: theme.textSecondary }}>
            {broker ? `${broker} · ` : ''}
            {detail || '—'}
          </Text>
          {displayStatus ? <Tag label={displayStatus.toUpperCase()} tone={tone} /> : null}
        </View>

        {reason ? (
          <Text style={{ fontSize: 12, color: theme.down, marginTop: 5 }} numberOfLines={2}>
            {reason}
          </Text>
        ) : null}
      </View>

      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        anchor={
          <TouchableRipple
            onPress={() => setMenuOpen(true)}
            borderless
            rippleColor={theme.ripple}
            style={styles.overflow}
            accessibilityRole="button"
            accessibilityLabel={`Actions for ${title}`}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={theme.textTertiary} />
          </TouchableRipple>
        }
      >
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            onEdit();
          }}
          title="Modify"
          leadingIcon="pencil-outline"
        />
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            onDelete();
          }}
          title="Cancel order"
          leadingIcon="trash-can-outline"
          titleStyle={{ color: theme.danger }}
        />
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  keyline: {
    width: 3,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingLeft: space.md,
    paddingVertical: space.md,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  overflow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: space.xs,
  },
});
