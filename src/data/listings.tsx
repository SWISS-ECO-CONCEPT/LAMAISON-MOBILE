import i18n from '../i18n';
import { toAbsoluteImageUrl, type AnnonceApi } from '../services/annonceService';

export type ListingType = 'ACHAT' | 'LOCATION';

// Type aligné sur ce qui existe VRAIMENT côté backend. Par rapport à
// l'ancienne version mock, on perd : `parkings` (aucun champ équivalent
// dans le modèle Annonce), `fullAddress` (le backend n'a que ville +
// quartier, pas d'adresse précise), `agent.verified/rating/reviewsCount`
// (rien de tout ça n'existe sur le modèle User), `nextSlot` (demanderait
// une requête calculée sur RendezVous, aucun endpoint pour ça aujourd'hui).
// On ne les remplace pas par des valeurs inventées -- on les retire, et
// les écrans qui les affichaient sont adaptés en conséquence.
export type Listing = {
  id: string;
  images: { uri: string }[];
  type: ListingType;
  price: string;
  title: string;
  location: string;
  reference: string;
  beds: number;
  showers: number;
  area: number;
  // Date brute : le texte (« publiée il y a 3 jours ») est produit à
  // l'affichage par formatPublishedAgo(), dans la langue courante. Un texte
  // calculé ici resterait figé dans la langue du moment du chargement.
  createdAt: string;
  description: string;
  negotiable: boolean;
  ownerId: number;
  ownerName: string | null;
  ownerIsAgent: boolean;
  ownerPhone: string | null;
};

// "1 234 567" -- espace simple plutôt que `toLocaleString('fr-FR')`, qui
// insère parfois une espace fine insécable (U+202F) que certains rendus
// RN affichent mal selon la police/plateforme.
function formatPrice(prix: number): string {
  const rounded = Math.round(prix);
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

// Appelé au rendu (composant qui utilise useTranslation, donc re-rendu au
// changement de langue).
export function formatPublishedAgo(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
  if (days <= 0) return i18n.t('listing.publishedToday');
  if (days === 1) return i18n.t('listing.publishedYesterday');
  return i18n.t('listing.publishedDaysAgo', { count: days });
}

export function mapAnnonceToListing(a: AnnonceApi): Listing {
  const isLocation = a.projet === 'location';
  return {
    id: String(a.id),
    images: (Array.isArray(a.images) ? a.images : []).map((path) => ({ uri: toAbsoluteImageUrl(path) })),
    type: isLocation ? 'LOCATION' : 'ACHAT',
    price: formatPrice(a.prix),
    title: a.titre,
    location: a.quartier ? `${a.quartier}, ${a.ville}` : a.ville,
    reference: a.bn_reference ?? `BN-${a.id}`,
    beds: a.chambres ?? 0,
    showers: a.douches ?? 0,
    area: a.surface ?? 0,
    createdAt: a.createdAt,
    description: a.description,
    negotiable: !!a.negotiable,
    ownerId: a.proprietaireId,
    ownerName: a.proprietaire?.firstname ?? null,
    ownerIsAgent: a.proprietaire?.role === 'AGENT',
    ownerPhone: a.proprietaire?.phone ?? null,
  };
}