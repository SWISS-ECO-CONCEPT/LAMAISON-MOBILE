// Données de démonstration — seront remplacées par l'appel à l'API rendez-vous
// (GET /rendez-vous) une fois le service branché.
export type Appointment =
  | {
      id: string;
      status: 'proposed';
      listingTitle: string;
      reference: string;
      location: string;
      price: string;
      agentName: string;
      previousSlot: string;
      proposedSlot: string;
      agentMessage: string;
    }
  | {
      id: string;
      status: 'accepted' | 'pending';
      listingTitle: string;
      reference: string;
      location: string;
      price: string;
      day: string;
      date: string;
      month: string;
      time: string;
    };

export const APPOINTMENTS: Appointment[] = [
  {
    id: 'RDV-1',
    status: 'proposed',
    listingTitle: 'Villa moderne 4 chambres',
    reference: 'BN-2419',
    location: 'Bonapriso, Douala',
    price: '85 000 000 FCFA',
    agentName: 'Serge Mbappé',
    previousSlot: 'Mar. 22 · 09 h 00',
    proposedSlot: 'Jeu. 24 · 10 h 00',
    agentMessage:
      "« Bonjour Arlette, je suis en visite mardi matin. Jeudi 10 h vous convient-il ? »",
  },
  {
    id: 'RDV-2',
    status: 'accepted',
    listingTitle: 'Appartement 2 pièces',
    reference: 'BN-2388',
    location: 'Bastos, Yaoundé',
    price: '350 000 FCFA/mois',
    day: 'SAM',
    date: '19',
    month: 'SEPT',
    time: '15 h 30',
  },
  {
    id: 'RDV-3',
    status: 'pending',
    listingTitle: 'Terrain 500 m²',
    reference: 'BN-2402',
    location: 'Odza, Yaoundé',
    price: '25 000 000 FCFA',
    day: 'LUN',
    date: '28',
    month: 'SEPT',
    time: '08 h 30',
  },
];