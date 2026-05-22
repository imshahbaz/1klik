import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { useTheme } from '../context/ThemeContext';
import { marginAPI } from '../services/api';
import { useCalculatorStyles } from '../theme/calculatorStyles';
import { getSafeBottomPadding } from '../theme/safeArea';

interface MarginData {
  symbol: string;
  margin: string | number; // Leverage factor (e.g., 4 or "4")
}

export default function CalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, theme } = useTheme();
  const styles = useCalculatorStyles(isDarkMode);

  // Navigation Steps
  const [view, setView] = useState<'form' | 'results'>('form');
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // API margins
  const [margins, setMargins] = useState<MarginData[]>([]);
  const [loadingMargins, setLoadingMargins] = useState(true);

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
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [exitDate, setExitDate] = useState('');
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

  // Fetch margins on mount
  useEffect(() => {
    const fetchMargins = async () => {
      setLoadingMargins(true);
      try {
        const response = await marginAPI.getAllMargins();
        const data = response?.data?.data || response?.data || [];
        setMargins(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching margins:', err);
      } finally {
        setLoadingMargins(false);
      }
    };
    fetchMargins();
  }, []);

  // Calculate days held whenever entryDate or exitDate changes
  useEffect(() => {
    if (entryDate) {
      const start = new Date(entryDate);
      const end = exitDate ? new Date(exitDate) : new Date(entryDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (exitDate && end.getTime() < start.getTime()) {
          setExitDate('');
          setDaysHeld(0);
          return;
        }
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysHeld(diffDays > 0 ? diffDays : 0);
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
      if (!buyPrice || isNaN(parseFloat(buyPrice)) || parseFloat(buyPrice) <= 0) {
        newErrors.buyPrice = 'Enter a valid buy price';
      }
      if (!sellPrice || isNaN(parseFloat(sellPrice)) || parseFloat(sellPrice) <= 0) {
        newErrors.sellPrice = sellType === 'exact' ? 'Enter a valid target price' : 'Enter a valid percentage';
      }
    }

    if (stepNum === 2) {
      if (daysHeld < 0 || isNaN(daysHeld)) {
        newErrors.daysHeld = 'Enter valid holding days';
      }
      if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
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

    const leverage = parseFloat(selectedLeverage) || 1;
    const bp = parseFloat(buyPrice);
    const spInput = parseFloat(sellPrice);
    const days = daysHeld || 0;
    const qtyVal = parseFloat(quantity);

    // Calculate Exit Target price
    const sp = sellType === 'exact' ? spInput : bp * (1 + spInput / 100);

    // Calculate Shares count
    const shares = quantityType === 'quantity' ? qtyVal : Math.trunc((qtyVal * leverage) / bp);

    const totalValue = shares * bp;
    const marginUsed = totalValue / leverage;
    const fundedAmt = totalValue - marginUsed;
    const grossProfit = (sp - bp) * shares;
    const turnover = (bp + sp) * shares;

    const brokerage = 40;
    const STT = days > 0 ? turnover * 0.001 : shares * sp * 0.00025;
    const stampCharges = shares * bp * (days > 0 ? 0.00015 : 0.00003);
    const transCharges = turnover * 0.0000345;
    const sebiCharges = turnover * 0.000001;
    const gst = 0.18 * (sebiCharges + brokerage + transCharges);
    const totalCharges = brokerage + STT + transCharges + stampCharges + gst + sebiCharges;

    const mtfInterest = (fundedAmt * 0.15 * days) / 365;
    const netProfit = grossProfit - mtfInterest - totalCharges;

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
      interest: f(mtfInterest),
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
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: getSafeBottomPadding(insets.bottom) }]}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (view === 'results') {
            setView('form');
          } else if (activeStep === 2) {
            setActiveStep(1);
          } else {
            router.back();
          }
        }}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MTF Trade Calculator</Text>
        <View style={{ width: 40 }} />
      </View>

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
            view === 'results' ? styles.resultsScrollContainer : null,
          ]}
          keyboardShouldPersistTaps="handled"
          extraKeyboardSpace={72}
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            styles.container,
            view === 'results' ? styles.resultsContentContainer : null,
          ]}>
            {view === 'form' ? (
              // FORM VIEWS
              activeStep === 1 ? (
                // STEP 1: STOCK SELECTION, ENTRY & EXIT
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
                              key={idx}
                              style={styles.suggestionRow}
                              onPress={() => {
                                setSelectedSymbol(marginItem.symbol);
                                setSelectedLeverage(String(marginItem.margin));
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
                                {marginItem.margin ? (
                                  <Text style={styles.suggestionRowBadge}>
                                    {marginItem.margin}x
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
              ) : (
                // STEP 2: DATES & POSITION SIZE METHOD
                <View style={styles.stepContent}>
                  {/* Date fields */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Entry Date</Text>
                    <TouchableOpacity
                      style={styles.inputWrapper}
                      onPress={() => {
                        setDatePickerTarget('entry');
                        if (entryDate) setPickerDate(new Date(entryDate));
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar-outline" size={18} color={theme.iconMuted} style={styles.inputIcon} />
                      <Text style={[styles.textInput, { color: entryDate ? theme.textPrimary : theme.textSecondary }]}>
                        {entryDate || 'YYYY-MM-DD'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Exit Date (Optional)</Text>
                    <TouchableOpacity
                      style={styles.inputWrapper}
                      onPress={() => {
                        setDatePickerTarget('exit');
                        if (exitDate) setPickerDate(new Date(exitDate));
                        else if (entryDate) setPickerDate(new Date(entryDate));
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar-outline" size={18} color={theme.iconMuted} style={styles.inputIcon} />
                      <Text style={[styles.textInput, { color: exitDate ? theme.textPrimary : theme.textSecondary }]}>
                        {exitDate || 'Select Exit Date'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Days held projection */}
                  <View style={styles.daysHeldPreviewBox}>
                    <Text style={styles.daysHeldPreviewLabel}>Calculated Holding Days</Text>
                    <View style={styles.daysHeldBadge}>
                      <Text style={styles.daysHeldBadgeText}>{daysHeld} Days</Text>
                    </View>
                  </View>

                  {/* Quantity Type Switcher */}
                  <View style={styles.exitStrategyBox}>
                    <View style={styles.exitHeaderRow}>
                      <Text style={styles.inputLabel}>Entry Method</Text>
                      <View style={styles.tabToggleBg}>
                        <TouchableOpacity
                          style={[styles.toggleBtn, quantityType === 'quantity' ? styles.toggleBtnActive : null]}
                          onPress={() => setQuantityType('quantity')}
                        >
                          <Text style={[styles.toggleBtnText, quantityType === 'quantity' ? styles.toggleBtnTextActive : null]}>
                            By Shares
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.toggleBtn, quantityType === 'investment' ? styles.toggleBtnActive : null]}
                          onPress={() => setQuantityType('investment')}
                        >
                          <Text style={[styles.toggleBtnText, quantityType === 'investment' ? styles.toggleBtnTextActive : null]}>
                            By Capital
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={[styles.inputWrapper, errors.quantity ? styles.inputError : null]}>
                      {quantityType === 'investment' ? (
                        <Text style={styles.inputCurrencyPrefix}>₹</Text>
                      ) : null}
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder={quantityType === 'quantity' ? "Number of shares" : "Total capital amount"}
                        placeholderTextColor={theme.placeholder}
                        value={quantity}
                        onChangeText={(t) => {
                          const clean = t.replace(/[^0-9.]/g, '');
                          setQuantity(clean);
                          setErrors((prev) => ({ ...prev, quantity: '' }));
                        }}
                      />
                    </View>
                    {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      onPress={() => setActiveStep(1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="arrow-back" size={18} color={theme.iconMuted} />
                      <Text style={styles.secondaryActionText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.calculateActionButton}
                      onPress={calculateReturns}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="calculator" size={18} color="#ffffff" />
                      <Text style={styles.calculateActionText}>Calculate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            ) : (
              // RESULTS SCREEN (Beautiful detailed outputs)
              results && (
                <View style={styles.resultsContainer}>
                  {/* Headline ROI card */}
                  <View style={[styles.headlineCard, results.isProfit ? styles.headlineCardProfit : styles.headlineCardLoss]}>
                    <View style={[styles.iconCircle, results.isProfit ? styles.iconCircleProfit : styles.iconCircleLoss]}>
                      <Ionicons name={results.isProfit ? "trending-up" : "trending-down"} size={32} color="#ffffff" />
                    </View>

                    <Text style={styles.headlineLabel}>Net P&L Result</Text>
                    <Text style={[styles.headlinePnLValue, results.isProfit ? styles.textProfit : styles.textLoss]}>
                      ₹{results.net}
                    </Text>

                    <View style={[styles.roiBadge, results.isProfit ? styles.roiBadgeProfit : styles.roiBadgeLoss]}>
                      <Text style={[styles.roiBadgeText, results.isProfit ? styles.roiBadgeTextProfit : styles.roiBadgeTextLoss]}>
                        {results.roi}% ROI
                      </Text>
                    </View>

                    {/* Reset options */}
                    <View style={styles.resultActionsRow}>
                      <TouchableOpacity
                        style={styles.resultAdjustBtn}
                        onPress={() => setView('form')}
                      >
                        <Ionicons name="create-outline" size={16} color={theme.textPrimary} />
                        <Text style={styles.resultAdjustBtnText}>Adjust</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.resultResetBtn}
                        onPress={resetForm}
                      >
                        <Ionicons name="refresh-outline" size={16} color="#ffffff" />
                        <Text style={styles.resultResetBtnText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Section 1: Position Summary */}
                  <View style={styles.resultsDetailCard}>
                    <View style={styles.resultsHeaderRow}>
                      <Ionicons name="wallet-outline" size={18} color={theme.secondary} />
                      <Text style={styles.resultsDetailCardTitle}>Position Summary</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Stock Symbol</Text>
                      <Text style={styles.detailValueBold} numberOfLines={1} adjustsFontSizeToFit>{results.symbol}</Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Shares Quantity</Text>
                      <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>{results.shares} shares</Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Total Position Value</Text>
                      <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.totalValue)}</Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Your Required Capital</Text>
                      <Text style={styles.detailValueBold} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.margin)}</Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Exit Target Price</Text>
                      <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.sellPrice)}</Text>
                    </View>
                  </View>

                  {/* Section 2: Cost Breakdown */}
                  <View style={styles.resultsDetailCard}>
                    <View style={styles.resultsHeaderRow}>
                      <Ionicons name="receipt-outline" size={18} color={theme.danger} />
                      <Text style={styles.resultsDetailCardTitle}>Cost Breakdown</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Gross Profit / Loss</Text>
                      <Text style={[styles.detailValue, results.isProfit ? styles.textProfit : styles.textLoss]} numberOfLines={1} adjustsFontSizeToFit>
                        {formatCurrency(results.gross)}
                      </Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>MTF Interest (15% p.a.)</Text>
                      <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.interest)}</Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>Total Charges & Taxes</Text>
                      <Text style={styles.detailValueBold} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(results.charges)}</Text>
                    </View>
                  </View>
                </View>
              )
            )}
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

                const currentSelectionDate = datePickerTarget === 'entry'
                  ? (entryDate ? new Date(entryDate) : null)
                  : (exitDate ? new Date(exitDate) : null);

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
                  const isSelected = currentSelectionDate &&
                    currentSelectionDate.getDate() === dayDate.getDate() &&
                    currentSelectionDate.getMonth() === dayDate.getMonth() &&
                    currentSelectionDate.getFullYear() === dayDate.getFullYear();

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
