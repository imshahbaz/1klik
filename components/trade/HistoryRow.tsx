import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface HistoryRowProps {
  readonly styles: any;
  readonly theme: any;
  /** Type badge (e.g. "MTF BUY" / "AUTO-TRADE"). */
  readonly badgeLabel: string;
  readonly badgeContainerStyle: any;
  readonly badgeTextStyle: any;
  /** Primary identifier — symbol or strategy name. */
  readonly title: string;
  /** Secondary metric — share count or amount. */
  readonly meta: string;
  /** Order status; a badge is shown for any value other than COMPLETED. */
  readonly status?: string;
  readonly statusContainerStyle: any;
  readonly statusTextStyle: any;
  readonly footerText: string;
  readonly footerTextStyle?: any;
  readonly reason?: string;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

/**
 * One order-history row. Shared between the MTF and Strategy sections of
 * HistoryTab, which previously duplicated this ~70-line block almost verbatim;
 * the per-section differences are now passed in as props.
 */
export default function HistoryRow({
  styles,
  theme,
  badgeLabel,
  badgeContainerStyle,
  badgeTextStyle,
  title,
  meta,
  status,
  statusContainerStyle,
  statusTextStyle,
  footerText,
  footerTextStyle,
  reason,
  onEdit,
  onDelete,
}: HistoryRowProps) {
  return (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.historyLeftInfo}>
          <View style={[styles.historyTypeBadge, badgeContainerStyle]}>
            <Text style={[styles.historyTypeText, badgeTextStyle]}>{badgeLabel}</Text>
          </View>
          <Text style={styles.historySymbolText}>{title}</Text>
          <Text style={styles.historyQtyText}>{meta}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={onEdit} style={{ padding: 4 }} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete} style={{ padding: 4 }} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
          </TouchableOpacity>

          {status === 'COMPLETED' ? null : (
            <View style={[styles.statusBadge, statusContainerStyle] as any}>
              <Text style={[styles.statusBadgeText, statusTextStyle] as any}>{status}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.historyFooter}>
        <Text style={[styles.historyPriceText, footerTextStyle] as any}>{footerText}</Text>
      </View>
      {reason ? <Text style={styles.historyRejectReason}>Reason: {reason}</Text> : null}
    </View>
  );
}
