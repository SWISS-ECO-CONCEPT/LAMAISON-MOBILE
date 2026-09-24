// Données de démonstration — seront remplacées par l'appel à l'API demandes
// de visite (GET /agent/demandes) une fois le service branché.
export type AgentRequestStatus = 'pending' | 'accepted';

export type AgentRequest = {
  id: string;
  status: AgentRequestStatus;
  clientName: string;
  clientType: string;
  receivedAgo: string;
  listingTitle: string;
  listingLocation: string;
  reference: string;
  price: string;
  requestedSlot: string;
  message?: string;
  acceptedDay?: string;
  acceptedDate?: string;
  acceptedMonth?: string;
  acceptedTime?: string;
};

export const AGENT_REQUESTS: AgentRequest[] = [
  {
    id: 'REQ-1',
    status: 'pending',
    clientName: 'Arlette Ngo Bakot',
    clientType: 'Particulier',
    receivedAgo: 'demande reçue il y a 2 h',
    listingTitle: 'Villa moderne 4 chambres',
    listingLocation: 'Bonapriso, Douala',
    reference: 'BN-2419',
    price: '85 000 000 FCFA',
    requestedSlot: 'mar. 22 sept · 09 h 00',
    message: 'Bonjour, je suis disponible mardi matin avant le travail.',
  },
  {
    id: 'REQ-2',
    status: 'pending',
    clientName: 'Désiré Ekambi',
    clientType: 'Particulier',
    receivedAgo: 'hier, 18 h 40',
    listingTitle: 'Terrain 500 m²',
    listingLocation: 'Odza, Yaoundé',
    reference: 'BN-2402',
    price: '25 000 000 FCFA',
    requestedSlot: 'lun. 28 sept · 08 h 30',
  },
  {
    id: 'REQ-3',
    status: 'accepted',
    clientName: 'Nadège Fotso',
    clientType: 'Particulier',
    receivedAgo: '',
    listingTitle: 'Appartement 2 p.',
    listingLocation: 'Bastos, Yaoundé',
    reference: 'BN-2388',
    price: '350 000 FCFA/mois',
    requestedSlot: '',
    acceptedDay: 'MER',
    acceptedDate: '23',
    acceptedMonth: 'SEPT',
    acceptedTime: '11 h 30',
  },
];