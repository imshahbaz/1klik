import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      {/* Order pad header — side tag + instrument */}
      <View style={styles.orderPadHeader}>
        <View style={styles.orderPadHeaderLeft}>
          <View style={styles.orderPadSideTag}>
            <Text style={styles.orderPadSideTagText}>BUY</Text>
          </View>
          <Text
            style={tradeSymbol ? styles.orderPadHeaderSymbol : styles.orderPadHeaderSymbolMuted}
            numberOfLines={1}
          >
            {tradeSymbol ? tradeSymbol.toUpperCase() : 'Select a stock'}
          </Text>
        </View>
        <Text style={styles.orderPadExchange} numberOfLines={1}>
          MTF · {tradeBroker}
        </Text>
      </View>

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
              {filteredMargins.map((marginItem: any, idx: number) => (
                <TouchableOpacity
                  key={marginItem.symbol || idx}
                  style={styles.suggestionRow}
                  onPress={() => {
                    setTradeSymbol(marginItem.symbol);
                    setSearchQuery(''); // Close recommendations on tap
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="trending-up" size={14} color={theme.primary} />
                    <Text style={styles.suggestionRowSymbol}>{marginItem.symbol}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {marginItem.requiredMargin || marginItem.leverage ? (
                      <Text style={styles.suggestionRowBadge}>
                        {marginItem.requiredMargin || marginItem.leverage}
                      </Text>
                    ) : null}
                    {marginItem.price || marginItem.ltp ? (
                      <Text style={styles.suggestionRowPrice}>
                        ₹{marginItem.price || marginItem.ltp}
                      </Text>
                    ) : null}
                    <Ionicons name="chevron-forward" size={14} color={theme.iconMuted} />
                  </View>
                </TouchableOpacity>
              ))}
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

      {/* Footer action bar */}
      <View style={styles.orderPadFooter}>
        {editingMtfOrderId ? (
          <>
            <TouchableOpacity
              style={[styles.orderCancelBtn, { flex: 1 }]}
              onPress={resetForm}
              disabled={executingTrade}
              activeOpacity={0.8}
            >
              <Text style={styles.orderCancelBtnText}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.orderSubmitBtn, { flex: 1, minWidth: 0 }, executingTrade && styles.disabledButton]}
              onPress={handleExecuteOrder}
              disabled={executingTrade}
              activeOpacity={0.85}
            >
              {executingTrade ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                  <Text style={styles.orderSubmitBtnText}>UPDATE</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.orderPadFooterHint}>
              <Text style={styles.orderPadFooterHintLabel}>ORDER TYPE</Text>
              <Text style={styles.orderPadFooterHintValue} numberOfLines={1}>
                MTF · Delivery
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.orderSubmitBtn, executingTrade && styles.disabledButton]}
              onPress={handleExecuteOrder}
              disabled={executingTrade}
              activeOpacity={0.85}
            >
              {executingTrade ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="flash" size={16} color="#ffffff" />
                  <Text style={styles.orderSubmitBtnText}>PLACE ORDER</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
