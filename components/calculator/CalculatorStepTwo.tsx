import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, Text as PaperText, TextInput as PaperTextInput, Button as PaperButton, SegmentedButtons, HelperText, Surface, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface CalculatorStepTwoProps {
  readonly styles: any;
  readonly theme: any;
  readonly errors: Record<string, string>;
  readonly setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readonly entryDate: string;
  readonly exitDate: string;
  readonly setDatePickerTarget: (val: 'entry' | 'exit') => void;
  readonly setPickerDate: (val: Date) => void;
  readonly setShowDatePicker: (val: boolean) => void;
  readonly daysHeld: number;
  readonly quantityType: 'quantity' | 'investment';
  readonly setQuantityType: (val: 'quantity' | 'investment') => void;
  readonly quantity: string;
  readonly setQuantity: (val: string) => void;
  readonly setActiveStep: (val: 1 | 2) => void;
  readonly calculateReturns: () => void;
}

export default function CalculatorStepTwo({
  theme,
  errors,
  setErrors,
  entryDate,
  exitDate,
  setDatePickerTarget,
  setPickerDate,
  setShowDatePicker,
  daysHeld,
  quantityType,
  setQuantityType,
  quantity,
  setQuantity,
  setActiveStep,
  calculateReturns
}: CalculatorStepTwoProps) {
  return (
    <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8, elevation: 3 }}>
      <Card.Content>
        {/* Date Selection */}
        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => {
              setDatePickerTarget('entry');
              if (entryDate) setPickerDate(new Date(entryDate));
              setShowDatePicker(true);
            }}
            activeOpacity={0.8}
          >
            <PaperTextInput
              mode="outlined"
              label="Entry Date"
              value={entryDate || 'YYYY-MM-DD'}
              editable={false}
              textColor={theme.textPrimary}
              outlineColor={theme.border}
              left={<PaperTextInput.Icon icon={({ size, color }) => <Ionicons name="calendar-outline" size={size || 18} color={color || theme.iconMuted} />} />}
              style={{ backgroundColor: theme.card }}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => {
              setDatePickerTarget('exit');
              if (exitDate) setPickerDate(new Date(exitDate));
              else if (entryDate) setPickerDate(new Date(entryDate));
              setShowDatePicker(true);
            }}
            activeOpacity={0.8}
          >
            <PaperTextInput
              mode="outlined"
              label="Exit Date (Optional)"
              value={exitDate || 'Select Exit Date'}
              editable={false}
              textColor={exitDate ? theme.textPrimary : theme.textSecondary}
              outlineColor={theme.border}
              left={<PaperTextInput.Icon icon={({ size, color }) => <Ionicons name="calendar-outline" size={size || 18} color={color || theme.iconMuted} />} />}
              style={{ backgroundColor: theme.card }}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </View>

        {/* Days held preview */}
        <Surface style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: theme.primaryBackground, marginBottom: 20 }} elevation={0}>
          <PaperText variant="bodyMedium" style={{ color: theme.textSecondary, fontWeight: '700' }}>
            Calculated Holding Days
          </PaperText>
          <Chip compact textStyle={{ fontSize: 13, fontWeight: '800', color: theme.primary }}>
            {daysHeld} Days
          </Chip>
        </Surface>

        {/* Quantity / Investment Switcher */}
        <View style={{ marginBottom: 20 }}>
          <PaperText variant="labelMedium" style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '700' }}>
            ENTRY METHOD
          </PaperText>
          <SegmentedButtons
            value={quantityType}
            onValueChange={(val) => setQuantityType(val as 'quantity' | 'investment')}
            buttons={[
              { value: 'quantity', label: 'By Shares' },
              { value: 'investment', label: 'By Capital' },
            ]}
            style={{ marginBottom: 12 }}
          />

          <PaperTextInput
            mode="outlined"
            label={quantityType === 'quantity' ? "Number of Shares" : "Total Capital Amount (₹)"}
            keyboardType="numeric"
            placeholder={quantityType === 'quantity' ? "Number of shares" : "Total capital amount"}
            placeholderTextColor={theme.placeholder}
            value={quantity}
            onChangeText={(t) => {
              const clean = t.replace(/[^0-9.]/g, '');
              setQuantity(clean);
              setErrors((prev) => ({ ...prev, quantity: '' }));
            }}
            textColor={theme.textPrimary}
            outlineColor={errors.quantity ? theme.danger : theme.border}
            activeOutlineColor={theme.primary}
            left={quantityType === 'investment' ? <PaperTextInput.Affix text="₹" /> : undefined}
            style={{ backgroundColor: theme.card }}
          />
          {errors.quantity ? <HelperText type="error" visible={true}>{errors.quantity}</HelperText> : null}
        </View>

        {/* Action Buttons Row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PaperButton
            mode="outlined"
            onPress={() => setActiveStep(1)}
            icon={({ size }) => <Ionicons name="arrow-back" size={size || 18} color={theme.textPrimary} />}
            textColor={theme.textPrimary}
            style={{ flex: 1, borderRadius: 14, borderColor: theme.border }}
            contentStyle={{ height: 50 }}
          >
            Back
          </PaperButton>

          <PaperButton
            mode="contained"
            onPress={calculateReturns}
            buttonColor={theme.primary}
            icon={({ size }) => <Ionicons name="calculator" size={size || 18} color="#ffffff" />}
            style={{ flex: 1, borderRadius: 14 }}
            contentStyle={{ height: 50 }}
            labelStyle={{ fontSize: 16, fontWeight: '700' }}
          >
            Calculate
          </PaperButton>
        </View>
      </Card.Content>
    </Card>
  );
}
