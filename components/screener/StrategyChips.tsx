import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { radius, space } from '../../theme/tokens';

function formatSuccessRate(rate: unknown): string | null {
  const num = typeof rate === 'string' ? Number.parseFloat(rate) : rate;
  if (typeof num !== 'number' || !Number.isFinite(num)) return null;
  if (num <= 0) return null;
  const rounded = Math.round(num);
  return `${rounded}%`;
}

interface StrategyChipsProps {
  readonly strategies: any[];
  readonly selectedStrategy: string | null;
  readonly onSelect: (name: string) => void;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onRetry: () => void;
  readonly getStrategyMetadata: (name: string) => { iconName: any; badgeText: string };
}

/**
 * Horizontal filter rail. A scrolling chip row is the standard Android pattern
 * for switching a list's filter — it keeps every option one tap away, unlike
 * the dropdown it replaces, which hid them behind an extra tap and an overlay.
 */
export default function StrategyChips({
  strategies,
  selectedStrategy,
  onSelect,
  loading,
  error,
  onRetry,
  getStrategyMetadata,
}: StrategyChipsProps) {
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={[styles.status, { borderBottomColor: theme.border }]}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginLeft: space.sm }}>
          Loading strategies…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <TouchableRipple onPress={onRetry} rippleColor={theme.ripple} style={[styles.status, { borderBottomColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="refresh" size={15} color={theme.danger} />
          <Text style={{ color: theme.danger, fontSize: 13, marginLeft: space.sm, fontWeight: '600' }}>
            {error} — tap to retry
          </Text>
        </View>
      </TouchableRipple>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      keyboardShouldPersistTaps="handled"
      // The rail is docked under the app bar, so it carries the separating rule.
      style={[styles.dock, { borderBottomColor: theme.border }]}
    >
      {strategies.map((item, index) => {
        const active = selectedStrategy === item.name;
        const metadata = getStrategyMetadata(item.name);
        const rate = formatSuccessRate(item.successRate);

        // Selected fill on a plain View, ripple nested — see the note in Panel.
        return (
          <View
            key={`${item.name}-${index}`}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.primary : theme.surface,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}
          >
            <TouchableRipple
              onPress={() => onSelect(item.name)}
              rippleColor={theme.ripple}
              style={styles.chipFill}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
            <View style={styles.chipInner}>
              <Ionicons
                name={metadata.iconName}
                size={14}
                color={active ? theme.buttonPrimaryText : theme.textSecondary}
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '700',
                  letterSpacing: 0.3,
                  color: active ? theme.buttonPrimaryText : theme.textPrimary,
                }}
              >
                {item.name}
              </Text>
              {rate ? (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: active ? theme.buttonPrimaryText : theme.up,
                    opacity: active ? 0.85 : 1,
                  }}
                >
                  {rate}
                </Text>
                ) : null}
              </View>
            </TouchableRipple>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
  },
  rail: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
  },
  chip: {
    height: 36,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  chipFill: {
    flex: 1,
    justifyContent: 'center',
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
