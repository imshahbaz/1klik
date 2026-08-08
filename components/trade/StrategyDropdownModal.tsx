import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { Portal, Modal as PaperModal, Surface, Text as PaperText, IconButton, TouchableRipple, Divider } from 'react-native-paper';

interface StrategyDropdownModalProps {
  readonly styles?: any;
  readonly theme: any;
  readonly visible: boolean;
  readonly options: readonly string[];
  readonly selected: string;
  readonly onSelect: (name: string) => void;
  readonly onClose: () => void;
}

export default function StrategyDropdownModal({
  theme,
  visible,
  options,
  selected,
  onSelect,
  onClose,
}: StrategyDropdownModalProps) {
  return (
    <Portal>
      <PaperModal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Surface
          style={{
            backgroundColor: theme.card,
            borderRadius: 24,
            width: '100%',
            maxWidth: 340,
            maxHeight: 380,
            padding: 16,
            elevation: 5,
          }}
          elevation={4}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
              Select Strategy
            </PaperText>
            <IconButton
              icon={({ size, color }) => <Ionicons name="close" size={size || 20} color={color || theme.textSecondary} />}
              onPress={onClose}
            />
          </View>

          <Divider style={{ backgroundColor: theme.border, marginBottom: 8 }} />

          <ScrollView style={{ width: '100%' }}>
            {options.length > 0 ? (
              options.map((name) => {
                const isSelected = selected === name;
                return (
                  <TouchableRipple
                    key={name}
                    style={{
                      borderRadius: 12,
                      backgroundColor: isSelected ? theme.primaryBackground : 'transparent',
                      marginBottom: 4,
                    }}
                    onPress={() => {
                      onSelect(name);
                      onClose();
                    }}
                  >
                    <View
                      style={{
                        padding: 14,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <PaperText variant="bodyMedium" style={{ color: isSelected ? theme.primary : theme.textPrimary, fontWeight: isSelected ? '800' : '600' }}>
                        {name}
                      </PaperText>
                      {isSelected ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                    </View>
                  </TouchableRipple>
                );
              })
            ) : (
              <PaperText style={{ color: theme.placeholder, padding: 12 }}>No strategies available</PaperText>
            )}
          </ScrollView>
        </Surface>
      </PaperModal>
    </Portal>
  );
}
