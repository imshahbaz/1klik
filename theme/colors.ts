/**
 * Trading-terminal palette.
 *
 * Two rules drive the choices here:
 *  1. Up/down are the loudest colours on screen and must never be confused with
 *     anything else, so the accent stays warm-orange and the loss colour is
 *     pushed to a crimson that reads clearly against it.
 *  2. Surfaces are separated by tone and hairlines rather than shadows, which is
 *     how native Android renders dense data.
 */

export const darkColors = {
  // Surfaces, from furthest back to nearest.
  background: '#0A0D12',
  surface: '#12161D',
  surfaceAlt: '#181D26',
  surfaceSunken: '#0D1116',
  card: '#12161D',
  darkCard: '#12161D',

  // Lines.
  border: '#232A35',
  borderLight: '#1A202A',
  divider: '#1E2530',

  // Type.
  textPrimary: '#E6EAF0',
  textSecondary: '#8A94A6',
  textTertiary: '#5D6779',
  darkCardText: '#E6EAF0',
  darkCardSubtext: '#8A94A6',
  iconMuted: '#697386',
  placeholder: '#5D6779',

  // Market direction.
  up: '#0ECB81',
  down: '#F6465D',
  upBackground: 'rgba(14, 203, 129, 0.14)',
  downBackground: 'rgba(246, 70, 93, 0.14)',
  success: '#0ECB81',
  danger: '#F6465D',
  successBackground: 'rgba(14, 203, 129, 0.14)',
  dangerBackground: 'rgba(246, 70, 93, 0.14)',

  // Brand accent — interactive affordances only, never P&L.
  primary: '#FF7A3D',
  primaryDim: '#C95A28',
  primaryBackground: 'rgba(255, 122, 61, 0.14)',
  secondary: '#4C8DFF',
  infoText: '#4C8DFF',
  infoBackground: 'rgba(76, 141, 255, 0.14)',
  warningText: '#F0B429',
  warningBackground: 'rgba(240, 180, 41, 0.14)',

  // Interaction.
  overlay: 'rgba(0, 0, 0, 0.72)',
  ripple: 'rgba(255, 255, 255, 0.09)',
  chipBackground: '#1B212B',
  disabledButton: '#232A35',
  disabledText: '#5D6779',

  buttonPrimary: '#FF7A3D',
  buttonPrimaryPressed: '#D9622C',
  buttonPrimaryText: '#0A0D12',
  buttonSecondary: '#181D26',
  buttonSecondaryPressed: '#232A35',
  buttonSecondaryText: '#E6EAF0',
  buttonSecondaryBorder: '#232A35',
  buttonDanger: '#F6465D',
  buttonDangerPressed: '#D13548',
  buttonDangerText: '#FFFFFF',
};

export const lightColors: typeof darkColors = {
  background: '#F2F4F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F9FC',
  surfaceSunken: '#EBEEF3',
  card: '#FFFFFF',
  darkCard: '#FFFFFF',

  border: '#DFE3EA',
  borderLight: '#EDF0F4',
  divider: '#E6EAF0',

  textPrimary: '#0E1319',
  textSecondary: '#616C7D',
  textTertiary: '#8A94A6',
  darkCardText: '#0E1319',
  darkCardSubtext: '#616C7D',
  iconMuted: '#8A94A6',
  placeholder: '#A3ACBA',

  up: '#00A56B',
  down: '#E02F45',
  upBackground: 'rgba(0, 165, 107, 0.12)',
  downBackground: 'rgba(224, 47, 69, 0.12)',
  success: '#00A56B',
  danger: '#E02F45',
  successBackground: 'rgba(0, 165, 107, 0.12)',
  dangerBackground: 'rgba(224, 47, 69, 0.12)',

  primary: '#E8590C',
  primaryDim: '#B8460A',
  primaryBackground: 'rgba(232, 89, 12, 0.10)',
  secondary: '#2563EB',
  infoText: '#2563EB',
  infoBackground: 'rgba(37, 99, 235, 0.10)',
  warningText: '#B45309',
  warningBackground: 'rgba(180, 83, 9, 0.10)',

  overlay: 'rgba(14, 19, 25, 0.45)',
  ripple: 'rgba(14, 19, 25, 0.08)',
  chipBackground: '#EDF0F4',
  disabledButton: '#DFE3EA',
  disabledText: '#A3ACBA',

  buttonPrimary: '#E8590C',
  buttonPrimaryPressed: '#C24A09',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#FFFFFF',
  buttonSecondaryPressed: '#EDF0F4',
  buttonSecondaryText: '#0E1319',
  buttonSecondaryBorder: '#DFE3EA',
  buttonDanger: '#E02F45',
  buttonDangerPressed: '#BC2337',
  buttonDangerText: '#FFFFFF',
};

export type Colors = typeof darkColors;
