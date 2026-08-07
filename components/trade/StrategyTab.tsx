import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  readonly setEditingStrategyOrderId: (id: string | null) => void;
  readonly submittingStrategy: boolean;
  readonly handleSaveStrategyOrder: () => void;
  readonly formatDateString: (date: Date) => string;
}

const BROKERS: ('ZERODHA' | 'RUPEEZY')[] = ['ZERODHA', 'RUPEEZY'];

/** Renders a segmented single-choice control. */
const Segmented = ({ styles, options, value, onSelect }: any) => (
  <View style={styles.segmentGroup}>
    {options.map((opt: string) => {
      const active = value === opt;
      return (
        <TouchableOpacity
          key={opt}
          style={[styles.segmentBtn, active && styles.segmentBtnActive]}
          onPress={() => onSelect(opt)}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentBtnText, active && styles.segmentBtnTextActive]}>{opt}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

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
  setEditingStrategyOrderId,
  submittingStrategy,
  handleSaveStrategyOrder,
  formatDateString,
}: StrategyTabProps) {
  const [showStrategyDropdown, setShowStrategyDropdown] = useState(false);

  const resetForm = () => {
    setEditingStrategyOrderId(null);
    setStrategyFormData({ strategyName: 'RSI15MIN', amount: '', date: '', broker: 'ZERODHA' });
  };

  return (
    <View style={styles.orderPadCard}>
      <View style={styles.orderPadBody}>
        {/* Broker */}
        <Text style={styles.orderFieldLabel}>BROKER</Text>
        <Segmented
          styles={styles}
          options={BROKERS}
          value={strategyFormData.broker}
          onSelect={(broker: string) => setStrategyFormData({ ...strategyFormData, broker })}
        />

        {/* Strategy */}
        <View style={styles.orderFieldGroup}>
          <Text style={styles.orderFieldLabel}>STRATEGY</Text>
          <TouchableOpacity
            style={[styles.orderInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setShowStrategyDropdown(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.orderInputText, !strategyFormData.strategyName && { color: theme.placeholder }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {strategyFormData.strategyName || 'Select strategy'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.iconMuted} />
          </TouchableOpacity>
        </View>

        {/* Amount + Date, side by side */}
        <View style={styles.orderRow}>
          <View style={styles.orderCol}>
            <Text style={styles.orderFieldLabel}>AMOUNT (₹)</Text>
            <TextInput
              style={styles.orderInput}
              value={strategyFormData.amount}
              onChangeText={(val) => setStrategyFormData({ ...strategyFormData, amount: val })}
              keyboardType="numeric"
              placeholder="e.g. 5000"
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={styles.orderCol}>
            <Text style={styles.orderFieldLabel}>DATE</Text>
            <TouchableOpacity
              style={styles.orderInput}
              onPress={() => {
                setDatePickerTarget('strategy');
                setPickerDate(strategyFormData.date ? new Date(strategyFormData.date) : new Date());
                setShowDatePicker(true);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.orderInputText, !strategyFormData.date && { color: theme.placeholder }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {strategyFormData.date ? formatDateString(new Date(strategyFormData.date)) : 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Swipe-to-confirm action bar */}
      <View style={styles.orderPadActionBar}>
        <SwipeButton
          styles={styles}
          theme={theme}
          label={editingStrategyOrderId ? 'Swipe to update order' : 'Swipe to place order'}
          loadingLabel={editingStrategyOrderId ? 'Updating order…' : 'Placing order…'}
          icon={editingStrategyOrderId ? 'checkmark-done' : 'flash'}
          loading={submittingStrategy}
          onSwipeSuccess={handleSaveStrategyOrder}
        />

        {editingStrategyOrderId ? (
          <TouchableOpacity style={styles.orderCancelLink} onPress={resetForm} disabled={submittingStrategy} activeOpacity={0.7}>
            <Text style={styles.orderCancelLinkText}>Cancel edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Strategy dropdown picker */}
      <StrategyDropdownModal
        styles={styles}
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
