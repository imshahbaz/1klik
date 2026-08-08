import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Dialog, Portal, Text, TouchableRipple } from 'react-native-paper';
import { CustomAlert } from '../../context/AlertContext';
import { useMargins } from '../../context/MarginContext';
import { holdingsAPI } from '../../services/api';
import { formatDateString, formatIsoDate } from '../../utils/date';
import { rankMarginSymbols } from '../../utils/margins';
import { getFriendlyErrorMessage } from '../../utils/errorMessage';
import DatePickerModal from '../common/DatePickerModal';
import HoldingCard from './HoldingCard';
import Button from '../ui/Button';
import { Field, SelectField } from '../ui/Field';
import { EmptyState } from '../ui/Feedback';
import { Panel, SectionHeader } from '../ui/Panel';
import { radius, space } from '../../theme/tokens';

/** Portfolio table plus the manual add/edit flow, shown under the Zerodha tab. */
export default function ZerodhaHoldings({ theme }: any) {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const { margins, loadingMargins } = useMargins();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newBuyDate, setNewBuyDate] = useState<Date>(new Date());
  const [adding, setAdding] = useState(false);
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);

  const fetchHoldings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await holdingsAPI.getHoldings();
      const data = res.data.data;
      setHoldings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch holdings:', err);
      if (err.response?.status === 404) {
        setHoldings([]);
        setError(null);
      } else {
        setError('Currently unable to load your portfolio holdings. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const openAddModal = () => {
    setEditingDetailId(null);
    setNewSymbol('');
    setNewQuantity('');
    setNewPrice('');
    setNewBuyDate(new Date());
    setSearchQuery('');
    setShowAddModal(true);
  };

  const openEditModal = useCallback((symbol: string, detail: any) => {
    setEditingDetailId(detail.id);
    setNewSymbol(symbol);
    setSearchQuery(symbol);
    setNewQuantity(String(detail.quantity));
    setNewPrice(String(detail.price));
    setNewBuyDate(detail.buyDate ? new Date(detail.buyDate) : new Date());
    setShowAddModal(true);
  }, []);

  const toggleExpanded = useCallback((symbol: string) => {
    setExpandedSymbol((prev) => (prev === symbol ? null : symbol));
  }, []);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  const handlePrevMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1));
  };

  const filteredMargins = useMemo(() => rankMarginSymbols(margins, searchQuery), [margins, searchQuery]);

  const handleAddHolding = async () => {
    try {
      if (!newSymbol.trim()) return CustomAlert.alert('Validation Error', 'Symbol cannot be blank.');

      const qty = Number.parseInt(newQuantity);
      if (Number.isNaN(qty) || qty < 1) return CustomAlert.alert('Validation Error', 'Quantity must be at least 1.');

      const prc = Number.parseFloat(newPrice);
      if (Number.isNaN(prc) || prc < 1) return CustomAlert.alert('Validation Error', 'Price must be 1 or greater.');

      setAdding(true);

      const payload = {
        symbol: newSymbol.trim().toUpperCase(),
        margin: 0,
        ltp: prc,
        holdingDetails: [
          {
            id: editingDetailId || 0,
            quantity: qty,
            price: prc,
            buyDate: formatIsoDate(newBuyDate),
          },
        ],
      };

      if (editingDetailId) {
        await holdingsAPI.updateHolding(payload);
        CustomAlert.alert('Success', 'Holding updated successfully.');
      } else {
        await holdingsAPI.addHolding(payload);
        CustomAlert.alert('Success', 'Holding added successfully.');
      }

      setShowAddModal(false);
      setNewSymbol('');
      setNewQuantity('');
      setNewPrice('');
      setEditingDetailId(null);
      fetchHoldings();
    } catch (err: any) {
      console.error('Failed to save holding:', err);
      CustomAlert.alert('Error', getFriendlyErrorMessage(err, 'Could not save the holding. Please try again.'));
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDetail = useCallback(
    (symbol: string, detailId: number) => {
      CustomAlert.alert(
        'Delete Holding Entry',
        'Are you sure you want to delete this specific buy entry? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                await holdingsAPI.deleteHoldingDetail(symbol, detailId);
                fetchHoldings();
                CustomAlert.alert('Success', 'Holding entry deleted successfully.');
              } catch (err: any) {
                console.error('Failed to delete holding detail:', err);
                CustomAlert.alert(
                  'Error',
                  getFriendlyErrorMessage(err, 'Could not delete the holding entry. Please try again.')
                );
                setLoading(false);
              }
            },
          },
        ]
      );
    },
    [fetchHoldings]
  );

  const handleDeleteHolding = useCallback(
    (symbol: string) => {
      CustomAlert.alert('Delete Holding', `Are you sure you want to delete all manual holdings for ${symbol}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await holdingsAPI.deleteHolding(symbol);
              CustomAlert.alert('Success', `${symbol} holding deleted successfully.`);
              fetchHoldings();
            } catch (err: any) {
              console.error('Failed to delete holding:', err);
              CustomAlert.alert(
                'Error',
                getFriendlyErrorMessage(err, 'Could not delete the holding. Please try again.')
              );
              setLoading(false);
            }
          },
        },
      ]);
    },
    [fetchHoldings]
  );

  useFocusEffect(
    useCallback(() => {
      fetchHoldings();
    }, [fetchHoldings])
  );

  let body: React.ReactNode;
  if (loading) {
    body = (
      <View style={{ paddingVertical: 40, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  } else if (error) {
    body = <EmptyState icon="cloud-offline-outline" title="Couldn't load holdings" message={error} tone="error" />;
  } else if (holdings.length === 0) {
    body = (
      <EmptyState
        icon="briefcase-outline"
        title="No holdings"
        message="Add a position manually to track its cost, MTF interest and break-even."
        actionLabel="Add holding"
        onAction={openAddModal}
      />
    );
  } else {
    body = holdings.map((holding, index) => (
      <HoldingCard
        key={holding.symbol || index}
        holding={holding}
        theme={theme}
        isExpanded={expandedSymbol === holding.symbol}
        onToggle={toggleExpanded}
        onEditDetail={openEditModal}
        onDeleteDetail={handleDeleteDetail}
        onDeleteHolding={handleDeleteHolding}
      />
    ));
  }

  return (
    <View>
      <SectionHeader
        title="Portfolio"
        actionLabel={holdings.length > 0 ? '+ Add' : undefined}
        onAction={holdings.length > 0 ? openAddModal : undefined}
      />
      <Panel padded={false}>{body}</Panel>

      <Portal>
        <Dialog
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          style={[dialogStyles.dialog, { backgroundColor: theme.surface }]}
        >
          <Text style={[dialogStyles.title, { color: theme.textPrimary }]}>
            {editingDetailId ? 'Edit holding' : 'Add holding'}
          </Text>

          <ScrollView
            style={{ maxHeight: 400 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: space.xxl, paddingBottom: space.lg, gap: space.lg }}
          >
            <View style={{ zIndex: 10 }}>
              <Field
                label="Symbol"
                icon="search-outline"
                placeholder={loadingMargins ? 'Loading instruments…' : 'e.g. RELIANCE'}
                value={newSymbol || searchQuery}
                editable={!loadingMargins && !editingDetailId}
                autoCapitalize="characters"
                onChangeText={(val) => {
                  setSearchQuery(val);
                  setNewSymbol('');
                  setShowDropdown(true);
                }}
              />

              {showDropdown && searchQuery && filteredMargins.length > 0 && !loadingMargins && !editingDetailId ? (
                <Panel
                  padded={false}
                  style={[dialogStyles.suggestions, { backgroundColor: theme.surfaceAlt }]}
                >
                  <ScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {filteredMargins.slice(0, 10).map((marginItem: any, idx: number) => (
                      <TouchableRipple
                        key={marginItem.symbol || idx}
                        rippleColor={theme.ripple}
                        onPress={() => {
                          setNewSymbol(marginItem.symbol);
                          setSearchQuery('');
                          setShowDropdown(false);
                        }}
                      >
                        <View style={[dialogStyles.suggestion, { borderBottomColor: theme.divider }]}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary }}>
                            {marginItem.symbol}
                          </Text>
                        </View>
                      </TouchableRipple>
                    ))}
                  </ScrollView>
                </Panel>
              ) : null}
            </View>

            <Field
              label="Quantity"
              value={newQuantity}
              onChangeText={setNewQuantity}
              keyboardType="number-pad"
              placeholder="0"
              suffix="qty"
              hint="min 1"
              numericFace
            />

            <Field
              label="Buy price"
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
              prefix="₹"
              hint="min 1"
              numericFace
            />

            <SelectField
              label="Buy date"
              value={formatDateString(newBuyDate)}
              icon="calendar-outline"
              onPress={() => setShowDatePicker(true)}
            />
          </ScrollView>

          <View style={dialogStyles.actions}>
            <Button label="Cancel" variant="text" compact onPress={() => setShowAddModal(false)} />
            <Button
              label={editingDetailId ? 'Update' : 'Save'}
              compact
              loading={adding}
              disabled={adding}
              onPress={handleAddHolding}
            />
          </View>
        </Dialog>
      </Portal>

      {/* Buy-date picker — future dates are disabled (a buy can't be in the future). */}
      <DatePickerModal
        theme={theme}
        visible={showDatePicker}
        pickerDate={pickerDate}
        selectedDate={newBuyDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(date) => setNewBuyDate(date)}
        isDateDisabled={(date) => date > new Date()}
      />
    </View>
  );
}

const dialogStyles = StyleSheet.create({
  dialog: {
    borderRadius: 28,
    marginHorizontal: space.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: space.xxl,
    paddingTop: space.xxl,
    paddingBottom: space.lg,
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: space.xs,
    borderRadius: radius.sm,
    elevation: 6,
  },
  suggestion: {
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
    padding: space.md,
  },
});
