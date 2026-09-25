const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = `${API_ORIGIN}/api/v1`;

// Synchronise la connexion avec la BDD : on prouve qui on est avec le
// `token` Clerk (envoyé en Authorization Bearer), le backend le vérifie
// lui-même aupres de Clerk (middleware clerkMiddleware()) avant de
// répondre — on ne peut donc pas se faire passer pour quelqu'un d'autre
// juste en connaissant son clerkId.
export async function signInUser(clerkId: string, token: string) {
  const response = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ clerkId }),
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors de la synchronisation de la session (${response.status})`;
    try {
      const errJson = await response.json();
      errorMsg = errJson?.error?.message ?? errJson?.message ?? errorMsg;
    } catch {
      /* la reponse n'etait pas du JSON exploitable, on garde le message par defaut */
    }
    throw new Error(errorMsg);
  }

  const json = await response.json();
  if (json?.success !== true) {
    throw new Error(json?.error?.message ?? json?.message ?? 'Réponse invalide du serveur');
  }
  return json?.data ?? json;
}

// Cree la ligne utilisateur en BDD juste apres la verification d'email
// (voir verify.tsx). Le `role` envoye ici sert de valeur de depart : c'est
// bien la colonne `role` en base qui fera foi ensuite, pas ce qu'on envoie
// ici une seule fois a la creation.
export async function signUpUser(
  clerkId: string,
  firstname: string,
  role: 'PROSPECT' | 'AGENT',
  phone: string,
  token: string
) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ clerkId, firstname, role, phone }),
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors de la création du profil local (${response.status})`;
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
  return json?.data ?? json;
}

// Demande de changement de role (ex: PROSPECT -> AGENT). Le backend
// verifie que le `clerkId` envoye correspond bien au token fourni — sans
// ca, n'importe qui aurait pu se donner le role AGENT juste en connaissant
// l'identifiant Clerk de quelqu'un d'autre.
export async function updateUserRole(clerkId: string, newRole: string, token: string) {
  const response = await fetch(`${API_BASE}/auth/update-role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ clerkId, newRole }),
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors de la mise à jour du rôle (${response.status})`;
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
  return json?.data ?? json;
}