import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../config/theme';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, setAppLanguage, type AppLanguage } from '../i18n';
import { showError } from '../lib/dialogs';

// Préférences des profils (particulier et agent). Le choix de langue utilise
// le même rendu segmenté que <RoleSwitcher /> : avec deux langues, c'est plus
// direct qu'une liste déroulante et ça fonctionne à l'identique sur le web.
export default function PreferencesCard() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage;

  const chooseLanguage = async (language: AppLanguage) => {
    if (language === currentLanguage) return;
    try {
      await setAppLanguage(language);
    } catch (err) {
      showError(t('common.error'), err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <MaterialIcons name="translate" size={21} color={colors.primary} />
        <Text style={styles.label}>{t('preferences.language')}</Text>
      </View>
      <View style={styles.segmentRow}>
        {SUPPORTED_LANGUAGES.map((language) => {
          const active = language === currentLanguage;
          return (
            <Pressable
              key={language}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => chooseLanguage(language)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{LANGUAGE_NAMES[language]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: colors.text,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  segmentRow: { marginTop: 10, flexDirection: 'row', gap: 8, backgroundColor: colors.background, borderRadius: 12, padding: 4 },
  segment: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 9 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  segmentTextActive: { fontWeight: '800', color: colors.white },
});
