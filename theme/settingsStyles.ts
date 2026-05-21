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
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
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
    fontSize: 18,
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
  },
  infoName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  infoEmail: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  formCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 16,
    paddingHorizontal: 14,
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
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  helperText: {
    fontSize: 12,
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
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
    gap: 10,
  },
  successAlert: {
    backgroundColor: theme.successBackground,
    borderWidth: 1,
    borderColor: theme.success,
  },
  successAlertText: {
    color: theme.success,
    fontSize: 13,
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
    fontSize: 13,
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
    gap: 8,
    marginTop: 24,
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
    fontSize: 15,
    fontWeight: '700',
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
  },
  themeToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  }
});

const lightStyles = createStyles(lightColors);
const darkStyles = createStyles(darkColors);

export const useSettingsStyles = (isDarkMode: boolean) => {
  return isDarkMode ? darkStyles : lightStyles;
};
