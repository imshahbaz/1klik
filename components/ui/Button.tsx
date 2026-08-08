import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ActivityIndicator, Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { radius, size, space } from '../../theme/tokens';

interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly compact?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * App button. Corners are kept small rather than fully pill-shaped so CTAs
 * align with the squared-off fields and panels around them; height matches the
 * 52dp field so stacked forms stay on a single rhythm.
 */
export default function Button({
  label,
  onPress,
  variant = 'filled',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const inert = disabled || loading;

  const palette = {
    filled: { bg: theme.primary, fg: theme.buttonPrimaryText, border: 'transparent' },
    tonal: { bg: theme.primaryBackground, fg: theme.primary, border: 'transparent' },
    outlined: { bg: 'transparent', fg: theme.textPrimary, border: theme.border },
    text: { bg: 'transparent', fg: theme.primary, border: 'transparent' },
    danger: { bg: theme.danger, fg: '#ffffff', border: 'transparent' },
  }[variant];

  const bg = inert && variant !== 'text' && variant !== 'outlined' ? theme.disabledButton : palette.bg;
  const fg = inert ? theme.disabledText : palette.fg;

  return (
    <TouchableRipple
      onPress={inert ? undefined : onPress}
      rippleColor={theme.ripple}
      disabled={inert}
      accessibilityRole="button"
      accessibilityState={{ disabled: inert }}
      style={[
        styles.button,
        {
          height: compact ? 40 : size.action,
          backgroundColor: bg,
          borderColor: palette.border,
          borderWidth: variant === 'outlined' ? StyleSheet.hairlineWidth : 0,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size={16} color={fg} />
        ) : (
          icon && <Ionicons name={icon} size={18} color={fg} />
        )}
        <Text style={{ fontSize: 14.5, fontWeight: '700', letterSpacing: 0.3, color: fg }}>
          {label}
        </Text>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.sm,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
  },
});
