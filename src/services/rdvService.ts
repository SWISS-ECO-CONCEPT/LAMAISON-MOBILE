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
};

// POST /rdvs n'attend PAS prospectClerkId/prospectId dans le payload --
// le backend les déduit du token (req.auth().userId), voir createRdv dans
// rdv.controller.ts. On envoie donc uniquement les champs du formulaire.
export async function createRdv(payload: CreateRdvPayload, token: string): Promise<RdvApi> {
  const response = await fetch(`${API_BASE}/rdvs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors de la demande de rendez-vous (${response.status})`;
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
