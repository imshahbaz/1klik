import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '../../context/AlertContext';

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
