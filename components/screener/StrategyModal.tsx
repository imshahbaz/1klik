import React from 'react';
import { View, ScrollView } from 'react-native';
import { Portal, Modal as PaperModal, Surface, Text as PaperText, IconButton, Chip, Divider, TouchableRipple } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

function formatSuccessRate(rate: unknown): string | null {
  const num = typeof rate === 'string' ? Number.parseFloat(rate) : rate;
  if (typeof num !== 'number' || !Number.isFinite(num)) return null;
  if (num <= 0) return null;
  const rounded = Math.round(num * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${text}%`;
}

interface StrategyModalProps {
  readonly styles?: any;
  readonly theme: any;
  readonly dropdownVisible: boolean;
  readonly setDropdownVisible: (val: boolean) => void;
  readonly strategies: any[];
  readonly selectedStrategy: string | null;
  readonly handleStrategyPress: (name: string) => void;
  readonly getStrategyMetadata: (name: string) => { iconName: any; badgeText: string };
}

export default function StrategyModal({
  theme,
  dropdownVisible,
  setDropdownVisible,
  strategies,
  selectedStrategy,
  handleStrategyPress,
  getStrategyMetadata
}: StrategyModalProps) {
  return (
    <Portal>
      <PaperModal
        visible={dropdownVisible}
        onDismiss={() => setDropdownVisible(false)}
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
            maxWidth: 360,
            maxHeight: '80%',
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
              onPress={() => setDropdownVisible(false)}
            />
          </View>

          <Divider style={{ backgroundColor: theme.border, marginBottom: 8 }} />

          <ScrollView style={{ width: '100%' }}>
            {strategies.map((item, index) => {
              const isSelected = selectedStrategy === item.name;
              const metadata = getStrategyMetadata(item.name);
              const successRateText = formatSuccessRate(item.successRate);

              return (
                <TouchableRipple
                  key={item.name + index}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: isSelected ? theme.primaryBackground : 'transparent',
                    marginBottom: 6,
                  }}
                  onPress={() => handleStrategyPress(item.name)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <Surface style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isSelected ? theme.primaryBackground : theme.borderLight, alignItems: 'center', justifyContent: 'center' }} elevation={0}>
                        <Ionicons name={metadata.iconName} size={16} color={isSelected ? theme.primary : theme.textSecondary} />
                      </Surface>
                      <View style={{ flex: 1 }}>
                        <PaperText variant="titleSmall" style={{ fontWeight: isSelected ? '800' : '600', color: isSelected ? theme.primary : theme.textPrimary }} numberOfLines={1}>
                          {item.name}
                        </PaperText>
                        <Chip compact textStyle={{ fontSize: 10, fontWeight: '700' }} style={{ marginTop: 2, alignSelf: 'flex-start' }}>
                          {metadata.badgeText}
                        </Chip>
                      </View>
                    </View>

                    {successRateText && (
                      <Chip compact style={{ backgroundColor: theme.successBackground }} textStyle={{ color: theme.success, fontSize: 11, fontWeight: '800' }}>
                        {successRateText}
                      </Chip>
                    )}

                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} style={{ marginLeft: 8 }} />
                    )}
                  </View>
                </TouchableRipple>
              );
            })}
          </ScrollView>
        </Surface>
      </PaperModal>
    </Portal>
  );
}
