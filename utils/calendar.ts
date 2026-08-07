/**
 * Shared month-grid construction for the calendar pickers (Trade, Calculator,
 * Holdings). Both screens render the same day grid: leading empty cells to
 * align the first weekday, then one cell per day of the month. Keys are stable
 * (date-based) so React does not need array indexes.
 */

export interface CalendarDay {
  key: string;
  date: Date | null;
}

/** Builds the day grid for the month containing `pickerDate`. */
export function buildCalendarDays(pickerDate: Date): CalendarDay[] {
  const daysInMonth = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1).getDay();
  const days: CalendarDay[] = [];

  for (let i = 0; i < firstDayIndex; i++) {
    days.push({ key: `empty-${i}`, date: null });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      key: `day-${pickerDate.getFullYear()}-${pickerDate.getMonth()}-${i}`,
      date: new Date(pickerDate.getFullYear(), pickerDate.getMonth(), i),
    });
  }
  return days;
}
