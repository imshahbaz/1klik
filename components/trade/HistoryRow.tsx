import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface HistoryRowProps {
  readonly styles: any;
  readonly theme: any;
  /** Type tag (e.g. "MTF BUY" / "AUTO"). */
  readonly badgeLabel: string;
  readonly badgeContainerStyle: any;
  readonly badgeTextStyle: any;
  /** Primary identifier — symbol or strategy name. */
  readonly title: string;
  /** Secondary metric shown at the right — share count or amount. */
  readonly meta: string;
  /** Order status (COMPLETED / CONFLICT / REJECTED / …). */
  readonly status?: string;
  /** Grey meta line under the title (target date / order date). */
  readonly footerText: string;
  readonly reason?: string;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

/** Maps an order status to a Kite-style label + colour. */
const resolveStatus = (theme: any, status?: string) => {
  switch (status) {
    case 'COMPLETED':
      return { label: 'COMPLETE', color: theme.success };
    case 'CONFLICT':
      return { label: 'CONFLICT', color: theme.warningText };
    case 'REJECTED':
      return { label: 'REJECTED', color: theme.danger };
    default:
      return { label: status || 'PENDING', color: theme.textSecondary };
  }
};

/**
 * One order-history row, styled after the Zerodha Kite orders list: a coloured
 * side tag + bold symbol with a status dot/label on the right, a grey meta line
 * with the quantity/amount aligned right, and subtle Edit / Cancel actions.
 * Shared between the MTF and Strategy sections of HistoryTab.
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
  footerText,
  reason,
  onEdit,
  onDelete,
}: HistoryRowProps) {
  const st = resolveStatus(theme, status);

  return (
    <View style={styles.ohRow}>
      <View style={styles.ohTopRow}>
        <View style={styles.ohLeft}>
          <View style={[styles.ohSideTag, badgeContainerStyle]}>
            <Text style={[styles.ohSideTagText, badgeTextStyle]}>{badgeLabel}</Text>
          </View>
          <Text style={styles.ohSymbol} numberOfLines={1}>{title}</Text>
        </View>

        <View style={styles.ohStatusWrap}>
          <View style={[styles.ohStatusDot, { backgroundColor: st.color }]} />
          <Text style={[styles.ohStatusText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      <View style={styles.ohSubRow}>
        <Text style={styles.ohMeta} numberOfLines={1}>{footerText}</Text>
        <Text style={styles.ohQty}>{meta}</Text>
      </View>

      {reason ? <Text style={styles.ohReason}>Reason: {reason}</Text> : null}

      <View style={styles.ohActions}>
        <TouchableOpacity onPress={onEdit} style={styles.ohActionBtn} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="create-outline" size={15} color={theme.textSecondary} />
          <Text style={[styles.ohActionText, { color: theme.textSecondary }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDelete} style={styles.ohActionBtn} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="trash-outline" size={15} color={theme.danger} />
          <Text style={[styles.ohActionText, { color: theme.danger }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
