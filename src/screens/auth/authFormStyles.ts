import { StyleSheet } from 'react-native';
import { colors, radius } from '../../config/theme';

// Styles communs aux écrans du parcours « mot de passe oublié »
// (app/(auth)/forgot-password.tsx et app/(auth)/reset-password.tsx).
// Même rendu que app/(auth)/verify.tsx (champ, bandeaux d'erreur/info,
// bouton principal, lien secondaire) pour que tout le parcours
// d'authentification ait le même aspect.
export const authFormStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 24 },
  emailHighlight: { fontWeight: '600', color: colors.text },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { color: colors.primaryDark, fontSize: 13, flex: 1 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  hint: { marginTop: 6, fontSize: 12, color: colors.textMuted },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
  // Champ « code à 6 chiffres » : chiffres espacés, comme dans verify.tsx.
  codeInput: { flex: 1, fontSize: 18, fontWeight: '600', letterSpacing: 4, color: colors.text },
  notice: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  secondaryButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
});
