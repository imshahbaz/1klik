import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { CustomAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useMargins } from '../../context/MarginContext';
import { useTheme } from '../../context/ThemeContext';
import { strategyOrderAPI, zerodhaAPI } from '../../services/api';
import { useAdaptiveLayout } from '../../theme/layout';
import { useZerodhaStyles } from '../../theme/zerodhaStyles';
import ExecuteTab from '../../components/trade/ExecuteTab';
import StrategyTab from '../../components/trade/StrategyTab';
import HistoryTab from '../../components/trade/HistoryTab';
import DatePickerModal from '../../components/trade/DatePickerModal';
import {
  formatDateString,
  formatIsoDate,
  formatMtfOrders,
  formatStrategyOrders,
  parseTargetDate,
} from '../../utils/tradeFormatters';

export default function TradeScreen() {
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout(insets);
  const { user, appLoading } = useAuth();
  const { isDarkMode, theme } = useTheme();
  const styles = useZerodhaStyles(isDarkMode);

  useRequireAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const { margins: marginsData } = useMargins();

  // Top 10 margin matches for the current search, ranked by relevance.
  // Memoized so the filter/sort only runs when the data or query changes.
  const filteredMargins = useMemo(() => {
    if (!Array.isArray(marginsData)) return [];
    const q = searchQuery.toLowerCase();
    return marginsData
      .filter((m: any) => m?.symbol?.toLowerCase().includes(q))
      .sort((a: any, b: any) => {
        const sA = a.symbol.toLowerCase();
        const sB = b.symbol.toLowerCase();
        if (sA === q) return -1;
        if (sB === q) return 1;
        const startsA = sA.startsWith(q);
        const startsB = sB.startsWith(q);
        if (startsA && !startsB) return -1;
        if (!startsA && startsB) return 1;
        return sA.localeCompare(sB);
      })
      .slice(0, 10);
  }, [marginsData, searchQuery]);

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

  if (!user) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

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

      <DatePickerModal
        styles={styles}
        theme={theme}
        visible={showDatePicker}
        pickerDate={pickerDate}
        selectedDate={
          datePickerTarget === 'execute'
            ? targetDate
            : (strategyFormData.date ? new Date(strategyFormData.date) : new Date())
        }
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(dayDate) => {
          if (datePickerTarget === 'execute') {
            setTargetDate(dayDate);
          } else {
            setStrategyFormData(prev => ({ ...prev, date: formatIsoDate(dayDate) }));
          }
        }}
      />

    </View>
  );
}
