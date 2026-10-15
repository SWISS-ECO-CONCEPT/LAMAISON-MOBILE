import AsyncStorage from '@react-native-async-storage/async-storage';

// Avant : RECENT_SEARCHES (src/data/search.ts) affichait 3 recherches
// fictives comme si elles venaient du compte connecté. Aucun endpoint
// backend n'a de sens pour ça (c'est un historique local, pas une donnée
// serveur) -- stocké sur l'appareil via AsyncStorage, même mécanisme que
// AuthContext pour le dernier profil connu.
const STORAGE_KEY = 'lamaison_recent_searches';
const MAX_ENTRIES = 6;

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('searchHistory: erreur lecture', err);
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches();
  try {
    const current = await getRecentSearches();
    // Dédoublonne (insensible à la casse) et remet l'entrée en tête plutôt
    // que de garder un vieux doublon plus bas dans la liste.
    const next = [trimmed, ...current.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(
      0,
      MAX_ENTRIES
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch (err) {
    console.error('searchHistory: erreur ecriture', err);
    return getRecentSearches();
  }
}
