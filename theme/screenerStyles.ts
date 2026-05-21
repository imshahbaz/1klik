import { StyleSheet } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { Colors, lightColors, darkColors } from './colors';

const createStyles = (theme: Colors) => ScaledSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
    marginTop: '8@vs',
  },
  sectionTitle: {
    fontSize: '15@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.2,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@ms',
    paddingVertical: '12@ms',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
    backgroundColor: theme.card,
  },
  backButton: {
    padding: '8@ms',
    borderRadius: 50,
    backgroundColor: theme.borderLight,
  },
  headerTitle: {
    fontSize: '20@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  container: {
    flex: 1,
    paddingHorizontal: '20@ms',
  },
  introContainer: {
    marginVertical: '15@vs',
  },
  subtext: {
    fontSize: '14@ms',
    color: theme.textSecondary,
    fontWeight: '500',
    lineHeight: 20,
  },
  topSection: {
    paddingBottom: '5@ms',
  },
  carouselContainer: {
    height: 140,
    justifyContent: 'center',
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    gap: '8@ms',
  },
  loadingText: {
    fontSize: '12@ms',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: '12@vs',
  },
  resultsSection: {
    flex: 1,
    marginTop: '10@vs',
  },
  resultsTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.2,
    marginBottom: '12@vs',
  },
  resultsLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12@ms',
    paddingVertical: '40@ms',
  },
  resultsStateText: {
    fontSize: '14@ms',
    color: theme.textSecondary,
    fontWeight: '600',
  },
  resultsPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '50@ms',
    paddingHorizontal: '30@ms',
    gap: '12@ms',
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultsPlaceholderText: {
    fontSize: '13@ms',
    color: theme.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  resultsErrorText: {
    fontSize: '13@ms',
    color: theme.danger,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsList: {
    gap: '10@ms',
    paddingBottom: '20@ms',
  },
  stockResultCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: '16@ms',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  stockLeft: {
    flex: 1,
    paddingRight: '12@ms',
    gap: '4@ms',
  },
  stockSymbol: {
    fontSize: '15@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.1,
  },
  stockCompany: {
    fontSize: '12@ms',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  marginBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.secondary + '20', // Add transparency manually or use a fixed transparent hex
    paddingHorizontal: '8@ms',
    paddingVertical: '4@ms',
    borderRadius: 6,
    marginTop: '4@vs',
  },
  marginBadgeText: {
    fontSize: '9@ms',
    fontWeight: '800',
    color: theme.secondary,
    letterSpacing: 0.5,
  },
  stockRight: {
    alignItems: 'flex-end',
    gap: '4@ms',
  },
  stockPrice: {
    fontSize: '15@ms',
    fontWeight: '800',
    color: theme.textPrimary,
  },
  stockChange: {
    fontSize: '12@ms',
    fontWeight: '700',
  },
  listContainer: {
    paddingRight: '20@ms',
    paddingVertical: '10@ms',
    gap: '12@ms',
  },
  strategyCard: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: '16@ms',
    borderWidth: 1,
    borderColor: theme.border,
    width: 170,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12@ms',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  selectedStrategyCard: {
    backgroundColor: theme.textPrimary,
    borderColor: theme.textPrimary,
    borderWidth: 2,
    shadowColor: theme.textPrimary,
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconCircle: {
    backgroundColor: theme.card,
  },
  strategyName: {
    fontSize: '13@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 18,
  },
  selectedStrategyName: {
    color: theme.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '50@ms',
    gap: '16@ms',
  },
  stateText: {
    color: theme.textSecondary,
    fontSize: '14@ms',
    fontWeight: '600',
  },
  errorText: {
    color: theme.danger,
    fontSize: '14@ms',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: theme.textPrimary,
    paddingHorizontal: '20@ms',
    paddingVertical: '10@ms',
    borderRadius: 14,
  },
  retryText: {
    color: theme.background,
    fontSize: '13@ms',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '60@ms',
    gap: '10@ms',
  },
  emptyText: {
    fontSize: '14@ms',
    color: theme.textSecondary,
    fontWeight: '600',
  },
});

const lightStyles = createStyles(lightColors);
const darkStyles = createStyles(darkColors);

export const useScreenerStyles = (isDarkMode: boolean) => {
  return isDarkMode ? darkStyles : lightStyles;
};
