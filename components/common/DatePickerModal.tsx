import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Modal as PaperModal, Portal, Surface, Text as PaperText, Button as PaperButton, IconButton } from 'react-native-paper';
import { buildCalendarDays } from '../../utils/calendar';

interface DatePickerModalProps {
  readonly styles: any;
  readonly theme: any;
  readonly visible: boolean;
  readonly pickerDate: Date;
  readonly selectedDate: Date;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onClose: () => void;
  readonly onSelectDate: (date: Date) => void;
  readonly isDateDisabled?: (date: Date) => boolean;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
    <Portal>
      <PaperModal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Surface
          style={[
            styles.modalCalendarContainer,
            {
              backgroundColor: theme.card,
              borderRadius: 24,
              padding: 16,
              width: '100%',
              maxWidth: 340,
              elevation: 5,
            },
          ]}
          elevation={4}
        >
          {/* Calendar Header */}
          <View style={[styles.calendarHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }]}>
            <IconButton
              icon={({ size, color }) => <Ionicons name="chevron-back" size={size || 20} color={color || theme.textPrimary} />}
              onPress={onPrevMonth}
            />
            <PaperText variant="titleMedium" style={{ fontWeight: '700', color: theme.textPrimary }}>
              {pickerDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </PaperText>
            <IconButton
              icon={({ size, color }) => <Ionicons name="chevron-forward" size={size || 20} color={color || theme.textPrimary} />}
              onPress={onNextMonth}
            />
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {WEEKDAY_LABELS.map((label, idx) => (
              <View key={`wk-${idx}`} style={styles.calendarHeaderDayCell}>
                <PaperText style={[styles.calendarHeaderDayText, { color: theme.textSecondary, fontWeight: '600' }]}>{label}</PaperText>
              </View>
            ))}
            {calendarDays.map((cell) => {
              const dayDate = cell.date;
              if (!dayDate) {
                return <View key={cell.key} style={styles.calendarDayCell} />;
              }

              const isSelected =
                selectedDate.getDate() === dayDate.getDate() &&
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
                    isSelected && [styles.selectedDayCell, { backgroundColor: theme.primary }],
                    disabled && styles.pastDayCell,
                  ]}
                  onPress={
                    disabled
                      ? undefined
                      : () => {
                          onSelectDate(dayDate);
                          onClose();
                        }
                  }
                  disabled={disabled}
                  activeOpacity={disabled ? 1 : 0.7}
                >
                  <PaperText
                    style={[
                      styles.calendarDayText,
                      { color: isSelected ? '#ffffff' : disabled ? theme.disabledText : theme.textPrimary },
                    ]}
                  >
                    {dayDate.getDate()}
                  </PaperText>
                </TouchableOpacity>
              );
            })}
          </View>

          <PaperButton
            mode="text"
            onPress={onClose}
            textColor={theme.primary}
            style={{ marginTop: 12 }}
          >
            Cancel
          </PaperButton>
        </Surface>
      </PaperModal>
    </Portal>
  );
}
