import { isClerkAPIResponseError } from '@clerk/clerk-expo';
import i18n from '../i18n';
import type { TranslationKey } from '../i18n';

// Pourquoi ce fichier ?
// Clerk (le service de connexion) renvoie ses messages d'erreur en ANGLAIS,
// quelle que soit la langue de l'app. Chaque erreur porte aussi un `code`
// stable (ex. "form_password_incorrect") : on traduit À PARTIR DU CODE,
// jamais à partir du texte anglais, qui peut changer d'une version à l'autre.
//
// Les codes ci-dessous ont été vérifiés dans la liste officielle de Clerk
// (paquet @clerk/localizations 3.37.9, champ `unstable__errors`). On ne
// dépend PAS de ce paquet : il n'est pas déclaré dans package.json (il
// arrive en dépendance indirecte) et pourrait disparaître à une mise à jour.
//
// Certaines clés combinent le code ET le champ concerné, séparés par "__" :
// le serveur renvoie `form_identifier_exists` avec meta.paramName =
// "email_address", ce qui donne la clé "form_identifier_exists__email_address".
const CLERK_ERROR_KEYS: Record<string, TranslationKey> = {
  form_password_incorrect: 'auth.clerkErrors.passwordIncorrect',
  form_identifier_not_found: 'auth.clerkErrors.accountNotFound',
  form_param_format_invalid__email_address: 'auth.clerkErrors.emailInvalid',
  form_identifier_exists__email_address: 'auth.clerkErrors.emailTaken',
  form_password_pwned: 'auth.clerkErrors.passwordPwned',
  form_password_length_too_short: 'auth.clerkErrors.passwordTooShort',
  form_password_not_strong_enough: 'auth.clerkErrors.passwordTooWeak',
  form_code_incorrect: 'auth.clerkErrors.codeIncorrect',
  form_param_nil: 'auth.clerkErrors.fieldRequired',
};

/**
 * Transforme une erreur levée par Clerk (signIn.create, signUp.create...)
 * en message lisible, dans la langue de l'app.
 *
 * @param err          l'erreur attrapée dans le `catch`
 * @param fallbackKey  message à afficher si on ne reconnaît pas l'erreur
 */
export function clerkErrorMessage(err: unknown, fallbackKey: TranslationKey): string {
  // 1. Pas une erreur Clerk (réseau coupé, bug...) -> message générique.
  if (!isClerkAPIResponseError(err)) return i18n.t(fallbackKey);

  const first = err.errors[0];
  if (!first) return i18n.t(fallbackKey);

  // 2. On cherche d'abord la version précise (code + champ), puis le code seul.
  const preciseKey = first.meta?.paramName ? `${first.code}__${first.meta.paramName}` : null;
  const translationKey = (preciseKey && CLERK_ERROR_KEYS[preciseKey]) || CLERK_ERROR_KEYS[first.code];
  if (translationKey) return i18n.t(translationKey);

  // 3. Code inconnu : en anglais, le texte de Clerk convient tel quel ; en
  //    français, on préfère un message générique à une phrase en anglais.
  if (i18n.resolvedLanguage === 'en' && first.longMessage) return first.longMessage;
  return i18n.t(fallbackKey);
}
