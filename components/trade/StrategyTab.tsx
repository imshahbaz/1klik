import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, TextInput as PaperTextInput, SegmentedButtons, TouchableRipple } from 'react-native-paper';
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
    <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8, elevation: 3 }}>
      <Card.Content style={{ gap: 16 }}>
        {/* Broker SegmentedButtons */}
        <View>
          <PaperText variant="labelMedium" style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '700' }}>
            BROKER
          </PaperText>
          <SegmentedButtons
            value={strategyFormData.broker}
            onValueChange={(val) => setStrategyFormData({ ...strategyFormData, broker: val as 'ZERODHA' | 'RUPEEZY' })}
            buttons={[
              { value: 'ZERODHA', label: 'ZERODHA' },
              { value: 'RUPEEZY', label: 'RUPEEZY' },
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
              borderRadius: 12,
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

        {/* Amount + Date */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
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
              left={<PaperTextInput.Affix text="₹" />}
              style={{ backgroundColor: theme.card }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <TouchableRipple
              onPress={() => {
                setDatePickerTarget('strategy');
                setPickerDate(strategyFormData.date ? new Date(strategyFormData.date) : new Date());
                setShowDatePicker(true);
              }}
            >
              <View pointerEvents="none">
                <PaperTextInput
                  mode="outlined"
                  label="DATE"
                  value={strategyFormData.date ? formatDateString(new Date(strategyFormData.date)) : 'Select date'}
                  editable={false}
                  textColor={strategyFormData.date ? theme.textPrimary : theme.textSecondary}
                  outlineColor={theme.border}
                  left={<PaperTextInput.Icon icon={({ size, color }) => <Ionicons name="calendar-outline" size={size || 18} color={color || theme.iconMuted} />} />}
                  style={{ backgroundColor: theme.card }}
                />
              </View>
            </TouchableRipple>
          </View>
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
        styles={styles}
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
