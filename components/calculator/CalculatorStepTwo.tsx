import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalculatorStepTwoProps {
  readonly styles: any;
  readonly theme: any;
  readonly errors: Record<string, string>;
  readonly setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readonly entryDate: string;
  readonly setEntryDate: (val: string) => void;
  readonly exitDate: string;
  readonly setExitDate: (val: string) => void;
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
  styles,
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
    <View style={styles.stepContent}>
      {/* Date fields */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Entry Date</Text>
        <TouchableOpacity
          style={styles.inputWrapper}
          onPress={() => {
            setDatePickerTarget('entry');
            if (entryDate) setPickerDate(new Date(entryDate));
            setShowDatePicker(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.iconMuted} style={styles.inputIcon} />
          <Text style={[styles.textInput, { color: entryDate ? theme.textPrimary : theme.textSecondary }]}>
            {entryDate || 'YYYY-MM-DD'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Exit Date (Optional)</Text>
        <TouchableOpacity
          style={styles.inputWrapper}
          onPress={() => {
            setDatePickerTarget('exit');
            if (exitDate) setPickerDate(new Date(exitDate));
            else if (entryDate) setPickerDate(new Date(entryDate));
            setShowDatePicker(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.iconMuted} style={styles.inputIcon} />
          <Text style={[styles.textInput, { color: exitDate ? theme.textPrimary : theme.textSecondary }]}>
            {exitDate || 'Select Exit Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Days held projection */}
      <View style={styles.daysHeldPreviewBox}>
        <Text style={styles.daysHeldPreviewLabel}>Calculated Holding Days</Text>
        <View style={styles.daysHeldBadge}>
          <Text style={styles.daysHeldBadgeText}>{daysHeld} Days</Text>
        </View>
      </View>

      {/* Quantity Type Switcher */}
      <View style={styles.exitStrategyBox}>
        <View style={styles.exitHeaderRow}>
          <Text style={styles.inputLabel}>Entry Method</Text>
          <View style={styles.tabToggleBg}>
            <TouchableOpacity
              style={[styles.toggleBtn, quantityType === 'quantity' ? styles.toggleBtnActive : null]}
              onPress={() => setQuantityType('quantity')}
            >
              <Text style={[styles.toggleBtnText, quantityType === 'quantity' ? styles.toggleBtnTextActive : null]}>
                By Shares
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, quantityType === 'investment' ? styles.toggleBtnActive : null]}
              onPress={() => setQuantityType('investment')}
            >
              <Text style={[styles.toggleBtnText, quantityType === 'investment' ? styles.toggleBtnTextActive : null]}>
                By Capital
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.inputWrapper, errors.quantity ? styles.inputError : null]}>
          {quantityType === 'investment' ? (
            <Text style={styles.inputCurrencyPrefix}>₹</Text>
          ) : null}
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            placeholder={quantityType === 'quantity' ? "Number of shares" : "Total capital amount"}
            placeholderTextColor={theme.placeholder}
            value={quantity}
            onChangeText={(t) => {
              const clean = t.replace(/[^0-9.]/g, '');
              setQuantity(clean);
              setErrors((prev) => ({ ...prev, quantity: '' }));
            }}
          />
        </View>
        {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.secondaryActionButton}
          onPress={() => setActiveStep(1)}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color={theme.iconMuted} />
          <Text style={styles.secondaryActionText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.calculateActionButton}
          onPress={calculateReturns}
          activeOpacity={0.85}
        >
          <Ionicons name="calculator" size={18} color="#ffffff" />
          <Text style={styles.calculateActionText}>Calculate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
