import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { radius, space } from '../../theme/tokens';

interface TagProps {
  readonly label: string;
  readonly tone?: 'neutral' | 'accent' | 'up' | 'down' | 'warn' | 'info';
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Square-ish status chip. Kept rectangular rather than pill-shaped so it reads
 * as a data label next to a symbol, not as a tappable web badge.
 */
export function Tag({ label, tone = 'neutral', style }: TagProps) {
  const { theme } = useTheme();
  const tones = {
    neutral: { bg: theme.chipBackground, fg: theme.textSecondary },
    accent: { bg: theme.primaryBackground, fg: theme.primary },
    up: { bg: theme.upBackground, fg: theme.up },
    down: { bg: theme.downBackground, fg: theme.down },
    warn: { bg: theme.warningBackground, fg: theme.warningText },
    info: { bg: theme.infoBackground, fg: theme.infoText },
  }[tone];

  return (
    <View style={[styles.tag, { backgroundColor: tones.bg }, style]}>
      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: tones.fg }}>
        {label}
      </Text>
    </View>
  );
}

interface EmptyStateProps {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly title: string;
  readonly message?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly tone?: 'neutral' | 'error';
}

/** Centred placeholder for empty lists and failed loads. */
export function EmptyState({ icon, title, message, actionLabel, onAction, tone = 'neutral' }: EmptyStateProps) {
  const { theme } = useTheme();
  const tint = tone === 'error' ? theme.danger : theme.textTertiary;

  return (
    <View style={styles.empty}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: tone === 'error' ? theme.dangerBackground : theme.chipBackground },
        ]}
      >
        <Ionicons name={icon} size={24} color={tint} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginTop: space.md }}>
        {title}
      </Text>
      {message ? (
        <Text
          style={{
            fontSize: 13,
            color: theme.textSecondary,
            textAlign: 'center',
            marginTop: space.xs,
            lineHeight: 19,
            maxWidth: 280,
          }}
        >
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableRipple
          onPress={onAction}
          rippleColor={theme.ripple}
          style={[styles.emptyAction, { borderColor: theme.border }]}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primary, letterSpacing: 0.4 }}>
            {actionLabel}
          </Text>
        </TouchableRipple>
      ) : null}
    </View>
  );
}

interface NoticeProps {
  readonly message: string;
  readonly tone: 'up' | 'down' | 'warn' | 'info';
}

/** Inline banner for save confirmations and form-level errors. */
export function Notice({ message, tone }: NoticeProps) {
  const { theme } = useTheme();
  const tones = {
    up: { bg: theme.upBackground, fg: theme.up, icon: 'checkmark-circle' as const },
    down: { bg: theme.downBackground, fg: theme.down, icon: 'alert-circle' as const },
    warn: { bg: theme.warningBackground, fg: theme.warningText, icon: 'warning' as const },
    info: { bg: theme.infoBackground, fg: theme.infoText, icon: 'information-circle' as const },
  }[tone];

  return (
    <View style={[styles.notice, { backgroundColor: tones.bg, borderLeftColor: tones.fg }]}>
      <Ionicons name={tones.icon} size={16} color={tones.fg} />
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: tones.fg, marginLeft: space.sm }}>
        {message}
      </Text>
    </View>
  );
}

/** Placeholder block shown while list data loads. */
export function Skeleton({ height = 14, width = '100%' }: { readonly height?: number; readonly width?: any }) {
  const { theme } = useTheme();
  return <View style={{ height, width, borderRadius: radius.xs, backgroundColor: theme.surfaceAlt }} />;
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: space.xl,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: {
    marginTop: space.lg,
    paddingHorizontal: space.xl,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
  },
});
