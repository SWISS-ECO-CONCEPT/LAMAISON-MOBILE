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
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (isSameDay(date, yesterday(now))) {
    return 'Hier';
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// Séparateur de jour pour un fil de discussion (remplace l'ancien
// "AUJOURD'HUI" statique, qui restait affiché même sur de vieux messages).
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) return "AUJOURD'HUI";
  if (isSameDay(date, yesterday(now))) return 'HIER';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

export function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
