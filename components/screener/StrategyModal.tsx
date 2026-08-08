import React from 'react';
import { View, ScrollView } from 'react-native';
import { Surface, Text as PaperText, Chip, TouchableRipple } from 'react-native-paper';
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
  if (!dropdownVisible) return null;

  return (
    <Surface
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        marginTop: 6,
        padding: 6,
        maxHeight: 280,
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      }}
      elevation={5}
    >
      <ScrollView
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        style={{ width: '100%' }}
      >
        {strategies.map((item, index) => {
          const isSelected = selectedStrategy === item.name;
          const metadata = getStrategyMetadata(item.name);
          const successRateText = formatSuccessRate(item.successRate);

          return (
            <TouchableRipple
              key={item.name + index}
              style={{
                padding: 10,
                borderRadius: 12,
                backgroundColor: isSelected ? theme.primaryBackground : 'transparent',
                marginBottom: 4,
              }}
              onPress={() => {
                handleStrategyPress(item.name);
                setDropdownVisible(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Surface style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isSelected ? theme.primaryBackground : theme.borderLight, alignItems: 'center', justifyContent: 'center' }} elevation={0}>
                    <Ionicons name={metadata.iconName} size={15} color={isSelected ? theme.primary : theme.textSecondary} />
                  </Surface>
                  <PaperText variant="titleSmall" style={{ fontWeight: isSelected ? '800' : '600', color: isSelected ? theme.primary : theme.textPrimary }} numberOfLines={1}>
                    {item.name}
                  </PaperText>
                </View>

                {successRateText ? (
                  <Chip compact style={{ backgroundColor: theme.successBackground, marginRight: isSelected ? 6 : 0 }} textStyle={{ color: theme.success, fontSize: 10, fontWeight: '800' }}>
                    {successRateText}
                  </Chip>
                ) : null}

                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                ) : null}
              </View>
            </TouchableRipple>
          );
        })}
      </ScrollView>
    </Surface>
  );
}
