import { StyleSheet } from 'react-native';
import { Colors, lightColors, darkColors } from './colors';

const createStyles = (theme: Colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  customHeader: {
    height: 60,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  formCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.borderLight,
    alignItems: 'center',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.dangerBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    width: '100%',
  },
  errorText: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  googleButton: {
    backgroundColor: theme.card,
    height: 54,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 8,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  termsText: {
    fontSize: 11,
    color: theme.iconMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 24,
    paddingHorizontal: 8,
  },
});

const lightStyles = createStyles(lightColors);
const darkStyles = createStyles(darkColors);

export const useLoginStyles = (isDarkMode: boolean) => {
  return isDarkMode ? darkStyles : lightStyles;
};
