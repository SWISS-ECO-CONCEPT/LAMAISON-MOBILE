import 'i18next';
import type fr from './locales/fr.json';

// Typage des clés : t('profile.logout') est vérifié à la compilation, une
// clé inexistante ou mal orthographiée devient une erreur TypeScript au lieu
// d'un texte brut "profile.logut" affiché à l'écran. Le français sert de
// référence : en.json doit contenir les mêmes clés.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof fr };
  }
}
