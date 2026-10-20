import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/clerk-expo';
import { useAuthContext } from '../context/AuthContext';
import { signInUser } from '../services/authService';

// « Finaliser la connexion » : ce qui doit se passer une fois que Clerk a
// accepté l'utilisateur, QUEL QUE SOIT le chemin pour y arriver (connexion
// classique dans login.tsx, réinitialisation du mot de passe dans
// reset-password.tsx). Un seul endroit pour cette règle métier.
//
// Pourquoi useClerk() et pas useAuth().userId ?
// `userId` (comme `useUser().user`) est une valeur lue AU RENDU de l'écran :
// à ce moment-là, personne n'est connecté, donc elle vaut undefined. Une
// fonction async déjà lancée garde cette valeur figée : même après
// setActive(), elle verrait toujours undefined. L'ancien login.tsx tombait
// dans ce piège, et la synchro avec la base n'avait donc jamais lieu.
// `clerk` (renvoyé par useClerk) est l'objet Clerk VIVANT : après setActive,
// clerk.user et clerk.session désignent bien le nouvel utilisateur.
export function useCompleteSignIn() {
  const clerk = useClerk();
  const router = useRouter();
  const { updateUser } = useAuthContext();

  return useCallback(
    async (createdSessionId: string | null) => {
      // Étape 1 : la session devient active -> l'utilisateur est connecté
      // aux yeux de Clerk.
      await clerk.setActive({ session: createdSessionId });

      try {
        // Étape 2 : identifiant + jeton lus sur l'objet vivant (voir plus haut).
        const clerkId = clerk.user?.id;
        const token = await clerk.session?.getToken();
        if (!clerkId || !token) throw new Error('Session Clerk active mais sans utilisateur ni jeton.');

        // Étape 3 : le VRAI profil (rôle, id interne...) vient de NOTRE base,
        // pas de Clerk. Le backend vérifie que clerkId est celui du jeton.
        const sync = await signInUser(clerkId, token);
        const dbUser = sync?.user ?? sync;
        updateUser({
          id: dbUser?.id,
          clerkId,
          firstname: dbUser?.firstname,
          email: dbUser?.email,
          role: dbUser?.role,
          phone: dbUser?.phone,
        });

        // Étape 4 : redirection selon le rôle renvoyé par LA BASE.
        router.replace(dbUser?.role === 'AGENT' ? '/accueil' : '/');
      } catch (syncErr) {
        // La connexion Clerk a réussi ; seule la synchro avec la base a
        // échoué (réseau, backend arrêté...). On ne bloque pas l'utilisateur :
        // il est bien connecté, son profil détaillé sera rechargé plus tard.
        console.warn('Synchro du profil échouée après connexion', syncErr);
        router.replace('/');
      }
    },
    [clerk, router, updateUser]
  );
}
