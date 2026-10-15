import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { getUserFavoris, addFavori, removeFavori, type FavoriApi } from '../services/favorisService';
import { mapAnnonceToListing, type Listing } from '../data/listings';

type FavorisContextProps = {
  favoriteIds: Set<number>;
  favoriteListings: Listing[];
  loading: boolean;
  isFavorite: (annonceId: number) => boolean;
  toggleFavorite: (annonceId: number) => Promise<void>;
};

const defaultValue: FavorisContextProps = {
  favoriteIds: new Set(),
  favoriteListings: [],
  loading: false,
  isFavorite: () => false,
  toggleFavorite: async () => {},
};

const FavorisContext = createContext<FavorisContextProps>(defaultValue);

export const FavorisProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, userId: clerkId, getToken } = useAuth();
  const [favoris, setFavoris] = useState<FavoriApi[]>([]);
  const [loading, setLoading] = useState(false);

  // Les favoris sont attachés au compte connecté -- rien à charger (et
  // rien à garder affiché) tant qu'on ne sait pas qui est connecté. Vider
  // la liste à la déconnexion évite de montrer les favoris du précédent
  // utilisateur si un autre se connecte sur le même appareil.
  const loadFavoris = useCallback(async () => {
    if (!isSignedIn || !clerkId) {
      setFavoris([]);
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getUserFavoris(clerkId, token);
      setFavoris(data);
    } catch (err) {
      console.error('FavorisProvider: erreur chargement favoris', err);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, clerkId, getToken]);

  useEffect(() => {
    loadFavoris();
  }, [loadFavoris]);

  const toggleFavorite = useCallback(
    async (annonceId: number) => {
      if (!isSignedIn || !clerkId) return;
      const token = await getToken();
      if (!token) return;
      const alreadyFavorite = favoris.some((f) => f.annonceId === annonceId);

      try {
        if (alreadyFavorite) {
          // Retirer ne demande pas de recharger : on connaît déjà l'id à
          // enlever, pas besoin des détails de l'annonce pour ça.
          setFavoris((current) => current.filter((f) => f.annonceId !== annonceId));
          await removeFavori(clerkId, annonceId, token);
        } else {
          await addFavori(clerkId, annonceId, token);
          // La réponse du POST n'inclut pas l'annonce liée (le backend ne
          // fait l'include que sur le GET, voir favorisService.ts) -- on
          // recharge depuis le GET pour que l'écran "Mes favoris" ait les
          // détails complets, plutôt que d'insérer une entrée partielle.
          await loadFavoris();
        }
      } catch (err) {
        console.error('FavorisProvider: erreur toggle favori', err);
        await loadFavoris(); // resynchronise avec le serveur si l'appel a échoué en cours de route
      }
    },
    [favoris, isSignedIn, clerkId, getToken, loadFavoris]
  );

  const favoriteIds = useMemo(() => new Set(favoris.map((f) => f.annonceId)), [favoris]);
  const favoriteListings = useMemo(
    () => favoris.filter((f) => f.annonce).map((f) => mapAnnonceToListing(f.annonce as NonNullable<typeof f.annonce>)),
    [favoris]
  );
  const isFavorite = useCallback((annonceId: number) => favoriteIds.has(annonceId), [favoriteIds]);

  return (
    <FavorisContext.Provider
      value={{ favoriteIds, favoriteListings, loading, isFavorite, toggleFavorite }}>
      {children}
    </FavorisContext.Provider>
  );
};

export const useFavoris = () => useContext(FavorisContext);
export default FavorisProvider;
