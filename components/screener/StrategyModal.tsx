import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StrategyModalProps {
  styles: any;
  theme: any;
  dropdownVisible: boolean;
  setDropdownVisible: (val: boolean) => void;
  strategies: any[];
  selectedStrategy: string | null;
  handleStrategyPress: (name: string) => void;
  getStrategyMetadata: (name: string) => { iconName: any; badgeText: string };
}

export default function StrategyModal({
  styles,
  theme,
  dropdownVisible,
  setDropdownVisible,
  strategies,
  selectedStrategy,
  handleStrategyPress,
  getStrategyMetadata
}: StrategyModalProps) {
  return (
    <Modal
      visible={dropdownVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setDropdownVisible(false)}
    >
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setDropdownVisible(false)}
      >
        <View
          style={styles.dropdownMenuCard}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.dropdownMenuHeader}>
            <Text style={styles.dropdownMenuTitle}>Select Strategy</Text>
            <TouchableOpacity
              style={styles.dropdownCloseBtn}
              onPress={() => setDropdownVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dropdownOptionsList}>
            {strategies.map((item, index) => {
              const isSelected = selectedStrategy === item.name;
              const metadata = getStrategyMetadata(item.name);
              return (
                <TouchableOpacity
                  key={item.name + index}
                  style={[
                    styles.dropdownOptionRow,
                    isSelected && styles.selectedDropdownOptionRow
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleStrategyPress(item.name)}
                >
                  <View style={styles.optionLeft}>
                    <View style={[
                      styles.iconCircleSmall,
                      isSelected && styles.selectedIconCircleSmall
                    ]}>
                      <Ionicons
                        name={metadata.iconName}
                        size={14}
                        color={isSelected ? '#ffffff' : theme.textSecondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.optionNameText,
                        isSelected && styles.selectedOptionNameText
                      ]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[
                        styles.optionIntervalText,
                        isSelected && styles.selectedOptionIntervalText
                      ]}>
                        {metadata.badgeText}
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
