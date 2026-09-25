import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Clerk a besoin d'un endroit pour garder le jeton de session entre deux
// ouvertures de l'app (sinon il faudrait se reconnecter à chaque fois).
// expo-secure-store utilise le Keychain (iOS) / Keystore (Android) : un
// coffre-fort chiffré géré par le système d'exploitation, pas un simple
// fichier — normal vu que ce jeton donne accès au compte.
//
// Sur le web, ce mécanisme n'existe pas : Clerk gère alors lui-même la
// persistance (cookies), donc on lui passe `undefined` plutôt que de faire
// semblant d'avoir un cache qui ne marcherait pas.
export const tokenCache =
  Platform.OS !== 'web'
    ? {
        async getToken(key: string) {
          try {
            return await SecureStore.getItemAsync(key);
          } catch (err) {
            // On avale l'erreur : un cache indisponible ne doit pas planter
            // l'app, juste forcer une reconnexion.
            console.error('tokenCache getToken error', err);
            return null;
          }
        },
        async saveToken(key: string, value: string) {
          try {
            await SecureStore.setItemAsync(key, value);
          } catch (err) {
            console.error('tokenCache saveToken error', err);
          }
        },
      }
    : undefined;