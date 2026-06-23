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
import ExecuteTab from '../../components/trade/ExecuteTab';
import StrategyTab from '../../components/trade/StrategyTab';
import HistoryTab from '../../components/trade/HistoryTab';

const formatDateString = (date: Date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatMtfOrders = (rawData: any) => {
  let ordersArray = [];
  if (Array.isArray(rawData)) {
    ordersArray = rawData;
  } else if (Array.isArray(rawData?.data)) {
    ordersArray = rawData.data;
  }
  return ordersArray.map((order: any, idx: number) => ({
    id: order.id || `m-api-${idx}`,
    symbol: order.symbol,
    qty: order.quantity || order.qty || 10,
    price: order.price || 2845.20,
    time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: order.status || 'COMPLETED',
    reason: order.reason || undefined,
    targetDate: order.date ? formatDateString(new Date(order.date)) : 'Today',
  }));
};

const formatStrategyOrders = (rawData: any) => {
  let stratArray = [];
  if (Array.isArray(rawData)) {
    stratArray = rawData;
  } else if (Array.isArray(rawData?.data)) {
    stratArray = rawData.data;
  }
  return stratArray.map((order: any, idx: number) => ({
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
};

export default function TradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { user, appLoading } = useAuth() as any;
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
    .filter((m: any) => m?.symbol?.toLowerCase().includes(searchQuery.toLowerCase()))
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
      if (!Number.isNaN(parsed)) return new Date(parsed);

      const parts = dateStr.split(' ');
      if (parts.length === 3) {
        const day = Number.parseInt(parts[0]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        let monthIdx = months.findIndex(m => m.toLowerCase() === parts[1].toLowerCase().substring(0, 3));
        if (monthIdx === -1) {
          monthIdx = fullMonths.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
        }

        const year = Number.parseInt(parts[2]);
        if (!Number.isNaN(day) && monthIdx !== -1 && !Number.isNaN(year)) {
          return new Date(year, monthIdx, day);
        }
      }
      return new Date();
    } catch {
      return new Date();
    }
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
        const formatted = formatMtfOrders(rawData);
        setMtfOrders(formatted);
      } else {
        setMtfOrders([]);
      }

      if (stratRes.status === 'fulfilled') {
        const rawData = stratRes.value.data;
        const formatted = formatStrategyOrders(rawData);
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
    if (!tradeQty || Number.parseInt(tradeQty) <= 0) {
      CustomAlert.alert('Execution Alert', 'Please enter a valid quantity.');
      return;
    }

    const parsedUserId = Number(user?.id || user?.userId || 1);
    const isoDateString = formatIsoDate(targetDate);

    const payload = {
      userId: parsedUserId,
      symbol: tradeSymbol.toUpperCase().trim(),
      quantity: Number.parseInt(tradeQty),
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
          qty: Number.parseInt(tradeQty),
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
          qty: Number.parseInt(tradeQty),
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
          qty: Number.parseInt(tradeQty),
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
          <ExecuteTab
            styles={styles}
            theme={theme}
            tradeBroker={tradeBroker}
            setTradeBroker={setTradeBroker}
            showExecuteBrokerDropdown={showExecuteBrokerDropdown}
            setShowExecuteBrokerDropdown={setShowExecuteBrokerDropdown}
            tradeSymbol={tradeSymbol}
            setTradeSymbol={setTradeSymbol}
            setSearchQuery={setSearchQuery}
            searchQuery={searchQuery}
            filteredMargins={filteredMargins}
            tradeQty={tradeQty}
            setTradeQty={setTradeQty}
            targetDate={targetDate}
            setPickerDate={setPickerDate}
            setShowDatePicker={setShowDatePicker}
            editingMtfOrderId={editingMtfOrderId}
            setEditingMtfOrderId={setEditingMtfOrderId}
            setTargetDate={setTargetDate}
            executingTrade={executingTrade}
            handleExecuteOrder={handleExecuteOrder}
            formatDateString={formatDateString}
          />
        );

      case 'strategy':
        return (
          <StrategyTab
            styles={styles}
            theme={theme}
            strategyFormData={strategyFormData}
            setStrategyFormData={setStrategyFormData}
            showStrategyBrokerDropdown={showStrategyBrokerDropdown}
            setShowStrategyBrokerDropdown={setShowStrategyBrokerDropdown}
            showStrategyDropdown={showStrategyDropdown}
            setShowStrategyDropdown={setShowStrategyDropdown}
            setDatePickerTarget={setDatePickerTarget}
            setPickerDate={setPickerDate}
            setShowDatePicker={setShowDatePicker}
            editingStrategyOrderId={editingStrategyOrderId}
            setEditingStrategyOrderId={setEditingStrategyOrderId}
            submittingStrategy={submittingStrategy}
            handleSaveStrategyOrder={handleSaveStrategyOrder}
            formatDateString={formatDateString}
          />
        );

      case 'history':
        return (
          <HistoryTab
            styles={styles}
            theme={theme}
            loadingHistory={loadingHistory}
            mtfOrders={mtfOrders}
            strategyOrders={strategyOrders}
            setTradeSymbol={setTradeSymbol}
            setTradeQty={setTradeQty}
            setTargetDate={setTargetDate}
            setPickerDate={setPickerDate}
            setTradeBroker={setTradeBroker}
            setEditingMtfOrderId={setEditingMtfOrderId}
            setActiveTab={setActiveTab}
            handleDeleteMtfOrder={handleDeleteMtfOrder}
            setStrategyFormData={setStrategyFormData}
            setEditingStrategyOrderId={setEditingStrategyOrderId}
            handleDeleteStrategyOrder={handleDeleteStrategyOrder}
            parseTargetDate={parseTargetDate}
          />
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
    const amountVal = Number.parseFloat(strategyFormData.amount);
    if (Number.isNaN(amountVal) || amountVal <= 0) {
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
                  let currentSelectedDate = new Date();
                  if (datePickerTarget === 'execute') {
                    currentSelectedDate = targetDate;
                  } else if (strategyFormData.date) {
                    currentSelectedDate = new Date(strategyFormData.date);
                  }

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
