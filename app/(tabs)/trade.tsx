import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import DatePickerModal from '../../components/common/DatePickerModal';
import ExecuteTab, { ExecuteAction } from '../../components/trade/ExecuteTab';
import HistoryTab from '../../components/trade/HistoryTab';
import OrderResultModal from '../../components/trade/OrderResultModal';
import StrategyTab, { StrategyAction } from '../../components/trade/StrategyTab';
import Screen from '../../components/ui/Screen';
import Tabs from '../../components/ui/Tabs';
import TopBar from '../../components/ui/TopBar';
import { CustomAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useMargins } from '../../context/MarginContext';
import { useTheme } from '../../context/ThemeContext';
import { useOrderHistory } from '../../hooks/useOrderHistory';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import {
  orderAPI,
  strategyOrderAPI,
  type CreateOrderPayload,
  type CreateStrategyOrderPayload,
} from '../../services/api';
import { rankMarginSymbols } from '../../utils/margins';
import { getOrderResult } from '../../utils/orderError';
import { getStrategyOrderResult } from '../../utils/strategyOrderError';
import {
  formatDateString,
  formatIsoDate,
  parseTargetDate,
} from '../../utils/tradeFormatters';

export default function TradeScreen() {
  const { user, appLoading, appConfig } = useAuth();
  const { theme } = useTheme();

  useRequireAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const { margins: marginsData } = useMargins();

  const allowedExecuteStrategies = useMemo(
    () => appConfig?.allowedDailyStrategies || [],
    [appConfig?.allowedDailyStrategies]
  );

  const continuousStrategyOptions = useMemo(
    () => appConfig?.allowedContinuousStrategies || [],
    [appConfig?.allowedContinuousStrategies]
  );

  // Top 10 margin matches for the current search, ranked by relevance.
  // Memoized so the filter/sort only runs when the data or query changes.
  const filteredMargins = useMemo(
    () => rankMarginSymbols(marginsData, searchQuery, 10),
    [marginsData, searchQuery]
  );

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
  const [tradeStrategyName, setTradeStrategyName] = useState<string>(
    allowedExecuteStrategies[0] || ''
  );
  const [tradeTargetPercentage, setTradeTargetPercentage] = useState('');

  // Auto-select first strategy when options populate asynchronously
  useEffect(() => {
    if (!tradeStrategyName && allowedExecuteStrategies.length > 0) {
      setTradeStrategyName(allowedExecuteStrategies[0]);
    }
  }, [allowedExecuteStrategies, tradeStrategyName]);

  // Order-history data layer (lists, fetch, deletes) lives in a dedicated hook.
  const {
    mtfOrders,
    setMtfOrders,
    strategyOrders,
    loadingHistory,
    fetchHistoryData,
    handleDeleteMtfOrder,
    handleDeleteStrategyOrder,
    deleteResult,
    setDeleteResult,
    fetchResult,
    setFetchResult,
  } = useOrderHistory(user);

  // Edit Order State
  const [editingMtfOrderId, setEditingMtfOrderId] = useState<string | null>(null);

  // Modal shown after the MTF order create/update request resolves.
  const [orderResult, setOrderResult] = useState<{
    variant: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Strategy Order Form State
  const [strategyFormData, setStrategyFormData] = useState({
    strategyName: continuousStrategyOptions[0] || '',
    amount: '',
    date: '',
    broker: 'ZERODHA' as 'ZERODHA' | 'RUPEEZY',
  });

  useEffect(() => {
    if (!strategyFormData.strategyName && continuousStrategyOptions.length > 0) {
      setStrategyFormData((prev) => ({ ...prev, strategyName: continuousStrategyOptions[0] }));
    }
  }, [continuousStrategyOptions, strategyFormData.strategyName]);

  const [editingStrategyOrderId, setEditingStrategyOrderId] = useState<string | null>(null);
  const [submittingStrategy, setSubmittingStrategy] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'execute' | 'strategy'>('execute');

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

  const resetExecuteForm = () => {
    setTradeSymbol('');
    setSearchQuery('');
    setTradeQty('10');
    setTargetDate(new Date());
    setTradeBroker('ZERODHA');
    setTradeStrategyName(allowedExecuteStrategies[0] || '');
    setTradeTargetPercentage('');
    setEditingMtfOrderId(null);
  };

  const resetStrategyForm = () => {
    setStrategyFormData({
      strategyName: continuousStrategyOptions[0] || '',
      amount: '',
      date: '',
      broker: 'ZERODHA',
    });
    setEditingStrategyOrderId(null);
  };

  // Reset whichever order form the user is leaving, so a half-filled Execute or
  // Strategy form isn't preserved after switching away. Edit-from-history uses
  // setActiveTab directly (not this handler), so loading an order to edit is safe.
  const handleTabChange = (tab: 'execute' | 'strategy' | 'history') => {
    if (activeTab === 'execute') resetExecuteForm();
    else if (activeTab === 'strategy') resetStrategyForm();
    setActiveTab(tab);
  };

  // Refresh order history whenever the History sub-tab is shown — both when the
  // user switches to it and when they return to the Trade tab while it's active.
  // Keeps the page mounted; only the history data updates.
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'history') {
        fetchHistoryData();
      }
    }, [activeTab, fetchHistoryData])
  );

  const buildRejectedOrder = (isConflict: boolean, errMsg: string) => {
    const status = isConflict ? 'CONFLICT' : 'REJECTED';
    return {
      id: `m-${Date.now()}`,
      symbol: tradeSymbol.toUpperCase().trim(),
      qty: Number.parseInt(tradeQty),
      price: 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status,
      orderStatus: status,
      statusLabel: isConflict ? 'Conflict' : 'Rejected',
      statusColor: '#EF4444',
      reason: isConflict ? 'Already scheduled for this date.' : errMsg,
      targetDate: formatDateString(targetDate),
      strategyName: tradeStrategyName,
      targetPercentage: tradeTargetPercentage,
      broker: tradeBroker,
    };
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

    const isTargetProfit = tradeStrategyName === 'TARGET PROFIT';
    const targetPercentageVal = Number.parseFloat(tradeTargetPercentage);
    if (isTargetProfit && (Number.isNaN(targetPercentageVal) || targetPercentageVal < 0.4 || targetPercentageVal > 20)) {
      CustomAlert.alert('Execution Alert', 'Target % is required and must be between 0.4 and 20.');
      return;
    }

    const parsedUserId = Number(user?.id || user?.userId || 1);
    const isoDateString = formatIsoDate(targetDate);

    const payload: CreateOrderPayload = {
      userId: parsedUserId,
      symbol: tradeSymbol.toUpperCase().trim(),
      quantity: Number.parseInt(tradeQty),
      date: isoDateString,
      broker: tradeBroker,
      strategyName: tradeStrategyName,
      ...(isTargetProfit ? { targetPercentage: targetPercentageVal } : {}),
    };

    try {
      setExecutingTrade(true);

      if (editingMtfOrderId) {
        await orderAPI.updateOrder(editingMtfOrderId, payload);
        // Pull the authoritative list from the server rather than patching the
        // row locally — avoids showing a stale/duplicate row before the refresh.
        await fetchHistoryData({ silent: true });

        setOrderResult({
          variant: 'success',
          title: 'Order Updated',
          message: `Successfully updated the scheduled MTF order for ${tradeSymbol.toUpperCase()} to ${tradeQty} shares, target date: ${formatDateString(targetDate)}.`,
        });
        setEditingMtfOrderId(null);
      } else {
        await orderAPI.createOrder(payload);
        // Fetch the real order from history instead of inserting an optimistic
        // dummy row — the dummy + the fetched real order briefly showed as two rows.
        await fetchHistoryData({ silent: true });

        setOrderResult({
          variant: 'success',
          title: 'Order Placed',
          message: `Successfully registered MTF order for ${tradeQty} shares of ${tradeSymbol.toUpperCase()} target date: ${formatDateString(targetDate)}.`,
        });
      }

      setTradeSymbol('');
      setSearchQuery('');
      setTradeQty('10');
      setTargetDate(new Date());
      setTradeStrategyName(allowedExecuteStrategies[0] || '');
      setTradeTargetPercentage('');
    } catch (err: any) {
      console.error('Failed to process MTF order:', err);

      const { title, message } = getOrderResult(err, 'Could not place the MTF order. Please try again.');

      if (!editingMtfOrderId) {
        const rejectedOrder = buildRejectedOrder(title === 'Duplicate Order', message);
        setMtfOrders([rejectedOrder, ...mtfOrders]);
      }

      setOrderResult({ variant: 'error', title, message });
    } finally {
      setExecutingTrade(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'execute':
        return (
          <ExecuteTab
            theme={theme}
            tradeBroker={tradeBroker}
            setTradeBroker={setTradeBroker}
            tradeStrategyName={tradeStrategyName}
            setTradeStrategyName={setTradeStrategyName}
            strategyOptions={allowedExecuteStrategies}
            tradeTargetPercentage={tradeTargetPercentage}
            setTradeTargetPercentage={setTradeTargetPercentage}
            tradeSymbol={tradeSymbol}
            setTradeSymbol={setTradeSymbol}
            setSearchQuery={setSearchQuery}
            searchQuery={searchQuery}
            filteredMargins={filteredMargins}
            tradeQty={tradeQty}
            setTradeQty={setTradeQty}
            targetDate={targetDate}
            setDatePickerTarget={setDatePickerTarget}
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
            theme={theme}
            strategyOptions={continuousStrategyOptions}
            strategyFormData={strategyFormData}
            setStrategyFormData={setStrategyFormData}
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
            theme={theme}
            loadingHistory={loadingHistory}
            mtfOrders={mtfOrders}
            strategyOrders={strategyOrders}
            setTradeSymbol={setTradeSymbol}
            setTradeQty={setTradeQty}
            setTargetDate={setTargetDate}
            setPickerDate={setPickerDate}
            setTradeBroker={setTradeBroker}
            setTradeStrategyName={setTradeStrategyName}
            setTradeTargetPercentage={setTradeTargetPercentage}
            setEditingMtfOrderId={setEditingMtfOrderId}
            setActiveTab={setActiveTab}
            handleDeleteMtfOrder={handleDeleteMtfOrder}
            setStrategyFormData={setStrategyFormData}
            setEditingStrategyOrderId={setEditingStrategyOrderId}
            handleDeleteStrategyOrder={handleDeleteStrategyOrder}
            parseTargetDate={parseTargetDate}
            formatIsoDate={formatIsoDate}
          />
        );
    }
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
      const payload: CreateStrategyOrderPayload = {
        strategyName: strategyFormData.strategyName,
        amount: amountVal,
        date: strategyFormData.date,
        broker: strategyFormData.broker,
      };

      if (editingStrategyOrderId) {
        await strategyOrderAPI.updateOrder(editingStrategyOrderId, payload);
        // Refresh from the server instead of patching the row locally.
        await fetchHistoryData({ silent: true });

        setOrderResult({
          variant: 'success',
          title: 'Strategy Order Updated',
          message: `Successfully updated the strategy order for ${payload.strategyName} with amount ₹${payload.amount}.`,
        });
        setEditingStrategyOrderId(null);
      } else {
        await strategyOrderAPI.placeOrder(payload);
        // Fetch the real order from history instead of inserting an optimistic dummy row.
        await fetchHistoryData({ silent: true });

        setOrderResult({
          variant: 'success',
          title: 'Strategy Order Placed',
          message: `Successfully registered the strategy order for ${payload.strategyName} of amount ₹${payload.amount}.`,
        });
      }

      setStrategyFormData({
        strategyName: continuousStrategyOptions[0] || '',
        amount: '',
        date: '',
        broker: 'ZERODHA',
      });
    } catch (err: any) {
      console.error('Failed to save strategy order:', err);
      const { title, message } = getStrategyOrderResult(
        err,
        'Could not save the strategy order. Please try again.'
      );
      setOrderResult({ variant: 'error', title, message });
    } finally {
      setSubmittingStrategy(false);
    }
  };

  if (appLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!user) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  let pickerSelectedDate = new Date();
  if (datePickerTarget === 'execute') {
    pickerSelectedDate = targetDate;
  } else if (strategyFormData.date) {
    pickerSelectedDate = new Date(strategyFormData.date);
  }

  // Execute and Strategy commit through a pinned action bar; History has none.
  let footer: React.ReactNode = null;
  if (activeTab === 'execute') {
    footer = (
      <ExecuteAction
        theme={theme}
        editingMtfOrderId={editingMtfOrderId}
        executingTrade={executingTrade}
        handleExecuteOrder={handleExecuteOrder}
      />
    );
  } else if (activeTab === 'strategy') {
    footer = (
      <StrategyAction
        theme={theme}
        editingStrategyOrderId={editingStrategyOrderId}
        submittingStrategy={submittingStrategy}
        handleSaveStrategyOrder={handleSaveStrategyOrder}
      />
    );
  }

  return (
    <>
      <Screen
        footer={footer}
        header={
          <TopBar
            title="Orders"
            bottom={
              <Tabs
                value={activeTab}
                onChange={(val) => handleTabChange(val as 'execute' | 'strategy' | 'history')}
                items={[
                  { value: 'execute', label: 'Execute' },
                  { value: 'strategy', label: 'Strategy' },
                  { value: 'history', label: 'History' },
                ]}
              />
            }
          />
        }
      >
        {renderTabContent()}
      </Screen>

      <DatePickerModal
        theme={theme}
        visible={showDatePicker}
        pickerDate={pickerDate}
        selectedDate={pickerSelectedDate}
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

      {(() => {
        // Only one result modal is ever shown. Priority: create/update result,
        // then delete result, then fetch failure — so parallel requests can never
        // stack overlapping popups.
        const active = orderResult || deleteResult || fetchResult;
        if (!active) return null;

        const onClose = orderResult
          ? () => setOrderResult(null)
          : deleteResult
            ? () => setDeleteResult(null)
            : () => setFetchResult(null);

        return (
          <OrderResultModal
            theme={theme}
            visible
            variant={active.variant}
            title={active.title}
            message={active.message}
            onClose={onClose}
          />
        );
      })()}
    </>
  );
}
