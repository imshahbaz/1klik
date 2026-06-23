import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalculatorStepOneProps {
  styles: any;
  theme: any;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedSymbol: string;
  setSelectedSymbol: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showDropdown: boolean;
  setShowDropdown: (val: boolean) => void;
  loadingMargins: boolean;
  filteredMargins: any[];
  setSelectedLeverage: (val: string) => void;
  selectedLeverage: string;
  buyPrice: string;
  setBuyPrice: (val: string) => void;
  sellType: 'exact' | 'percent';
  setSellType: (val: 'exact' | 'percent') => void;
  sellPrice: string;
  setSellPrice: (val: string) => void;
  handleNext: () => void;
}

export default function CalculatorStepOne({
  styles,
  theme,
  errors,
  setErrors,
  selectedSymbol,
  setSelectedSymbol,
  searchQuery,
  setSearchQuery,
  showDropdown,
  setShowDropdown,
  loadingMargins,
  filteredMargins,
  setSelectedLeverage,
  selectedLeverage,
  buyPrice,
  setBuyPrice,
  sellType,
  setSellType,
  sellPrice,
  setSellPrice,
  handleNext
}: CalculatorStepOneProps) {
  return (
    <View style={styles.stepContent}>
      {/* Search Stock Input */}
      <View style={styles.formInputGroup}>
        <Text style={styles.formInputLabel}>SYMBOL</Text>
        <View style={[styles.formInputWrapper, errors.stock ? styles.inputError : null]}>
          <Ionicons name="trending-up-outline" size={18} color={theme.iconMuted} style={styles.formInputIcon} />
          <TextInput
            style={styles.formTextInput}
            value={selectedSymbol || searchQuery}
            onChangeText={(val) => {
              setSearchQuery(val);
              setSelectedSymbol('');
              setShowDropdown(true);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={loadingMargins ? "Loading stocks..." : "e.g. RELIANCE"}
            placeholderTextColor={theme.placeholder}
            onFocus={() => setShowDropdown(true)}
            editable={!loadingMargins}
          />
          {loadingMargins && (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
          )}
        </View>
        {errors.stock ? <Text style={styles.errorText}>{errors.stock}</Text> : null}

        {/* Autocomplete suggestions dropdown based on margins */}
        {showDropdown && searchQuery && filteredMargins.length > 0 && !loadingMargins ? (
          <View style={styles.verticalDropdownContainer}>
            <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
              {filteredMargins.slice(0, 10).map((marginItem, idx) => (
                <TouchableOpacity
                  key={marginItem.symbol || idx}
                  style={styles.suggestionRow}
                  onPress={() => {
                    setSelectedSymbol(marginItem.symbol);
                    setSelectedLeverage(String(marginItem.requiredMargin));
                    setSearchQuery(''); // Close recommendations on tap
                    setShowDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                    <Ionicons name="trending-up" size={14} color={theme.primary} />
                    <Text style={styles.suggestionRowSymbol} numberOfLines={1} adjustsFontSizeToFit>{marginItem.symbol}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {marginItem.requiredMargin ? (
                      <Text style={styles.suggestionRowBadge}>
                        {marginItem.requiredMargin}x
                      </Text>
                    ) : null}
                    <Ionicons name="chevron-forward" size={14} color={theme.iconMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* Selected leverage indicator */}
      {selectedSymbol ? (
        <View style={styles.leverageIndicatorBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color={theme.success} />
          <Text style={styles.leverageIndicatorText}>
            Leverage for <Text style={{ fontWeight: '700' }}>{selectedSymbol}</Text> is{' '}
            <Text style={{ fontWeight: '700', color: theme.success }}>{selectedLeverage}x</Text>
          </Text>
        </View>
      ) : null}

      {/* Entry Price */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Entry Price (₹)</Text>
        <View style={[styles.inputWrapper, errors.buyPrice ? styles.inputError : null]}>
          <Text style={styles.inputCurrencyPrefix}>₹</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={theme.placeholder}
            value={buyPrice}
            onChangeText={(t) => {
              const clean = t.replace(/[^0-9.]/g, '');
              setBuyPrice(clean);
              setErrors((prev) => ({ ...prev, buyPrice: '' }));
            }}
          />
        </View>
        {errors.buyPrice ? <Text style={styles.errorText}>{errors.buyPrice}</Text> : null}
      </View>

      {/* Exit Target Selector */}
      <View style={styles.exitStrategyBox}>
        <View style={styles.exitHeaderRow}>
          <Text style={styles.inputLabel}>Exit Target</Text>
          <View style={styles.tabToggleBg}>
            <TouchableOpacity
              style={[styles.toggleBtn, sellType === 'exact' ? styles.toggleBtnActive : null]}
              onPress={() => setSellType('exact')}
            >
              <Text style={[styles.toggleBtnText, sellType === 'exact' ? styles.toggleBtnTextActive : null]}>
                Target Price
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, sellType === 'percent' ? styles.toggleBtnActive : null]}
              onPress={() => setSellType('percent')}
            >
              <Text style={[styles.toggleBtnText, sellType === 'percent' ? styles.toggleBtnTextActive : null]}>
                Percentage
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.inputWrapper, errors.sellPrice ? styles.inputError : null]}>
          {sellType === 'exact' ? (
            <Text style={styles.inputCurrencyPrefix}>₹</Text>
          ) : null}
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            placeholder={sellType === 'exact' ? "Exit target price" : "Percentage profit target"}
            placeholderTextColor={theme.placeholder}
            value={sellPrice}
            onChangeText={(t) => {
              const clean = t.replace(/[^0-9.]/g, '');
              setSellPrice(clean);
              setErrors((prev) => ({ ...prev, sellPrice: '' }));
            }}
          />
          {sellType === 'percent' ? (
            <Text style={styles.inputCurrencySuffix}>%</Text>
          ) : null}
        </View>
        {errors.sellPrice ? <Text style={styles.errorText}>{errors.sellPrice}</Text> : null}
      </View>

      {/* Next button */}
      <TouchableOpacity
        style={styles.primaryActionButton}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryActionText}>Position Sizing</Text>
        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
