import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '../../context/AlertContext';
import HistoryRow from './HistoryRow';

interface HistoryTabProps {
  readonly styles: any;
  readonly theme: any;
  readonly loadingHistory: boolean;
  readonly mtfOrders: any[];
  readonly strategyOrders: any[];
  readonly setTradeSymbol: (symbol: string) => void;
  readonly setTradeQty: (qty: string) => void;
  readonly setTargetDate: (date: Date) => void;
  readonly setPickerDate: (date: Date) => void;
  readonly setTradeBroker: (broker: 'ZERODHA' | 'RUPEEZY') => void;
  readonly setEditingMtfOrderId: (id: string | null) => void;
  readonly setActiveTab: (tab: 'execute' | 'strategy' | 'history') => void;
  readonly handleDeleteMtfOrder: (id: string) => void;
  readonly setStrategyFormData: (data: any) => void;
  readonly setEditingStrategyOrderId: (id: string | null) => void;
  readonly handleDeleteStrategyOrder: (id: string) => void;
  readonly parseTargetDate: (dateStr: string) => Date;
}

export default function HistoryTab({
  styles,
  theme,
  loadingHistory,
  mtfOrders,
  strategyOrders,
  setTradeSymbol,
  setTradeQty,
  setTargetDate,
  setPickerDate,
  setTradeBroker,
  setEditingMtfOrderId,
  setActiveTab,
  handleDeleteMtfOrder,
  setStrategyFormData,
  setEditingStrategyOrderId,
  handleDeleteStrategyOrder,
  parseTargetDate
}: HistoryTabProps) {
  return (
    <View style={styles.tabCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tabCardTitle}>Order History</Text>
        </View>
        {loadingHistory && <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 8 }} />}
      </View>

      {/* Section 1: MTF History */}
      <View style={styles.historySectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={15} color={theme.primary} />
          <Text style={styles.historySectionTitle}>MTF HISTORY</Text>
        </View>
        <Text style={styles.historySectionBadge}>{mtfOrders.length} Orders</Text>
      </View>

      <View style={styles.historyList}>
        {mtfOrders.length === 0 ? (
          <View style={styles.emptyHistoryContainer}>
            <Ionicons name="receipt-outline" size={24} color={theme.iconMuted} />
            <Text style={styles.emptyHistoryText}>No MTF orders found</Text>
          </View>
        ) : (
          mtfOrders.map((log) => (
            <HistoryRow
              key={log.id}
              styles={styles}
              theme={theme}
              badgeLabel="MTF BUY"
              badgeContainerStyle={styles.historyBuyBadge}
              badgeTextStyle={styles.historyBuyText}
              title={log.symbol}
              meta={`${log.qty} Qty`}
              status={log.status}
              footerText={log.targetDate ? `Target: ${log.targetDate}` : `₹${(log.price * log.qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              reason={log.reason}
              onEdit={() => {
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
              onDelete={() => handleDeleteMtfOrder(log.id)}
            />
          ))
        )}
      </View>

      {/* Visual Separation Divider */}
      <View style={styles.historyDividerSeparator} />

      {/* Section 2: Strategy History */}
      <View style={styles.historySectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="analytics-outline" size={15} color={theme.primary} />
          <Text style={styles.historySectionTitle}>STRATEGY HISTORY</Text>
        </View>
        <Text style={styles.historySectionBadge}>{strategyOrders.length} Trades</Text>
      </View>

      <View style={styles.historyList}>
        {strategyOrders.length === 0 ? (
          <View style={styles.emptyHistoryContainer}>
            <Ionicons name="flash-outline" size={24} color={theme.iconMuted} />
            <Text style={styles.emptyHistoryText}>No strategy orders triggered</Text>
          </View>
        ) : (
          strategyOrders.map((log) => (
            <HistoryRow
              key={log.id}
              styles={styles}
              theme={theme}
              badgeLabel="AUTO"
              badgeContainerStyle={{ backgroundColor: theme.infoBackground }}
              badgeTextStyle={{ color: theme.infoText }}
              title={log.strategyName}
              meta={`₹${log.amount}`}
              status={log.status}
              footerText={`Date: ${log.date}`}
              reason={log.reason}
              onEdit={() => {
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
              onDelete={() => handleDeleteStrategyOrder(log.id)}
            />
          ))
        )}
      </View>
    </View>
  );
}
