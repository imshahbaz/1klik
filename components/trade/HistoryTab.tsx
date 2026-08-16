import React, { useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { CustomAlert } from '../../context/AlertContext';
import { FormattedMtfOrder, FormattedStrategyOrder } from '../../utils/tradeFormatters';
import HistoryRow from './HistoryRow';
import Tabs from '../ui/Tabs';
import { Panel } from '../ui/Panel';
import { EmptyState } from '../ui/Feedback';
import { space } from '../../theme/tokens';

interface HistoryTabProps {
  readonly styles?: any;
  readonly theme: any;
  readonly loadingHistory: boolean;
  readonly mtfOrders: FormattedMtfOrder[];
  readonly strategyOrders: FormattedStrategyOrder[];
  readonly setTradeSymbol: (symbol: string) => void;
  readonly setTradeQty: (qty: string) => void;
  readonly setTargetDate: (date: Date) => void;
  readonly setPickerDate: (date: Date) => void;
  readonly setTradeBroker: (broker: 'ZERODHA' | 'RUPEEZY') => void;
  readonly setTradeStrategyName: (name: string) => void;
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

/** Order book, split by order type and rendered as a continuous table. */
export default function HistoryTab({
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
  formatIsoDate,
}: HistoryTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'mtf' | 'strategy'>('mtf');

  return (
    <View style={{ paddingTop: space.lg }}>
      <Panel padded={false}>
        <Tabs
          value={activeSubTab}
          onChange={(val) => setActiveSubTab(val as 'mtf' | 'strategy')}
          items={[
            { value: 'mtf', label: 'MTF', count: mtfOrders.length },
            { value: 'strategy', label: 'Strategy', count: strategyOrders.length },
          ]}
        />

        {loadingHistory ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : null}

        {!loadingHistory && activeSubTab === 'mtf' ? (
          <View>
            {mtfOrders.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="No MTF orders"
                message="Orders you schedule from the Execute tab appear here."
              />
            ) : (
              mtfOrders.map((log) => (
                <HistoryRow
                  key={log.id}
                  theme={theme}
                  badgeLabel="BUY"
                  title={log.symbol}
                  orderStatus={log.orderStatus}
                  statusLabel={log.statusLabel}
                  statusColor={log.statusColor}
                  details={[
                    { label: 'QUANTITY', value: `${log.qty}`, mono: true },
                    { label: 'BROKER', value: log.broker || '—' },
                    { label: 'STRATEGY', value: log.strategyName || '—' },
                    {
                      label: 'TARGET',
                      value: log.targetPercentage ? `+${log.targetPercentage}%` : 'Trailing',
                      mono: Boolean(log.targetPercentage),
                    },
                    { label: 'EXECUTES ON', value: log.targetDate || '—' },
                  ]}
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
        ) : null}

        {!loadingHistory && activeSubTab === 'strategy' ? (
          <View>
            {strategyOrders.length === 0 ? (
              <EmptyState
                icon="flash-outline"
                title="No strategy orders"
                message="Allocations you schedule from the Strategy tab appear here."
              />
            ) : (
              strategyOrders.map((log) => (
                <HistoryRow
                  key={log.id}
                  theme={theme}
                  badgeLabel="AUTO"
                  title={log.strategyName}
                  orderStatus={log.orderStatus || log.status}
                  statusLabel={log.statusLabel}
                  statusColor={log.statusColor}
                  details={[
                    { label: 'AMOUNT', value: `₹${log.amount.toLocaleString('en-IN')}`, mono: true },
                    { label: 'BROKER', value: log.broker || '—' },
                    { label: 'STARTS ON', value: log.date || '—' },
                  ]}
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
                    CustomAlert.alert('Loaded to Strategy Tab', 'Strategy order details loaded into form.');
                  }}
                  onDelete={() => handleDeleteStrategyOrder(log.id)}
                />
              ))
            )}
          </View>
        ) : null}
      </Panel>
    </View>
  );
}
