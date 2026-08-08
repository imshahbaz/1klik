import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Button from '../ui/Button';
import { Field, SelectField, ToggleGroup } from '../ui/Field';
import { Tag } from '../ui/Feedback';
import { Panel, SectionHeader } from '../ui/Panel';
import { radius, space } from '../../theme/tokens';

interface CalculatorStepTwoProps {
  readonly styles?: any;
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

/** Step 2: how long the position is held and how large it is. */
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
  calculateReturns,
}: CalculatorStepTwoProps) {
  return (
    <View>
      <SectionHeader title="Holding period" />
      <Panel style={{ gap: space.lg }}>
        <SelectField
          label="Entry date"
          value={entryDate}
          placeholder="YYYY-MM-DD"
          icon="calendar-outline"
          onPress={() => {
            setDatePickerTarget('entry');
            if (entryDate) setPickerDate(new Date(entryDate));
            setShowDatePicker(true);
          }}
        />

        <SelectField
          label="Exit date (optional)"
          value={exitDate}
          placeholder="Select exit date"
          icon="calendar-outline"
          onPress={() => {
            setDatePickerTarget('exit');
            if (exitDate) setPickerDate(new Date(exitDate));
            else if (entryDate) setPickerDate(new Date(entryDate));
            setShowDatePicker(true);
          }}
        />

        {/* Days held drives the MTF interest accrual, so it's surfaced live. */}
        <View style={[styles.days, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>Days held</Text>
          <Tag label={`${daysHeld} ${daysHeld === 1 ? 'DAY' : 'DAYS'}`} tone="accent" />
        </View>
      </Panel>

      <SectionHeader title="Position size" />
      <Panel style={{ gap: space.lg }}>
        <ToggleGroup
          value={quantityType}
          options={[
            { value: 'quantity', label: 'BY SHARES' },
            { value: 'investment', label: 'BY CAPITAL' },
          ]}
          onChange={(val) => setQuantityType(val as 'quantity' | 'investment')}
        />

        <Field
          label={quantityType === 'quantity' ? 'Number of shares' : 'Capital to deploy'}
          value={quantity}
          onChangeText={(t) => {
            setQuantity(t.replace(/[^0-9.]/g, ''));
            setErrors((prev) => ({ ...prev, quantity: '' }));
          }}
          keyboardType={quantityType === 'quantity' ? 'number-pad' : 'numeric'}
          placeholder={quantityType === 'quantity' ? '10' : '50000'}
          prefix={quantityType === 'investment' ? '₹' : undefined}
          suffix={quantityType === 'quantity' ? 'qty' : undefined}
          error={errors.quantity}
          numericFace
        />
      </Panel>

      <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xl }}>
        <Button label="Back" variant="outlined" onPress={() => setActiveStep(1)} style={{ flex: 1 }} />
        <Button label="Calculate" icon="calculator-outline" onPress={calculateReturns} style={{ flex: 1.4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  days: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.sm,
  },
});
