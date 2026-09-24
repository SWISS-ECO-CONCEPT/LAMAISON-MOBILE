// Données de démonstration — seront remplacées par l'appel à l'API annonces
// filtrées par agent (GET /agent/annonces) une fois le service branché.
export type AgentListingStatus = 'online' | 'draft';

export type AgentListing = {
  id: string;
  reference: string;
  status: AgentListingStatus;
  title: string;
  location: string;
  price: string;
  views?: number;
  favorites?: number;
  appointments?: number;
  missingNote?: string;
};

export const AGENT_LISTINGS: AgentListing[] = [
  {
    id: 'BN-2419',
    reference: 'BN-2419',
    status: 'online',
    title: 'Villa moderne 4 ch. · Bonapriso',
    location: 'Bonapriso, Douala',
    price: '85 000 000 FCFA',
    views: 412,
    favorites: 28,
    appointments: 3,
  },
  {
    id: 'BN-2388',
    reference: 'BN-2388',
    status: 'online',
    title: 'Appartement 2 pièces · Bastos',
    location: 'Bastos, Yaoundé',
    price: '350 000 FCFA /mois',
    views: 296,
    favorites: 17,
  },
  {
    id: 'BN-2402',
    reference: 'BN-2402',
    status: 'draft',
    title: 'Terrain 500 m² · Réf. BN-2402',
    location: 'Odza, Yaoundé',
    price: '25 000 000 FCFA',
    missingNote: '3 photos manquantes',
  },
];