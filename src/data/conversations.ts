// Données de démonstration — seront remplacées par l'appel à l'API messagerie
// (GET /conversations, WebSocket temps réel) une fois le service branché.
export type ChatMessage =
  | { id: string; type: 'text'; sender: 'them' | 'me'; text: string; time: string; read?: boolean }
  | {
      id: string;
      type: 'slot-proposal';
      sender: 'them';
      time: string;
      slotLabel: string;
      listingSummary: string;
    };

export type Conversation = {
  id: string;
  name: string;
  online: boolean;
  subtitle: string;
  lastMessage: string;
  timeLabel: string;
  unreadCount?: number;
  read?: boolean;
  dimmed?: boolean;
  listing?: { id: string; title: string; reference: string; price: string };
  messages: ChatMessage[];
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'CONV-1',
    name: 'Serge Mbappé',
    online: true,
    subtitle: 'Villa 4 ch. · Réf. BN-2419',
    lastMessage: 'Je vous propose jeudi 24 à 10 h.',
    timeLabel: '09 h 31',
    unreadCount: 2,
    listing: { id: 'BN-2419', title: 'Villa moderne 4 ch. · Réf. BN-2419', reference: 'BN-2419', price: '85 000 000 FCFA' },
    messages: [
      {
        id: 'M1',
        type: 'text',
        sender: 'them',
        text: 'Bonjour Arlette, la villa de Bonapriso est toujours disponible. Souhaitez-vous la visiter cette semaine ?',
        time: '09 h 12',
      },
      {
        id: 'M2',
        type: 'text',
        sender: 'me',
        text: 'Bonjour Serge, oui. J\'avais demandé mardi 22 à 09 h.',
        time: '09 h 26',
        read: true,
      },
      {
        id: 'M3',
        type: 'slot-proposal',
        sender: 'them',
        time: '09 h 31',
        slotLabel: 'Jeu. 24 sept · 10 h 00 – 10 h 45',
        listingSummary: 'Villa moderne 4 ch., Bonapriso · Réf. BN-2419',
      },
    ],
  },
  {
    id: 'CONV-2',
    name: 'Nadège Fotso',
    online: false,
    subtitle: 'Appartement 2 p. · Réf. BN-2388',
    lastMessage: 'Le loyer inclut-il les charges ?',
    timeLabel: 'hier',
    read: true,
    listing: { id: 'BN-2388', title: 'Appartement 2 pièces · Réf. BN-2388', reference: 'BN-2388', price: '350 000 FCFA/mois' },
    messages: [
      { id: 'M1', type: 'text', sender: 'them', text: 'Le loyer inclut-il les charges ?', time: 'hier' },
    ],
  },
  {
    id: 'CONV-3',
    name: 'Désiré Ekambi',
    online: false,
    subtitle: 'Terrain 500 m² · Réf. BN-2402',
    lastMessage: "Le titre foncier est disponible, je vous l'envoie.",
    timeLabel: 'lun.',
    read: true,
    messages: [
      { id: 'M1', type: 'text', sender: 'them', text: "Le titre foncier est disponible, je vous l'envoie.", time: 'lun.' },
    ],
  },
  {
    id: 'CONV-4',
    name: 'Épiphanie Tchoumi',
    online: false,
    subtitle: 'Studio meublé · Denver',
    lastMessage: 'Merci pour la visite, je reviens vers vous.',
    timeLabel: '12 sept',
    dimmed: true,
    messages: [
      { id: 'M1', type: 'text', sender: 'them', text: 'Merci pour la visite, je reviens vers vous.', time: '12 sept' },
    ],
  },
];

export function getConversationById(id: string) {
  return CONVERSATIONS.find((c) => c.id === id);
}