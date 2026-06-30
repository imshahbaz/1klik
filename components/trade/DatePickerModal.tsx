import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface DatePickerModalProps {
  readonly styles: any;
  readonly theme: any;
  readonly visible: boolean;
  /** Month currently displayed in the grid. */
  readonly pickerDate: Date;
  /** Date to highlight as selected. */
  readonly selectedDate: Date;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onClose: () => void;
  /** Invoked with the chosen day; the parent owns where it's stored. */
  readonly onSelectDate: (date: Date) => void;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Month-grid date picker used for both the Execute and Strategy target dates.
 * Extracted verbatim from trade.tsx; selection/storage is delegated to the
 * parent via `onSelectDate`, keeping this component purely presentational.
 */
export default function DatePickerModal({
  styles,
  theme,
  visible,
  pickerDate,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onClose,
  onSelectDate,
}: DatePickerModalProps) {
  const daysInMonth = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1).getDay();

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(pickerDate.getFullYear(), pickerDate.getMonth(), i));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay as any} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalCalendarContainer as any} onStartShouldSetResponder={() => true}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader as any}>
            <TouchableOpacity onPress={onPrevMonth} style={styles.calendarNavBtn as any}>
              <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.calendarMonthText as any}>
              {pickerDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={onNextMonth} style={styles.calendarNavBtn as any}>
              <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid as any}>
            {WEEKDAY_LABELS.map((label, idx) => (
              <View key={`wk-${idx}`} style={styles.calendarHeaderDayCell as any}>
                <Text style={styles.calendarHeaderDayText as any}>{label}</Text>
              </View>
            ))}
            {calendarDays.map((dayDate, idx) => {
              if (!dayDate) {
                return <View key={`empty-${idx}`} style={styles.calendarDayCell as any} />;
              }

              const isSelected = selectedDate.getDate() === dayDate.getDate() &&
                selectedDate.getMonth() === dayDate.getMonth() &&
                selectedDate.getFullYear() === dayDate.getFullYear();

              const dayDateAtMidnight = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
              const isPastDate = dayDateAtMidnight < today;

              return (
                <TouchableOpacity
                  key={`day-${idx}`}
                  style={[
                    styles.calendarDayCell,
                    isSelected && styles.selectedDayCell,
                    isPastDate && styles.pastDayCell
                  ] as any}
                  onPress={isPastDate ? undefined : () => {
                    onSelectDate(dayDate);
                    onClose();
                  }}
                  disabled={isPastDate}
                  activeOpacity={isPastDate ? 1 : 0.7}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isSelected && styles.selectedDayText,
                    isPastDate && styles.pastDayText
                  ] as any}>
                    {dayDate.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.calendarCloseBtn as any} onPress={onClose}>
            <Text style={styles.calendarCloseBtnText as any}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
