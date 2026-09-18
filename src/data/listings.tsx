import type { ImageSourcePropType } from 'react-native';

// Données de démonstration — seront remplacées par l'appel à l'API annonces
// (GET /annonces, GET /annonces/:id) une fois le service branché.
export type ListingType = 'ACHAT' | 'LOCATION';

export type Listing = {
  id: string;
  images: ImageSourcePropType[];
  type: ListingType;
  price: string;
  priceSuffix?: string;
  title: string;
  location: string;
  fullAddress: string;
  reference: string;
  beds: number;
  showers: number;
  area: number;
  parkings: number;
  favorite: boolean;
  publishedAgo: string;
  description: string;
  agent: {
    name: string;
    verified: boolean;
    role: string;
    rating: number;
    reviewsCount: number;
  };
  nextSlot: {
    label: string;
    value: string;
  };
};

export const LISTINGS: Listing[] = [
  {
    id: 'BN-2419',
    images: [
      require('../../assets/images/listings/bn-2419-1.jpg'),
      require('../../assets/images/listings/bn-2419-2.jpg'),
      require('../../assets/images/listings/bn-2419-3.jpg'),
    ],
    type: 'ACHAT',
    price: '85 000 000 FCFA',
    title: 'Villa moderne 4 chambres',
    location: 'Bonapriso, Douala',
    fullAddress: 'Rue Njo-Njo, Bonapriso, Douala',
    reference: 'BN-2419',
    beds: 4,
    showers: 3,
    area: 320,
    parkings: 2,
    favorite: true,
    publishedAgo: 'publiée il y a 3 jours',
    description:
      'Villa récente sur terrain clôturé de 600 m², séjour double, cuisine équipée, forage et groupe électrogène. Quartier résidentiel calme, à 5 minutes du boulevard de la Liberté.',
    agent: {
      name: 'Serge Mbappé',
      verified: true,
      role: 'Agent LAMAISON',
      rating: 4.8,
      reviewsCount: 37,
    },
    nextSlot: {
      label: 'Créneau le plus proche',
      value: 'Jeu. 24 sept · 10 h 00',
    },
  },
  {
    id: 'BN-2388',
    images: [
      require('../../assets/images/listings/bn-2388-1.jpg'),
      require('../../assets/images/listings/bn-2388-2.jpg'),
    ],
    type: 'LOCATION',
    price: '350 000 FCFA',
    priceSuffix: '/mois',
    title: 'Appartement 2 pièces',
    location: 'Bastos, Yaoundé',
    fullAddress: 'Avenue Kennedy, Bastos, Yaoundé',
    reference: 'BN-2388',
    beds: 2,
    showers: 1,
    area: 75,
    parkings: 1,
    favorite: false,
    publishedAgo: 'publiée il y a 6 jours',
    description:
      'Appartement lumineux au 2ᵉ étage, résidence sécurisée avec gardiennage, proche des écoles internationales et des commerces de Bastos.',
    agent: {
      name: 'Aïcha Belinga',
      verified: true,
      role: 'Agent LAMAISON',
      rating: 4.6,
      reviewsCount: 21,
    },
    nextSlot: {
      label: 'Créneau le plus proche',
      value: 'Sam. 26 sept · 15 h 00',
    },
  },
];

export function getListingById(id: string) {
  return LISTINGS.find((listing) => listing.id === id);
}