import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { radius, size, space } from '../../theme/tokens';

export interface TopBarAction {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly tint?: string;
  /** Small dot drawn on the icon, e.g. an unread or live indicator. */
  readonly badgeColor?: string;
}

interface TopBarProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly actions?: readonly TopBarAction[];
  /** Rendered at the far right, after `actions` — used for the avatar button. */
  readonly trailing?: React.ReactNode;
  /** Content rendered flush under the title row, e.g. a tab strip. */
  readonly bottom?: React.ReactNode;
}

/**
 * Material 3 top app bar. Owns the status-bar inset so every screen starts its
 * content directly below the bar, and draws a hairline instead of a shadow so
 * it sits flat against the content the way system Android surfaces do.
 */
export default function TopBar({ title, subtitle, onBack, actions, trailing, bottom }: TopBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: theme.surface,
        // When something is docked below the bar (a tab strip, a filter rail)
        // that element draws the separating hairline, so the bar skips its own
        // and the two don't stack into a visible double rule.
        borderBottomWidth: bottom ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
      }}
    >
      <View style={[styles.bar, { paddingHorizontal: onBack ? space.xs : space.lg }]}>
        {onBack ? (
          <TouchableRipple
            onPress={onBack}
            borderless
            rippleColor={theme.ripple}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Navigate back"
          >
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableRipple>
        ) : null}

        <View style={styles.titleBlock}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary, letterSpacing: 0.1 }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {actions?.map((action) => (
          <TouchableRipple
            key={action.accessibilityLabel}
            onPress={action.onPress}
            borderless
            rippleColor={theme.ripple}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
          >
            <View>
              <Ionicons name={action.icon} size={22} color={action.tint || theme.textSecondary} />
              {action.badgeColor ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: action.badgeColor, borderColor: theme.surface },
                  ]}
                />
              ) : null}
            </View>
          </TouchableRipple>
        ))}

        {trailing ? <View style={{ marginLeft: space.xs }}>{trailing}</View> : null}
      </View>

      {bottom}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: size.appBar,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  iconButton: {
    width: size.touch,
    height: size.touch,
    borderRadius: size.touch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
});
