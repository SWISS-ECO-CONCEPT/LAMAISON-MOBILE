import type { AnnonceApi } from './annonceService';

const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = `${API_ORIGIN}/api/v1`;

// Le modèle RendezVous (voir prisma/schema.prisma) stocke nom/prenom/email/
// telephone comme de simples chaînes saisies sur le formulaire -- ce ne sont
// PAS des champs du modèle User (qui n'a que firstname/phone). On ne peut
// donc pas les déduire du compte connecté, il faut vraiment les demander.
export type CreateRdvPayload = {
  annonceId: number;
  date: string; // ISO -- converti en Date côté backend (new Date(proposedDate) etc. ailleurs dans rdv.controller.ts)
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
};

export type RdvApi = {
  id: number;
  date: string;
  proposedDate: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
  status: 'EN_ATTENTE' | 'PROPOSE' | 'ACCEPTE' | 'REFUSE' | 'ANNULE';
  createdAt: string;
  prospectId: number;
  annonceId: number;
  // Présents sur GET /rdvs et GET /rdvs/:id (include prospect + annonce.proprietaire),
  // absents sur la réponse de POST /rdvs (voir rdv.service.ts createRdv, pas d'include).
  prospect?: { id: number; clerkId: string; firstname: string; role: string; phone: string | null };
  annonce?: AnnonceApi;
};

async function request<T>(path: string, token: string, init?: RequestInit, errorPrefix = 'Erreur'): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let errorMsg = `${errorPrefix} (${response.status})`;
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
  return json?.data;
}

// POST /rdvs n'attend PAS prospectClerkId/prospectId dans le payload --
// le backend les déduit du token (req.auth().userId), voir createRdv dans
// rdv.controller.ts. On envoie donc uniquement les champs du formulaire.
export function createRdv(payload: CreateRdvPayload, token: string): Promise<RdvApi> {
  return request('/rdvs', token, { method: 'POST', body: JSON.stringify(payload) }, 'Erreur lors de la demande de rendez-vous');
}

// NOTE sécurité repérée en passant : GET /rdvs ne vérifie pas que
// prospectClerkId/agentClerkId correspond à l'appelant (contrairement à
// /favoris ou /messages qui le font) -- n'importe quel compte connecté peut
// en théorie lire les RDV de n'importe qui d'autre en devinant son clerkId.
// Pas corrigé ici : c'est une règle d'autorisation côté backend, pas un
// bouton mort côté mobile -- signalé plutôt que patché en douce.
export function getRdvsByProspect(clerkId: string, token: string): Promise<RdvApi[]> {
  return request(`/rdvs?prospectClerkId=${encodeURIComponent(clerkId)}`, token, undefined, 'Erreur lors du chargement des rendez-vous');
}

export function getRdvsByAgent(clerkId: string, token: string): Promise<RdvApi[]> {
  return request(`/rdvs?agentClerkId=${encodeURIComponent(clerkId)}`, token, undefined, 'Erreur lors du chargement des demandes');
}

export function acceptRdv(id: number, token: string): Promise<RdvApi> {
  return request(`/rdvs/${id}/accept`, token, { method: 'POST' }, "Erreur lors de l'acceptation");
}

export function rejectRdv(id: number, token: string): Promise<RdvApi> {
  return request(`/rdvs/${id}/reject`, token, { method: 'POST' }, 'Erreur lors du refus');
}

// Le backend n'accepte que `proposedDate` sur cette route (voir
// rdvController.proposeRdv) -- pas de message personnalisé possible, le
// serveur génère lui-même le message automatique envoyé dans la messagerie.
export function proposeRdv(id: number, proposedDateIso: string, token: string): Promise<RdvApi> {
  return request(
    `/rdvs/${id}/propose`,
    token,
    { method: 'POST', body: JSON.stringify({ proposedDate: proposedDateIso }) },
    'Erreur lors de la proposition de créneau'
  );
}

export function acceptProposal(id: number, token: string): Promise<RdvApi> {
  return request(`/rdvs/${id}/proposal/accept`, token, { method: 'POST' }, "Erreur lors de la validation du créneau");
}

export function rejectProposal(id: number, token: string): Promise<RdvApi> {
  return request(`/rdvs/${id}/proposal/reject`, token, { method: 'POST' }, 'Erreur lors du refus du créneau');
}

export function cancelRdv(id: number, token: string): Promise<void> {
  return request(`/rdvs/${id}`, token, { method: 'DELETE' }, "Erreur lors de l'annulation");
}
