import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalculatorResults from '../components/calculator/CalculatorResults';
import CalculatorStepOne from '../components/calculator/CalculatorStepOne';
import CalculatorStepTwo from '../components/calculator/CalculatorStepTwo';
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

  // Calculate days held whenever entryDate or exitDate changes
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

  // Filter and sort stocks list
  const filteredMargins = margins.filter((item) =>
    item?.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const q = searchQuery.toLowerCase();
    const sA = a.symbol.toLowerCase();
    const sB = b.symbol.toLowerCase();

    if (sA === q) return -1;
    if (sB === q) return 1;

    const startsA = sA.startsWith(q);
    const startsB = sB.startsWith(q);
    if (startsA && !startsB) return -1;
    if (!startsA && startsB) return 1;

    return sA.localeCompare(sB);
  });

  const validateStep = (stepNum: 1 | 2) => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!selectedSymbol) {
        newErrors.stock = 'Stock selection is required';
      }
      if (!buyPrice || Number.isNaN(Number.parseFloat(buyPrice)) || Number.parseFloat(buyPrice) <= 0) {
        newErrors.buyPrice = 'Enter a valid buy price';
      }
      if (!sellPrice || Number.isNaN(Number.parseFloat(sellPrice)) || Number.parseFloat(sellPrice) <= 0) {
        newErrors.sellPrice = sellType === 'exact' ? 'Enter a valid target price' : 'Enter a valid percentage';
      }
    }

    if (stepNum === 2) {
      if (daysHeld < 0 || Number.isNaN(daysHeld)) {
        newErrors.daysHeld = 'Enter valid holding days';
      }
      if (!quantity || Number.isNaN(Number.parseFloat(quantity)) || Number.parseFloat(quantity) <= 0) {
        newErrors.quantity = quantityType === 'quantity' ? 'Enter quantity' : 'Enter capital amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(1)) {
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
    if (!validateStep(2)) return;

    const leverage = Number.parseFloat(selectedLeverage) || 1;
    const bp = Number.parseFloat(buyPrice);
    const spInput = Number.parseFloat(sellPrice);
    const days = daysHeld || 0;
    const qtyVal = Number.parseFloat(quantity);

    // Calculate Exit Target price
    const sp = sellType === 'exact' ? spInput : bp * (1 + spInput / 100);

    // Calculate Shares count
    const shares = quantityType === 'quantity' ? qtyVal : Math.trunc((qtyVal * leverage) / bp);

    const totalValue = shares * bp;
    const marginUsed = totalValue / leverage;
    const fundedAmt = totalValue - marginUsed;
    const grossProfit = (sp - bp) * shares;
    const turnover = (bp + sp) * shares;

    const brokerage = 2 * BROKERAGE_PER_LEG; // buy + sell legs
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

  return (
    <View style={[styles.safeArea, layout.screenPadding]}>


      {/* Steps Indicator / Result Header */}
      {view === 'form' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressStepText}>STEP {activeStep} OF 2</Text>
            <Text style={styles.progressTitleText}>
              {activeStep === 1 ? 'Configure Entry & Target' : 'Holding Days & Size'}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: activeStep === 1 ? '50%' : '100%' }]} />
          </View>
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
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.modalCalendarContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
                <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {pickerDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
                <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
                <View key={`wk-${idx}`} style={styles.calendarHeaderDayCell}>
                  <Text style={styles.calendarHeaderDayText}>{label}</Text>
                </View>
              ))}
              {(() => {
                const daysInMonth = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 0).getDate();
                const firstDayIndex = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1).getDay();
                const calendarDays = [];

                for (let i = 0; i < firstDayIndex; i++) {
                  calendarDays.push(null);
                }
                for (let i = 1; i <= daysInMonth; i++) {
                  calendarDays.push(new Date(pickerDate.getFullYear(), pickerDate.getMonth(), i));
                }

                let currentSelectionDate = null;
                if (datePickerTarget === 'entry') {
                  currentSelectionDate = entryDate ? new Date(entryDate) : null;
                } else {
                  currentSelectionDate = exitDate ? new Date(exitDate) : null;
                }

                const minAllowedDate = datePickerTarget === 'exit' && entryDate
                  ? new Date(entryDate)
                  : null;

                if (minAllowedDate) {
                  minAllowedDate.setHours(0, 0, 0, 0);
                }

                return calendarDays.map((dayDate, idx) => {
                  if (!dayDate) {
                    return <View key={`empty-${idx}`} style={styles.calendarDayCell} />;
                  }
                  const isSelected = currentSelectionDate?.getDate() === dayDate.getDate() &&
                    currentSelectionDate?.getMonth() === dayDate.getMonth() &&
                    currentSelectionDate?.getFullYear() === dayDate.getFullYear();

                  const dayDateAtMidnight = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
                  const isPastDate = minAllowedDate ? dayDateAtMidnight < minAllowedDate : false;

                  return (
                    <TouchableOpacity
                      key={`day-${idx}`}
                      style={[
                        styles.calendarDayCell,
                        isSelected && styles.selectedDayCell,
                        isPastDate && styles.pastDayCell
                      ]}
                      onPress={isPastDate ? undefined : () => {
                        // We use a manual string format so timezone adjustments don't shift the day
                        const year = dayDate.getFullYear();
                        const month = String(dayDate.getMonth() + 1).padStart(2, '0');
                        const day = String(dayDate.getDate()).padStart(2, '0');
                        const dateString = `${year}-${month}-${day}`;

                        if (datePickerTarget === 'entry') {
                          setEntryDate(dateString);
                          if (exitDate && new Date(exitDate) < dayDate) {
                            setExitDate(dateString);
                          }
                        } else {
                          setExitDate(dateString);
                        }
                        setShowDatePicker(false);
                      }}
                      disabled={isPastDate}
                      activeOpacity={isPastDate ? 1 : 0.7}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        isSelected && styles.selectedDayText,
                        isPastDate && styles.pastDayText
                      ]}>
                        {dayDate.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>

            <TouchableOpacity
              style={styles.calendarCloseBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.calendarCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
