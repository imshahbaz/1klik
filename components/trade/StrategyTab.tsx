import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';

interface StrategyTabProps {
  readonly styles: any;
  readonly theme: any;
  readonly strategyFormData: {
    readonly strategyName: string;
    readonly amount: string;
    readonly date: string;
    readonly broker: 'ZERODHA' | 'RUPEEZY';
  };
  readonly setStrategyFormData: (data: any) => void;
  readonly showStrategyBrokerDropdown: boolean;
  readonly setShowStrategyBrokerDropdown: (show: boolean) => void;
  readonly showStrategyDropdown: boolean;
  readonly setShowStrategyDropdown: (show: boolean) => void;
  readonly setDatePickerTarget: (target: 'execute' | 'strategy') => void;
  readonly setPickerDate: (date: Date) => void;
  readonly setShowDatePicker: (show: boolean) => void;
  readonly editingStrategyOrderId: string | null;
  readonly setEditingStrategyOrderId: (id: string | null) => void;
  readonly submittingStrategy: boolean;
  readonly handleSaveStrategyOrder: () => void;
  readonly formatDateString: (date: Date) => string;
}

const BrokerSelection = ({
  styles,
  theme,
  strategyFormData,
  setStrategyFormData,
  showStrategyBrokerDropdown,
  setShowStrategyBrokerDropdown
}: any) => (
  <View style={styles.formInputGroup}>
    <Text style={styles.formInputLabel}>BROKER</Text>
    <View style={styles.formInputWrapper}>
      <Ionicons name="business-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon} />
      {Platform.OS === 'web' ? (
        <select
          value={strategyFormData.broker}
          onChange={(e: any) => setStrategyFormData({ ...strategyFormData, broker: e.target.value })}
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
          onPress={() => setShowStrategyBrokerDropdown(!showStrategyBrokerDropdown)}
          activeOpacity={0.7}
        >
          <Text style={[{ fontSize: moderateScale(14), fontWeight: '600' }, { color: theme.textPrimary }] as any}>
            {strategyFormData.broker}
          </Text>
          <Ionicons name={showStrategyBrokerDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>

    {Platform.OS !== 'web' && showStrategyBrokerDropdown && (
      <View style={styles.verticalDropdownContainer}>
        {['ZERODHA', 'RUPEEZY'].map((brokerOption) => (
          <TouchableOpacity
            key={brokerOption}
            style={styles.suggestionRow}
            onPress={() => {
              setStrategyFormData({ ...strategyFormData, broker: brokerOption });
              setShowStrategyBrokerDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionRowSymbol}>{brokerOption}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const StrategySelection = ({
  styles,
  theme,
  strategyFormData,
  setStrategyFormData,
  showStrategyDropdown,
  setShowStrategyDropdown
}: any) => (
  <View style={styles.formInputGroup}>
    <Text style={styles.formInputLabel}>STRATEGY NAME</Text>
    <View style={styles.formInputWrapper}>
      <Ionicons name="git-branch-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon} />
      {Platform.OS === 'web' ? (
        <select
          value={strategyFormData.strategyName}
          onChange={(e: any) => setStrategyFormData({ ...strategyFormData, strategyName: e.target.value })}
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
          <option value="" style={{ color: theme.placeholder }}>Select Strategy</option>
          <option value="RSI15MIN" className="bg-background text-foreground font-black">RSI15MIN</option>
          <option value="MACD15MIN" className="bg-background text-foreground font-black">MACD15MIN</option>
        </select>
      ) : (
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          onPress={() => setShowStrategyDropdown(!showStrategyDropdown)}
          activeOpacity={0.7}
        >
          <Text style={[
            { fontSize: moderateScale(14), fontWeight: '600' },
            strategyFormData.strategyName ? { color: theme.textPrimary } : { color: theme.placeholder }
          ] as any}>
            {strategyFormData.strategyName || "Select Strategy"}
          </Text>
          <Ionicons name={showStrategyDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>

    {Platform.OS !== 'web' && showStrategyDropdown && (
      <View style={styles.verticalDropdownContainer}>
        {['RSI15MIN', 'MACD15MIN'].map((strat) => (
          <TouchableOpacity
            key={strat}
            style={styles.suggestionRow}
            onPress={() => {
              setStrategyFormData({ ...strategyFormData, strategyName: strat });
              setShowStrategyDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionRowSymbol}>{strat}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const DateSelection = ({
  styles,
  theme,
  strategyFormData,
  setDatePickerTarget,
  setPickerDate,
  setShowDatePicker,
  formatDateString
}: any) => (
  <View style={styles.formInputGroup}>
    <Text style={styles.formInputLabel}>DATE</Text>
    <TouchableOpacity
      style={styles.formInputWrapper}
      onPress={() => {
        setDatePickerTarget('strategy');
        setPickerDate(strategyFormData.date ? new Date(strategyFormData.date) : new Date());
        setShowDatePicker(true);
      }}
      activeOpacity={0.7}
    >
      <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon} />
      <Text style={[
        styles.datePickerText,
        !strategyFormData.date && { color: theme.placeholder }
      ] as any} numberOfLines={1} adjustsFontSizeToFit>
        {strategyFormData.date ? formatDateString(new Date(strategyFormData.date)) : "Select Date"}
      </Text>
    </TouchableOpacity>
  </View>
);

const AmountSelection = ({ styles, theme, strategyFormData, setStrategyFormData }: any) => (
  <View style={styles.formInputGroup}>
    <Text style={styles.formInputLabel}>AMOUNT (₹)</Text>
    <View style={styles.formInputWrapper}>
      <Ionicons name="card-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon} />
      <TextInput
        style={styles.formTextInput}
        value={strategyFormData.amount}
        onChangeText={(val) => setStrategyFormData({ ...strategyFormData, amount: val })}
        keyboardType="numeric"
        placeholder="Enter Amount (e.g. 5000)"
        placeholderTextColor={theme.placeholder}
      />
    </View>
  </View>
);

const SubmitButtons = ({
  styles,
  theme,
  editingStrategyOrderId,
  setEditingStrategyOrderId,
  setStrategyFormData,
  submittingStrategy,
  handleSaveStrategyOrder
}: any) => (
  <>
    {editingStrategyOrderId ? (
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <TouchableOpacity
          style={[
            styles.executeActionBtn,
            styles.executeBuyBtn,
            { flex: 1, backgroundColor: theme.borderLight, borderWidth: 0 }
          ]}
          onPress={() => {
            setEditingStrategyOrderId(null);
            setStrategyFormData({
              strategyName: '',
              amount: '',
              date: '',
              broker: 'ZERODHA',
            });
          }}
          disabled={submittingStrategy}
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
            submittingStrategy && styles.disabledButton
          ]}
          onPress={handleSaveStrategyOrder}
          disabled={submittingStrategy}
          activeOpacity={0.8}
        >
          {submittingStrategy ? (
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
          submittingStrategy && styles.disabledButton,
          { marginTop: 12 }
        ]}
        onPress={handleSaveStrategyOrder}
        disabled={submittingStrategy}
        activeOpacity={0.8}
      >
        {submittingStrategy ? (
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
  </>
);

export default function StrategyTab(props: StrategyTabProps) {
  return (
    <View style={props.styles.tabCard}>
      <Text style={props.styles.tabCardTitle}>Deployed Trading Algorithms</Text>
      <Text style={props.styles.tabCardSubtitle}>Auto-execute trades based on quantitative indicators and rules.</Text>

      <View style={{ marginTop: 16 }}>
        <BrokerSelection {...props} />
        <StrategySelection {...props} />
        <DateSelection {...props} />
        <AmountSelection {...props} />
        <SubmitButtons {...props} />
      </View>
    </View>
  );
}
