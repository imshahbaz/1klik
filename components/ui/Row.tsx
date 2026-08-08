import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { radius, size, space } from '../../theme/tokens';

interface ListRowProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onPress?: () => void;
  /** Leading glyph, drawn in a tinted square keyline block. */
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly iconTint?: string;
  readonly iconBackground?: string;
  /** Right-hand content — a price stack, switch, or chevron replacement. */
  readonly trailing?: React.ReactNode;
  readonly showChevron?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: React.ReactNode;
}

/**
 * Dense two-line list row. Trading apps show data as continuous rows separated
 * by hairlines rather than as individually floating cards, which keeps far more
 * instruments visible per screen.
 */
export default function ListRow({
  title,
  subtitle,
  onPress,
  icon,
  iconTint,
  iconBackground,
  trailing,
  showChevron = false,
  style,
  children,
}: ListRowProps) {
  const { theme } = useTheme();

  const body = (
    <View style={[styles.row, style]}>
      {icon ? (
        <View
          style={[
            styles.iconBlock,
            { backgroundColor: iconBackground || theme.chipBackground },
          ]}
        >
          <Ionicons name={icon} size={18} color={iconTint || theme.textSecondary} />
        </View>
      ) : null}

      <View style={styles.textBlock}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: 12.5, color: theme.textSecondary, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>

      {trailing}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} style={{ marginLeft: space.sm }} />
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <TouchableRipple onPress={onPress} rippleColor={theme.ripple}>
      {body}
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.row,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  iconBlock: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
});
