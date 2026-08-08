import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper';
import { buildCalendarDays } from '../../utils/calendar';
import { useTheme } from '../../context/ThemeContext';
import { numeric, radius, space } from '../../theme/tokens';

interface DatePickerModalProps {
  readonly styles?: any;
  readonly theme?: any;
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

/**
 * Material date-picker dialog: month header with paging arrows, a 7-column
 * grid, and circular day cells with a filled selection — matching the platform
 * picker so the control feels familiar without pulling in a native module.
 */
export default function DatePickerModal({
  theme: themeProp,
  visible,
  pickerDate,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onClose,
  onSelectDate,
  isDateDisabled,
}: DatePickerModalProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeProp || contextTheme;

  const calendarDays = buildCalendarDays(pickerDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={[styles.dialog, { backgroundColor: theme.surface }]}
      >
        <Text style={[styles.overline, { color: theme.textTertiary }]}>SELECT DATE</Text>
        <Text style={[styles.headline, { color: theme.textPrimary }]}>
          {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </Text>

        <View style={[styles.monthBar, { borderTopColor: theme.divider }]}>
          <TouchableRipple onPress={onPrevMonth} borderless rippleColor={theme.ripple} style={styles.arrow}>
            <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
          </TouchableRipple>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary }}>
            {pickerDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableRipple onPress={onNextMonth} borderless rippleColor={theme.ripple} style={styles.arrow}>
            <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
          </TouchableRipple>
        </View>

        <View style={styles.grid}>
          {WEEKDAY_LABELS.map((label, idx) => (
            <View key={`wk-${idx}`} style={styles.cell}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textTertiary }}>{label}</Text>
            </View>
          ))}

          {calendarDays.map((cell) => {
            const dayDate = cell.date;
            if (!dayDate) return <View key={cell.key} style={styles.cell} />;

            const isSelected =
              selectedDate.getDate() === dayDate.getDate() &&
              selectedDate.getMonth() === dayDate.getMonth() &&
              selectedDate.getFullYear() === dayDate.getFullYear();

            const dayAtMidnight = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
            const isToday = dayAtMidnight.getTime() === today.getTime();
            const disabled = isDateDisabled ? isDateDisabled(dayAtMidnight) : dayAtMidnight < today;

            let dayColor = theme.textPrimary;
            if (isSelected) dayColor = theme.buttonPrimaryText;
            else if (disabled) dayColor = theme.disabledText;
            else if (isToday) dayColor = theme.primary;

            return (
              <View key={cell.key} style={styles.cell}>
                <TouchableRipple
                  borderless
                  rippleColor={theme.ripple}
                  disabled={disabled}
                  onPress={() => {
                    onSelectDate(dayDate);
                    onClose();
                  }}
                  style={[
                    styles.day,
                    isSelected && { backgroundColor: theme.primary },
                    !isSelected && isToday && { borderWidth: 1, borderColor: theme.primary },
                  ]}
                >
                  <Text style={[numeric, { fontSize: 14, fontWeight: isSelected ? '700' : '500', color: dayColor }]}>
                    {dayDate.getDate()}
                  </Text>
                </TouchableRipple>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <TouchableRipple onPress={onClose} rippleColor={theme.ripple} style={styles.action}>
            <Text style={{ fontSize: 14, fontWeight: '700', letterSpacing: 0.5, color: theme.primary }}>
              CANCEL
            </Text>
          </TouchableRipple>
        </View>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 28,
    marginHorizontal: space.xl,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: space.xxl,
    paddingTop: space.xl,
  },
  headline: {
    fontSize: 26,
    fontWeight: '600',
    paddingHorizontal: space.xxl,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: space.md,
  },
  cell: {
    // Seven columns; the fractional width keeps the grid flush at any density.
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: space.md,
  },
  action: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
