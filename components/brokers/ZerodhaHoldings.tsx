import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { CustomAlert } from '../../context/AlertContext';
import { useMargins } from '../../context/MarginContext';
import { holdingsAPI } from '../../services/api';
import HoldingCard from './HoldingCard';

const formatDateString = (date: Date) => {
  if (!date) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ZerodhaHoldings({ styles, theme }: any) {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // Add Holding Form State
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
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setHoldings(data);
      } else {
        setHoldings([]);
      }
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
    if (detail.buyDate) {
      setNewBuyDate(new Date(detail.buyDate));
    } else {
      setNewBuyDate(new Date());
    }
    setShowAddModal(true);
  }, []);

  const toggleExpanded = useCallback((symbol: string) => {
    setExpandedSymbol((prev) => (prev === symbol ? null : symbol));
  }, []);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  const handlePrevMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1));
  };

  const filteredMargins = margins.filter((item: any) =>
    item?.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a: any, b: any) => {
    const q = searchQuery.toLowerCase();
    const sA = a.symbol.toLowerCase();
    const sB = b.symbol.toLowerCase();
    if (sA === q) return -1;
    if (sB === q) return 1;
    const startsA = sA.startsWith(q);
    const startsB = sB.startsWith(q);
    if (startsA && !startsB) return -1;
    if (!startsA && startsB) return 1;
    return sA.localeCompare(sB);
  });

  const handleAddHolding = async () => {
    try {
      if (!newSymbol.trim()) return CustomAlert.alert('Validation Error', 'Symbol cannot be blank.');

      const qty = parseInt(newQuantity);
      if (isNaN(qty) || qty < 1) return CustomAlert.alert('Validation Error', 'Quantity must be at least 1.');

      const prc = parseFloat(newPrice);
      if (isNaN(prc) || prc < 1) return CustomAlert.alert('Validation Error', 'Price must be 1 or greater.');

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
            buyDate: formatIsoDate(newBuyDate)
          }
        ]
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
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save holding. Please try again.';
      CustomAlert.alert('Error', errorMsg);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDetail = useCallback((symbol: string, detailId: number) => {
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
              const errorMsg = err.response?.data?.message || err.message || 'Failed to delete holding entry.';
              CustomAlert.alert('Error', errorMsg);
              setLoading(false);
            }
          }
        }
      ]
    );
  }, [fetchHoldings]);

  const handleDeleteHolding = useCallback((symbol: string) => {
    CustomAlert.alert(
      'Delete Holding',
      `Are you sure you want to delete all manual holdings for ${symbol}?`,
      [
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
              CustomAlert.alert('Error', err.response?.data?.message || 'Failed to delete holding.');
              setLoading(false);
            }
          }
        }
      ]
    );
  }, [fetchHoldings]);

  useFocusEffect(
    useCallback(() => {
      fetchHoldings();
    }, [fetchHoldings])
  );

  if (loading) {
    return (
      <View style={[styles.formCard, { marginTop: 16, alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.formSubtitle, { marginTop: 8 }]}>Loading holdings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.formCard, { marginTop: 16 }]}>
        <Text style={[styles.formTitle, { color: theme.danger }]}>Error</Text>
        <Text style={styles.formSubtitle}>{error}</Text>
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={[styles.formCard, { marginTop: 16 }]}>
      <Text style={styles.formTitle}>Holdings</Text>
      <Text style={styles.formSubtitle}>No holdings mapped.</Text>
      <TouchableOpacity style={[styles.submitButton, { marginTop: 16 }]} onPress={openAddModal}>
        <Ionicons name="add" size={18} color="#ffffff" />
        <Text style={styles.submitButtonText}>Add Holding</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      {holdings.length === 0 ? renderEmptyState() : (
        <View style={[styles.formCard, { marginTop: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.formTitle}>Portfolio Holdings</Text>
            <TouchableOpacity onPress={openAddModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="add-circle" size={20} color={theme.primary} />
              <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>Add</Text>
            </TouchableOpacity>
          </View>

          {holdings.map((holding, index) => (
            <HoldingCard
              key={holding.symbol || index}
              holding={holding}
              styles={styles}
              theme={theme}
              isExpanded={expandedSymbol === holding.symbol}
              onToggle={toggleExpanded}
              onEditDetail={openEditModal}
              onDeleteDetail={handleDeleteDetail}
              onDeleteHolding={handleDeleteHolding}
            />
          ))}
        </View>
      )}

      <Modal visible={showAddModal} transparent={true} animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <View style={[styles.formCard, { width: '100%', marginTop: 0, maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.formTitle}>{editingDetailId ? 'Edit Holding' : 'Add Manual Holding'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.inputGroup, { zIndex: 100 }]}>
                <Text style={styles.inputLabel}>SYMBOL *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="trending-up-outline" size={18} color={theme.iconMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={loadingMargins ? "Loading stocks..." : "e.g. RELIANCE"}
                    placeholderTextColor={theme.placeholder}
                    value={newSymbol || searchQuery}
                    onChangeText={(val) => {
                      setSearchQuery(val);
                      setNewSymbol('');
                      setShowDropdown(true);
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    onFocus={() => setShowDropdown(true)}
                    editable={!loadingMargins && !editingDetailId}
                  />
                  {loadingMargins && <ActivityIndicator size="small" color={theme.primary} />}
                </View>

                {showDropdown && searchQuery && filteredMargins.length > 0 && !loadingMargins && !editingDetailId && (
                  <View style={styles.verticalDropdownContainer}>
                    <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                      {filteredMargins.slice(0, 10).map((marginItem: any, idx: number) => (
                        <TouchableOpacity
                          key={marginItem.symbol || idx}
                          style={styles.suggestionRow}
                          onPress={() => {
                            setNewSymbol(marginItem.symbol);
                            setSearchQuery('');
                            setShowDropdown(false);
                          }}
                        >
                          <Text style={styles.suggestionRowSymbol}>{marginItem.symbol}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={[styles.inputGroup, { zIndex: 1 }]}>
                <Text style={styles.inputLabel}>QUANTITY (Min 1) *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={styles.textInput} placeholder="10" placeholderTextColor={theme.placeholder} value={newQuantity} onChangeText={setNewQuantity} keyboardType="numeric" />
                </View>
              </View>

              <View style={[styles.inputGroup, { zIndex: 1 }]}>
                <Text style={styles.inputLabel}>PRICE (Min 1) *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={styles.textInput} placeholder="2500.50" placeholderTextColor={theme.placeholder} value={newPrice} onChangeText={setNewPrice} keyboardType="decimal-pad" />
                </View>
              </View>

              <View style={[styles.inputGroup, { zIndex: 1 }]}>
                <Text style={styles.inputLabel}>BUY DATE *</Text>
                <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color={theme.iconMuted} style={styles.inputIcon} />
                  <Text style={[styles.textInput, { paddingVertical: 12 }]}>{formatDateString(newBuyDate)}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddHolding} disabled={adding}>
                {adding ? <ActivityIndicator size="small" color="#ffffff" /> : (
                  <>
                    <Ionicons name={editingDetailId ? "save-outline" : "checkmark-circle-outline"} size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>{editingDetailId ? 'Update Holding' : 'Save Holding'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent={true} animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalCalendarContainer} onStartShouldSetResponder={() => true}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
                <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                {pickerDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
                <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
                <View key={`wk-${idx}`} style={{ width: '14.28%', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>{label}</Text>
                </View>
              ))}
              {(() => {
                const daysInMonth = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 0).getDate();
                const firstDayIndex = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1).getDay();
                const calendarDays = [];

                for (let i = 0; i < firstDayIndex; i++) {
                  calendarDays.push(null);
                }
                for (let i = 1; i <= daysInMonth; i++) {
                  calendarDays.push(new Date(pickerDate.getFullYear(), pickerDate.getMonth(), i));
                }

                return calendarDays.map((dayDate, idx) => {
                  if (!dayDate) {
                    return <View key={`empty-${idx}`} style={{ width: '14.28%', height: 40 }} />;
                  }
                  const isSelected = newBuyDate && newBuyDate.getDate() === dayDate.getDate() &&
                    newBuyDate.getMonth() === dayDate.getMonth() &&
                    newBuyDate.getFullYear() === dayDate.getFullYear();

                  const dayDateAtMidnight = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
                  const isFutureDate = dayDateAtMidnight > new Date();

                  return (
                    <TouchableOpacity
                      key={`day-${idx}`}
                      style={{
                        width: '14.28%',
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                        borderRadius: 20
                      }}
                      onPress={isFutureDate ? undefined : () => {
                        setNewBuyDate(dayDate);
                        setShowDatePicker(false);
                      }}
                      disabled={isFutureDate}
                      activeOpacity={isFutureDate ? 1 : 0.7}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: isSelected ? '800' : '500',
                        color: isSelected ? '#ffffff' : (isFutureDate ? theme.iconMuted : theme.textPrimary)
                      }}>
                        {dayDate.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>

            <TouchableOpacity style={{ marginTop: 16, alignItems: 'center', padding: 12 }} onPress={() => setShowDatePicker(false)}>
              <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
