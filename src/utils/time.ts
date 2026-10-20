import i18n from '../i18n';

// Locale de formatage des dates selon la langue de l'app. en-GB plutôt que
// en-US : même ordre jour/mois et heure sur 24 h que le français, cohérent
// avec la saisie JJ/MM/AAAA des formulaires. Lu à chaque appel : les écrans
// qui affichent ces dates utilisent useTranslation() et se re-rendent donc
// au changement de langue.
const DATE_LOCALES = { fr: 'fr-FR', en: 'en-GB' } as const;

function dateLocale(): string {
  return i18n.resolvedLanguage === 'en' ? DATE_LOCALES.en : DATE_LOCALES.fr;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function yesterday(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - 1);
  return d;
}

// Label court pour une ligne de liste (conversations, etc.) : l'heure si
// c'est aujourd'hui, "Hier", sinon une date courte.
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' });
  }
  if (isSameDay(date, yesterday(now))) {
    return i18n.t('time.yesterday');
  }
  return date.toLocaleDateString(dateLocale(), { day: '2-digit', month: '2-digit' });
}

// Séparateur de jour pour un fil de discussion (remplace l'ancien
// "AUJOURD'HUI" statique, qui restait affiché même sur de vieux messages).
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) return i18n.t('time.todayUpper');
  if (isSameDay(date, yesterday(now))) return i18n.t('time.yesterdayUpper');
  return date.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

export function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' });
}

// "15/03 à 14:30" -- utilisé partout où on affiche un créneau sans avoir
// besoin du badge jour/date/mois à 3 cases séparées.
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(dateLocale(), { day: '2-digit', month: '2-digit' });
  const time = d.toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' });
  return i18n.t('time.dateAtTime', { date, time });
}

// Badge jour/date/mois utilisé par les cartes de rendez-vous (prospect et agent).
export function formatDateBadge(iso: string): { day: string; date: string; month: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString(dateLocale(), { weekday: 'short' }).replace('.', '').toUpperCase(),
    date: d.toLocaleDateString(dateLocale(), { day: '2-digit' }),
    month: d.toLocaleDateString(dateLocale(), { month: 'short' }).replace('.', '').toUpperCase(),
  };
}
