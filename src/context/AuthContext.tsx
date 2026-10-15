import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { useStableGetToken } from '../lib/useStableGetToken';
import { signInUser } from '../services/authService';

// Ce que CE contexte connaît vient de la base de données (via authService),
// jamais directement de Clerk. Clerk sait "qui tu es" (identité) ; la BDD
// sait "ce que tu as le droit de faire" (rôle) et tes données métier
// (id interne, téléphone...). On ne mélange pas les deux sources.
type UserShape = {
  id?: number | string;
  clerkId?: string;
  firstname?: string;
  email?: string;
  role?: string;
  phone?: string;
} | null;

type AuthContextProps = {
  user: UserShape;
  updateUser: (data: UserShape) => void;
  clearUser: () => void;
};

const defaultValue: AuthContextProps = {
  user: null,
  updateUser: () => {},
  clearUser: () => {},
};

export const AuthContext = createContext<AuthContextProps>(defaultValue);

const STORAGE_KEY = 'lamaison_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserShape>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const { isLoaded: isClerkLoaded, isSignedIn, userId: clerkId } = useAuth();
  const getToken = useStableGetToken();

  // Au démarrage de l'app, on relit le dernier profil connu pour ne pas
  // afficher un écran vide pendant que le réseau répond — pas une source
  // de vérité, juste un affichage immédiat en attendant la vraie donnée.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .catch((err) => console.error('AuthProvider: erreur lecture storage', err))
      .finally(() => setStorageLoaded(true));
  }, []);

  // login.tsx/verify.tsx appellent signInUser() juste après une connexion
  // ACTIVE, mais si Clerk restaure une session déjà valide au lancement
  // (l'app rouvre, personne ne retape ses identifiants), ces écrans ne sont
  // jamais visités -- et si le cache local est vide, périmé, ou appartient
  // à un AUTRE compte (clerkId différent, appareil partagé), rien ne
  // repeuplait jamais `user`. Résultat concret : un agent dont la session
  // est juste restaurée ne voyait pas son nom. On resynchronise ici, dès
  // que Clerk confirme une connexion sans profil correspondant.
  useEffect(() => {
    if (!storageLoaded || !isClerkLoaded || !isSignedIn || !clerkId) return;
    if (user?.clerkId === clerkId) return;

    let active = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const result = await signInUser(clerkId, token);
        const synced = result?.user ?? result;
        if (active && synced?.id) {
          setUser({
            id: synced.id,
            clerkId,
            firstname: synced.firstname,
            role: synced.role,
            phone: synced.phone,
          });
        }
      } catch (err) {
        console.error('AuthProvider: erreur resynchronisation du profil', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [storageLoaded, isClerkLoaded, isSignedIn, clerkId, user?.clerkId, getToken]);

  const updateUser = (data: UserShape) => setUser(data);
  const clearUser = () => setUser(null);

  // Chaque changement de `user` est répercuté sur le disque, pour survivre
  // à la fermeture de l'app.
  useEffect(() => {
    (async () => {
      try {
        if (user) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('AuthProvider: erreur ecriture storage', err);
      }
    })();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, updateUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
export default AuthProvider;