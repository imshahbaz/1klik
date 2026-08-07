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

/**
 * One order-history row, styled after the Zerodha Kite orders list: a coloured
 * side tag + bold symbol, broker badge, order status pill, target/strategy metadata,
 * and subtle Edit / Cancel actions. Shared between the MTF and Strategy sections of HistoryTab.
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
  // Determine status color & text
  const displayStatus = statusLabel || orderStatus;
  const statusBg = statusColor
    ? `${statusColor}1F`
    : displayStatus?.toUpperCase() === 'PENDING'
    ? '#FEF3C7'
    : displayStatus?.toUpperCase() === 'EXECUTED' || displayStatus?.toUpperCase() === 'COMPLETED'
    ? '#D1FAE5'
    : '#F3F4F6';
  const statusFg = statusColor
    ? statusColor
    : displayStatus?.toUpperCase() === 'PENDING'
    ? '#D97706'
    : displayStatus?.toUpperCase() === 'EXECUTED' || displayStatus?.toUpperCase() === 'COMPLETED'
    ? '#059669'
    : '#6B7280';

  return (
    <View style={styles.ohRow}>
      {/* Top Row: Type Tag, Symbol, Broker (Left) | Qty (Right) */}
      <View style={styles.ohTopRow}>
        <View style={styles.ohLeft}>
          <View style={[styles.ohSideTag, badgeContainerStyle]}>
            <Text style={[styles.ohSideTagText, badgeTextStyle]}>{badgeLabel}</Text>
          </View>
          <Text style={styles.ohSymbol} numberOfLines={1}>{title}</Text>
          {broker ? (
            <View style={styles.ohBrokerTag}>
              <Text style={styles.ohBrokerTagText} numberOfLines={1}>{broker}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.ohQty} numberOfLines={1}>{meta}</Text>
      </View>

      {/* Sub Row: Details / Strategy (Left) | Status Pill (Right) */}
      <View style={styles.ohSubRow}>
        <View style={{ flex: 1, marginRight: 6 }}>
          {strategyName || targetPercentage ? (
            <Text style={styles.ohMeta} numberOfLines={1}>
              {strategyName ? strategyName : ''}
              {strategyName && targetPercentage ? ' • ' : ''}
              {targetPercentage ? `Target: +${targetPercentage}%` : ''}
            </Text>
          ) : footerText ? (
            <Text style={styles.ohMeta} numberOfLines={1}>{footerText}</Text>
          ) : null}
        </View>

        {displayStatus ? (
          <View style={[styles.ohStatusTag, { backgroundColor: statusBg }]}>
            <Text style={[styles.ohStatusTagText, { color: statusFg }]} numberOfLines={1}>
              {displayStatus.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Date Row (shown if strategy info was in sub row) */}
      {(strategyName || targetPercentage) && footerText ? (
        <Text style={styles.ohDateText} numberOfLines={1}>{footerText}</Text>
      ) : null}

      {/* Failure Reason Text */}
      {reason ? (
        <Text style={styles.ohReason} numberOfLines={2}>Reason: {reason}</Text>
      ) : null}

      {/* Action Footer */}
      <View style={styles.ohActions}>
        <TouchableOpacity onPress={onEdit} style={styles.ohActionBtn} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="create-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.ohActionText, { color: theme.textSecondary }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDelete} style={styles.ohActionBtn} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="trash-outline" size={14} color={theme.danger} />
          <Text style={[styles.ohActionText, { color: theme.danger }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
