import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { overline, radius, space } from '../../theme/tokens';

interface PanelProps {
  readonly children: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  /** Applies the standard 16dp inset. Turn off for full-bleed lists. */
  readonly padded?: boolean;
  /** One tone up from the page — for inputs and nested blocks. */
  readonly raised?: boolean;
  readonly onPress?: () => void;
}

/**
 * Flat content surface: hairline border, small radius, no shadow. Panels group
 * related data without the floating-card look of a web dashboard.
 */
export function Panel({ children, style, padded = true, raised = false, onPress }: PanelProps) {
  const { theme } = useTheme();

  const base: ViewStyle = {
    backgroundColor: raised ? theme.surfaceAlt : theme.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    overflow: 'hidden',
  };

  if (onPress) {
    return (
      <TouchableRipple onPress={onPress} rippleColor={theme.ripple} style={[base, style]}>
        <View style={padded ? { padding: space.lg } : undefined}>{children}</View>
      </TouchableRipple>
    );
  }

  return <View style={[base, padded && { padding: space.lg }, style]}>{children}</View>;
}

interface SectionHeaderProps {
  readonly title: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly style?: StyleProp<ViewStyle>;
}

/** Uppercase micro-heading that separates groups of rows. */
export function SectionHeader({ title, actionLabel, onAction, style }: SectionHeaderProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={[overline, { color: theme.textTertiary }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Text
          onPress={onAction}
          style={[overline, { color: theme.primary }]}
          accessibilityRole="button"
        >
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

/** Hairline rule matched to the current surface. */
export function Hairline({ inset = 0 }: { readonly inset?: number }) {
  const { theme } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, marginLeft: inset, backgroundColor: theme.divider }} />;
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: space.sm,
    paddingTop: space.lg,
  },
});
