import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, TextInput as PaperTextInput, SegmentedButtons, TouchableRipple, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import SwipeButton from '../common/SwipeButton';
import StrategyDropdownModal from './StrategyDropdownModal';

interface StrategyTabProps {
  readonly styles: any;
  readonly theme: any;
  readonly strategyOptions: string[];
  readonly strategyFormData: {
    readonly strategyName: string;
    readonly amount: string;
    readonly date: string;
    readonly broker: 'ZERODHA' | 'RUPEEZY';
  };
  readonly setStrategyFormData: (data: any) => void;
  readonly setDatePickerTarget: (target: 'execute' | 'strategy') => void;
  readonly setPickerDate: (date: Date) => void;
  readonly setShowDatePicker: (show: boolean) => void;
  readonly editingStrategyOrderId: string | null;
  readonly setEditingStrategyOrderId?: (id: string | null) => void;
  readonly submittingStrategy: boolean;
  readonly handleSaveStrategyOrder: () => void;
  readonly formatDateString: (date: Date) => string;
}

export default function StrategyTab({
  styles,
  theme,
  strategyOptions,
  strategyFormData,
  setStrategyFormData,
  setDatePickerTarget,
  setPickerDate,
  setShowDatePicker,
  editingStrategyOrderId,
  submittingStrategy,
  handleSaveStrategyOrder,
  formatDateString,
}: StrategyTabProps) {
  const [showStrategyDropdown, setShowStrategyDropdown] = useState(false);

  return (
    <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8, elevation: 0, borderWidth: 1, borderColor: theme.borderLight }}>
      <Card.Content style={{ gap: 18 }}>
        {/* Broker SegmentedButtons */}
        <View>
          <PaperText variant="labelMedium" style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '700' }}>
            BROKER
          </PaperText>
          <SegmentedButtons
            value={strategyFormData.broker}
            onValueChange={(val) => setStrategyFormData({ ...strategyFormData, broker: val as 'ZERODHA' | 'RUPEEZY' })}
            buttons={[
              {
                value: 'ZERODHA',
                label: 'ZERODHA',
                style: { backgroundColor: strategyFormData.broker === 'ZERODHA' ? theme.primaryBackground : 'transparent' },
                labelStyle: { color: strategyFormData.broker === 'ZERODHA' ? theme.primary : theme.textSecondary, fontWeight: '700' },
              },
              {
                value: 'RUPEEZY',
                label: 'RUPEEZY',
                style: { backgroundColor: strategyFormData.broker === 'RUPEEZY' ? theme.primaryBackground : 'transparent' },
                labelStyle: { color: strategyFormData.broker === 'RUPEEZY' ? theme.primary : theme.textSecondary, fontWeight: '700' },
              },
            ]}
          />
        </View>

        {/* Strategy Selection */}
        <View>
          <PaperText variant="labelMedium" style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '700' }}>
            STRATEGY
          </PaperText>
          <TouchableRipple
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
            }}
            onPress={() => setShowStrategyDropdown(true)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <PaperText variant="bodyMedium" style={{ color: strategyFormData.strategyName ? theme.textPrimary : theme.placeholder, fontWeight: '700' }}>
                {strategyFormData.strategyName || 'Select strategy'}
              </PaperText>
              <Ionicons name="chevron-down" size={18} color={theme.iconMuted} />
            </View>
          </TouchableRipple>
        </View>

        {/* Amount Input */}
        <PaperTextInput
          mode="outlined"
          label="AMOUNT (₹)"
          value={strategyFormData.amount}
          onChangeText={(val) => setStrategyFormData({ ...strategyFormData, amount: val })}
          keyboardType="numeric"
          placeholder="e.g. 5000"
          placeholderTextColor={theme.placeholder}
          textColor={theme.textPrimary}
          outlineColor={theme.border}
          activeOutlineColor={theme.primary}
          left={<PaperTextInput.Affix text="₹" textStyle={{ color: theme.textSecondary }} />}
          style={{ backgroundColor: theme.card }}
        />

        {/* Prominent Full-Width Date Selector */}
        <View>
          <PaperText variant="labelMedium" style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '700' }}>
            TARGET DATE
          </PaperText>
          <TouchableRipple
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.card,
            }}
            onPress={() => {
              setDatePickerTarget('strategy');
              setPickerDate(strategyFormData.date ? new Date(strategyFormData.date) : new Date());
              setShowDatePicker(true);
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                <PaperText variant="titleMedium" style={{ color: strategyFormData.date ? theme.textPrimary : theme.textSecondary, fontWeight: '700' }}>
                  {strategyFormData.date ? formatDateString(new Date(strategyFormData.date)) : 'Select date'}
                </PaperText>
              </View>
              <Chip compact style={{ backgroundColor: theme.primaryBackground }} textStyle={{ color: theme.primary, fontWeight: '800', fontSize: 11 }}>
                Change Date
              </Chip>
            </View>
          </TouchableRipple>
        </View>

        {/* Swipe Button */}
        <View style={{ marginTop: 8 }}>
          <SwipeButton
            styles={styles}
            theme={theme}
            label={editingStrategyOrderId ? 'Swipe to update order' : 'Swipe to place order'}
            loadingLabel={editingStrategyOrderId ? 'Updating order…' : 'Placing order…'}
            icon={editingStrategyOrderId ? 'checkmark-done' : 'flash'}
            loading={submittingStrategy}
            onSwipeSuccess={handleSaveStrategyOrder}
          />
        </View>
      </Card.Content>

      <StrategyDropdownModal
        theme={theme}
        visible={showStrategyDropdown}
        options={strategyOptions}
        selected={strategyFormData.strategyName}
        onSelect={(name) => setStrategyFormData({ ...strategyFormData, strategyName: name })}
        onClose={() => setShowStrategyDropdown(false)}
      />
    </Card>
  );
}
