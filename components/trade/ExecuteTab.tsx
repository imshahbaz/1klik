import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExecuteTabProps {
  readonly styles: any;
  readonly theme: any;
  readonly tradeBroker: 'ZERODHA' | 'RUPEEZY';
  readonly setTradeBroker: (broker: 'ZERODHA' | 'RUPEEZY') => void;
  readonly showExecuteBrokerDropdown: boolean;
  readonly setShowExecuteBrokerDropdown: (show: boolean) => void;
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

export default function ExecuteTab({
  styles,
  theme,
  tradeBroker,
  setTradeBroker,
  showExecuteBrokerDropdown,
  setShowExecuteBrokerDropdown,
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
  formatDateString
}: ExecuteTabProps) {
  return (
    <View style={styles.tabCard}>
      <Text style={styles.tabCardTitle}>Broker Direct Execution</Text>
      <Text style={styles.tabCardSubtitle}>Instant trade triggers sent directly to your broker terminal.</Text>

      {/* Broker Selection */}
      <View style={styles.formInputGroup}>
        <Text style={styles.formInputLabel}>BROKER</Text>
        <View style={styles.formInputWrapper}>
          <Ionicons name="business-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon} />
          {Platform.OS === 'web' ? (
            <select
              value={tradeBroker}
              onChange={(e: any) => setTradeBroker(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                color: theme.textPrimary,
                borderWidth: 0,
                outlineStyle: 'none',
                fontSize: 14,
                fontWeight: '600',
                height: '100%',
                cursor: 'pointer',
              } as any}
            >
              <option value="ZERODHA" className="bg-background text-foreground font-black">ZERODHA</option>
              <option value="RUPEEZY" className="bg-background text-foreground font-black">RUPEEZY</option>
            </select>
          ) : (
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              onPress={() => setShowExecuteBrokerDropdown(!showExecuteBrokerDropdown)}
              activeOpacity={0.7}
            >
              <Text style={[{ fontSize: 14, fontWeight: '600' }, { color: theme.textPrimary }] as any}>
                {tradeBroker}
              </Text>
              <Ionicons name={showExecuteBrokerDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {Platform.OS !== 'web' && showExecuteBrokerDropdown && (
          <View style={styles.verticalDropdownContainer}>
            {['ZERODHA', 'RUPEEZY'].map((brokerOption) => (
              <TouchableOpacity
                key={brokerOption}
                style={styles.suggestionRow}
                onPress={() => {
                  setTradeBroker(brokerOption as any);
                  setShowExecuteBrokerDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionRowSymbol}>{brokerOption}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Trading Symbol */}
      <View style={styles.formInputGroup}>
        <Text style={styles.formInputLabel}>SYMBOL</Text>
        <View style={styles.formInputWrapper}>
          <Ionicons name="trending-up-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon} />
          <TextInput
            style={styles.formTextInput}
            value={tradeSymbol}
            onChangeText={(val) => {
              setTradeSymbol(val);
              setSearchQuery(val);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="e.g. RELIANCE"
            placeholderTextColor={theme.placeholder}
          />
        </View>

        {/* Autocomplete suggestions dropdown based on margins */}
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

      {/* Quantity */}
      <View style={styles.formInputGroup}>
        <Text style={styles.formInputLabel}>QUANTITY</Text>
        <View style={styles.formInputWrapper}>
          <Ionicons name="layers-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon} />
          <TextInput
            style={styles.formTextInput}
            value={tradeQty}
            onChangeText={setTradeQty}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.placeholder}
          />
        </View>
      </View>

      {/* Target Date */}
      <View style={styles.formInputGroup}>
        <Text style={styles.formInputLabel}>TARGET DATE</Text>
        <TouchableOpacity
          style={styles.formInputWrapper}
          onPress={() => {
            setPickerDate(new Date(targetDate));
            setShowDatePicker(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon} />
          <Text style={styles.datePickerText} numberOfLines={1} adjustsFontSizeToFit>
            {formatDateString(targetDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Execute Action Button */}
      {editingMtfOrderId ? (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <TouchableOpacity
            style={[
              styles.executeActionBtn,
              styles.executeBuyBtn,
              { flex: 1, backgroundColor: theme.borderLight, borderWidth: 0 }
            ]}
            onPress={() => {
              setEditingMtfOrderId(null);
              setTradeSymbol('');
              setTradeQty('10');
              setTargetDate(new Date());
              setTradeBroker('ZERODHA');
            }}
            disabled={executingTrade}
            activeOpacity={0.8}
          >
            <Text style={[styles.executeActionBtnText, { color: theme.textSecondary }]}>
              CANCEL EDIT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.executeActionBtn,
              styles.executeBuyBtn,
              { flex: 1 },
              executingTrade && styles.disabledButton
            ]}
            onPress={handleExecuteOrder}
            disabled={executingTrade}
            activeOpacity={0.8}
          >
            {executingTrade ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                <Text style={styles.executeActionBtnText}>
                  UPDATE ORDER
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.executeActionBtn,
            styles.executeBuyBtn,
            executingTrade && styles.disabledButton,
            { marginTop: 12 }
          ]}
          onPress={handleExecuteOrder}
          disabled={executingTrade}
          activeOpacity={0.8}
        >
          {executingTrade ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="flash-outline" size={18} color="#ffffff" />
              <Text style={styles.executeActionBtnText}>
                PLACE ORDER
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
