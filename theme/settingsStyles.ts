import { ScaledSheet } from 'react-native-size-matters';
import { Colors, darkColors, lightColors } from './colors';

const createStyles = (theme: Colors) => ScaledSheet.create({
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
    paddingHorizontal: '16@ms',
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
    fontSize: '18@ms',
    fontWeight: '700',
    color: theme.textPrimary,
  },
  keyboardFrame: {
    flex: 1,
    minHeight: 0,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: '28@ms',
  },
  container: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    paddingHorizontal: '20@ms',
    paddingTop: '16@ms',
  },
  sectionTitle: {
    fontSize: '20@ms',
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: '6@vs',
  },
  sectionSubtitle: {
    fontSize: '14@ms',
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: '14@vs',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: '16@ms',
    borderWidth: 1,
    borderColor: theme.borderLight,
    marginBottom: '14@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: '16@ms',
  },
  avatarImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: '18@ms',
    fontWeight: '700',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  infoName: {
    fontSize: '16@ms',
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: '2@vs',
  },
  infoEmail: {
    fontSize: '13@ms',
    color: theme.textSecondary,
  },
  formCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: '18@ms',
    borderWidth: 1,
    borderColor: theme.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: '14@vs',
  },
  inputLabel: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: theme.textSecondary,
    marginBottom: '8@vs',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 16,
    paddingHorizontal: '14@ms',
    height: 52,
    backgroundColor: theme.background,
  },
  inputWrapperError: {
    borderColor: theme.danger,
    backgroundColor: theme.dangerBackground,
  },
  inputWrapperSuccess: {
    borderColor: theme.success,
    backgroundColor: theme.successBackground,
  },
  inputIcon: {
    marginRight: '10@ms',
  },
  textInput: {
    flex: 1,
    fontSize: '15@ms',
    color: theme.textPrimary,
    fontWeight: '600',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '8@vs',
    paddingHorizontal: '4@ms',
    gap: '6@ms',
  },
  helperText: {
    fontSize: '12@ms',
    color: theme.textSecondary,
    flex: 1,
  },
  errorText: {
    color: theme.danger,
    fontWeight: '600',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '14@ms',
    borderRadius: 14,
    marginTop: '14@vs',
    gap: '10@ms',
  },
  successAlert: {
    backgroundColor: theme.successBackground,
    borderWidth: 1,
    borderColor: theme.success,
  },
  successAlertText: {
    color: theme.success,
    fontSize: '13@ms',
    fontWeight: '600',
    flex: 1,
  },
  errorAlert: {
    backgroundColor: theme.dangerBackground,
    borderWidth: 1,
    borderColor: theme.danger,
  },
  errorAlertText: {
    color: theme.danger,
    fontSize: '13@ms',
    fontWeight: '600',
    flex: 1,
  },
  saveButton: {
    backgroundColor: theme.darkCard,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8@ms',
    marginTop: '18@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: theme.disabledButton,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: theme.darkCardText,
    fontSize: '15@ms',
    fontWeight: '700',
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12@ms',
    width: '100%',
    paddingVertical: '12@ms',
  },
  themeToggleLabel: {
    fontSize: '16@ms',
    fontWeight: '600',
    color: theme.textPrimary,
    flex: 1,
    minWidth: 0,
  }
});

const lightStyles = createStyles(lightColors);
const darkStyles = createStyles(darkColors);

export const useSettingsStyles = (isDarkMode: boolean) => {
  return isDarkMode ? darkStyles : lightStyles;
};
