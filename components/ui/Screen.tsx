import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '../KeyboardAwareScrollView';
import { useTheme } from '../../context/ThemeContext';
import { space } from '../../theme/tokens';

interface ScreenProps {
  readonly children: React.ReactNode;
  /** Rendered above the body, outside the scroll area — normally a TopBar. */
  readonly header?: React.ReactNode;
  /** Wraps the body in a keyboard-aware scroll view. Off for screens that own a list. */
  readonly scroll?: boolean;
  /** Adds the standard 16dp side gutter to the body. */
  readonly gutter?: boolean;
  /**
   * True on tab screens: the bottom navigation bar already carries the gesture
   * inset, so the body only needs breathing room, not the full safe area.
   */
  readonly inTabs?: boolean;
  /** Pinned to the bottom of the screen, below the scroll area — e.g. a submit bar. */
  readonly footer?: React.ReactNode;
  readonly contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Standard screen shell: an app bar pinned at the top, a body that scrolls
 * beneath it, and an optional pinned action bar. Replaces the previous
 * scaffold, which padded every screen by the status-bar inset itself and so
 * left no room for a real app bar.
 */
export default function Screen({
  children,
  header,
  scroll = true,
  gutter = true,
  inTabs = true,
  footer,
  contentStyle,
}: ScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = inTabs ? space.xxl : Math.max(insets.bottom, space.lg) + space.lg;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {header}

      {scroll ? (
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            { paddingHorizontal: gutter ? space.lg : 0, paddingBottom: footer ? space.lg : bottomPad },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          extraKeyboardSpace={72}
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[{ flex: 1, paddingHorizontal: gutter ? space.lg : 0 }, contentStyle]}>
          {children}
        </View>
      )}

      {footer ? (
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: inTabs ? space.md : Math.max(insets.bottom, space.md),
            backgroundColor: theme.surface,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
          }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}
