import React from 'react';
import { StyleProp, TextStyle, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { numeric, radius, space } from '../../theme/tokens';

const inr = (value: number, digits = 2) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Formats a number in the Indian grouping used throughout the app. */
export const formatAmount = inr;

interface MoneyProps {
  readonly value: number;
  readonly size?: number;
  readonly weight?: TextStyle['fontWeight'];
  readonly color?: string;
  readonly digits?: number;
  /** Prefix with ₹. Off by default — index levels are quoted bare. */
  readonly currency?: boolean;
  readonly style?: StyleProp<TextStyle>;
}

/** Price text in tabular figures so digits don't shift as quotes tick. */
export function Money({
  value,
  size = 16,
  weight = '700',
  color,
  digits = 2,
  currency = false,
  style,
}: MoneyProps) {
  const { theme } = useTheme();
  return (
    <Text style={[numeric, { fontSize: size, fontWeight: weight, color: color || theme.textPrimary }, style]}>
      {currency ? '₹' : ''}
      {inr(value, digits)}
    </Text>
  );
}

interface DeltaProps {
  readonly change: number;
  readonly percent?: number;
  readonly size?: number;
  /** Draw as a tinted pill rather than bare text. */
  readonly pill?: boolean;
}

/** Signed change with a direction caret, coloured green up / red down. */
export function Delta({ change, percent, size = 13, pill = false }: DeltaProps) {
  const { theme } = useTheme();
  const isUp = change >= 0;
  const tint = isUp ? theme.up : theme.down;
  const sign = isUp ? '+' : '−';
  const body = `${isUp ? '▲' : '▼'} ${sign}${inr(Math.abs(change))}${
    percent === undefined ? '' : ` (${sign}${Math.abs(percent).toFixed(2)}%)`
  }`;

  const text = (
    <Text style={[numeric, { fontSize: size, fontWeight: '700', color: tint }]}>{body}</Text>
  );

  if (!pill) return text;

  return (
    <View
      style={{
        backgroundColor: isUp ? theme.upBackground : theme.downBackground,
        paddingHorizontal: space.sm,
        paddingVertical: 3,
        borderRadius: radius.xs,
        alignSelf: 'flex-start',
      }}
    >
      {text}
    </View>
  );
}

interface StatProps {
  readonly label: string;
  readonly value: string;
  readonly align?: 'flex-start' | 'center' | 'flex-end';
  readonly tint?: string;
  /** Override the caption size — see `useStatScale` for narrow layouts. */
  readonly labelSize?: number;
  readonly valueSize?: number;
}

/**
 * Caption-over-value cell used in OHLC strips and summary rows.
 *
 * The caption is pinned to a single line: if one cell's label wrapped while its
 * neighbours' didn't, that cell's value would sit a line lower and break the
 * row's baseline. Narrow layouts should shrink the type via `useStatScale`
 * rather than let it wrap.
 */
export function Stat({ label, value, align = 'flex-start', tint, labelSize = 10, valueSize = 13.5 }: StatProps) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: align, minWidth: 0 }}>
      <Text
        numberOfLines={1}
        style={{
          fontSize: labelSize,
          fontWeight: '700',
          letterSpacing: labelSize >= 10 ? 0.7 : 0.3,
          color: theme.textTertiary,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={[numeric, { fontSize: valueSize, fontWeight: '600', color: tint || theme.textPrimary, marginTop: 3 }]}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Type scale for a row of `columns` Stat cells spanning the viewport.
 *
 * Steps the caption and value down as each column's share of the width
 * shrinks. Divides by the system font scale too, so a user running large text
 * gets the same protection a small screen does — that combination is what
 * pushes a long caption like "PREV CLOSE" onto a second line.
 */
export function useStatScale(columns: number, horizontalPadding = 32) {
  const { width, fontScale } = useWindowDimensions();
  const column = (width - horizontalPadding) / columns / Math.max(fontScale, 1);

  if (column < 62) return { labelSize: 8, valueSize: 11.5 };
  if (column < 74) return { labelSize: 9, valueSize: 12.5 };
  return { labelSize: 10, valueSize: 13.5 };
}
