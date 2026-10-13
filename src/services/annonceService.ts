const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = `${API_ORIGIN}/api/v1`;

// Le backend stocke les photos sous forme de chemins relatifs ("/uploads/x.jpg"),
// servis par SON serveur. Utilisés tels quels, ils seraient résolus par rapport
// à l'app (ex: le serveur Expo sur :8081) -> 404. Même règle que
// toAbsoluteUrl() dans frontend/src/components/AnnonceCard.tsx.
export function toAbsoluteImageUrl(path: string): string {
  if (!path || /^(https?:|data:|blob:|file:)/.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

// GET /annonces et GET /annonces/:id n'exigent AUCUN token côté backend
// (voir annonce.routes.ts) -- normal, n'importe qui doit pouvoir parcourir
// les annonces sans être connecté. Contrairement à authService.ts, pas de
// header Authorization ici.

// Forme exacte renvoyée par Prisma (include: { proprietaire: true }) --
// voir le modèle `Annonce` dans LAMAISON-BACKEND/prisma/schema.prisma.
export type AnnonceApi = {
  id: number;
  bn_reference: string | null;
  titre: string;
  description: string;
  prix: number;
  ville: string;
  quartier: string | null;
  surface: number | null;
  chambres: number | null;
  douches: number | null;
  vues: number;
  type: string | null;
  projet: 'achat' | 'location' | null; // minuscule côté backend !
  createdAt: string;
  images: string[]; // URLs distantes, pas des assets locaux
  negotiable: boolean | null;
  proprietaireId: number;
  proprietaire?: {
    id: number;
    clerkId: string;
    firstname: string;
    role: 'PROSPECT' | 'AGENT' | 'ADMIN';
    phone: string | null;
    avatar: string | null;
  };
};

export type AnnonceFilters = {
  search?: string;
  ville?: string;
  quartier?: string;
  prixMin?: number;
  prixMax?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  chambres?: number;
  douches?: number;
  type?: string;
  projet?: 'achat' | 'location';
};

export async function getAnnonces(filters: AnnonceFilters = {}): Promise<AnnonceApi[]> {
  // On ne construit l'URL qu'avec les filtres réellement fournis -- le
  // backend ignore de toute façon un paramètre vide, mais autant ne pas
  // polluer l'URL avec `?prixMin=&prixMax=` etc.
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const query = params.toString();

  const response = await fetch(`${API_BASE}/annonces${query ? `?${query}` : ''}`);
  if (!response.ok) {
    throw new Error(`Erreur lors du chargement des annonces (${response.status})`);
  }
  const json = await response.json();
  if (json?.success !== true) {
    throw new Error(json?.error?.message ?? json?.message ?? 'Réponse invalide du serveur');
  }
  return json?.data ?? [];
}

export async function getAnnonceById(id: string | number): Promise<AnnonceApi | null> {
  const response = await fetch(`${API_BASE}/annonces/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Erreur lors du chargement de l'annonce (${response.status})`);
  }
  const json = await response.json();
  if (json?.success !== true) {
    throw new Error(json?.error?.message ?? json?.message ?? 'Réponse invalide du serveur');
  }
  return json?.data ?? null;
}