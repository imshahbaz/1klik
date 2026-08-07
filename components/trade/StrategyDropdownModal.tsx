import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface StrategyDropdownModalProps {
  readonly styles: any;
  readonly theme: any;
  readonly visible: boolean;
  readonly options: readonly string[];
  readonly selected: string;
  readonly onSelect: (name: string) => void;
  readonly onClose: () => void;
}

/**
 * "Select Strategy" picker modal shared by the Execute and Strategy order tabs.
 * Selection is delegated to the parent via `onSelect`; the component stays purely
 * presentational.
 */
export default function StrategyDropdownModal({
  styles,
  theme,
  visible,
  options,
  selected,
  onSelect,
  onClose,
}: StrategyDropdownModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.editModalContainer, { maxHeight: 420 }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>Select Strategy</Text>
            <TouchableOpacity
              style={styles.editModalCloseBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.length > 0 ? (
              options.map((name) => {
                const isSelected = selected === name;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[styles.suggestionRow, isSelected && { backgroundColor: theme.primaryBackground }]}
                    onPress={() => {
                      onSelect(name);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.suggestionRowSymbol, isSelected && { color: theme.primary }]}>
                      {name}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark" size={16} color={theme.primary} /> : null}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={[styles.orderFieldLabel, { color: theme.placeholder, marginBottom: 0 }]}>
                No strategies available
              </Text>
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
