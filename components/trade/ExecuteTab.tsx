import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import SwipeButton from '../common/SwipeButton';

interface ExecuteTabProps {
  readonly styles: any;
  readonly theme: any;
  readonly tradeBroker: 'ZERODHA' | 'RUPEEZY';
  readonly setTradeBroker: (broker: 'ZERODHA' | 'RUPEEZY') => void;
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

const BROKERS: Array<'ZERODHA' | 'RUPEEZY'> = ['ZERODHA', 'RUPEEZY'];

export default function ExecuteTab({
  styles,
  theme,
  tradeBroker,
  setTradeBroker,
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
  const resetForm = () => {
    setEditingMtfOrderId(null);
    setTradeSymbol('');
    setSearchQuery('');
    setTradeQty('10');
    setTargetDate(new Date());
    setTradeBroker('ZERODHA');
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
    </View>
  );
}
