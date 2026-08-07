import { ScaledSheet } from 'react-native-size-matters';
import { Colors, darkColors, lightColors } from './colors';

/**
 * Shared button style factory. Every primary/secondary/danger action button in
 * the app derives from here so the color and geometry stay consistent across
 * all screens (trade, brokers, calculator, settings, modals, etc.).
 */
const createStyles = (theme: Colors) => ScaledSheet.create({
  primaryButton: {
    backgroundColor: theme.buttonPrimary,
    height: '50@ms',
    borderRadius: '14@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8@ms',
    shadowColor: theme.buttonPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonPressed: {
    backgroundColor: theme.buttonPrimaryPressed,
  },
  primaryButtonText: {
    color: theme.buttonPrimaryText,
    fontSize: '15@ms',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: theme.buttonSecondary,
    borderWidth: 1.5,
    borderColor: theme.buttonSecondaryBorder,
    height: '50@ms',
    borderRadius: '14@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6@ms',
  },
  secondaryButtonPressed: {
    backgroundColor: theme.buttonSecondaryPressed,
  },
  secondaryButtonText: {
    color: theme.buttonSecondaryText,
    fontSize: '15@ms',
    fontWeight: '700',
  },
  dangerButton: {
    backgroundColor: theme.buttonDanger,
    height: '50@ms',
    borderRadius: '14@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8@ms',
    shadowColor: theme.buttonDanger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  dangerButtonPressed: {
    backgroundColor: theme.buttonDangerPressed,
  },
  dangerButtonText: {
    color: theme.buttonDangerText,
    fontSize: '15@ms',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  disabledButton: {
    backgroundColor: theme.disabledButton,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: theme.disabledText,
  },
});

const lightStyles = createStyles(lightColors);
const darkStyles = createStyles(darkColors);

export const useButtonStyles = (isDarkMode: boolean) => {
  return isDarkMode ? darkStyles : lightStyles;
};
