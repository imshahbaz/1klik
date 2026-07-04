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
  /** Grey meta line under the title (target date / order date). */
  readonly footerText: string;
  readonly reason?: string;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

/**
 * One order-history row, styled after the Zerodha Kite orders list: a coloured
 * side tag + bold symbol, a grey meta line with the quantity/amount aligned
 * right, and subtle Edit / Cancel actions. Shared between the MTF and Strategy
 * sections of HistoryTab.
 */
export default function HistoryRow({
  styles,
  theme,
  badgeLabel,
  badgeContainerStyle,
  badgeTextStyle,
  title,
  meta,
  footerText,
  reason,
  onEdit,
  onDelete,
}: HistoryRowProps) {
  return (
    <View style={styles.ohRow}>
      <View style={styles.ohTopRow}>
        <View style={styles.ohLeft}>
          <View style={[styles.ohSideTag, badgeContainerStyle]}>
            <Text style={[styles.ohSideTagText, badgeTextStyle]}>{badgeLabel}</Text>
          </View>
          <Text style={styles.ohSymbol} numberOfLines={1}>{title}</Text>
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
