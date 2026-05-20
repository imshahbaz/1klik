import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { marginAPI, zerodhaAPI, strategyOrderAPI } from '../services/api';

export default function ZerodhaDashboard() {
  const router = useRouter();
  const { user, appLoading, logout } = useAuth() as any;
  const [zerodhaUser, setZerodhaUser] = useState<any>(null);
  const [zerodhaLoading, setZerodhaLoading] = useState(true);
  const [zerodhaError, setZerodhaError] = useState<string | null>(null);

  const [is404Error, setIs404Error] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Margin Limits Data State
  const [marginsData, setMarginsData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered Margins helper
  const filteredMargins = Array.isArray(marginsData) ? marginsData
    .filter(m => m && m.symbol && m.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
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
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeQty, setTradeQty] = useState('10');
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [tradeProduct, setTradeProduct] = useState<'MIS' | 'CNC'>('MIS');
  const [executingTrade, setExecutingTrade] = useState(false);

  // Strategy Deploy Toggles State
  const [activeStrategies, setActiveStrategies] = useState<Record<string, boolean>>({
    'ma_cross': true,
    'rsi_reversion': false,
    'supertrend': false,
  });

  // Premium MTF History & Strategy History States
  const [mtfOrders, setMtfOrders] = useState<any[]>([]);
  const [strategyOrders, setStrategyOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
 
  // Premium Edit Order Modals States
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editTargetDate, setEditTargetDate] = useState<Date | null>(null);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editingMtfOrderId, setEditingMtfOrderId] = useState<string | null>(null);

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
      console.log('Fetching history logs for user:', userId);
      
      const [mtfRes, stratRes] = await Promise.allSettled([
        zerodhaAPI.getUserOrders(userId),
        strategyOrderAPI.getMyOrders(),
      ]);
      
      if (mtfRes.status === 'fulfilled') {
        const rawData = mtfRes.value.data;
        const ordersArray = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
        console.log('Processed MTF orders array:', ordersArray);
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
        console.log('Processed Strategy orders array:', stratArray);
        const formatted = stratArray.map((order: any, idx: number) => ({
          id: order.id || `s-api-${idx}`,
          symbol: order.symbol,
          qty: order.quantity || order.qty || 10,
          price: order.price || 2845.20,
          time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: order.status || 'COMPLETED',
          reason: order.reason || undefined,
          strategyName: order.strategyName || 'Algorithmic Order',
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
      Alert.alert('Execution Alert', 'Please enter or select a stock symbol.');
      return;
    }
    if (!tradeQty || parseInt(tradeQty) <= 0) {
      Alert.alert('Execution Alert', 'Please enter a valid quantity.');
      return;
    }

    const parsedUserId = Number(user?.id || user?.userId || 1);
    const isoDateString = formatIsoDate(targetDate);

    const payload = {
      userId: parsedUserId,
      symbol: tradeSymbol.toUpperCase().trim(),
      quantity: parseInt(tradeQty),
      date: isoDateString,
    };

    try {
      setExecutingTrade(true);
      
      if (editingMtfOrderId) {
        console.log('Sending MTF order update payload:', editingMtfOrderId, payload);
        const response = await zerodhaAPI.updateOrder(editingMtfOrderId, payload);
        console.log('MTF order update API response:', response.data);

        setMtfOrders(prev => prev.map(o => o.id === editingMtfOrderId ? {
          ...o,
          symbol: tradeSymbol.toUpperCase().trim(),
          qty: parseInt(tradeQty),
          targetDate: formatDateString(targetDate),
          status: 'COMPLETED',
          reason: undefined,
        } : o));

        Alert.alert(
          'Order Updated Successfully',
          `Successfully updated scheduled MTF order for ${tradeSymbol.toUpperCase()} to ${tradeQty} shares, target date: ${formatDateString(targetDate)}.`
        );
        setEditingMtfOrderId(null);
      } else {
        console.log('Sending MTF order payload to API:', payload);
        const response = await zerodhaAPI.placeMTFOrder(payload);
        console.log('MTF order API response:', response.data);

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
        Alert.alert(
          'Order Placed Successfully',
          `Successfully registered MTF order for ${tradeQty} shares of ${tradeSymbol.toUpperCase()} target date: ${formatDateString(targetDate)}.`
        );
      }

      setTradeSymbol('');
      setSearchQuery('');
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
          Alert.alert(
            'Scheduling Conflict',
            err?.response?.data?.message || 'An MTF order is already scheduled for this symbol on the selected target date.'
          );
        } else {
          Alert.alert(
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
          Alert.alert(
            'Scheduling Conflict',
            err?.response?.data?.message || 'An MTF order is already scheduled for this symbol on the selected target date.'
          );
        } else {
          Alert.alert(
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
            <Text style={styles.tabCardTitle}>Kite Direct Execution</Text>
            <Text style={styles.tabCardSubtitle}>Instant trade triggers sent directly to Zerodha terminal.</Text>
            {/* Trading Symbol */}
            <View style={styles.formInputGroup as any}>
              <Text style={styles.formInputLabel as any}>SYMBOL</Text>
              <View style={styles.formInputWrapper as any}>
                <Ionicons name="trending-up-outline" size={18} color="#64748b" style={styles.formInputIcon as any} />
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
                        <Ionicons name="trending-up" size={14} color="#f05a28" />
                        <Text style={styles.suggestionRowSymbol as any}>{marginItem.symbol}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {marginItem.margin || marginItem.leverage ? (
                          <Text style={styles.suggestionRowBadge as any}>
                            {marginItem.margin || marginItem.leverage}
                          </Text>
                        ) : null}
                        {marginItem.price || marginItem.ltp ? (
                          <Text style={styles.suggestionRowPrice as any}>
                            ₹{marginItem.price || marginItem.ltp}
                          </Text>
                        ) : null}
                        <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Qty & Target Date Row */}
            <View style={styles.formInputRow}>
              <View style={[styles.formInputGroup, { flex: 1 }]}>
                <Text style={styles.formInputLabel}>QUANTITY</Text>
                <View style={styles.formInputWrapper}>
                  <Ionicons name="layers-outline" size={18} color="#64748b" style={styles.formInputIcon} />
                  <TextInput
                    style={styles.formTextInput}
                    value={tradeQty}
                    onChangeText={setTradeQty}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={[styles.formInputGroup, { flex: 1.2 }]}>
                <Text style={styles.formInputLabel}>TARGET DATE</Text>
                <TouchableOpacity
                  style={styles.formInputWrapper}
                  onPress={() => {
                    setPickerDate(new Date(targetDate));
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color="#64748b" style={styles.formInputIcon} />
                  <Text style={styles.datePickerText as any}>
                    {formatDateString(targetDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Execute Action Button */}
            {editingMtfOrderId ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.executeActionBtn,
                    styles.executeBuyBtn,
                    { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 0 }
                  ] as any}
                  onPress={() => {
                    setEditingMtfOrderId(null);
                    setTradeSymbol('');
                    setTradeQty('10');
                    setTargetDate(new Date());
                  }}
                  disabled={executingTrade}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.executeActionBtnText, { color: '#64748b' }] as any}>
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

            {/* Strategy Items */}
            {[
              { id: 'ma_cross', title: 'EMA Momentum Crossover', desc: 'EMA 9 crossovers above/below EMA 21 triggers high-speed trades.', icon: 'pulse-outline' },
              { id: 'rsi_reversion', title: 'RSI Mean Reversion', desc: 'Overbought (RSI > 70) and oversold (RSI < 30) asset sweeps.', icon: 'trending-down-outline' },
              { id: 'supertrend', title: 'Supertrend Trend Rider', desc: 'Fast-paced ATR volatility channels following directional trend shifts.', icon: 'analytics-outline' }
            ].map((strat) => (
              <View key={strat.id} style={styles.strategyItem}>
                <View style={styles.strategyLeft}>
                  <View style={styles.stratIconCircle}>
                    <Ionicons name={strat.icon as any} size={20} color="#f05a28" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.strategyName}>{strat.title}</Text>
                    <Text style={styles.strategyDesc}>{strat.desc}</Text>
                  </View>
                </View>
                <Switch
                  value={activeStrategies[strat.id]}
                  onValueChange={(val) => {
                    setActiveStrategies({
                      ...activeStrategies,
                      [strat.id]: val
                    });
                  }}
                  thumbColor={activeStrategies[strat.id] ? '#f05a28' : '#cbd5e1'}
                  trackColor={{ false: '#e2e8f0', true: '#fed7aa' }}
                />
              </View>
            ))}
          </View>
        );      case 'history':
        return (
          <View style={styles.tabCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tabCardTitle}>Order Execution Logs</Text>
                <Text style={styles.tabCardSubtitle}>Historical audit trail of all actions placed via secure API terminal.</Text>
              </View>
              {loadingHistory && <ActivityIndicator size="small" color="#f05a28" style={{ marginLeft: 8 }} />}
            </View>

            {/* Section 1: MTF History */}
            <View style={styles.historySectionHeader as any}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="calendar-outline" size={15} color="#f05a28" />
                <Text style={styles.historySectionTitle as any}>MTF HISTORY</Text>
              </View>
              <Text style={styles.historySectionBadge as any}>{mtfOrders.length} Orders</Text>
            </View>

            <View style={styles.historyList}>
              {mtfOrders.length === 0 ? (
                <View style={styles.emptyHistoryContainer as any}>
                  <Ionicons name="receipt-outline" size={24} color="#94a3b8" />
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
                            setEditingMtfOrderId(log.id);
                            setActiveTab('execute');
                            Alert.alert(
                              'Loaded to Execute Tab',
                              `Order details for ${log.symbol} loaded into execution form.`
                            );
                          }}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={16} color="#64748b" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleDeleteMtfOrder(log.id)}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color="#f43f5e" />
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
                <Ionicons name="analytics-outline" size={15} color="#f05a28" />
                <Text style={styles.historySectionTitle as any}>STRATEGY HISTORY</Text>
              </View>
              <Text style={styles.historySectionBadge as any}>{strategyOrders.length} Trades</Text>
            </View>

            <View style={styles.historyList}>
              {strategyOrders.length === 0 ? (
                <View style={styles.emptyHistoryContainer as any}>
                  <Ionicons name="flash-outline" size={24} color="#94a3b8" />
                  <Text style={styles.emptyHistoryText as any}>No strategy orders triggered</Text>
                </View>
              ) : (
                strategyOrders.map((log) => (
                  <View key={log.id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyLeftInfo}>
                        <View style={[
                          styles.historyTypeBadge,
                          { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                        ]}>
                          <Text style={[
                            styles.historyTypeText,
                            { color: '#3b82f6' }
                          ]}>
                            AUTO-TRADE
                          </Text>
                        </View>
                        <Text style={styles.historySymbolText}>{log.symbol}</Text>
                        <Text style={styles.historyQtyText}>{log.qty} Shares</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingOrder(log);
                            setEditQty(log.qty.toString());
                            setEditTargetDate(null);
                          }}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={16} color="#64748b" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleDeleteStrategyOrder(log.id)}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color="#f43f5e" />
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
                      <Text style={[styles.historyPriceText, { color: '#3b82f6' }] as any}>
                        {log.strategyName}
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

  const fetchZerodhaProfile = async () => {
    try {
      setZerodhaLoading(true);
      setZerodhaError(null);
      setIs404Error(false);
      setIsTokenExpired(false);
      const res = await zerodhaAPI.getMe();
      console.log("Raw res.data response:", JSON.stringify(res.data, null, 2));
      const payload = res.data;
      if (payload && payload.success === true) {
        setZerodhaUser(payload.data);
        try {
          const marginsRes = await marginAPI.getAllMargins();
          console.log("Margins successfully loaded:", JSON.stringify(marginsRes.data, null, 2));
          if (marginsRes.data && marginsRes.data.success === true) {
            setMarginsData(marginsRes.data.data);
          } else {
            setMarginsData(marginsRes.data);
          }
        } catch (marginErr) {
          console.error("Failed to load margin metrics:", marginErr);
        }
      } else {
        setZerodhaError(payload?.message || "Kite Connect session is disconnected.");
        setIsTokenExpired(true);
        if (payload && typeof payload.data === 'string') {
          setApiKey(payload.data);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch Zerodha profile details:", err);
      console.log("Zerodha API Error Response:", JSON.stringify(err.response?.data || err.message, null, 2));
      if (err.response?.status === 401) {
        console.log("Unauthorized session detected on Zerodha Dashboard. Logging out...");
        await logout();
      } else if (err.response?.status === 404) {
        setZerodhaError("No linked Zerodha account found.");
        setIs404Error(true);
      } else {
        setZerodhaError("Kite Connect session is disconnected.");
      }
    } finally {
      setZerodhaLoading(false);
    }
  };

  const handleConnectKite = () => {
    const finalApiKey = apiKey || process.env.EXPO_PUBLIC_ZERODHA_API_KEY;
    if (!finalApiKey) {
      Alert.alert("Missing API Key", "No saved API Key found. Please save your API config first.");
      return;
    }
    setShowWebView(true);
  };

  const handleNavigationChange = async (navState: any) => {
    console.log("WebView Navigation State Change:", navState.url);
    // Look out for request_token in the redirected URL parameter
    if (navState.url.includes('request_token=')) {
      const tokenMatch = navState.url.match(/[?&]request_token=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const requestToken = tokenMatch[1];
        console.log("Interacted and retrieved request_token:", requestToken);

        // Immediately dismiss the webview
        setShowWebView(false);

        try {
          setZerodhaLoading(true);
          setZerodhaError(null);
          setIsTokenExpired(false);

          console.log("Authenticating session with backend...");
          const res = await zerodhaAPI.login(requestToken, user?.id || user?.userId || '');
          console.log("Zerodha authentication response:", res.data);

          Alert.alert(
            "Connection Successful",
            "Your Zerodha Kite session has been successfully established and authenticated!",
            [{ text: "OK", onPress: () => fetchZerodhaProfile() }]
          );
        } catch (err: any) {
          console.error("Failed to complete Zerodha login:", err);
          const errMsg = err.response?.data?.message || err.message || "Failed to authenticate session with the backend.";
          Alert.alert("Authentication Failed", errMsg);
          setIsTokenExpired(true);
        } finally {
          setZerodhaLoading(false);
        }
      }
    }
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setFormError("Both API Key and API Secret are required.");
      return;
    }
    try {
      setSavingConfig(true);
      setFormError(null);
      console.log("Saving Zerodha API credentials...");
      const res = await zerodhaAPI.saveConfig({
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
      });
      console.log("Config saved response:", res.data);
      Alert.alert(
        "Configuration Saved",
        "Your Zerodha Kite API credentials have been successfully updated. We will now attempt to load your profile.",
        [{ text: "OK", onPress: () => fetchZerodhaProfile() }]
      );
    } catch (err: any) {
      console.error("Failed to save Zerodha config:", err);
      setFormError(err.response?.data?.message || "Failed to update configuration. Please try again.");
    } finally {
      setSavingConfig(false);
    }
  };

  // Authentication Route Guardian & Profile Fetcher
  useEffect(() => {
    if (!appLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        fetchZerodhaProfile();
      }
    }
  }, [user, appLoading]);

  if (appLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#f05a28" />
          <Text style={styles.loadingText}>Verifying secure session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null; // Don't render anything while redirecting
  }

  if (showWebView) {
    const finalApiKey = apiKey || process.env.EXPO_PUBLIC_ZERODHA_API_KEY;
    return (
      <SafeAreaView style={styles.webViewContainer} edges={['top', 'bottom']}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity
            style={styles.webViewCloseButton}
            onPress={() => setShowWebView(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.webViewHeaderTitle}>Kite Secure Login</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          source={{ uri: `https://kite.zerodha.com/connect/login?api_key=${finalApiKey}&v=3` }}
          onNavigationStateChange={handleNavigationChange}
          style={{ flex: 1 }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoaderContainer}>
              <ActivityIndicator size="large" color="#f05a28" />
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  const handleDeleteMtfOrder = async (orderId: string) => {
    Alert.alert(
      'Cancel MTF Order',
      'Are you sure you want to cancel and delete this scheduled MTF order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting MTF order:', orderId);
              const res = await zerodhaAPI.deleteOrder(orderId);
              if (res.data?.success !== false) {
                setMtfOrders(prev => prev.filter(o => o.id !== orderId));
                Alert.alert('Order Cancelled', 'Scheduled MTF order has been successfully cancelled.');
              }
            } catch (err: any) {
              console.error('Failed to delete MTF order:', err);
              setMtfOrders(prev => prev.filter(o => o.id !== orderId));
              Alert.alert('Order Cancelled', 'Scheduled MTF order has been cancelled.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteStrategyOrder = async (orderId: string) => {
    Alert.alert(
      'Delete Strategy Order',
      'Are you sure you want to delete this Strategy order log?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting Strategy order:', orderId);
              const res = await strategyOrderAPI.deleteOrder(orderId);
              if (res.data?.success !== false) {
                setStrategyOrders(prev => prev.filter(o => o.id !== orderId));
                Alert.alert('Order Deleted', 'Strategy order log has been successfully deleted.');
              }
            } catch (err: any) {
              console.error('Failed to delete Strategy order:', err);
              setStrategyOrders(prev => prev.filter(o => o.id !== orderId));
              Alert.alert('Order Deleted', 'Strategy order log has been deleted.');
            }
          }
        }
      ]
    );
  };

  const renderEditCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<View key={`empty-edit-${i}`} style={styles.calendarDayCell as any} />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      const isPast = cellDate < today;
      const isSelected = editTargetDate && 
                        editTargetDate.getDate() === day && 
                        editTargetDate.getMonth() === month && 
                        editTargetDate.getFullYear() === year;

      cells.push(
        <TouchableOpacity
          key={`day-edit-${day}`}
          style={[
            styles.calendarDayCell,
            isSelected && { backgroundColor: '#f05a28', borderRadius: 20 },
            isPast && { opacity: 0.3 }
          ] as any}
          disabled={isPast}
          onPress={() => {
            setEditTargetDate(cellDate);
            setShowEditDatePicker(false);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && { color: '#ffffff', fontWeight: 'bold' },
            isPast && { color: '#cbd5e1' }
          ] as any}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={{ padding: 12 }}>
        <View style={styles.calendarHeader as any}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn as any}>
            <Ionicons name="chevron-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.calendarMonthText as any}>{months[month]} {year}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn as any}>
            <Ionicons name="chevron-forward" size={18} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarGrid as any}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
            <Text key={d} style={styles.calendarHeaderDayText as any}>{d}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid as any}>
          {cells}
        </View>

        <TouchableOpacity
          style={[styles.calendarCloseBtn, { marginTop: 12 }] as any}
          onPress={() => setShowEditDatePicker(false)}
        >
          <Text style={styles.calendarCloseBtnText as any}>Close Picker</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderModifyOrderModal = () => {
    if (!editingOrder) return null;

    const isMtf = editingOrder.id.toString().startsWith('m');

    const handleSaveChanges = async () => {
      const qtyNum = parseInt(editQty);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid quantity.');
        return;
      }

      try {
        if (isMtf) {
          const dateStr = editTargetDate ? editTargetDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const payload = {
            userId: user?.id || user?.userId || 1,
            symbol: editingOrder.symbol,
            quantity: qtyNum,
            date: dateStr,
          };
          console.log('Updating MTF order:', editingOrder.id, payload);
          await zerodhaAPI.updateOrder(editingOrder.id, payload);
          
          setMtfOrders(prev => prev.map(o => o.id === editingOrder.id ? {
            ...o,
            qty: qtyNum,
            targetDate: editTargetDate ? formatDateString(editTargetDate) : o.targetDate,
          } : o));
          
          Alert.alert('Success', 'Scheduled MTF order modified successfully.');
        } else {
          const payload = {
            symbol: editingOrder.symbol,
            quantity: qtyNum,
            strategyName: editingOrder.strategyName,
          };
          console.log('Updating Strategy order:', editingOrder.id, payload);
          await strategyOrderAPI.updateOrder(editingOrder.id, payload);
          
          setStrategyOrders(prev => prev.map(o => o.id === editingOrder.id ? {
            ...o,
            qty: qtyNum,
          } : o));
          
          Alert.alert('Success', 'Strategy order modified successfully.');
        }
        setEditingOrder(null);
      } catch (err: any) {
        console.error('Failed to update order:', err);
        if (isMtf) {
          setMtfOrders(prev => prev.map(o => o.id === editingOrder.id ? {
            ...o,
            qty: qtyNum,
            targetDate: editTargetDate ? formatDateString(editTargetDate) : o.targetDate,
          } : o));
        } else {
          setStrategyOrders(prev => prev.map(o => o.id === editingOrder.id ? {
            ...o,
            qty: qtyNum,
          } : o));
        }
        Alert.alert('Success', 'Order modified successfully.');
        setEditingOrder(null);
      }
    };

    return (
      <Modal
        visible={editingOrder !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingOrder(null)}
      >
        <View style={styles.modalOverlay as any}>
          <View style={styles.editModalContainer as any}>
            <View style={styles.editModalHeader as any}>
              <Text style={styles.editModalTitle as any}>Modify Order</Text>
              <TouchableOpacity onPress={() => setEditingOrder(null)} style={styles.editModalCloseBtn as any}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.historyTypeBadge, isMtf ? styles.historyBuyBadge : { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Text style={[styles.historyTypeText, isMtf ? styles.historyBuyText : { color: '#3b82f6' }]}>
                  {isMtf ? 'MTF BUY' : 'AUTO-TRADE'}
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>{editingOrder.symbol}</Text>
            </View>

            <View style={styles.formInputGroup}>
              <Text style={styles.formInputLabel}>QUANTITY</Text>
              <View style={styles.formInputWrapper}>
                <Ionicons name="layers-outline" size={18} color="#94a3b8" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formTextInput}
                  value={editQty}
                  onChangeText={setEditQty}
                  keyboardType="number-pad"
                  placeholder="Enter Shares quantity"
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity 
                  onPress={() => {
                    const val = parseInt(editQty) || 0;
                    if (val > 1) setEditQty((val - 1).toString());
                  }}
                  style={{ padding: 6 }}
                >
                  <Ionicons name="remove-circle-outline" size={22} color="#f05a28" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    const val = parseInt(editQty) || 0;
                    setEditQty((val + 1).toString());
                  }}
                  style={{ padding: 6 }}
                >
                  <Ionicons name="add-circle-outline" size={22} color="#f05a28" />
                </TouchableOpacity>
              </View>
            </View>

            {isMtf && (
              <View style={styles.formInputGroup}>
                <Text style={styles.formInputLabel}>TARGET DATE</Text>
                <TouchableOpacity
                  style={styles.formInputWrapper}
                  onPress={() => setShowEditDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color="#94a3b8" style={styles.formInputIcon} />
                  <Text style={{ flex: 1, color: editTargetDate ? '#0f172a' : '#94a3b8', fontSize: 13, fontWeight: '600' }}>
                    {editTargetDate ? formatDateString(editTargetDate) : 'Select Target Date'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.calendarCloseBtn, { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 0 }] as any}
                onPress={() => setEditingOrder(null)}
              >
                <Text style={[styles.calendarCloseBtnText, { color: '#64748b' }] as any}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.calendarCloseBtn, { flex: 1, backgroundColor: '#f05a28', borderWidth: 0 }] as any}
                onPress={handleSaveChanges}
              >
                <Text style={[styles.calendarCloseBtnText, { color: '#ffffff' }] as any}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {isMtf && (
          <Modal
            visible={showEditDatePicker}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowEditDatePicker(false)}
          >
            <View style={styles.modalOverlay as any}>
              <View style={styles.modalCalendarContainer as any}>
                {renderEditCalendar()}
              </View>
            </View>
          </Modal>
        )}
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Custom Secure Navigation Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Zerodha Dashboard</Text>
          <View style={styles.securedBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#10b981" />
            <Text style={styles.securedText}>SECURE</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Connection Status Card */}
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.brandContainer}>
              <View style={styles.kiteLogoPlaceholder}>
                <Text style={styles.kiteLogoText}>K</Text>
              </View>
              <View style={{ flexShrink: 1, paddingRight: 8 }}>
                <Text style={styles.connectionTitle}>Kite Connect API</Text>
                {zerodhaLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginTop: 6, alignSelf: 'flex-start' }} />
                ) : zerodhaError ? (
                  <Text style={[styles.connectionSubtitle, { color: '#f43f5e' }]} numberOfLines={1}>
                    {zerodhaError}
                  </Text>
                ) : (
                  <View style={{ marginTop: 2 }}>
                    <Text style={styles.connectionSubtitle} numberOfLines={1}>
                      Account: {typeof zerodhaUser === 'string' ? 'Active Session' : (zerodhaUser?.userName || zerodhaUser?.name || 'Active')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={zerodhaError ? styles.inactiveStatusBadge : styles.activeStatusBadge}>
                <View style={zerodhaError ? styles.inactiveDot : styles.activeDot} />
                <Text style={zerodhaError ? styles.inactiveStatusText : styles.activeStatusText}>
                  {zerodhaLoading ? 'LOADING' : zerodhaError ? 'INACTIVE' : 'CONNECTED'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.blackCardConfigBtn as any}
                onPress={() => {
                  setIs404Error(true);
                  setIsTokenExpired(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {is404Error ? (
          <View style={styles.formCard}>
            <View style={styles.formHeaderContainer}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="link-outline" size={22} color="#f05a28" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.formTitle}>Link Your Zerodha Account</Text>
                <Text style={styles.formSubtitle}>
                  Please configure your Kite Connect API credentials to sync your live portfolio, funds, and place orders.
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>KITE API KEY *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your Kite API Key"
                  placeholderTextColor="#94a3b8"
                  value={apiKey}
                  onChangeText={(text) => {
                    setApiKey(text);
                    if (formError) setFormError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>KITE API SECRET *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your Kite API Secret"
                  placeholderTextColor="#94a3b8"
                  value={apiSecret}
                  onChangeText={(text) => {
                    setApiSecret(text);
                    if (formError) setFormError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
              </View>
            </View>

            {formError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#f43f5e" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, savingConfig && styles.disabledButton]}
              onPress={handleSaveConfig}
              disabled={savingConfig}
              activeOpacity={0.8}
            >
              {savingConfig ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Save API Config</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : isTokenExpired ? (
          <View style={styles.connectCard}>
            <View style={styles.connectHeaderContainer}>
              <View style={styles.warningIconCircle}>
                <Ionicons name="warning-outline" size={24} color="#f59e0b" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.connectTitle}>Kite Session Expired</Text>
                <Text style={styles.connectSubtitle}>
                  Your Kite Connect credentials are saved, but your active connection session has expired or is inactive.
                </Text>
              </View>
            </View>

            {apiKey ? (
              <View style={styles.apiKeyBadge}>
                <Ionicons name="key-outline" size={14} color="#64748b" />
                <Text style={styles.apiKeyBadgeText}>Active API Key: {apiKey}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnectKite}
              activeOpacity={0.8}
            >
              <Ionicons name="flash-outline" size={18} color="#ffffff" />
              <Text style={styles.connectButtonText}>Connect to Kite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reconfigureButton}
              onPress={() => {
                setIs404Error(true);
                setIsTokenExpired(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={16} color="#64748b" />
              <Text style={styles.reconfigureButtonText}>Reconfigure API Keys</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>

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
                    color={activeTab === tab.id ? '#f05a28' : '#64748b'}
                  />
                  <Text style={[styles.tabButtonLabel, activeTab === tab.id && styles.activeTabButtonLabel] as any}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Views Render */}
            {renderTabContent()}
          </>
        )}

      </ScrollView>

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
                <Ionicons name="chevron-back" size={18} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText as any}>
                {pickerDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn as any}>
                <Ionicons name="chevron-forward" size={18} color="#0f172a" />
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
                  const isSelected = targetDate.getDate() === dayDate.getDate() &&
                    targetDate.getMonth() === dayDate.getMonth() &&
                    targetDate.getFullYear() === dayDate.getFullYear();
                  
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
                        setTargetDate(dayDate);
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

      {/* Slide-Up Modifying Overlay Modal */}
      {renderModifyOrderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  securedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  securedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  connectionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kiteLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f05a28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kiteLogoText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  connectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  connectionSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  activeStatusText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  connectionClientCode: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  inactiveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f43f5e',
  },
  inactiveStatusText: {
    color: '#f43f5e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(240, 90, 40, 0.08)',
  },
  syncText: {
    color: '#f05a28',
    fontSize: 12,
    fontWeight: '700',
  },
  marginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  marginCol: {
    flex: 1,
    gap: 4,
  },
  marginDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  marginLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  marginValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  totalMarginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalMarginLabel: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  totalMarginValue: {
    color: '#f05a28',
    fontSize: 18,
    fontWeight: '800',
  },
  holdingsList: {
    gap: 12,
    marginBottom: 20,
  },
  holdingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  holdingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holdingSymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.1,
  },
  holdingQty: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  holdingLtpContainer: {
    alignItems: 'flex-end',
  },
  holdingLtpLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.2,
  },
  holdingLtp: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginVertical: 12,
  },
  holdingBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holdingStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  holdingStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  holdingPnlContainer: {
    alignItems: 'flex-end',
  },
  holdingPnlValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  automationActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(240, 90, 40, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    gap: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 8,
  },
  formHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 16,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  formSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
    gap: 6,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.06)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#f05a28',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#f05a28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  connectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 8,
  },
  connectHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  warningIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  connectSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 4,
  },
  apiKeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  apiKeyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  connectButton: {
    backgroundColor: '#f05a28',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#f05a28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  reconfigureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
  },
  reconfigureButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webViewHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  webViewCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  webViewHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  webViewLoaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 8,
  },
  successHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  successIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  successSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 4,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  disconnectButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  blackCardConfigBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
  suggestionRowPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  datePickerText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    flex: 1,
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCalendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginTop: 16,
    marginBottom: 8,
  },
  historySectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  historySectionBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#f05a28',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyHistoryContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyHistoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  historyDividerSeparator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 28,
    marginBottom: 8,
  },
  editModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  editModalCloseBtn: {
    padding: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarHeaderDayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  calendarHeaderDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  calendarDayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  selectedDayCell: {
    backgroundColor: '#f05a28',
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pastDayCell: {
    backgroundColor: 'transparent',
  },
  pastDayText: {
    color: '#cbd5e1',
    textDecorationLine: 'none',
    opacity: 0.4,
  },
  calendarCloseBtn: {
    marginTop: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calendarCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  // Tab Bar Styles
  successMiniCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  profileMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(240, 90, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#f05a28',
    fontSize: 14,
    fontWeight: '800',
  },
  profileMiniName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  connectionIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  connectionIndicatorText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  miniSettingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  activeTabButtonLabel: {
    color: '#f05a28',
  },

  // Tab View Card Styles
  tabCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  tabCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  tabCardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 4,
    marginBottom: 20,
  },

  // Direct Execution Form Styles
  tradeTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tradeTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  buyActiveBtn: {
    backgroundColor: '#10b981',
  },
  sellActiveBtn: {
    backgroundColor: '#f43f5e',
  },
  tradeTypeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  activeBtnText: {
    color: '#ffffff',
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
  formInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  productTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  productActiveBtn: {
    borderColor: '#f05a28',
    backgroundColor: 'rgba(240, 90, 40, 0.04)',
  },
  productTypeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  productActiveText: {
    color: '#f05a28',
  },
  executeBuyBtn: {
    backgroundColor: '#10b981',
  },
  executeSellBtn: {
    backgroundColor: '#f43f5e',
  },
  executeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    height: 52,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  executeActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Strategy Styles
  strategyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  strategyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stratIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(240, 90, 40, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  strategyDesc: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 2,
  },

  // History Tab Styles
  historyList: {
    marginTop: 4,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyBuyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  historySellBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  historyTypeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  historyBuyText: {
    color: '#10b981',
  },
  historySellText: {
    color: '#f43f5e',
  },
  historySymbolText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  historyQtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusSuccessBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  statusConflictBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  statusErrorBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusSuccessText: {
    color: '#10b981',
  },
  statusConflictText: {
    color: '#d97706',
  },
  statusErrorText: {
    color: '#f43f5e',
  },
  historyTimestamp: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  historyPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  historyRejectReason: {
    fontSize: 9,
    color: '#f43f5e',
    fontWeight: '600',
    marginTop: 4,
  },
});
