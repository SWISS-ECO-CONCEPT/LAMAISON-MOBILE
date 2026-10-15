import { useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';

type GetToken = ReturnType<typeof useAuth>['getToken'];

// Le useAuth de @clerk/clerk-expo recrée `getToken` à CHAQUE rendu (pas de
// useCallback, voir node_modules/@clerk/clerk-expo/dist/hooks/useAuth.js).
// Placé dans les dépendances d'un useCallback/useEffect, il relance l'effet
// après chaque rendu : boucle de chargement infinie, écrans qui clignotent
// (spinner <-> données) et requêtes envoyées en continu au backend.
//
// Ce hook renvoie une fonction à identité stable qui appelle toujours la
// version courante de `getToken`. À utiliser à la place de
// `useAuth().getToken` dès que la fonction sert dans des dépendances.
export function useStableGetToken(): GetToken {
  const { getToken } = useAuth();
  const latestGetTokenRef = useRef(getToken);
  latestGetTokenRef.current = getToken;

  return useCallback<GetToken>((options) => latestGetTokenRef.current(options), []);
}
