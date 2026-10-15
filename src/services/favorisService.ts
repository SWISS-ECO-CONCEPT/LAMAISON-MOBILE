import type { AnnonceApi } from './annonceService';

const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = `${API_ORIGIN}/api/v1`;

// Les 3 routes /favoris exigent requireAuth() côté backend (voir
// favoris.routes.ts) -- contrairement à GET /annonces, impossible de lire
// ou modifier des favoris sans prouver son identité via le token Clerk.

// GET /favoris/:clerkId fait `include: { annonce: true }` côté service
// (favoris.service.ts), mais POST /favoris/:clerkId ne le fait PAS --
// `annonce` est donc optionnel ici, pas par prudence mais parce que le
// contrat réel du backend est différent selon l'endpoint.
export type FavoriApi = {
  id: number;
  annonceId: number;
  userId: number;
  createdAt: string;
  annonce?: AnnonceApi;
};

export async function getUserFavoris(clerkId: string, token: string): Promise<FavoriApi[]> {
  const response = await fetch(`${API_BASE}/favoris/${clerkId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors du chargement des favoris (${response.status})`;
    try {
      const errJson = await response.json();
      errorMsg = errJson?.error?.message ?? errJson?.message ?? errorMsg;
    } catch {
      /* reponse non-JSON, on garde le message par defaut */
    }
    throw new Error(errorMsg);
  }

  const json = await response.json();
  if (json?.success !== true) {
    throw new Error(json?.error?.message ?? json?.message ?? 'Réponse invalide du serveur');
  }
  return json?.data ?? [];
}

export async function addFavori(clerkId: string, annonceId: number, token: string): Promise<FavoriApi> {
  const response = await fetch(`${API_BASE}/favoris/${clerkId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ annonceId }),
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors de l'ajout du favori (${response.status})`;
    try {
      const errJson = await response.json();
      errorMsg = errJson?.error?.message ?? errJson?.message ?? errorMsg;
    } catch {
      /* fallback */
    }
    throw new Error(errorMsg);
  }

  const json = await response.json();
  if (json?.success !== true) {
    throw new Error(json?.error?.message ?? json?.message ?? 'Réponse invalide du serveur');
  }
  return json?.data;
}

export async function removeFavori(clerkId: string, annonceId: number, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/favoris/${annonceId}/${clerkId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors de la suppression du favori (${response.status})`;
    try {
      const errJson = await response.json();
      errorMsg = errJson?.error?.message ?? errJson?.message ?? errorMsg;
    } catch {
      /* fallback */
    }
    throw new Error(errorMsg);
  }

  const json = await response.json();
  if (json?.success !== true) {
    throw new Error(json?.error?.message ?? json?.message ?? 'Réponse invalide du serveur');
  }
}
