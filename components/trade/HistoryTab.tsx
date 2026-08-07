import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '../../context/AlertContext';
import { FormattedMtfOrder, FormattedStrategyOrder } from '../../utils/tradeFormatters';
import HistoryRow from './HistoryRow';

interface HistoryTabProps {
  readonly styles: any;
  readonly theme: any;
  readonly loadingHistory: boolean;
  readonly mtfOrders: FormattedMtfOrder[];
  readonly strategyOrders: FormattedStrategyOrder[];
  readonly setTradeSymbol: (symbol: string) => void;
  readonly setTradeQty: (qty: string) => void;
  readonly setTargetDate: (date: Date) => void;
  readonly setPickerDate: (date: Date) => void;
  readonly setTradeBroker: (broker: 'ZERODHA' | 'RUPEEZY') => void;
  readonly setTradeStrategyName: (name: 'TARGET PROFIT' | 'TRAILING PROFIT') => void;
  readonly setTradeTargetPercentage: (value: string) => void;
  readonly setEditingMtfOrderId: (id: string | null) => void;
  readonly setActiveTab: (tab: 'execute' | 'strategy' | 'history') => void;
  readonly handleDeleteMtfOrder: (id: string) => void;
  readonly setStrategyFormData: (data: any) => void;
  readonly setEditingStrategyOrderId: (id: string | null) => void;
  readonly handleDeleteStrategyOrder: (id: string) => void;
  readonly parseTargetDate: (dateStr: string) => Date;
  readonly formatIsoDate: (date: Date) => string;
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
  setTradeStrategyName,
  setTradeTargetPercentage,
  setEditingMtfOrderId,
  setActiveTab,
  handleDeleteMtfOrder,
  setStrategyFormData,
  setEditingStrategyOrderId,
  handleDeleteStrategyOrder,
  parseTargetDate,
  formatIsoDate
}: HistoryTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'mtf' | 'strategy'>('mtf');

  return (
    <View style={styles.tabCard}>
      {/* Top Title Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tabCardTitle}>Order History</Text>
        </View>
        {loadingHistory && <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 8 }} />}
      </View>

      {/* Side-by-Side Sub-Tab Bar (Default: MTF) */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: theme.borderLight || '#F3F4F6',
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
      }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveSubTab('mtf')}
          style={{
            flex: 1,
            paddingVertical: 9,
            alignItems: 'center',
            borderRadius: 8,
            backgroundColor: activeSubTab === 'mtf' ? (theme.card || '#FFFFFF') : 'transparent',
            elevation: activeSubTab === 'mtf' ? 1 : 0,
            shadowColor: activeSubTab === 'mtf' ? theme.textPrimary : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
          }}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: '800',
            color: activeSubTab === 'mtf' ? theme.primary : theme.textSecondary,
            letterSpacing: 0.3,
          }}>
            MTF ORDERS ({mtfOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveSubTab('strategy')}
          style={{
            flex: 1,
            paddingVertical: 9,
            alignItems: 'center',
            borderRadius: 8,
            backgroundColor: activeSubTab === 'strategy' ? (theme.card || '#FFFFFF') : 'transparent',
            elevation: activeSubTab === 'strategy' ? 1 : 0,
            shadowColor: activeSubTab === 'strategy' ? theme.textPrimary : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
          }}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: '800',
            color: activeSubTab === 'strategy' ? theme.primary : theme.textSecondary,
            letterSpacing: 0.3,
          }}>
            STRATEGY ORDERS ({strategyOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* MTF Tab Content */}
      {activeSubTab === 'mtf' && (
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
                badgeLabel="BUY"
                badgeContainerStyle={styles.historyBuyBadge}
                badgeTextStyle={styles.historyBuyText}
                title={log.symbol}
                broker={log.broker}
                orderStatus={log.orderStatus}
                statusLabel={log.statusLabel}
                statusColor={log.statusColor}
                strategyName={log.strategyName}
                targetPercentage={log.targetPercentage}
                meta={`${log.qty} Qty`}
                footerText={log.targetDate ? `Target: ${log.targetDate}` : ''}
                reason={log.reason}
                onEdit={() => {
                  setTradeSymbol(log.symbol);
                  setTradeQty(log.qty.toString());
                  const parsedDate = parseTargetDate(log.targetDate);
                  setTargetDate(parsedDate);
                  setPickerDate(parsedDate);
                  setTradeBroker((log.broker as any) || 'ZERODHA');
                  setTradeStrategyName(log.strategyName === 'TARGET PROFIT' ? 'TARGET PROFIT' : 'TRAILING PROFIT');
                  setTradeTargetPercentage(log.targetPercentage || '');
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
      )}

      {/* Strategy Tab Content */}
      {activeSubTab === 'strategy' && (
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
                badgeContainerStyle={{ backgroundColor: theme.infoBackground || '#EEF2FF' }}
                badgeTextStyle={{ color: theme.infoText || '#4F46E5' }}
                title={log.strategyName}
                broker={log.broker}
                meta={`₹${log.amount.toLocaleString('en-IN')}`}
                footerText={log.date ? `Target: ${log.date}` : ''}
                reason={log.reason}
                onEdit={() => {
                  setStrategyFormData({
                    strategyName: log.strategyName || '',
                    amount: log.amount ? log.amount.toString() : '',
                    date: log.date ? formatIsoDate(parseTargetDate(log.date)) : '',
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
      )}
    </View>
  );
}
