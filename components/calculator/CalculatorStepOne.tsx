import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, TouchableRipple } from 'react-native-paper';
import Button from '../ui/Button';
import { Field, ToggleGroup } from '../ui/Field';
import { Tag } from '../ui/Feedback';
import { Panel, SectionHeader } from '../ui/Panel';
import { radius, space } from '../../theme/tokens';

interface CalculatorStepOneProps {
  readonly styles?: any;
  readonly theme: any;
  readonly errors: Record<string, string>;
  readonly setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readonly selectedSymbol: string;
  readonly setSelectedSymbol: (val: string) => void;
  readonly searchQuery: string;
  readonly setSearchQuery: (val: string) => void;
  readonly showDropdown: boolean;
  readonly setShowDropdown: (val: boolean) => void;
  readonly loadingMargins: boolean;
  readonly filteredMargins: any[];
  readonly selectedLeverage: string;
  readonly setSelectedLeverage: (val: string) => void;
  readonly buyPrice: string;
  readonly setBuyPrice: (val: string) => void;
  readonly sellType: 'exact' | 'percent';
  readonly setSellType: (val: 'exact' | 'percent') => void;
  readonly sellPrice: string;
  readonly setSellPrice: (val: string) => void;
  readonly handleNext: () => void;
}

const formatLeverage = (raw: unknown) => {
  const parsed = Number.parseFloat(String(raw ?? '').trim());
  return !Number.isNaN(parsed) && parsed > 0 ? `${parsed.toFixed(2)}×` : '1×';
};

/** Step 1: which instrument, at what entry, and where the target sits. */
export default function CalculatorStepOne({
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
  selectedLeverage,
  setSelectedLeverage,
  buyPrice,
  setBuyPrice,
  sellType,
  setSellType,
  sellPrice,
  setSellPrice,
  handleNext,
}: CalculatorStepOneProps) {
  return (
    <View>
      <SectionHeader title="Instrument" />
      <Panel style={{ gap: space.lg }}>
        <View style={{ zIndex: 10 }}>
          <Field
            label="Symbol"
            icon="search-outline"
            placeholder={loadingMargins ? 'Loading instruments…' : 'e.g. RELIANCE'}
            value={selectedSymbol || searchQuery}
            editable={!loadingMargins}
            autoCapitalize="characters"
            error={errors.stock}
            onChangeText={(val) => {
              setSearchQuery(val);
              setSelectedSymbol('');
              setShowDropdown(true);
            }}
          />

          {loadingMargins ? (
            <View style={{ position: 'absolute', right: space.md, top: 40 }}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : null}

          {showDropdown && searchQuery && filteredMargins.length > 0 && !loadingMargins ? (
            <Panel padded={false} style={[styles.suggestions, { backgroundColor: theme.surfaceAlt }]}>
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 200 }}>
                {filteredMargins.slice(0, 10).map((marginItem: any, idx: number) => (
                  <TouchableRipple
                    key={marginItem.symbol || idx}
                    rippleColor={theme.ripple}
                    onPress={() => {
                      setSelectedSymbol(marginItem.symbol);
                      setSelectedLeverage(String(marginItem.requiredMargin || 1));
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                  >
                    <View style={[styles.suggestion, { borderBottomColor: theme.divider }]}>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.textPrimary }}>
                        {marginItem.symbol}
                      </Text>
                      <Tag label={formatLeverage(marginItem.requiredMargin)} tone="accent" />
                    </View>
                  </TouchableRipple>
                ))}
              </ScrollView>
            </Panel>
          ) : null}
        </View>

        {selectedSymbol ? (
          <View style={[styles.leverage, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>Available leverage</Text>
            <Tag label={formatLeverage(selectedLeverage)} tone="up" />
          </View>
        ) : null}

        <Field
          label="Entry price"
          value={buyPrice}
          onChangeText={(t) => {
            setBuyPrice(t.replace(/[^0-9.]/g, ''));
            setErrors((prev: any) => ({ ...prev, buyPrice: '' }));
          }}
          keyboardType="numeric"
          placeholder="0.00"
          prefix="₹"
          error={errors.buyPrice}
          numericFace
        />
      </Panel>

      <SectionHeader title="Exit target" />
      <Panel style={{ gap: space.lg }}>
        <ToggleGroup
          value={sellType}
          options={[
            { value: 'exact', label: 'PRICE' },
            { value: 'percent', label: 'PERCENT' },
          ]}
          onChange={(val) => setSellType(val as 'exact' | 'percent')}
        />

        <Field
          label={sellType === 'exact' ? 'Target price' : 'Target gain'}
          value={sellPrice}
          onChangeText={(t) => {
            setSellPrice(t.replace(/[^0-9.]/g, ''));
            setErrors((prev: any) => ({ ...prev, sellPrice: '' }));
          }}
          keyboardType="numeric"
          placeholder="0.00"
          prefix={sellType === 'exact' ? '₹' : undefined}
          suffix={sellType === 'percent' ? '%' : undefined}
          error={errors.sellPrice}
          numericFace
        />
      </Panel>

      <View style={{ marginTop: space.xl }}>
        <Button label="Continue to sizing" icon="arrow-forward" onPress={handleNext} />
      </View>
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
    borderRadius: radius.sm,
    elevation: 6,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leverage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.sm,
  },
});
