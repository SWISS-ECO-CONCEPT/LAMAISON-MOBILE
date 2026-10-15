const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = `${API_ORIGIN}/api/v1`;

// Toutes les routes /messages exigent requireAuth() (voir message.routes.ts).
// Le modèle Message (prisma/schema.prisma) n'a NI statut de lecture, NI
// présence en ligne -- on ne les affiche donc nulle part cote mobile,
// plutot que d'inventer un "lu"/"en ligne" qui n'existe pas en base.
export type MessageApi = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
};

// Forme renvoyee par GET /messages (getConversationsForUser cote backend) --
// `id` ici est l'id BDD de L'AUTRE participant, pas un id de "conversation"
// a part : il n'existe pas de table Conversation, seulement des Message.
export type ConversationSummaryApi = {
  id: number;
  otherUser: {
    id: number;
    clerkId: string;
    firstname: string;
    avatar: string | null;
    role: 'PROSPECT' | 'AGENT' | 'ADMIN';
  };
  lastMessage: MessageApi;
};

export async function getUserConversations(token: string): Promise<ConversationSummaryApi[]> {
  const response = await fetch(`${API_BASE}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors du chargement des conversations (${response.status})`;
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
  return json?.data ?? [];
}

export async function getConversation(
  userId1: number,
  userId2: number,
  token: string
): Promise<MessageApi[]> {
  const response = await fetch(`${API_BASE}/messages/${userId1}/${userId2}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors du chargement de la conversation (${response.status})`;
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
  return json?.data ?? [];
}

export async function createMessage(
  senderId: number,
  receiverId: number,
  content: string,
  token: string
): Promise<MessageApi> {
  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ senderId, receiverId, content }),
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors de l'envoi du message (${response.status})`;
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
