import { ScaledSheet } from 'react-native-size-matters';
import { Colors, darkColors, lightColors } from './colors';

const createStyles = (theme: Colors) => ScaledSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
    fontSize: '20@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.borderLight,
  },
  container: {
    flex: 1,
  },
  topSection: {
    flexShrink: 0,
    paddingBottom: '4@ms',
  },
  introContainer: {
    marginVertical: '10@vs',
  },
  subtext: {
    fontSize: '13@ms',
    color: theme.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
    marginTop: '6@vs',
  },
  sectionTitle: {
    fontSize: '11@ms',
    fontWeight: '800',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.borderLight,
    marginVertical: '10@vs',
  },

  // Dropdown trigger selector styling
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.border,
    paddingHorizontal: '16@ms',
    height: '48@ms',
    marginTop: '4@vs',
    marginBottom: '6@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedDropdownTrigger: {
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@ms',
    flex: 1,
    minWidth: 0,
  },
  iconCircleSmall: {
    width: '28@ms',
    height: '28@ms',
    borderRadius: '14@ms',
    backgroundColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconCircleSmall: {
    backgroundColor: theme.primary,
  },
  dropdownTriggerText: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: theme.textPrimary,
  },
  selectedDropdownTriggerText: {
    fontWeight: '800',
    color: theme.primary,
    flexShrink: 1,
    minWidth: 0,
  },
  dropdownPlaceholder: {
    fontSize: '13@ms',
    fontWeight: '500',
    color: theme.placeholder,
    flexShrink: 1,
    minWidth: 0,
  },
  dropdownTriggerInterval: {
    fontSize: '9@ms',
    fontWeight: '700',
    color: theme.textSecondary,
    backgroundColor: theme.border,
    paddingHorizontal: '6@ms',
    paddingVertical: '2@ms',
    borderRadius: 4,
    marginLeft: '6@ms',
  },
  selectedDropdownTriggerInterval: {
    backgroundColor: theme.primary + '18',
    color: theme.primary,
  },

  // Dropdown Overlay Menu Card
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24@ms',
  },
  dropdownMenuCard: {
    width: '100%',
    maxWidth: '320@ms',
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: '16@ms',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
    paddingBottom: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  dropdownMenuTitle: {
    fontSize: '11@ms',
    fontWeight: '800',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownCloseBtn: {
    padding: '2@ms',
  },
  dropdownOptionsList: {
    gap: '4@ms',
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '10@ms',
    paddingHorizontal: '12@ms',
    borderRadius: 10,
    gap: '10@ms',
  },
  selectedDropdownOptionRow: {
    backgroundColor: theme.primaryBackground,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@ms',
    flex: 1,
    minWidth: 0,
  },
  optionNameText: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: theme.textPrimary,
  },
  selectedOptionNameText: {
    fontWeight: '700',
    color: theme.primary,
  },
  optionIntervalText: {
    fontSize: '9@ms',
    color: theme.textSecondary,
    fontWeight: '600',
    marginTop: '1@vs',
  },
  selectedOptionIntervalText: {
    color: theme.primary,
    opacity: 0.8,
  },
  successRateBadge: {
    alignItems: 'flex-end',
  },
  successRateValue: {
    fontSize: '13@ms',
    fontWeight: '800',
    color: theme.success ?? '#16a34a',
  },
  successRateLabel: {
    fontSize: '8@ms',
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: '1@vs',
  },

  // Results UI
  resultsSection: {
    flex: 1,
    minHeight: 0,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  resultsTitle: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.2,
    flex: 1,
    minWidth: 0,
  },
  emptyStateContainer: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-160@ms',
    paddingHorizontal: '32@ms',
    gap: '12@ms',
  },
  emptyStateIconWrapper: {
    width: '64@ms',
    height: '64@ms',
    borderRadius: '32@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8@ms',
  },
  emptyStateTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: theme.textPrimary,
  },
  emptyStateSubtext: {
    fontSize: '13@ms',
    color: theme.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsList: {
    gap: '8@ms',
    paddingBottom: '24@ms',
  },

  // Stock Result Card
  stockResultCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    paddingHorizontal: '14@ms',
    paddingVertical: '12@ms',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  stockLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: '10@ms',
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@ms',
    marginBottom: '2@vs',
  },
  stockSymbol: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.2,
  },
  marginBadgeSmall: {
    backgroundColor: theme.secondary + '15',
    paddingHorizontal: '6@ms',
    paddingVertical: '2@ms',
    borderRadius: 4,
  },
  marginBadgeSmallText: {
    fontSize: '8@ms',
    fontWeight: '800',
    color: theme.secondary,
    letterSpacing: 0.2,
  },
  stockCompany: {
    fontSize: '11@ms',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  stockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@ms',
    flexShrink: 0,
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
    gap: '2@ms',
  },
  stockPrice: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    flexShrink: 1,
  },

  // Skeletons
  skeletonRow: {
    gap: '8@ms',
    paddingBottom: '20@ms',
  },
  skeletonCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: '14@ms',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '66@ms',
  },
  skeletonTextSymbol: {
    width: '90@ms',
    height: '14@ms',
    borderRadius: 4,
    backgroundColor: theme.borderLight,
    marginBottom: '6@vs',
  },
  skeletonTextDesc: {
    width: '140@ms',
    height: '10@ms',
    borderRadius: 4,
    backgroundColor: theme.borderLight,
  },
  skeletonPrice: {
    width: '60@ms',
    height: '14@ms',
    borderRadius: 4,
    backgroundColor: theme.borderLight,
    marginBottom: '4@vs',
  },

  // Others
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '50@ms',
    gap: '16@ms',
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
