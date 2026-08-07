import { useCallback, useState } from 'react';
import { CustomAlert } from '../context/AlertContext';
import type { User } from '../services/api';
import { strategyOrderAPI, orderAPI } from '../services/api';
import { formatMtfOrders, formatStrategyOrders, type FormattedMtfOrder, type FormattedStrategyOrder } from '../utils/tradeFormatters';
import { getDeleteOrderResult, getOrdersResult } from '../utils/orderError';
import { getDeleteStrategyOrderResult, getStrategyOrdersResult } from '../utils/strategyOrderError';

/**
 * Owns the Trade screen's order-history data layer: the MTF and Strategy order
 * lists, their loading state, the fetch, and the delete handlers. This is the
 * self-contained data domain — the order *placement* handlers stay in the
 * screen because they're coupled to its form state.
 *
 * The list setters are exposed so the placement handlers can optimistically
 * update the lists, preserving the screen's existing behavior.
 */
export interface DeleteResult {
  variant: 'success' | 'error';
  title: string;
  message: string;
}

export function useOrderHistory(user: User | null) {
  const [mtfOrders, setMtfOrders] = useState<FormattedMtfOrder[]>([]);
  const [strategyOrders, setStrategyOrders] = useState<FormattedStrategyOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Modal shown after a delete request resolves — mirrors the create/update flow.
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);
  // Single modal state for the history fetch — both GETs run in parallel, so their
  // failures are aggregated here to guarantee only one popup ever appears.
  const [fetchResult, setFetchResult] = useState<DeleteResult | null>(null);

  const fetchHistoryData = useCallback(async (options?: { silent?: boolean }) => {
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

      // Aggregate both fetch outcomes into a single modal. Success on both clears
      // the error; otherwise one friendly popup for the failures.
      if (options?.silent) {
        setFetchResult(null);
        return;
      }

      if (stratRes.status === 'rejected' || mtfRes.status === 'rejected') {
        let result: DeleteResult;
        if (stratRes.status === 'rejected' && mtfRes.status === 'rejected') {
          result = {
            variant: 'error',
            title: 'Could Not Load Orders',
            message: 'We could not load your order history. Please check your connection and try again.',
          };
        } else if (stratRes.status === 'rejected') {
          result = { variant: 'error', ...getStrategyOrdersResult(stratRes.reason) };
        } else if (mtfRes.status === 'rejected') {
          result = { variant: 'error', ...getOrdersResult(mtfRes.reason) };
        } else {
          result = {
            variant: 'error',
            title: 'Could Not Load Orders',
            message: 'We could not load your order history. Please check your connection and try again.',
          };
        }
        setFetchResult(result);
      } else {
        setFetchResult(null);
      }
    } catch (err) {
      console.error('Error fetching history logs:', err);
      if (!options?.silent) {
        setFetchResult({
          variant: 'error',
          title: 'Could Not Load Orders',
          message: 'We could not load your order history. Please try again.',
        });
      }
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
              setDeleteResult({
                variant: 'success',
                title: 'Order Cancelled',
                message: 'Scheduled MTF order has been successfully cancelled.',
              });
            } catch (err: any) {
              console.error('Failed to delete MTF order:', err);
              // Keep the row — the order still exists server-side.
              const result = getDeleteOrderResult(err);
              setDeleteResult({ variant: 'error', ...result });
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
              setDeleteResult({
                variant: 'success',
                title: 'Order Deleted',
                message: 'Strategy order log has been successfully deleted.',
              });
            } catch (err: any) {
              console.error('Failed to delete Strategy order:', err);
              // Keep the row — the log still exists server-side.
              const result = getDeleteStrategyOrderResult(err);
              setDeleteResult({ variant: 'error', ...result });
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
    deleteResult,
    setDeleteResult,
    fetchResult,
    setFetchResult,
  };
}
