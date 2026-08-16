import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import SwipeButton from '../common/SwipeButton';
import StrategyDropdownModal from './StrategyDropdownModal';
import { Field, SelectField, ToggleGroup } from '../ui/Field';
import { Panel, SectionHeader } from '../ui/Panel';
import { Tag } from '../ui/Feedback';
import { numeric, radius, space } from '../../theme/tokens';

export type ExecuteStrategy = string;

interface ExecuteTabProps {
  readonly styles?: any;
  readonly theme: any;
  readonly tradeBroker: 'ZERODHA' | 'RUPEEZY';
  readonly setTradeBroker: (broker: 'ZERODHA' | 'RUPEEZY') => void;
  readonly tradeStrategyName: string;
  readonly setTradeStrategyName: (name: string) => void;
  readonly strategyOptions?: readonly string[];
  readonly tradeTargetPercentage: string;
  readonly setTradeTargetPercentage: (value: string) => void;
  readonly tradeSymbol: string;
  readonly setTradeSymbol: (symbol: string) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly searchQuery: string;
  readonly filteredMargins: any[];
  readonly tradeQty: string;
  readonly setTradeQty: (qty: string) => void;
  readonly targetDate: Date;
  readonly setDatePickerTarget: (target: 'execute' | 'strategy') => void;
  readonly setPickerDate: (date: Date) => void;
  readonly setShowDatePicker: (show: boolean) => void;
  readonly editingMtfOrderId: string | null;
  readonly setEditingMtfOrderId?: (id: string | null) => void;
  readonly setTargetDate?: (date: Date) => void;
  readonly executingTrade: boolean;
  readonly handleExecuteOrder: () => void;
  readonly formatDateString: (date: Date) => string;
}

/**
 * MTF order ticket. Fields run top to bottom in the order a trader fills them —
 * where, what, how much, when — with the commit control pinned by the parent so
 * it stays reachable while the keyboard is up.
 */
