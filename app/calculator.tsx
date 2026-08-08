import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Text as PaperText, ProgressBar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalculatorResults from '../components/calculator/CalculatorResults';
import CalculatorStepOne from '../components/calculator/CalculatorStepOne';
import CalculatorStepTwo from '../components/calculator/CalculatorStepTwo';
import DatePickerModal from '../components/common/DatePickerModal';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { useMargins } from '../context/MarginContext';
import { useTheme } from '../context/ThemeContext';
import { useCalculatorStyles } from '../theme/calculatorStyles';
import { useAdaptiveLayout } from '../theme/layout';
import {
  BROKERAGE_PER_LEG,
  STT_DELIVERY_RATE,
  STT_INTRADAY_SELL_RATE,
  STAMP_DELIVERY_RATE,
  STAMP_INTRADAY_RATE,
  TRANSACTION_RATE,
  SEBI_RATE,
  GST_RATE,
  mtfInterest,
} from '../utils/charges';
import { rankMarginSymbols } from '../utils/margins';

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { isDarkMode, theme } = useTheme();
  const styles = useCalculatorStyles(isDarkMode);

  // Navigation Steps
  const [view, setView] = useState<'form' | 'results'>('form');
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  const { margins, loadingMargins } = useMargins();

  // Search Stocks states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedLeverage, setSelectedLeverage] = useState('1');
  const [showDropdown, setShowDropdown] = useState(false);

  // Form Fields
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellType, setSellType] = useState<'exact' | 'percent'>('exact');

  // Step 2 Fields
  const [entryDate, setEntryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [exitDate, setExitDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [daysHeld, setDaysHeld] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [quantityType, setQuantityType] = useState<'quantity' | 'investment'>('quantity');

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'entry' | 'exit'>('entry');
  const [pickerDate, setPickerDate] = useState(new Date());

  const handlePrevMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1));
  };

  // Results State
  const [results, setResults] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entryDate) {
      const start = new Date(entryDate);
      const end = exitDate ? new Date(exitDate) : new Date(new Date().toISOString().split('T')[0]);

      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (exitDate && end.getTime() < start.getTime()) {
          setExitDate('');
          setDaysHeld(0);
          return;
        }
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysHeld(Math.max(0, diffDays));
      }
    } else {
      setDaysHeld(0);
    }
  }, [entryDate, exitDate]);

  const filteredMargins = rankMarginSymbols(margins, searchQuery);

  const validateStepOne = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedSymbol) {
      newErrors.stock = 'Stock selection is required';
    }
    if (!buyPrice || Number.isNaN(Number.parseFloat(buyPrice)) || Number.parseFloat(buyPrice) <= 0) {
      newErrors.buyPrice = 'Enter a valid buy price';
    }
    if (!sellPrice || Number.isNaN(Number.parseFloat(sellPrice)) || Number.parseFloat(sellPrice) <= 0) {
      newErrors.sellPrice = sellType === 'exact' ? 'Enter a valid target price' : 'Enter a valid percentage';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStepTwo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (daysHeld < 0 || Number.isNaN(daysHeld)) {
      newErrors.daysHeld = 'Enter valid holding days';
    }
    if (!quantity || Number.isNaN(Number.parseFloat(quantity)) || Number.parseFloat(quantity) <= 0) {
      newErrors.quantity = quantityType === 'quantity' ? 'Enter quantity' : 'Enter capital amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStepOne()) {
      setActiveStep(2);
    }
  };

  const resetForm = () => {
    setActiveStep(1);
    setView('form');
    setBuyPrice('');
    setSellPrice('');
    setSelectedSymbol('');
    setSelectedLeverage('1');
    setSearchQuery('');
    setQuantity('');
    setExitDate('');
    const today = new Date();
    setEntryDate(today.toISOString().split('T')[0]);
    setErrors({});
    setResults(null);
  };

  const calculateReturns = () => {
    if (!validateStepTwo()) return;

    const leverage = Number.parseFloat(selectedLeverage) || 1;
    const bp = Number.parseFloat(buyPrice);
    const spInput = Number.parseFloat(sellPrice);
    const days = daysHeld || 0;
    const qtyVal = Number.parseFloat(quantity);

    const sp = sellType === 'exact' ? spInput : bp * (1 + spInput / 100);
    const shares = quantityType === 'quantity' ? qtyVal : Math.trunc((qtyVal * leverage) / bp);

    const totalValue = shares * bp;
    const marginUsed = totalValue / leverage;
    const fundedAmt = totalValue - marginUsed;
    const grossProfit = (sp - bp) * shares;
    const turnover = (bp + sp) * shares;

    const brokerage = 2 * BROKERAGE_PER_LEG;
    const STT = days > 0 ? turnover * STT_DELIVERY_RATE : shares * sp * STT_INTRADAY_SELL_RATE;
    const stampCharges = shares * bp * (days > 0 ? STAMP_DELIVERY_RATE : STAMP_INTRADAY_RATE);
    const transCharges = turnover * TRANSACTION_RATE;
    const sebiCharges = turnover * SEBI_RATE;
    const gst = GST_RATE * (sebiCharges + brokerage + transCharges);
    const totalCharges = brokerage + STT + transCharges + stampCharges + gst + sebiCharges;

    const interest = mtfInterest(fundedAmt, days);
    const netProfit = grossProfit - interest - totalCharges;

    const f = (n: number) => {
      return n.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    setResults({
      totalValue: f(totalValue),
      margin: f(marginUsed),
      funding: f(fundedAmt),
      interest: f(interest),
      gross: f(grossProfit),
      charges: f(totalCharges),
      net: f(netProfit),
      roi: marginUsed > 0 ? ((netProfit / marginUsed) * 100).toFixed(2) : '0.00',
      isProfit: netProfit >= 0,
      shares: shares,
      symbol: selectedSymbol,
      sellPrice: sp.toFixed(2),
    });

    setView('results');
  };

  const formatCurrency = (valStr: string) => {
    return `₹${valStr}`;
  };

  const selectedDateObj = datePickerTarget === 'entry'
    ? (entryDate ? new Date(entryDate) : new Date())
    : (exitDate ? new Date(exitDate) : new Date());

  return (
    <View style={[styles.safeArea, layout.screenPadding]}>
      {/* Steps Indicator / Result Header */}
      {view === 'form' && (
        <View style={{ paddingHorizontal: layout.horizontalPadding, paddingTop: insets.top + 12, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <PaperText variant="labelMedium" style={{ color: theme.primary, fontWeight: '800' }}>
              STEP {activeStep} OF 2
            </PaperText>
            <PaperText variant="bodySmall" style={{ color: theme.textSecondary, fontWeight: '600' }}>
              {activeStep === 1 ? 'Configure Entry & Target' : 'Holding Days & Size'}
            </PaperText>
          </View>
          <ProgressBar progress={activeStep === 1 ? 0.5 : 1.0} color={theme.primary} style={{ borderRadius: 4, height: 6 }} />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios' && view === 'form'}
        style={styles.keyboardFrame}
        keyboardVerticalOffset={insets.top + 60}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingHorizontal: layout.horizontalPadding },
            view === 'results' ? styles.resultsScrollContainer : null,
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          extraKeyboardSpace={72}
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            styles.container,
            layout.centeredContent,
            view === 'results' ? styles.resultsContentContainer : null,
          ]}>
            {(() => {
              if (view === 'form') {
                if (activeStep === 1) {
                  return (
                    <CalculatorStepOne
                      styles={styles}
                      theme={theme}
                      errors={errors}
                      setErrors={setErrors}
                      selectedSymbol={selectedSymbol}
                      setSelectedSymbol={setSelectedSymbol}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      showDropdown={showDropdown}
                      setShowDropdown={setShowDropdown}
                      loadingMargins={loadingMargins}
                      filteredMargins={filteredMargins}
                      setSelectedLeverage={setSelectedLeverage}
                      selectedLeverage={selectedLeverage}
                      buyPrice={buyPrice}
                      setBuyPrice={setBuyPrice}
                      sellType={sellType}
                      setSellType={setSellType}
                      sellPrice={sellPrice}
                      setSellPrice={setSellPrice}
                      handleNext={handleNext}
                    />
                  );
                } else {
                  return (
                    <CalculatorStepTwo
                      styles={styles}
                      theme={theme}
                      errors={errors}
                      setErrors={setErrors}
                      entryDate={entryDate}
                      exitDate={exitDate}
                      setDatePickerTarget={setDatePickerTarget}
                      setPickerDate={setPickerDate}
                      setShowDatePicker={setShowDatePicker}
                      daysHeld={daysHeld}
                      quantityType={quantityType}
                      setQuantityType={setQuantityType}
                      quantity={quantity}
                      setQuantity={setQuantity}
                      setActiveStep={setActiveStep}
                      calculateReturns={calculateReturns}
                    />
                  );
                }
              } else if (view === 'results' && results) {
                return (
                  <CalculatorResults
                    styles={styles}
                    theme={theme}
                    results={results}
                    setView={setView}
                    resetForm={resetForm}
                    formatCurrency={formatCurrency}
                  />
                );
              }
              return null;
            })()}
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <DatePickerModal
        styles={styles}
        theme={theme}
        visible={showDatePicker}
        pickerDate={pickerDate}
        selectedDate={selectedDateObj}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;

          if (datePickerTarget === 'entry') {
            setEntryDate(dateString);
            if (exitDate && new Date(exitDate) < date) {
              setExitDate(dateString);
            }
          } else {
            setExitDate(dateString);
          }
        }}
        isDateDisabled={(date) => {
          if (datePickerTarget === 'exit' && entryDate) {
            const entryAtMidnight = new Date(entryDate);
            entryAtMidnight.setHours(0, 0, 0, 0);
            return date < entryAtMidnight;
          }
          return false;
        }}
      />
    </View>
  );
}
