import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { buildCalendarDays } from '../../utils/calendar';

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
  /**
   * Predicate marking a (midnight-normalized) day as non-selectable. Defaults to
   * disabling past dates (e.g. Trade target date). Holdings passes a future-date
   * check instead, since a buy date can't be in the future.
   */
  readonly isDateDisabled?: (date: Date) => boolean;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Month-grid date picker shared across the app (Trade target dates, Holdings
 * buy date). Selection/storage is delegated to the parent via `onSelectDate`,
 * and which days are selectable is controlled via `isDateDisabled`, keeping
 * this component purely presentational and reusable.
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
  isDateDisabled,
}: DatePickerModalProps) {
  const calendarDays = buildCalendarDays(pickerDate);

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
            {calendarDays.map((cell) => {
              const dayDate = cell.date;
              if (!dayDate) {
                return <View key={cell.key} style={styles.calendarDayCell as any} />;
              }

              const isSelected = selectedDate.getDate() === dayDate.getDate() &&
                selectedDate.getMonth() === dayDate.getMonth() &&
                selectedDate.getFullYear() === dayDate.getFullYear();

              const dayDateAtMidnight = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
              const disabled = isDateDisabled
                ? isDateDisabled(dayDateAtMidnight)
                : dayDateAtMidnight < today;

              return (
                <TouchableOpacity
                  key={cell.key}
                  style={[
                    styles.calendarDayCell,
                    isSelected && styles.selectedDayCell,
                    disabled && styles.pastDayCell
                  ] as any}
                  onPress={disabled ? undefined : () => {
                    onSelectDate(dayDate);
                    onClose();
                  }}
                  disabled={disabled}
                  activeOpacity={disabled ? 1 : 0.7}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isSelected && styles.selectedDayText,
                    disabled && styles.pastDayText
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