export default function ExecuteTab({
  theme,
  tradeBroker,
  setTradeBroker,
  tradeStrategyName,
  setTradeStrategyName,
  strategyOptions,
  tradeTargetPercentage,
  setTradeTargetPercentage,
  tradeSymbol,
  setTradeSymbol,
  setSearchQuery,
  searchQuery,
  filteredMargins,
  tradeQty,
  setTradeQty,
  targetDate,
  setDatePickerTarget,
  setPickerDate,
  setShowDatePicker,
  editingMtfOrderId,
  formatDateString,
}: ExecuteTabProps) {
  const [showStrategyDropdown, setShowStrategyDropdown] = useState(false);
  const options = strategyOptions || [];

  return (
    <View>
      {editingMtfOrderId ? (
        <View style={{ paddingTop: space.lg }}>
          <Panel raised style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Ionicons name="create-outline" size={16} color={theme.warningText} />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: theme.warningText }}>
              Editing an existing order
            </Text>
          </Panel>
        </View>
      ) : null}

      <SectionHeader title="Order ticket" />
      <Panel style={{ gap: space.lg }}>
        <ToggleGroup
          label="Broker"
          value={tradeBroker}
          options={[
            { value: 'ZERODHA', label: 'ZERODHA' },
            { value: 'RUPEEZY', label: 'RUPEEZY' },
          ]}
          onChange={(val) => setTradeBroker(val as 'ZERODHA' | 'RUPEEZY')}
        />

        <SelectField
          label="Exit strategy"
          value={tradeStrategyName}
          onPress={() => setShowStrategyDropdown(true)}
          icon="trending-up-outline"
        />

        {tradeStrategyName === 'TARGET PROFIT' ? (
          <Field
            label="Target"
            hint="0.4 – 20"
            value={tradeTargetPercentage}
            onChangeText={setTradeTargetPercentage}
            keyboardType="numeric"
            placeholder="0.00"
            suffix="%"
            numericFace
          />
        ) : null}

        {/* Symbol lookup: results drop directly under the field, as an Android
            autocomplete does, rather than inside a separate overlay. */}
        <View style={{ zIndex: 10 }}>
          <Field
            label="Symbol"
            value={tradeSymbol}
            onChangeText={(val) => {
              setTradeSymbol(val);
              setSearchQuery(val);
            }}
            autoCapitalize="characters"
            placeholder="e.g. RELIANCE"
            icon="search-outline"
            onClear={() => {
              setTradeSymbol('');
              setSearchQuery('');
            }}
          />

          {searchQuery && filteredMargins.length > 0 ? (
            <Panel padded={false} style={[styles.suggestions, { backgroundColor: theme.surfaceAlt }]}>
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {filteredMargins.map((marginItem: any, idx: number) => {
                  const rawMargin = marginItem.requiredMargin || marginItem.leverage || '';
                  let marginStr = rawMargin.toString().trim();
                  const parsedMargin = Number.parseFloat(marginStr);
                  if (Number.isNaN(parsedMargin) || parsedMargin <= 0) {
                    marginStr = '1x';
                  } else {
                    const suffix = marginStr.endsWith('%') ? '%' : 'x';
                    marginStr = `${parsedMargin.toFixed(2)}${suffix}`;
                  }

                  return (
                    <TouchableRipple
                      key={marginItem.symbol || idx}
                      rippleColor={theme.ripple}
                      onPress={() => {
                        setTradeSymbol(marginItem.symbol);
                        setSearchQuery('');
                      }}
                    >
                      <View style={[styles.suggestion, { borderBottomColor: theme.divider }]}>
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.textPrimary }}>
                          {marginItem.symbol}
                        </Text>
                        <Tag label={marginStr} tone="accent" />
                      </View>
                    </TouchableRipple>
                  );
                })}
              </ScrollView>
            </Panel>
          ) : null}
        </View>

        <Field
          label="Quantity"
          value={tradeQty}
          onChangeText={setTradeQty}
          keyboardType="number-pad"
          placeholder="0"
          suffix="qty"
          numericFace
        />

        <SelectField
          label="Target date"
          value={formatDateString(targetDate)}
          icon="calendar-outline"
          onPress={() => {
            setDatePickerTarget('execute');
            setPickerDate(new Date(targetDate));
            setShowDatePicker(true);
          }}
        />
      </Panel>

      {/* Ticket summary — the numbers worth re-reading before committing. */}
      <SectionHeader title="Summary" />
      <Panel padded={false}>
        <SummaryLine theme={theme} label="Broker" value={tradeBroker} />
        <SummaryLine theme={theme} label="Symbol" value={tradeSymbol.toUpperCase() || '—'} />
        <SummaryLine theme={theme} label="Quantity" value={tradeQty || '0'} mono />
        <SummaryLine
          theme={theme}
          label="Strategy"
          value={
            tradeStrategyName === 'TARGET PROFIT' && tradeTargetPercentage
              ? `TARGET +${tradeTargetPercentage}%`
              : tradeStrategyName
          }
        />
        <SummaryLine theme={theme} label="Executes on" value={formatDateString(targetDate)} last />
      </Panel>

      <StrategyDropdownModal
        theme={theme}
        visible={showStrategyDropdown}
        options={options}
        selected={tradeStrategyName}
        onSelect={(name) => setTradeStrategyName(name)}
        onClose={() => setShowStrategyDropdown(false)}
      />
    </View>
  );
}

/** Pinned commit control, rendered by the parent into the screen's action bar. */
export function ExecuteAction({
  theme,
  editingMtfOrderId,
  executingTrade,
  handleExecuteOrder,
}: {
  readonly theme: any;
  readonly editingMtfOrderId: string | null;
  readonly executingTrade: boolean;
  readonly handleExecuteOrder: () => void;
}) {
  return (
    <SwipeButton
      theme={theme}
      label={editingMtfOrderId ? 'Swipe to update order' : 'Swipe to place order'}
      loadingLabel={editingMtfOrderId ? 'Updating order…' : 'Placing order…'}
      icon={editingMtfOrderId ? 'checkmark-done' : 'flash'}
      loading={executingTrade}
      onSwipeSuccess={handleExecuteOrder}
    />
  );
}

function SummaryLine({
  theme,
  label,
  value,
  mono = false,
  last = false,
}: {
  readonly theme: any;
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
  readonly last?: boolean;
}) {
  return (
    <View
      style={[
        styles.summaryLine,
        { borderBottomColor: theme.divider, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
      ]}
    >
      <Text style={{ fontSize: 13, color: theme.textSecondary }}>{label}</Text>
      <Text
        numberOfLines={1}
        style={[mono && numeric, { fontSize: 13.5, fontWeight: '700', color: theme.textPrimary, marginLeft: space.md }]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: space.xs,
    maxHeight: 220,
    borderRadius: radius.sm,
    // Suggestions genuinely float above the form, so this is one of the few
    // places elevation is warranted.
    elevation: 6,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
