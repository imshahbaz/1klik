import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { radius, space } from '../../theme/tokens';

interface OrderResultModalProps {
  readonly styles?: any;
  readonly theme?: any;
  readonly visible: boolean;
  readonly variant: 'success' | 'error';
  readonly title: string;
  readonly message: string;
  readonly onClose: () => void;
}

/**
 * Material 3 alert dialog: hero icon and headline centred, body text
 * left-aligned, and a single text action in the bottom-right corner — where
 * Android puts confirmations, rather than a full-width web-style button.
 */
export default function OrderResultModal({
  theme: themeProp,
  visible,
  variant,
  title,
  message,
  onClose,
}: OrderResultModalProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeProp || contextTheme;

  const isSuccess = variant === 'success';
  const accent = isSuccess ? theme.up : theme.down;

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={[styles.dialog, { backgroundColor: theme.surface }]}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: isSuccess ? theme.upBackground : theme.downBackground },
            ]}
          >
            <Ionicons name={isSuccess ? 'checkmark-circle' : 'alert-circle'} size={28} color={accent} />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>

        <Text style={[styles.body, { color: theme.textSecondary }]}>{message}</Text>

        <View style={styles.actions}>
          <TouchableRipple
            onPress={onClose}
            rippleColor={theme.ripple}
            style={styles.action}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 14, fontWeight: '700', letterSpacing: 0.5, color: theme.primary }}>
              {isSuccess ? 'DONE' : 'GOT IT'}
            </Text>
          </TouchableRipple>
        </View>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 28,
    marginHorizontal: space.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingTop: space.xxl,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: space.xxl,
    paddingTop: space.lg,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: space.xxl,
    paddingTop: space.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: space.md,
    paddingTop: space.xl,
  },
  action: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
