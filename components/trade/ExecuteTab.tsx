import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SwipeButton from '../common/SwipeButton';

// Fixed strategy choices for the Execute order pad. Sent to the backend as `strategyName`.
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
  readonly setEditingMtfOrderId: (id: string | null) => void;
  readonly setTargetDate: (date: Date) => void;
  readonly executingTrade: boolean;
  readonly handleExecuteOrder: () => void;
  readonly formatDateString: (date: Date) => string;
}

const BROKERS: ('ZERODHA' | 'RUPEEZY')[] = ['ZERODHA', 'RUPEEZY'];

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
  setEditingMtfOrderId,
  setTargetDate,
  executingTrade,
  handleExecuteOrder,
  formatDateString,
}: ExecuteTabProps) {
  const [showStrategyDropdown, setShowStrategyDropdown] = useState(false);

  const resetForm = () => {
    setEditingMtfOrderId(null);
    setTradeSymbol('');
    setSearchQuery('');
    setTradeQty('10');
    setTargetDate(new Date());
    setTradeBroker('ZERODHA');
    setTradeStrategyName('TRAILING PROFIT');
    setTradeTargetPercentage('');
  };

  return (
    <View style={styles.orderPadCard}>
      {/* Order pad body */}
      <View style={styles.orderPadBody}>
        {/* Broker — segmented toggle */}
        <Text style={styles.orderFieldLabel}>BROKER</Text>
        <View style={styles.segmentGroup}>
          {BROKERS.map((brokerOption) => {
            const active = tradeBroker === brokerOption;
            return (
              <TouchableOpacity
                key={brokerOption}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => setTradeBroker(brokerOption)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentBtnText, active && styles.segmentBtnTextActive]}>
                  {brokerOption}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Strategy */}
        <View style={styles.orderFieldGroup}>
          <Text style={styles.orderFieldLabel}>STRATEGY</Text>
          <TouchableOpacity
            style={[styles.orderInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setShowStrategyDropdown(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.orderInputText} numberOfLines={1} adjustsFontSizeToFit>
              {tradeStrategyName}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.iconMuted} />
          </TouchableOpacity>
        </View>

        {/* Target percentage — required only for TARGET PROFIT */}
        {tradeStrategyName === 'TARGET PROFIT' ? (
          <View style={styles.orderFieldGroup}>
            <Text style={styles.orderFieldLabel}>TARGET %</Text>
            <TextInput
              style={styles.orderInput}
              value={tradeTargetPercentage}
              onChangeText={setTradeTargetPercentage}
              keyboardType="numeric"
              placeholder="0.4 – 20"
              placeholderTextColor={theme.placeholder}
            />
          </View>
        ) : null}

        {/* Symbol */}
        <View style={styles.orderFieldGroup}>
          <Text style={styles.orderFieldLabel}>SYMBOL</Text>
          <TextInput
            style={styles.orderInput}
            value={tradeSymbol}
            onChangeText={(val) => {
              setTradeSymbol(val);
              setSearchQuery(val);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Search e.g. RELIANCE"
            placeholderTextColor={theme.placeholder}
          />

          {/* Autocomplete suggestions from margins */}
          {searchQuery && filteredMargins.length > 0 ? (
            <View style={styles.verticalDropdownContainer}>
              {filteredMargins.map((marginItem: any, idx: number) => {
                const rawMargin = marginItem.requiredMargin || marginItem.leverage || '';
                let marginStr = rawMargin.toString().trim();

                const parsedMargin = parseFloat(marginStr);
                if (isNaN(parsedMargin) || parsedMargin <= 0) {
                  marginStr = '1x';
                } else {
                  const suffix = marginStr.toLowerCase().endsWith('x') ? 'x' : marginStr.endsWith('%') ? '%' : 'x';
                  marginStr = `${parsedMargin.toFixed(2)}${suffix}`;
                }

                return (
                  <TouchableOpacity
                    key={marginItem.symbol || idx}
                    style={styles.suggestionRow}
                    onPress={() => {
                      setTradeSymbol(marginItem.symbol);
                      setSearchQuery('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="trending-up" size={14} color={theme.primary} />
                      <Text style={styles.suggestionRowSymbol}>{marginItem.symbol}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.suggestionRowBadge}>
                        {marginStr}
                      </Text>
                      {marginItem.price || marginItem.ltp ? (
                        <Text style={styles.suggestionRowPrice}>
                          ₹{marginItem.price || marginItem.ltp}
                        </Text>
                      ) : null}
                      <Ionicons name="chevron-forward" size={14} color={theme.iconMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* Quantity + Target date, side by side */}
        <View style={styles.orderRow}>
          <View style={styles.orderCol}>
            <Text style={styles.orderFieldLabel}>QUANTITY</Text>
            <TextInput
              style={styles.orderInput}
              value={tradeQty}
              onChangeText={setTradeQty}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={styles.orderCol}>
            <Text style={styles.orderFieldLabel}>TARGET DATE</Text>
            <TouchableOpacity
              style={styles.orderInput}
              onPress={() => {
                setDatePickerTarget('execute');
                setPickerDate(new Date(targetDate));
                setShowDatePicker(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.orderInputText} numberOfLines={1} adjustsFontSizeToFit>
                {formatDateString(targetDate)}
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
          label={editingMtfOrderId ? 'Swipe to update order' : 'Swipe to place order'}
          loadingLabel={editingMtfOrderId ? 'Updating order…' : 'Placing order…'}
          icon={editingMtfOrderId ? 'checkmark-done' : 'flash'}
          loading={executingTrade}
          onSwipeSuccess={handleExecuteOrder}
        />

        {editingMtfOrderId ? (
          <TouchableOpacity style={styles.orderCancelLink} onPress={resetForm} disabled={executingTrade} activeOpacity={0.7}>
            <Text style={styles.orderCancelLinkText}>Cancel edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Strategy dropdown picker */}
      <Modal
        visible={showStrategyDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStrategyDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStrategyDropdown(false)}
        >
          <View
            style={[styles.editModalContainer, { maxHeight: 420 }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Select Strategy</Text>
              <TouchableOpacity
                style={styles.editModalCloseBtn}
                onPress={() => setShowStrategyDropdown(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {EXECUTE_STRATEGIES.map((name) => {
                const isSelected = tradeStrategyName === name;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[styles.suggestionRow, isSelected && { backgroundColor: theme.primaryBackground }]}
                    onPress={() => {
                      setTradeStrategyName(name);
                      setShowStrategyDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.suggestionRowSymbol, isSelected && { color: theme.primary }]}>
                      {name}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark" size={16} color={theme.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
