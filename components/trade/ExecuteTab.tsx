import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text as PaperText, TextInput as PaperTextInput, SegmentedButtons, TouchableRipple, Chip, Surface } from 'react-native-paper';
import SwipeButton from '../common/SwipeButton';
import StrategyDropdownModal from './StrategyDropdownModal';

export const EXECUTE_STRATEGIES = ['TARGET PROFIT', 'TRAILING PROFIT'] as const;
export type ExecuteStrategy = (typeof EXECUTE_STRATEGIES)[number];

interface ExecuteTabProps {
  readonly styles: any;
  readonly theme: any;
  readonly tradeBroker: 'ZERODHA' | 'RUPEEZY';
  readonly setTradeBroker: (broker: 'ZERODHA' | 'RUPEEZY') => void;
  readonly tradeStrategyName: ExecuteStrategy;
  readonly setTradeStrategyName: (name: ExecuteStrategy) => void;
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

export default function ExecuteTab({
  styles,
  theme,
  tradeBroker,
  setTradeBroker,
  tradeStrategyName,
  setTradeStrategyName,
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
  executingTrade,
  handleExecuteOrder,
  formatDateString,
}: ExecuteTabProps) {
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
            value={tradeBroker}
            onValueChange={(val) => setTradeBroker(val as 'ZERODHA' | 'RUPEEZY')}
            buttons={[
              { value: 'ZERODHA', label: 'ZERODHA' },
              { value: 'RUPEEZY', label: 'RUPEEZY' },
            ]}
          />
        </View>

        {/* Strategy Dropdown */}
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
              <PaperText variant="bodyMedium" style={{ color: theme.textPrimary, fontWeight: '700' }}>
                {tradeStrategyName}
              </PaperText>
              <Ionicons name="chevron-down" size={18} color={theme.iconMuted} />
            </View>
          </TouchableRipple>
        </View>

        {/* Target percentage input if TARGET PROFIT */}
        {tradeStrategyName === 'TARGET PROFIT' ? (
          <PaperTextInput
            mode="outlined"
            label="TARGET %"
            value={tradeTargetPercentage}
            onChangeText={setTradeTargetPercentage}
            keyboardType="numeric"
            placeholder="0.4 – 20"
            placeholderTextColor={theme.placeholder}
            textColor={theme.textPrimary}
            outlineColor={theme.border}
            activeOutlineColor={theme.primary}
            right={<PaperTextInput.Affix text="%" />}
            style={{ backgroundColor: theme.card }}
          />
        ) : null}

        {/* Symbol */}
        <View style={{ zIndex: 10 }}>
          <PaperTextInput
            mode="outlined"
            label="SYMBOL"
            value={tradeSymbol}
            onChangeText={(val) => {
              setTradeSymbol(val);
              setSearchQuery(val);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Search e.g. RELIANCE"
            placeholderTextColor={theme.placeholder}
            textColor={theme.textPrimary}
            outlineColor={theme.border}
            activeOutlineColor={theme.primary}
            left={<PaperTextInput.Icon icon={({ size, color }) => <Ionicons name="search-outline" size={size || 18} color={color || theme.iconMuted} />} />}
            style={{ backgroundColor: theme.card }}
          />

          {searchQuery && filteredMargins.length > 0 ? (
            <Surface style={{ backgroundColor: theme.card, borderRadius: 12, marginTop: 4, elevation: 4, maxHeight: 200 }} elevation={3}>
              <ScrollView keyboardShouldPersistTaps="handled">
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
                      onPress={() => {
                        setTradeSymbol(marginItem.symbol);
                        setSearchQuery('');
                      }}
                    >
                      <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.borderLight }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="trending-up" size={16} color={theme.primary} />
                          <PaperText variant="titleSmall" style={{ color: theme.textPrimary, fontWeight: '700' }}>
                            {marginItem.symbol}
                          </PaperText>
                        </View>
                        <Chip compact textStyle={{ fontSize: 11, fontWeight: '700' }}>
                          {marginStr}
                        </Chip>
                      </View>
                    </TouchableRipple>
                  );
                })}
              </ScrollView>
            </Surface>
          ) : null}
        </View>

        {/* Quantity + Target Date */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <PaperTextInput
              mode="outlined"
              label="QUANTITY"
              value={tradeQty}
              onChangeText={setTradeQty}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.placeholder}
              textColor={theme.textPrimary}
              outlineColor={theme.border}
              activeOutlineColor={theme.primary}
              style={{ backgroundColor: theme.card }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <TouchableRipple
              onPress={() => {
                setDatePickerTarget('execute');
                setPickerDate(new Date(targetDate));
                setShowDatePicker(true);
              }}
            >
              <View pointerEvents="none">
                <PaperTextInput
                  mode="outlined"
                  label="TARGET DATE"
                  value={formatDateString(targetDate)}
                  editable={false}
                  textColor={theme.textPrimary}
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
            label={editingMtfOrderId ? 'Swipe to update order' : 'Swipe to place order'}
            loadingLabel={editingMtfOrderId ? 'Updating order…' : 'Placing order…'}
            icon={editingMtfOrderId ? 'checkmark-done' : 'flash'}
            loading={executingTrade}
            onSwipeSuccess={handleExecuteOrder}
          />
        </View>
      </Card.Content>

      <StrategyDropdownModal
        styles={styles}
        theme={theme}
        visible={showStrategyDropdown}
        options={EXECUTE_STRATEGIES}
        selected={tradeStrategyName}
        onSelect={(name) => setTradeStrategyName(name as ExecuteStrategy)}
        onClose={() => setShowStrategyDropdown(false)}
      />
    </Card>
  );
}
