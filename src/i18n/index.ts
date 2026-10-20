import i18n, { type ParseKeys } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from './locales/fr.json';
import en from './locales/en.json';

// Même bibliothèque que le site web (frontend/src/i18n.ts), mais les
// traductions sont EMBARQUÉES dans l'app (pas de chargement HTTP comme sur le
// web) : disponibles hors connexion et sans délai au démarrage.

// Type de « n'importe quelle clé de traduction valide », calculé par i18next
// à partir de fr.json (voir i18next.d.ts). Sert quand une clé est stockée
// dans une variable ou une table (ex. src/lib/clerkErrors.ts) : une faute
// de frappe y devient une erreur `tsc`, comme dans un appel t('...') direct.
export type TranslationKey = ParseKeys;

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Nom de chaque langue dans SA propre langue : quelqu'un qui ne lit pas la
// langue actuelle de l'app doit quand même reconnaître la sienne.
export const LANGUAGE_NAMES: Record<AppLanguage, string> = { fr: 'Français', en: 'English' };

// Public francophone (prix en FCFA) : si la langue du téléphone n'est pas
// proposée, on retombe sur le français. (Le web, lui, retombe sur l'anglais.)
const FALLBACK_LANGUAGE: AppLanguage = 'fr';
const STORAGE_KEY = 'lamaison_language';

function isSupported(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

// getLocales() contient toujours au moins une entrée ; languageCode peut
// toutefois être null (doc expo-localization, SDK 57).
function detectDeviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  return isSupported(code) ? code : FALLBACK_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  // Langue de l'appareil en attendant de relire le choix enregistré (asynchrone).
  lng: detectDeviceLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false }, // React échappe déjà le texte rendu
});

// Le choix explicite de l'utilisateur prime sur la langue de l'appareil.
AsyncStorage.getItem(STORAGE_KEY)
  .then((saved) => {
    if (isSupported(saved) && saved !== i18n.language) i18n.changeLanguage(saved);
  })
  .catch((err) => console.error('i18n: lecture de la langue enregistrée impossible', err));

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, language);
  } catch (err) {
    // La langue change quand même pour cette session ; seule la mémorisation échoue.
    console.error('i18n: enregistrement de la langue impossible', err);
  }
}

export default i18n;
