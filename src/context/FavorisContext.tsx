import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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

  // Le useAuth de @clerk/clerk-expo recrée `getToken` à CHAQUE rendu (pas de
  // useCallback, voir node_modules/@clerk/clerk-expo/dist/hooks/useAuth.js).
  // Le mettre dans les dépendances d'un hook relancerait l'effet de chargement
  // après chaque rendu -> boucle infinie ("Maximum update depth exceeded").
  // La ref donne toujours la version courante sans être une dépendance.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // Numéro du dernier chargement lancé. Une réponse n'est appliquée que si
  // elle correspond encore au dernier numéro : sinon elle est périmée
  // (déconnexion, changement de compte, retrait d'un favori entre-temps)
  // et l'appliquer réafficherait des données fausses -- voire celles d'un
  // autre compte.
  const latestLoadIdRef = useRef(0);
  // Annonces dont un ajout/retrait est en cours : bloque le double clic,
  // qui enverrait deux requêtes contradictoires ou en double.
  const pendingToggleIdsRef = useRef(new Set<number>());

  // Rend périmés les chargements en cours (leur réponse sera ignorée).
  const invalidatePendingLoads = useCallback(() => {
    latestLoadIdRef.current += 1;
    setLoading(false);
  }, []);

  // Les favoris sont attachés au compte connecté -- rien à charger (et
  // rien à garder affiché) tant qu'on ne sait pas qui est connecté. Vider
  // la liste à la déconnexion évite de montrer les favoris du précédent
  // utilisateur si un autre se connecte sur le même appareil.
  const loadFavoris = useCallback(async () => {
    const loadId = ++latestLoadIdRef.current;
    const isLatestLoad = () => loadId === latestLoadIdRef.current;

    if (!isSignedIn || !clerkId) {
      // Garder la même référence si c'est déjà vide : un nouveau `[]` forcerait
      // un re-rendu inutile.
      setFavoris((current) => (current.length === 0 ? current : []));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error('Session Clerk sans token');
      const data = await getUserFavoris(clerkId, token);
      if (isLatestLoad()) setFavoris(data);
    } catch (err) {
      if (isLatestLoad()) console.error('FavorisProvider: erreur chargement favoris', err);
    } finally {
      if (isLatestLoad()) setLoading(false);
    }
  }, [isSignedIn, clerkId]);

  // Changement de compte sans déconnexion intermédiaire : on vide tout de
  // suite plutôt que de laisser les favoris du compte précédent affichés
  // pendant le chargement de ceux du nouveau.
  useEffect(() => {
    setFavoris((current) => (current.length === 0 ? current : []));
  }, [clerkId]);

  useEffect(() => {
    loadFavoris();
  }, [loadFavoris]);

  const toggleFavorite = useCallback(
    async (annonceId: number) => {
      if (!isSignedIn || !clerkId) return;
      if (pendingToggleIdsRef.current.has(annonceId)) return;
      pendingToggleIdsRef.current.add(annonceId);

      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('Session Clerk sans token');
        const alreadyFavorite = favoris.some((f) => f.annonceId === annonceId);

        if (alreadyFavorite) {
          // Retirer ne demande pas de recharger : on connaît déjà l'id à
          // enlever, pas besoin des détails de l'annonce pour ça. Un
          // chargement lancé AVANT ce retrait réinsérerait l'annonce à son
          // retour : on le rend périmé.
          invalidatePendingLoads();
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
      } finally {
        pendingToggleIdsRef.current.delete(annonceId);
      }
    },
    [favoris, isSignedIn, clerkId, loadFavoris, invalidatePendingLoads]
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
