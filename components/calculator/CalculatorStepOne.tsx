import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Card, Text as PaperText, TextInput as PaperTextInput, Button as PaperButton, SegmentedButtons, HelperText, ActivityIndicator, Surface, Chip } from 'react-native-paper';

interface CalculatorStepOneProps {
  readonly styles: any;
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
  readonly setSelectedLeverage: (val: string) => void;
  readonly selectedLeverage: string;
  readonly buyPrice: string;
  readonly setBuyPrice: (val: string) => void;
  readonly sellType: 'exact' | 'percent';
  readonly setSellType: (val: 'exact' | 'percent') => void;
  readonly sellPrice: string;
  readonly setSellPrice: (val: string) => void;
  readonly handleNext: () => void;
}

const SymbolSearch = ({
  theme,
  errors,
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
}: any) => (
  <View style={{ marginBottom: 16 }}>
    <PaperTextInput
      mode="outlined"
      label="SYMBOL"
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
      textColor={theme.textPrimary}
      outlineColor={errors.stock ? theme.danger : theme.border}
      activeOutlineColor={theme.primary}
      left={
        <PaperTextInput.Icon
          icon={({ size, color }) => <Ionicons name="trending-up-outline" size={size || 18} color={color || theme.iconMuted} />}
        />
      }
      right={
        loadingMargins ? (
          <PaperTextInput.Icon icon={() => <ActivityIndicator size="small" color={theme.primary} />} />
        ) : undefined
      }
      style={{ backgroundColor: theme.card }}
    />
    {errors.stock ? <HelperText type="error" visible={true}>{errors.stock}</HelperText> : null}

    {showDropdown && searchQuery && filteredMargins.length > 0 && !loadingMargins ? (
      <Surface style={{ backgroundColor: theme.card, borderRadius: 12, marginTop: 4, elevation: 4, maxHeight: 200, zIndex: 99 }} elevation={3}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {filteredMargins.slice(0, 10).map((marginItem: any, idx: number) => {
            const rawMargin = marginItem.requiredMargin ?? '';
            const parsedMargin = Number.parseFloat(rawMargin.toString().trim());
            let uiMarginStr = '1x';
            if (!Number.isNaN(parsedMargin) && parsedMargin > 0) {
              uiMarginStr = `${parsedMargin.toFixed(2)}x`;
            }

            return (
              <TouchableOpacity
                key={marginItem.symbol || idx}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight }}
                onPress={() => {
                  setSelectedSymbol(marginItem.symbol);
                  setSelectedLeverage(String(rawMargin || 1));
                  setSearchQuery('');
                  setShowDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons name="trending-up" size={16} color={theme.primary} />
                  <PaperText variant="titleSmall" style={{ color: theme.textPrimary, fontWeight: '700' }}>
                    {marginItem.symbol}
                  </PaperText>
                </View>
                <Chip compact textStyle={{ fontSize: 11, fontWeight: '700' }}>
                  {uiMarginStr}
                </Chip>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Surface>
    ) : null}

    {selectedSymbol ? (
      <Surface style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: theme.primaryBackground, marginTop: 8 }} elevation={0}>
        <Ionicons name="shield-checkmark-outline" size={18} color={theme.success} />
        <PaperText variant="bodyMedium" style={{ marginLeft: 8, color: theme.textPrimary }}>
          Leverage for <PaperText style={{ fontWeight: '700' }}>{selectedSymbol}</PaperText> is{' '}
          <PaperText style={{ fontWeight: '700', color: theme.success }}>
            {(() => {
              const parsedMargin = Number.parseFloat(selectedLeverage?.toString().trim());
              return !Number.isNaN(parsedMargin) && parsedMargin > 0 ? `${parsedMargin.toFixed(2)}x` : '1x';
            })()}
          </PaperText>
        </PaperText>
      </Surface>
    ) : null}
  </View>
);

const EntryPriceInput = ({ theme, errors, setErrors, buyPrice, setBuyPrice }: any) => (
  <View style={{ marginBottom: 16 }}>
    <PaperTextInput
      mode="outlined"
      label="Entry Price (₹)"
      keyboardType="numeric"
      placeholder="0.00"
      placeholderTextColor={theme.placeholder}
      value={buyPrice}
      onChangeText={(t) => {
        const clean = t.replace(/[^0-9.]/g, '');
        setBuyPrice(clean);
        setErrors((prev: any) => ({ ...prev, buyPrice: '' }));
      }}
      textColor={theme.textPrimary}
      outlineColor={errors.buyPrice ? theme.danger : theme.border}
      activeOutlineColor={theme.primary}
      left={<PaperTextInput.Affix text="₹" />}
      style={{ backgroundColor: theme.card }}
    />
    {errors.buyPrice ? <HelperText type="error" visible={true}>{errors.buyPrice}</HelperText> : null}
  </View>
);

const ExitTargetSelector = ({ theme, errors, setErrors, sellType, setSellType, sellPrice, setSellPrice }: any) => (
  <View style={{ marginBottom: 20 }}>
    <PaperText variant="labelMedium" style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '700' }}>
      EXIT TARGET
    </PaperText>
    <SegmentedButtons
      value={sellType}
      onValueChange={(val) => setSellType(val as 'exact' | 'percent')}
      buttons={[
        { value: 'exact', label: 'Target Price' },
        { value: 'percent', label: 'Percentage' },
      ]}
      style={{ marginBottom: 12 }}
    />

    <PaperTextInput
      mode="outlined"
      label={sellType === 'exact' ? "Exit Target Price (₹)" : "Exit Target Percentage (%)"}
      keyboardType="numeric"
      placeholder={sellType === 'exact' ? "Exit target price" : "Percentage profit target"}
      placeholderTextColor={theme.placeholder}
      value={sellPrice}
      onChangeText={(t) => {
        const clean = t.replace(/[^0-9.]/g, '');
        setSellPrice(clean);
        setErrors((prev: any) => ({ ...prev, sellPrice: '' }));
      }}
      textColor={theme.textPrimary}
      outlineColor={errors.sellPrice ? theme.danger : theme.border}
      activeOutlineColor={theme.primary}
      left={sellType === 'exact' ? <PaperTextInput.Affix text="₹" /> : undefined}
      right={sellType === 'percent' ? <PaperTextInput.Affix text="%" /> : undefined}
      style={{ backgroundColor: theme.card }}
    />
    {errors.sellPrice ? <HelperText type="error" visible={true}>{errors.sellPrice}</HelperText> : null}
  </View>
);

export default function CalculatorStepOne(props: CalculatorStepOneProps) {
  return (
    <Card style={{ backgroundColor: props.theme.card, borderRadius: 24, padding: 8, elevation: 3 }}>
      <Card.Content>
        <SymbolSearch {...props} />
        <EntryPriceInput {...props} />
        <ExitTargetSelector {...props} />

        <PaperButton
          mode="contained"
          onPress={props.handleNext}
          buttonColor={props.theme.primary}
          icon={({ size }) => <Ionicons name="arrow-forward" size={size || 18} color="#ffffff" />}
          contentStyle={{ flexDirection: 'row-reverse', height: 50 }}
          labelStyle={{ fontSize: 16, fontWeight: '700' }}
          style={{ borderRadius: 14, marginTop: 8 }}
        >
          Position Sizing
        </PaperButton>
      </Card.Content>
    </Card>
  );
}
