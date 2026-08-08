import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, Text, TouchableRipple } from 'react-native-paper';
import { Tag } from '../ui/Feedback';
import { numeric, radius, space } from '../../theme/tokens';

export interface OrderDetail {
  readonly label: string;
  readonly value: string;
  /** Render the value in tabular figures — for quantities, amounts, percentages. */
  readonly mono?: boolean;
}

interface HistoryRowProps {
  readonly theme: any;
  readonly badgeLabel: string;
  readonly title: string;
  /** Labelled fields shown beneath the header, two per line. */
  readonly details: readonly OrderDetail[];
  readonly orderStatus?: string;
  readonly statusLabel?: string;
  readonly statusColor?: string;
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
 * One entry in the order book. A scheduled MTF order carries more fields than
 * fit on a single line, so rather than truncating them into a run-on subtitle
 * every field gets an explicit caption in a grid that wraps — nothing is
 * clipped, and the columns stay scannable down the list.
 */
export default function HistoryRow({
  theme,
  badgeLabel,
  title,
  details,
  orderStatus,
  statusLabel,
  statusColor,
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

  return (
    <View style={[styles.row, { borderBottomColor: theme.divider }]}>
      <View style={[styles.keyline, { backgroundColor: keyline }]} />

      <View style={styles.body}>
        <View style={styles.header}>
          <Tag label={badgeLabel} tone={badgeLabel === 'BUY' ? 'up' : 'accent'} />
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontSize: 15, fontWeight: '700', color: theme.textPrimary }}
          >
            {title}
          </Text>
          {displayStatus ? <Tag label={displayStatus.toUpperCase()} tone={tone} /> : null}

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

        <View style={[styles.grid, { backgroundColor: theme.surfaceAlt }]}>
          {details.map((detail) => (
            <View key={detail.label} style={styles.cell}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.7, color: theme.textTertiary }}>
                {detail.label}
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  detail.mono && numeric,
                  { fontSize: 13, fontWeight: '600', color: theme.textPrimary, marginTop: 2 },
                ]}
              >
                {detail.value}
              </Text>
            </View>
          ))}
        </View>

        {reason ? (
          <View style={[styles.reason, { backgroundColor: theme.downBackground, borderLeftColor: theme.down }]}>
            <Text style={{ fontSize: 12.5, color: theme.down, lineHeight: 18 }}>{reason}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
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
    paddingRight: space.xs,
    paddingVertical: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginTop: space.md,
    marginRight: space.sm,
    rowGap: space.md,
  },
  cell: {
    // Two per line; a long value wraps to a second line rather than clipping.
    width: '50%',
    paddingRight: space.sm,
  },
  reason: {
    marginTop: space.sm,
    marginRight: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.xs,
    borderLeftWidth: 3,
  },
  overflow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
