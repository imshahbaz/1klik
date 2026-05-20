import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { marginAPI } from '../services/api';

interface MarginData {
  symbol: string;
  margin: string | number; // Leverage factor (e.g., 4 or "4")
}

export default function CalculatorScreen() {
  const router = useRouter();

  // Navigation Steps
  const [view, setView] = useState<'form' | 'results'>('form');
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // API margins
  const [margins, setMargins] = useState<MarginData[]>([]);
  const [loadingMargins, setLoadingMargins] = useState(true);
  const [marginError, setMarginError] = useState<string | null>(null);

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

  // Results State
  const [results, setResults] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch margins on mount
  useEffect(() => {
    const fetchMargins = async () => {
      setLoadingMargins(true);
      setMarginError(null);
      try {
        const response = await marginAPI.getAllMargins();
        const data = response?.data?.data || response?.data || [];
        setMargins(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching margins:', err);
        setMarginError('Failed to load margin data.');
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
      const end = exitDate ? new Date(exitDate) : new Date();

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {view === 'form' ? (
              // FORM VIEWS
              activeStep === 1 ? (
                // STEP 1: STOCK SELECTION, ENTRY & EXIT
                <View style={styles.stepContent}>
                  {/* Search Stock Input */}
                  <View style={styles.formInputGroup}>
                    <Text style={styles.formInputLabel}>SYMBOL</Text>
                    <View style={[styles.formInputWrapper, errors.stock ? styles.inputError : null]}>
                      <Ionicons name="trending-up-outline" size={18} color="#64748b" style={styles.formInputIcon} />
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
                        onFocus={() => setShowDropdown(true)}
                        editable={!loadingMargins}
                      />
                      {loadingMargins && (
                        <ActivityIndicator size="small" color="#f05a28" style={{ marginRight: 8 }} />
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
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="trending-up" size={14} color="#f05a28" />
                                <Text style={styles.suggestionRowSymbol}>{marginItem.symbol}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                {marginItem.margin ? (
                                  <Text style={styles.suggestionRowBadge}>
                                    {marginItem.margin}x
                                  </Text>
                                ) : null}
                                <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
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
                      <Ionicons name="shield-checkmark-outline" size={18} color="#10b981" />
                      <Text style={styles.leverageIndicatorText}>
                        Leverage for <Text style={{ fontWeight: '700' }}>{selectedSymbol}</Text> is{' '}
                        <Text style={{ fontWeight: '700', color: '#10b981' }}>{selectedLeverage}x</Text>
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
                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Entry Date</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="calendar-outline" size={18} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="YYYY-MM-DD"
                          value={entryDate}
                          onChangeText={setEntryDate}
                        />
                      </View>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Exit Date (Optional)</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="calendar-outline" size={18} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="YYYY-MM-DD"
                          value={exitDate}
                          onChangeText={setExitDate}
                        />
                      </View>
                    </View>
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
                      <Ionicons name="arrow-back" size={18} color="#64748b" />
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
                        <Ionicons name="create-outline" size={16} color="#0f172a" />
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
                      <Ionicons name="wallet-outline" size={18} color="#4f46e5" />
                      <Text style={styles.resultsDetailCardTitle}>Position Summary</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Stock Symbol</Text>
                      <Text style={styles.detailValueBold}>{results.symbol}</Text>
                    </View>
                    <View style={styles.rowDivider} />
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Shares Quantity</Text>
                      <Text style={styles.detailValue}>{results.shares} shares</Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Position Value</Text>
                      <Text style={styles.detailValue}>{formatCurrency(results.totalValue)}</Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Your Required Capital</Text>
                      <Text style={styles.detailValueBold}>{formatCurrency(results.margin)}</Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Exit Target Price</Text>
                      <Text style={styles.detailValue}>{formatCurrency(results.sellPrice)}</Text>
                    </View>
                  </View>

                  {/* Section 2: Cost Breakdown */}
                  <View style={styles.resultsDetailCard}>
                    <View style={styles.resultsHeaderRow}>
                      <Ionicons name="receipt-outline" size={18} color="#f43f5e" />
                      <Text style={styles.resultsDetailCardTitle}>Cost Breakdown</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Gross Profit / Loss</Text>
                      <Text style={[styles.detailValue, results.isProfit ? styles.textProfit : styles.textLoss]}>
                        {formatCurrency(results.gross)}
                      </Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>MTF Interest (15% p.a.)</Text>
                      <Text style={styles.detailValue}>{formatCurrency(results.interest)}</Text>
                    </View>
                    <View style={styles.rowDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Charges & Taxes</Text>
                      <Text style={styles.detailValueBold}>{formatCurrency(results.charges)}</Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  customHeader: {
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: '#ffffff',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStepText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  progressTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#f8fafc',
  },
  inputIcon: {
    marginRight: 10,
  },
  inputCurrencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 6,
  },
  inputCurrencySuffix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#f43f5e',
    backgroundColor: '#fff1f2',
  },
  errorText: {
    fontSize: 12,
    color: '#f43f5e',
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  formInputGroup: {
    marginBottom: 14,
  },
  formInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  formInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    height: 48,
  },
  formInputIcon: {
    marginRight: 8,
  },
  formTextInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  verticalDropdownContainer: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionRowSymbol: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  suggestionRowBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f05a28',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  dropdownEmptyText: {
    textAlign: 'center',
    paddingVertical: 16,
    color: '#64748b',
    fontSize: 13,
  },
  leverageIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
    gap: 8,
  },
  leverageIndicatorText: {
    fontSize: 13,
    color: '#166534',
    flex: 1,
  },
  exitStrategyBox: {
    marginBottom: 20,
  },
  exitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabToggleBg: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleBtnTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  primaryActionButton: {
    backgroundColor: '#4f46e5',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  daysHeldPreviewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  daysHeldPreviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  daysHeldBadge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  daysHeldBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338ca',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 52,
    gap: 6,
  },
  secondaryActionText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700',
  },
  calculateActionButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 16,
    height: 52,
    gap: 6,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  calculateActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  resultsContainer: {
    width: '100%',
  },
  headlineCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  headlineCardProfit: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    shadowColor: '#10b981',
  },
  headlineCardLoss: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecaca',
    shadowColor: '#f43f5e',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircleProfit: {
    backgroundColor: '#10b981',
  },
  iconCircleLoss: {
    backgroundColor: '#f43f5e',
  },
  headlineLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headlinePnLValue: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 10,
  },
  textProfit: {
    color: '#047857',
  },
  textLoss: {
    color: '#b91c1c',
  },
  roiBadge: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 20,
  },
  roiBadgeProfit: {
    backgroundColor: '#d1fae5',
  },
  roiBadgeLoss: {
    backgroundColor: '#ffe4e6',
  },
  roiBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  roiBadgeTextProfit: {
    color: '#065f46',
  },
  roiBadgeTextLoss: {
    color: '#991b1b',
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resultAdjustBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    height: 46,
    gap: 6,
  },
  resultAdjustBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  resultResetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    height: 46,
    gap: 6,
  },
  resultResetBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultsDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultsDetailCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  detailValueBold: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '800',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
});
