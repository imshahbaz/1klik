import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Card, Chip, Button as PaperButton, Text as PaperText } from 'react-native-paper';

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

function resolveStatusColors(
  status: string | undefined,
  statusColor: string | undefined,
  theme: any
): { bg: string; fg: string } {
  if (statusColor) {
    return { bg: `${statusColor}22`, fg: statusColor };
  }
  const upper = status?.toUpperCase();
  if (upper === 'PENDING') {
    return { bg: theme.warningBackground || 'rgba(245, 158, 11, 0.2)', fg: theme.warningText || '#d97706' };
  }
  if (upper === 'EXECUTED' || upper === 'COMPLETED') {
    return { bg: theme.successBackground || 'rgba(16, 185, 129, 0.2)', fg: theme.success || '#10b981' };
  }
  return { bg: theme.borderLight || '#1c1c1e', fg: theme.textSecondary || '#94a3b8' };
}

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
  const displayStatus = statusLabel || orderStatus;
  const { bg: statusBg, fg: statusFg } = resolveStatusColors(displayStatus, statusColor, theme);
  const hasStrategy = Boolean(strategyName || targetPercentage);

  return (
    <Card style={{ backgroundColor: theme.card, borderRadius: 16, marginBottom: 10, elevation: 2 }}>
      <Card.Content style={{ gap: 8 }}>
        {/* Top Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Chip compact style={{ backgroundColor: theme.primaryBackground }} textStyle={{ color: theme.primary, fontWeight: '800', fontSize: 10 }}>
              {badgeLabel}
            </Chip>
            <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }} numberOfLines={1}>
              {title}
            </PaperText>
            {broker ? (
              <Chip compact style={{ backgroundColor: theme.borderLight }} textStyle={{ color: theme.textSecondary, fontSize: 10 }}>
                {broker}
              </Chip>
            ) : null}
          </View>
          <PaperText variant="titleSmall" style={{ fontWeight: '800', color: theme.textPrimary }}>
            {meta}
          </PaperText>
        </View>

        {/* Strategy / Status Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            {hasStrategy ? (
              <PaperText variant="bodySmall" style={{ color: theme.textSecondary, fontWeight: '600' }} numberOfLines={1}>
                {strategyName} {strategyName && targetPercentage ? '• ' : ''}{targetPercentage ? `Target: +${targetPercentage}%` : ''}
              </PaperText>
            ) : footerText ? (
              <PaperText variant="bodySmall" style={{ color: theme.textSecondary }} numberOfLines={1}>
                {footerText}
              </PaperText>
            ) : null}
          </View>

          {displayStatus ? (
            <Chip compact style={{ backgroundColor: statusBg }} textStyle={{ color: statusFg, fontWeight: '800', fontSize: 10 }}>
              {displayStatus.toUpperCase()}
            </Chip>
          ) : null}
        </View>

        {hasStrategy && footerText ? (
          <PaperText variant="labelSmall" style={{ color: theme.textSecondary }}>
            {footerText}
          </PaperText>
        ) : null}

        {reason ? (
          <PaperText variant="bodySmall" style={{ color: theme.danger, fontWeight: '600' }}>
            Reason: {reason}
          </PaperText>
        ) : null}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <PaperButton
            compact
            mode="text"
            onPress={onEdit}
            icon={({ size }) => <Ionicons name="create-outline" size={size || 14} color={theme.textSecondary} />}
            textColor={theme.textSecondary}
          >
            Edit
          </PaperButton>

          <PaperButton
            compact
            mode="text"
            onPress={onDelete}
            icon={({ size }) => <Ionicons name="trash-outline" size={size || 14} color={theme.danger} />}
            textColor={theme.danger}
          >
            Cancel
          </PaperButton>
        </View>
      </Card.Content>
    </Card>
  );
}
