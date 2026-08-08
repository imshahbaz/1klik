import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { space } from '../../theme/tokens';

interface StrategyDropdownModalProps {
  readonly styles?: any;
  readonly theme?: any;
  readonly visible: boolean;
  readonly options: readonly string[];
  readonly selected: string;
  readonly onSelect: (name: string) => void;
  readonly onClose: () => void;
}

/**
 * Material "simple dialog" picker — a titled list of full-bleed choices with
 * the current one checked. Selecting commits and dismisses; there is no
 * separate confirm step.
 */
export default function StrategyDropdownModal({
  theme: themeProp,
  visible,
  options,
  selected,
  onSelect,
  onClose,
}: StrategyDropdownModalProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeProp || contextTheme;

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={[styles.dialog, { backgroundColor: theme.surface }]}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>Select strategy</Text>

        <ScrollView style={{ maxHeight: 340 }}>
          {options.length > 0 ? (
            options.map((name) => {
              const isSelected = selected === name;
              return (
                <TouchableRipple key={name} rippleColor={theme.ripple} onPress={() => {
                  onSelect(name);
                  onClose();
                }}>
                  <View style={styles.option}>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? theme.primary : theme.textPrimary,
                      }}
                    >
                      {name}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark" size={20} color={theme.primary} /> : null}
                  </View>
                </TouchableRipple>
              );
            })
          ) : (
            <Text style={{ color: theme.placeholder, padding: space.xxl }}>No strategies available</Text>
          )}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableRipple onPress={onClose} rippleColor={theme.ripple} style={styles.action}>
            <Text style={{ fontSize: 14, fontWeight: '700', letterSpacing: 0.5, color: theme.primary }}>
              CANCEL
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
  title: {
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: space.xxl,
    paddingTop: space.xxl,
    paddingBottom: space.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xxl,
    paddingVertical: space.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: space.md,
  },
  action: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
