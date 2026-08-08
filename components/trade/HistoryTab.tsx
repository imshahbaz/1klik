import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
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
    <Card style={{ backgroundColor: theme.card, borderRadius: 24, padding: 8, elevation: 0, borderWidth: 1, borderColor: theme.borderLight }}>
      <Card.Content style={{ gap: 16 }}>
        {/* Title */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
            Order History
          </PaperText>
          {loadingHistory && <ActivityIndicator size="small" color={theme.primary} />}
        </View>

        {/* Sub-Tab SegmentedButtons */}
        <SegmentedButtons
          value={activeSubTab}
          onValueChange={(val) => setActiveSubTab(val as 'mtf' | 'strategy')}
          buttons={[
            {
              value: 'mtf',
              label: `MTF ORDERS (${mtfOrders.length})`,
              style: { backgroundColor: activeSubTab === 'mtf' ? theme.primaryBackground : 'transparent' },
              labelStyle: { color: activeSubTab === 'mtf' ? theme.primary : theme.textSecondary, fontWeight: '700' },
            },
            {
              value: 'strategy',
              label: `STRATEGY (${strategyOrders.length})`,
              style: { backgroundColor: activeSubTab === 'strategy' ? theme.primaryBackground : 'transparent' },
              labelStyle: { color: activeSubTab === 'strategy' ? theme.primary : theme.textSecondary, fontWeight: '700' },
            },
          ]}
        />

        {/* MTF Content */}
        {activeSubTab === 'mtf' && (
          <View>
            {mtfOrders.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="receipt-outline" size={32} color={theme.iconMuted} />
                <PaperText variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 8 }}>
                  No MTF orders found
                </PaperText>
              </View>
            ) : (
              mtfOrders.map((log) => (
                <HistoryRow
                  key={log.id}
                  styles={styles}
                  theme={theme}
                  badgeLabel="BUY"
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

        {/* Strategy Content */}
        {activeSubTab === 'strategy' && (
          <View>
            {strategyOrders.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="flash-outline" size={32} color={theme.iconMuted} />
                <PaperText variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 8 }}>
                  No strategy orders triggered
                </PaperText>
              </View>
            ) : (
              strategyOrders.map((log) => (
                <HistoryRow
                  key={log.id}
                  styles={styles}
                  theme={theme}
                  badgeLabel="AUTO"
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
      </Card.Content>
    </Card>
  );
}
