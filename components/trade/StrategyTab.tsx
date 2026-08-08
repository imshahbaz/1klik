import React, { useState } from 'react';
import { View } from 'react-native';
import SwipeButton from '../common/SwipeButton';
import StrategyDropdownModal from './StrategyDropdownModal';
import { Field, SelectField, ToggleGroup } from '../ui/Field';
import { Panel, SectionHeader } from '../ui/Panel';
import { Notice } from '../ui/Feedback';
import { space } from '../../theme/tokens';

interface StrategyTabProps {
  readonly styles?: any;
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

/** Automated-strategy allocation form: pick a strategy, an amount and a date. */
export default function StrategyTab({
  theme,
  strategyOptions,
  strategyFormData,
  setStrategyFormData,
  setDatePickerTarget,
  setPickerDate,
  setShowDatePicker,
  editingStrategyOrderId,
  formatDateString,
}: StrategyTabProps) {
  const [showStrategyDropdown, setShowStrategyDropdown] = useState(false);

  return (
    <View>
      {editingStrategyOrderId ? (
        <View style={{ paddingTop: space.lg }}>
          <Notice tone="warn" message="Editing an existing strategy order" />
        </View>
      ) : null}

      <SectionHeader title="Strategy allocation" />
      <Panel style={{ gap: space.lg }}>
        <ToggleGroup
          label="Broker"
          value={strategyFormData.broker}
          options={[
            { value: 'ZERODHA', label: 'ZERODHA' },
            { value: 'RUPEEZY', label: 'RUPEEZY' },
          ]}
          onChange={(val) => setStrategyFormData({ ...strategyFormData, broker: val })}
        />

        <SelectField
          label="Strategy"
          value={strategyFormData.strategyName}
          placeholder="Select a strategy"
          icon="flash-outline"
          onPress={() => setShowStrategyDropdown(true)}
        />

        <Field
          label="Amount"
          value={strategyFormData.amount}
          onChangeText={(val) => setStrategyFormData({ ...strategyFormData, amount: val })}
          keyboardType="numeric"
          placeholder="0"
          prefix="₹"
          numericFace
        />

        <SelectField
          label="Start date"
          value={strategyFormData.date ? formatDateString(new Date(strategyFormData.date)) : ''}
          placeholder="Select a date"
          icon="calendar-outline"
          onPress={() => {
            setDatePickerTarget('strategy');
            setPickerDate(strategyFormData.date ? new Date(strategyFormData.date) : new Date());
            setShowDatePicker(true);
          }}
        />
      </Panel>

      <StrategyDropdownModal
        theme={theme}
        visible={showStrategyDropdown}
        options={strategyOptions}
        selected={strategyFormData.strategyName}
        onSelect={(name) => setStrategyFormData({ ...strategyFormData, strategyName: name })}
        onClose={() => setShowStrategyDropdown(false)}
      />
    </View>
  );
}

/** Pinned commit control, rendered by the parent into the screen's action bar. */
export function StrategyAction({
  theme,
  editingStrategyOrderId,
  submittingStrategy,
  handleSaveStrategyOrder,
}: {
  readonly theme: any;
  readonly editingStrategyOrderId: string | null;
  readonly submittingStrategy: boolean;
  readonly handleSaveStrategyOrder: () => void;
}) {
  return (
    <SwipeButton
      theme={theme}
      label={editingStrategyOrderId ? 'Swipe to update order' : 'Swipe to place order'}
      loadingLabel={editingStrategyOrderId ? 'Updating order…' : 'Placing order…'}
      icon={editingStrategyOrderId ? 'checkmark-done' : 'flash'}
      loading={submittingStrategy}
      onSwipeSuccess={handleSaveStrategyOrder}
    />
  );
}
