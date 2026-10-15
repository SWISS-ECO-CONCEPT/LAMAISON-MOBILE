const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = `${API_ORIGIN}/api/v1`;

// POST /images (multipart, champ "file") -- stockage local sur le serveur
// (multer, voir image.routes.ts), 5 Mo max, images uniquement. Renvoie un
// chemin relatif ("/uploads/xxx.jpg"), pas une URL absolue -- même
// convention que les images d'annonce (toAbsoluteImageUrl dans
// annonceService.ts).
export async function uploadImage(uri: string, token: string): Promise<string> {
  const filename = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  const extensionMatch = /\.(\w+)$/.exec(filename);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
  const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  // RN accepte cette forme {uri, name, type} pour un champ fichier --
  // ce n'est pas un vrai objet File/Blob, mais c'est ce que fetch/FormData
  // attend sur React Native (contrairement au web).
  formData.append('file', { uri, name: filename, type: mimeType } as unknown as Blob);

  const response = await fetch(`${API_BASE}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Erreur lors de l'envoi de la photo (${response.status})`;
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
  return json?.data?.url;
}
