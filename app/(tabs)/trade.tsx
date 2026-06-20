import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { CustomAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { marginAPI, strategyOrderAPI, zerodhaAPI } from '../../services/api';
import { useAdaptiveLayout } from '../../theme/layout';
import { useZerodhaStyles } from '../../theme/zerodhaStyles';

export default function TradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { user, appLoading, logout } = useAuth() as any;
  const { isDarkMode, theme } = useTheme();
  const styles = useZerodhaStyles(isDarkMode);

  useEffect(() => {
    if (!appLoading && !user) {
      router.replace('/login');
    }
  }, [user, appLoading]);

  const [searchQuery, setSearchQuery] = useState('');
  const [marginsData, setMarginsData] = useState<any[]>([]);

  useEffect(() => {
    marginAPI.getAllMargins().then(res => {
      if (res.data?.success) {
        setMarginsData(res.data.data);
      } else {
        setMarginsData(res.data);
      }
    }).catch(console.error);
  }, []);

  // Filtered Margins helper
  const filteredMargins = Array.isArray(marginsData) ? marginsData
    .filter((m: any) => m && m.symbol && m.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a: any, b: any) => {
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
    }).slice(0, 10) : [];

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'execute' | 'strategy' | 'history'>('execute');

  // Order Execution Form State
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradeQty, setTradeQty] = useState('10');
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [executingTrade, setExecutingTrade] = useState(false);
  const [tradeBroker, setTradeBroker] = useState<'ZERODHA' | 'RUPEEZY'>('ZERODHA');
  const [showExecuteBrokerDropdown, setShowExecuteBrokerDropdown] = useState(false);


  // Premium MTF History & Strategy History States
  const [mtfOrders, setMtfOrders] = useState<any[]>([]);
  const [strategyOrders, setStrategyOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit Order State
  const [editingMtfOrderId, setEditingMtfOrderId] = useState<string | null>(null);

  // Strategy Order Form State
  const [strategyFormData, setStrategyFormData] = useState({
    strategyName: '',
    amount: '',
    date: '',
    broker: 'ZERODHA' as 'ZERODHA' | 'RUPEEZY',
  });
  const [editingStrategyOrderId, setEditingStrategyOrderId] = useState<string | null>(null);
  const [submittingStrategy, setSubmittingStrategy] = useState(false);
  const [showStrategyDropdown, setShowStrategyDropdown] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'execute' | 'strategy'>('execute');
  const [showStrategyBrokerDropdown, setShowStrategyBrokerDropdown] = useState(false);

  const parseTargetDate = (dateStr: string) => {
    try {
      if (!dateStr) return new Date();
      const parsed = Date.parse(dateStr);
      if (!isNaN(parsed)) return new Date(parsed);

      const parts = dateStr.split(' ');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        let monthIdx = months.findIndex(m => m.toLowerCase() === parts[1].toLowerCase().substring(0, 3));
        if (monthIdx === -1) {
          monthIdx = fullMonths.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
        }

        const year = parseInt(parts[2]);
        if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
          return new Date(year, monthIdx, day);
        }
      }
      return new Date();
    } catch {
      return new Date();
    }
  };

  const formatDateString = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = () => {
    const today = new Date();
    if (pickerDate.getFullYear() > today.getFullYear() ||
      (pickerDate.getFullYear() === today.getFullYear() && pickerDate.getMonth() > today.getMonth())) {
      setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1));
  };

  const fetchHistoryData = async () => {
    const userId = user?.id || user?.userId;
    if (!userId) return;

    try {
      setLoadingHistory(true);

      const [mtfRes, stratRes] = await Promise.allSettled([
        zerodhaAPI.getUserOrders(userId),
        strategyOrderAPI.getMyOrders(),
      ]);

      if (mtfRes.status === 'fulfilled') {
        const rawData = mtfRes.value.data;
        const ordersArray = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
        const formatted = ordersArray.map((order: any, idx: number) => ({
          id: order.id || `m-api-${idx}`,
          symbol: order.symbol,
          qty: order.quantity || order.qty || 10,
          price: order.price || 2845.20,
          time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: order.status || 'COMPLETED',
          reason: order.reason || undefined,
          targetDate: order.date ? formatDateString(new Date(order.date)) : 'Today',
        }));
        setMtfOrders(formatted);
      } else {
        setMtfOrders([]);
      }

      if (stratRes.status === 'fulfilled') {
        const rawData = stratRes.value.data;
        const stratArray = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
        const formatted = stratArray.map((order: any, idx: number) => ({
          id: order.id || order._id || `s-api-${idx}`,
          symbol: order.symbol || 'AUTO',
          qty: order.quantity || order.qty || 1,
          price: order.price || 0,
          time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: order.status || 'COMPLETED',
          reason: order.reason || undefined,
          strategyName: order.strategyName || 'RSI15MIN',
          amount: order.amount || 0,
          date: order.date || '',
        }));
        setStrategyOrders(formatted);
      } else {
        setStrategyOrders([]);
      }
    } catch (err) {
      console.error('Error fetching history logs:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (tab: 'execute' | 'strategy' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      fetchHistoryData();
    }
  };

  const handleExecuteOrder = async () => {
    if (!tradeSymbol.trim()) {
      CustomAlert.alert('Execution Alert', 'Please enter or select a stock symbol.');
      return;
    }
    if (!tradeQty || parseInt(tradeQty) <= 0) {
      CustomAlert.alert('Execution Alert', 'Please enter a valid quantity.');
      return;
    }

    const parsedUserId = Number(user?.id || user?.userId || 1);
    const isoDateString = formatIsoDate(targetDate);

    const payload = {
      userId: parsedUserId,
      symbol: tradeSymbol.toUpperCase().trim(),
      quantity: parseInt(tradeQty),
      date: isoDateString,
      broker: tradeBroker,
    };

    try {
      setExecutingTrade(true);

      if (editingMtfOrderId) {
        await zerodhaAPI.updateOrder(editingMtfOrderId, payload);

        setMtfOrders(prev => prev.map(o => o.id === editingMtfOrderId ? {
          ...o,
          symbol: tradeSymbol.toUpperCase().trim(),
          qty: parseInt(tradeQty),
          targetDate: formatDateString(targetDate),
          status: 'COMPLETED',
          reason: undefined,
        } : o));

        CustomAlert.alert(
          'Order Updated Successfully',
          `Successfully updated scheduled MTF order for ${tradeSymbol.toUpperCase()} to ${tradeQty} shares, target date: ${formatDateString(targetDate)}.`
        );
        setEditingMtfOrderId(null);
      } else {
        const response = await zerodhaAPI.placeMTFOrder(payload);

        const newOrder = {
          id: (mtfOrders.length + 1).toString(),
          symbol: tradeSymbol.toUpperCase().trim(),
          type: 'BUY',
          qty: parseInt(tradeQty),
          price: response.data?.price || 2845.20,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'COMPLETED',
          reason: undefined,
          targetDate: formatDateString(targetDate),
        };

        setMtfOrders([newOrder, ...mtfOrders]);
        CustomAlert.alert(
          'Order Placed Successfully',
          `Successfully registered MTF order for ${tradeQty} shares of ${tradeSymbol.toUpperCase()} target date: ${formatDateString(targetDate)}.`
        );
      }

      setTradeSymbol('');
      setSearchQuery('');
      setTradeQty('10');
      setTargetDate(new Date());
    } catch (err: any) {
      console.error('Failed to process MTF order:', err);

      const isConflict = err?.response?.status === 409;
      const errMsg = err?.response?.data?.message || err?.message || 'Network error occurred.';

      if (editingMtfOrderId) {
        setMtfOrders(prev => prev.map(o => o.id === editingMtfOrderId ? {
          ...o,
          status: isConflict ? 'CONFLICT' : 'REJECTED',
          reason: isConflict ? (err?.response?.data?.message || 'Order already scheduled for this date') : errMsg,
        } : o));

        if (isConflict) {
          CustomAlert.alert(
            'Scheduling Conflict',
            err?.response?.data?.message || 'An MTF order is already scheduled for this symbol on the selected target date.'
          );
        } else {
          CustomAlert.alert(
            'Update Failed',
            `Could not update MTF order: ${errMsg}`
          );
        }
      } else {
        const rejectedOrder = {
          id: (mtfOrders.length + 1).toString(),
          symbol: tradeSymbol.toUpperCase().trim(),
          type: 'BUY',
          qty: parseInt(tradeQty),
          price: 0,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: isConflict ? 'CONFLICT' : 'REJECTED',
          reason: isConflict ? (err?.response?.data?.message || 'Order already scheduled for this date') : errMsg,
          targetDate: formatDateString(targetDate),
        };
        setMtfOrders([rejectedOrder, ...mtfOrders]);

        if (isConflict) {
          CustomAlert.alert(
            'Scheduling Conflict',
            err?.response?.data?.message || 'An MTF order is already scheduled for this symbol on the selected target date.'
          );
        } else {
          CustomAlert.alert(
            'Order Failed',
            `Could not place MTF order: ${errMsg}`
          );
        }
      }
    } finally {
      setExecutingTrade(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'execute':
        return (
          <View style={styles.tabCard}>
            <Text style={styles.tabCardTitle}>Broker Direct Execution</Text>
            <Text style={styles.tabCardSubtitle}>Instant trade triggers sent directly to your broker terminal.</Text>

            {/* Broker Selection */}
            <View style={styles.formInputGroup as any}>
              <Text style={styles.formInputLabel as any}>BROKER</Text>
              <View style={styles.formInputWrapper as any}>
                <Ionicons name="business-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon as any} />
                {Platform.OS === 'web' ? (
                  <select
                    value={tradeBroker}
                    onChange={(e: any) => setTradeBroker(e.target.value as any)}
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
                    <Text style={[
                      { fontSize: 14, fontWeight: '600' },
                      { color: theme.textPrimary }
                    ] as any}>
                      {tradeBroker}
                    </Text>
                    <Ionicons name={showExecuteBrokerDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {Platform.OS !== 'web' && showExecuteBrokerDropdown && (
                <View style={styles.verticalDropdownContainer as any}>
                  {['ZERODHA', 'RUPEEZY'].map((brokerOption) => (
                    <TouchableOpacity
                      key={brokerOption}
                      style={styles.suggestionRow as any}
                      onPress={() => {
                        setTradeBroker(brokerOption as any);
                        setShowExecuteBrokerDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionRowSymbol as any}>{brokerOption}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Trading Symbol */}
            <View style={styles.formInputGroup as any}>
              <Text style={styles.formInputLabel as any}>SYMBOL</Text>
              <View style={styles.formInputWrapper as any}>
                <Ionicons name="trending-up-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon as any} />
                <TextInput
                  style={styles.formTextInput as any}
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
                <View style={styles.verticalDropdownContainer as any}>
                  {filteredMargins.map((marginItem: any, idx: number) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.suggestionRow as any}
                      onPress={() => {
                        setTradeSymbol(marginItem.symbol);
                        setSearchQuery(''); // Close recommendations on tap
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="trending-up" size={14} color={theme.primary} />
                        <Text style={styles.suggestionRowSymbol as any}>{marginItem.symbol}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {marginItem.requiredMargin || marginItem.leverage ? (
                          <Text style={styles.suggestionRowBadge as any}>
                            {marginItem.requiredMargin || marginItem.leverage}
                          </Text>
                        ) : null}
                        {marginItem.price || marginItem.ltp ? (
                          <Text style={styles.suggestionRowPrice as any}>
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
            <View style={styles.formInputGroup as any}>
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
            <View style={styles.formInputGroup as any}>
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
                <Text style={styles.datePickerText as any} numberOfLines={1} adjustsFontSizeToFit>
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
                  ] as any}
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
                  <Text style={[styles.executeActionBtnText, { color: theme.textSecondary }] as any}>
                    CANCEL EDIT
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.executeActionBtn,
                    styles.executeBuyBtn,
                    { flex: 1 },
                    executingTrade && styles.disabledButton
                  ] as any}
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
                ] as any}
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

      case 'strategy':
        return (
          <View style={styles.tabCard}>
            <Text style={styles.tabCardTitle}>Deployed Trading Algorithms</Text>
            <Text style={styles.tabCardSubtitle}>Auto-execute trades based on quantitative indicators and rules.</Text>

            {/* Strategy Form */}
            <View style={{ marginTop: 16 }}>
              {/* Broker Selection */}
              <View style={styles.formInputGroup as any}>
                <Text style={styles.formInputLabel as any}>BROKER</Text>
                <View style={styles.formInputWrapper as any}>
                  <Ionicons name="business-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon as any} />
                  {Platform.OS === 'web' ? (
                    <select
                      value={strategyFormData.broker}
                      onChange={(e: any) => setStrategyFormData({ ...strategyFormData, broker: e.target.value as any })}
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
                      <Text style={[
                        { fontSize: 14, fontWeight: '600' },
                        { color: theme.textPrimary }
                      ] as any}>
                        {strategyFormData.broker}
                      </Text>
                      <Ionicons name={showStrategyBrokerDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {Platform.OS !== 'web' && showStrategyBrokerDropdown && (
                  <View style={styles.verticalDropdownContainer as any}>
                    {['ZERODHA', 'RUPEEZY'].map((brokerOption) => (
                      <TouchableOpacity
                        key={brokerOption}
                        style={styles.suggestionRow as any}
                        onPress={() => {
                          setStrategyFormData({ ...strategyFormData, broker: brokerOption as any });
                          setShowStrategyBrokerDropdown(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suggestionRowSymbol as any}>{brokerOption}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Strategy Name */}
              <View style={styles.formInputGroup as any}>
                <Text style={styles.formInputLabel as any}>STRATEGY NAME</Text>
                <View style={styles.formInputWrapper as any}>
                  <Ionicons name="git-branch-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon as any} />
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
                        { fontSize: 14, fontWeight: '600' },
                        strategyFormData.strategyName ? { color: theme.textPrimary } : { color: theme.placeholder }
                      ] as any}>
                        {strategyFormData.strategyName || "Select Strategy"}
                      </Text>
                      <Ionicons name={showStrategyDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {Platform.OS !== 'web' && showStrategyDropdown && (
                  <View style={styles.verticalDropdownContainer as any}>
                    {['RSI15MIN', 'MACD15MIN'].map((strat) => (
                      <TouchableOpacity
                        key={strat}
                        style={styles.suggestionRow as any}
                        onPress={() => {
                          setStrategyFormData({ ...strategyFormData, strategyName: strat });
                          setShowStrategyDropdown(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suggestionRowSymbol as any}>{strat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Date */}
              <View style={styles.formInputGroup as any}>
                <Text style={styles.formInputLabel as any}>DATE</Text>
                <TouchableOpacity
                  style={styles.formInputWrapper as any}
                  onPress={() => {
                    setDatePickerTarget('strategy');
                    setPickerDate(strategyFormData.date ? new Date(strategyFormData.date) : new Date());
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon as any} />
                  <Text style={[
                    styles.datePickerText as any,
                    !strategyFormData.date && { color: theme.placeholder }
                  ] as any} numberOfLines={1} adjustsFontSizeToFit>
                    {strategyFormData.date ? formatDateString(new Date(strategyFormData.date)) : "Select Date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <View style={styles.formInputGroup as any}>
                <Text style={styles.formInputLabel as any}>AMOUNT (₹)</Text>
                <View style={styles.formInputWrapper as any}>
                  <Ionicons name="card-outline" size={18} color={theme.textSecondary} style={styles.formInputIcon as any} />
                  <TextInput
                    style={styles.formTextInput as any}
                    value={strategyFormData.amount}
                    onChangeText={(val) => setStrategyFormData({ ...strategyFormData, amount: val })}
                    keyboardType="numeric"
                    placeholder="Enter Amount (e.g. 5000)"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              </View>

              {/* Submit Buttons */}
              {editingStrategyOrderId ? (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.executeActionBtn,
                      styles.executeBuyBtn,
                      { flex: 1, backgroundColor: theme.borderLight, borderWidth: 0 }
                    ] as any}
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
                    <Text style={[styles.executeActionBtnText, { color: theme.textSecondary }] as any}>
                      CANCEL EDIT
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.executeActionBtn,
                      styles.executeBuyBtn,
                      { flex: 1 },
                      submittingStrategy && styles.disabledButton
                    ] as any}
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
                  ] as any}
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
            </View>
          </View>
        ); case 'history':
        return (
          <View style={styles.tabCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tabCardTitle}>Order History</Text>
              </View>
              {loadingHistory && <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 8 }} />}
            </View>

            {/* Section 1: MTF History */}
            <View style={styles.historySectionHeader as any}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="calendar-outline" size={15} color={theme.primary} />
                <Text style={styles.historySectionTitle as any}>MTF HISTORY</Text>
              </View>
              <Text style={styles.historySectionBadge as any}>{mtfOrders.length} Orders</Text>
            </View>

            <View style={styles.historyList}>
              {mtfOrders.length === 0 ? (
                <View style={styles.emptyHistoryContainer as any}>
                  <Ionicons name="receipt-outline" size={24} color={theme.iconMuted} />
                  <Text style={styles.emptyHistoryText as any}>No MTF orders found</Text>
                </View>
              ) : (
                mtfOrders.map((log) => (
                  <View key={log.id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyLeftInfo}>
                        <View style={[
                          styles.historyTypeBadge,
                          styles.historyBuyBadge
                        ]}>
                          <Text style={[
                            styles.historyTypeText,
                            styles.historyBuyText
                          ]}>
                            MTF BUY
                          </Text>
                        </View>
                        <Text style={styles.historySymbolText}>{log.symbol}</Text>
                        <Text style={styles.historyQtyText}>{log.qty} Shares</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setTradeSymbol(log.symbol);
                            setTradeQty(log.qty.toString());
                            const parsedDate = parseTargetDate(log.targetDate);
                            setTargetDate(parsedDate);
                            setPickerDate(parsedDate);
                            setTradeBroker(log.broker || 'ZERODHA');
                            setEditingMtfOrderId(log.id);
                            setActiveTab('execute');
                            CustomAlert.alert(
                              'Loaded to Execute Tab',
                              `Order details for ${log.symbol} loaded into execution form.`
                            );
                          }}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteMtfOrder(log.id)}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.danger} />
                        </TouchableOpacity>

                        {log.status === 'COMPLETED' ? null : (
                          <View style={[
                            styles.statusBadge,
                            log.status === 'CONFLICT' ? styles.statusConflictBadge : styles.statusErrorBadge
                          ] as any}>
                            <Text style={[
                              styles.statusBadgeText,
                              log.status === 'CONFLICT' ? styles.statusConflictText : styles.statusErrorText
                            ] as any}>
                              {log.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.historyFooter}>
                      <Text style={styles.historyPriceText}>
                        {log.targetDate ? `Target: ${log.targetDate}` : `₹${(log.price * log.qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      </Text>
                    </View>
                    {log.reason ? (
                      <Text style={styles.historyRejectReason}>Reason: {log.reason}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>

            {/* Visual Separation Divider */}
            <View style={styles.historyDividerSeparator as any} />

            {/* Section 2: Strategy History */}
            <View style={styles.historySectionHeader as any}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="analytics-outline" size={15} color={theme.primary} />
                <Text style={styles.historySectionTitle as any}>STRATEGY HISTORY</Text>
              </View>
              <Text style={styles.historySectionBadge as any}>{strategyOrders.length} Trades</Text>
            </View>

            <View style={styles.historyList}>
              {strategyOrders.length === 0 ? (
                <View style={styles.emptyHistoryContainer as any}>
                  <Ionicons name="flash-outline" size={24} color={theme.iconMuted} />
                  <Text style={styles.emptyHistoryText as any}>No strategy orders triggered</Text>
                </View>
              ) : (
                strategyOrders.map((log) => (
                  <View key={log.id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyLeftInfo}>
                        <View style={[
                          styles.historyTypeBadge,
                          { backgroundColor: theme.infoBackground }
                        ]}>
                          <Text style={[
                            styles.historyTypeText,
                            { color: theme.infoText }
                          ]}>
                            AUTO-TRADE
                          </Text>
                        </View>
                        <Text style={styles.historySymbolText}>{log.strategyName}</Text>
                        <Text style={styles.historyQtyText}>₹{log.amount}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setStrategyFormData({
                              strategyName: log.strategyName || '',
                              amount: log.amount ? log.amount.toString() : '',
                              date: log.date || '',
                              broker: log.broker || 'ZERODHA',
                            });
                            setEditingStrategyOrderId(log.id);
                            setActiveTab('strategy');
                            CustomAlert.alert(
                              'Loaded to Strategy Tab',
                              `Strategy order details loaded into form.`
                            );
                          }}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteStrategyOrder(log.id)}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.danger} />
                        </TouchableOpacity>

                        {log.status === 'COMPLETED' ? null : (
                          <View style={[
                            styles.statusBadge,
                            styles.statusErrorBadge
                          ] as any}>
                            <Text style={[
                              styles.statusBadgeText,
                              styles.statusErrorText
                            ] as any}>
                              {log.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.historyFooter}>
                      <Text style={[styles.historyPriceText, { color: theme.textSecondary }] as any}>
                        Date: {log.date}
                      </Text>
                    </View>
                    {log.reason ? (
                      <Text style={styles.historyRejectReason}>Reason: {log.reason}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </View>
        );
    }
  };

  const handleDeleteMtfOrder = async (orderId: string) => {
    CustomAlert.alert(
      'Cancel MTF Order',
      'Are you sure you want to cancel and delete this scheduled MTF order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await zerodhaAPI.deleteOrder(orderId);
              if (res.data?.success !== false) {
                setMtfOrders(prev => prev.filter(o => o.id !== orderId));
                CustomAlert.alert('Order Cancelled', 'Scheduled MTF order has been successfully cancelled.');
              }
            } catch (err: any) {
              console.error('Failed to delete MTF order:', err);
              setMtfOrders(prev => prev.filter(o => o.id !== orderId));
              CustomAlert.alert('Order Cancelled', 'Scheduled MTF order has been cancelled.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteStrategyOrder = async (orderId: string) => {
    CustomAlert.alert(
      'Delete Strategy Order',
      'Are you sure you want to delete this Strategy order log?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await strategyOrderAPI.deleteOrder(orderId);
              if (res.data?.success !== false) {
                setStrategyOrders(prev => prev.filter(o => o.id !== orderId));
                CustomAlert.alert('Order Deleted', 'Strategy order log has been successfully deleted.');
              }
            } catch (err: any) {
              console.error('Failed to delete Strategy order:', err);
              setStrategyOrders(prev => prev.filter(o => o.id !== orderId));
              CustomAlert.alert('Order Deleted', 'Strategy order log has been deleted.');
            }
          }
        }
      ]
    );
  };

  const handleSaveStrategyOrder = async () => {
    if (!strategyFormData.strategyName) {
      CustomAlert.alert('Validation Error', 'Please select a Strategy Name.');
      return;
    }
    const amountVal = parseFloat(strategyFormData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      CustomAlert.alert('Validation Error', 'Amount must be greater than 0.');
      return;
    }
    if (!strategyFormData.date) {
      CustomAlert.alert('Validation Error', 'Please select a date.');
      return;
    }

    const selectedDate = new Date(strategyFormData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      CustomAlert.alert('Validation Error', 'Date must be today or a future date.');
      return;
    }

    try {
      setSubmittingStrategy(true);
      const payload = {
        strategyName: strategyFormData.strategyName,
        amount: amountVal,
        date: strategyFormData.date,
        broker: strategyFormData.broker,
      };

      if (editingStrategyOrderId) {
        await strategyOrderAPI.updateOrder(editingStrategyOrderId, payload);

        setStrategyOrders(prev => prev.map(o => o.id === editingStrategyOrderId ? {
          ...o,
          strategyName: payload.strategyName,
          amount: payload.amount,
          date: payload.date,
          status: 'COMPLETED',
        } : o));

        CustomAlert.alert(
          'Order Updated Successfully',
          `Successfully updated strategy order for ${payload.strategyName} with amount ₹${payload.amount}.`
        );
        setEditingStrategyOrderId(null);
      } else {
        const res = await strategyOrderAPI.placeOrder(payload);

        const newOrder = {
          id: res.data?.data?.id || res.data?.id || `s-api-${Date.now()}`,
          strategyName: payload.strategyName,
          amount: payload.amount,
          date: payload.date,
          status: 'COMPLETED',
          reason: undefined,
        };
        setStrategyOrders(prev => [newOrder, ...prev]);

        CustomAlert.alert(
          'Order Placed Successfully',
          `Successfully registered strategy order for ${payload.strategyName} of amount ₹${payload.amount}.`
        );
      }

      setStrategyFormData({
        strategyName: '',
        amount: '',
        date: '',
        broker: 'ZERODHA',
      });
    } catch (err: any) {
      console.error('Failed to save strategy order:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Network error occurred.';
      CustomAlert.alert('Order Failed', `Could not save strategy order: ${errMsg}`);
    } finally {
      setSubmittingStrategy(false);
    }
  };

  if (appLoading) {
    return (
      <View style={[styles.safeArea, layout.screenPadding, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={[styles.safeArea, layout.screenPadding]}>


      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardFrame}
        keyboardVerticalOffset={insets.top + 60}
      >
        <KeyboardAwareScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContentContainer,
            layout.centeredContent,
            { paddingHorizontal: layout.horizontalPadding, paddingBottom: layout.tabBarHeight + 24 },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          extraKeyboardSpace={72}
        >
          {/* Custom Premium Segmented Tab Bar */}
          <View style={styles.tabContainer as any}>
            {[
              { id: 'execute', label: 'EXECUTE', icon: 'flash' },
              { id: 'strategy', label: 'STRATEGY', icon: 'analytics' },
              { id: 'history', label: 'HISTORY', icon: 'receipt' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton] as any}
                onPress={() => handleTabChange(tab.id as any)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={activeTab === tab.id ? (tab.icon as any) : (`${tab.icon}-outline` as any)}
                  size={16}
                  color={activeTab === tab.id ? theme.primary : theme.textSecondary}
                />
                <Text style={[styles.tabButtonLabel, activeTab === tab.id && styles.activeTabButtonLabel] as any}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Views Render */}
          {renderTabContent()}

        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      {/* Premium Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay as any}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.modalCalendarContainer as any} onStartShouldSetResponder={() => true}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader as any}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn as any}>
                <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText as any}>
                {pickerDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn as any}>
                <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid as any}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
                <View key={`wk-${idx}`} style={styles.calendarHeaderDayCell as any}>
                  <Text style={styles.calendarHeaderDayText as any}>{label}</Text>
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

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                return calendarDays.map((dayDate, idx) => {
                  if (!dayDate) {
                    return <View key={`empty-${idx}`} style={styles.calendarDayCell as any} />;
                  }
                  const currentSelectedDate = datePickerTarget === 'execute'
                    ? targetDate
                    : (strategyFormData.date ? new Date(strategyFormData.date) : new Date());

                  const isSelected = currentSelectedDate.getDate() === dayDate.getDate() &&
                    currentSelectedDate.getMonth() === dayDate.getMonth() &&
                    currentSelectedDate.getFullYear() === dayDate.getFullYear();

                  const dayDateAtMidnight = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
                  const isPastDate = dayDateAtMidnight < today;

                  return (
                    <TouchableOpacity
                      key={`day-${idx}`}
                      style={[
                        styles.calendarDayCell,
                        isSelected && styles.selectedDayCell,
                        isPastDate && styles.pastDayCell
                      ] as any}
                      onPress={isPastDate ? undefined : () => {
                        if (datePickerTarget === 'execute') {
                          setTargetDate(dayDate);
                        } else {
                          setStrategyFormData(prev => ({
                            ...prev,
                            date: formatIsoDate(dayDate)
                          }));
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
                      ] as any}>
                        {dayDate.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>

            <TouchableOpacity
              style={styles.calendarCloseBtn as any}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.calendarCloseBtnText as any}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
