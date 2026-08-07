import { useCallback, useState } from 'react';
import { CustomAlert } from '../context/AlertContext';
import type { User } from '../services/api';
import { strategyOrderAPI, orderAPI } from '../services/api';
import { formatMtfOrders, formatStrategyOrders, type FormattedMtfOrder, type FormattedStrategyOrder } from '../utils/tradeFormatters';

/**
 * Owns the Trade screen's order-history data layer: the MTF and Strategy order
 * lists, their loading state, the fetch, and the delete handlers. This is the
 * self-contained data domain — the order *placement* handlers stay in the
 * screen because they're coupled to its form state.
 *
 * The list setters are exposed so the placement handlers can optimistically
 * update the lists, preserving the screen's existing behavior.
 */
export function useOrderHistory(user: User | null) {
  const [mtfOrders, setMtfOrders] = useState<FormattedMtfOrder[]>([]);
  const [strategyOrders, setStrategyOrders] = useState<FormattedStrategyOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistoryData = useCallback(async () => {
    const userId = user?.id || user?.userId;
    if (!userId) return;

    try {
      setLoadingHistory(true);

      const [mtfRes, stratRes] = await Promise.allSettled([
        orderAPI.getUserOrders(userId),
        strategyOrderAPI.getMyOrders(),
      ]);

      if (mtfRes.status === 'fulfilled') {
        setMtfOrders(formatMtfOrders(mtfRes.value.data.data));
      } else {
        setMtfOrders([]);
      }

      if (stratRes.status === 'fulfilled') {
        setStrategyOrders(formatStrategyOrders(stratRes.value.data.data));
      } else {
        setStrategyOrders([]);
      }
    } catch (err) {
      console.error('Error fetching history logs:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  const handleDeleteMtfOrder = useCallback((orderId: string) => {
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
              const res = await orderAPI.deleteOrder(orderId);
              if (res.data?.success === false) {
                throw new Error(res.data?.message || 'Backend reported failure.');
              }
              // Only drop the row once the server confirms the cancellation.
              setMtfOrders(prev => prev.filter(o => o.id !== orderId));
              CustomAlert.alert('Order Cancelled', 'Scheduled MTF order has been successfully cancelled.');
            } catch (err: any) {
              console.error('Failed to delete MTF order:', err);
              // Keep the row — the order still exists server-side.
              CustomAlert.alert('Cancellation Failed', 'Could not cancel the MTF order. Please try again.');
            }
          }
        }
      ]
    );
  }, []);

  const handleDeleteStrategyOrder = useCallback((orderId: string) => {
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
              if (res.data?.success === false) {
                throw new Error(res.data?.message || 'Backend reported failure.');
              }
              // Only drop the row once the server confirms the deletion.
              setStrategyOrders(prev => prev.filter(o => o.id !== orderId));
              CustomAlert.alert('Order Deleted', 'Strategy order log has been successfully deleted.');
            } catch (err: any) {
              console.error('Failed to delete Strategy order:', err);
              // Keep the row — the log still exists server-side.
              CustomAlert.alert('Deletion Failed', 'Could not delete the Strategy order log. Please try again.');
            }
          }
        }
      ]
    );
  }, []);

  return {
    mtfOrders,
    setMtfOrders,
    strategyOrders,
    setStrategyOrders,
    loadingHistory,
    fetchHistoryData,
    handleDeleteMtfOrder,
    handleDeleteStrategyOrder,
  };
}
