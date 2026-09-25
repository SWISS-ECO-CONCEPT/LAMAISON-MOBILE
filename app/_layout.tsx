import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import { tokenCache } from '../src/lib/tokenCache';
import { AuthProvider } from '../src/context/AuthContext';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Tant qu'il n'y a pas de vérification de session, l'app démarre sur
  // l'écran de connexion plutôt que sur les tabs.
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable. Add it to your .env file.'
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ClerkProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments(); // ex: ['(auth)', 'login'] ou ['(tabs)']
  const router = useRouter();

  // Le "videur" : s'execute a chaque changement d'ecran ou d'etat de
  // connexion. `segments[0]` dit dans quel groupe de routes on se trouve.
  useEffect(() => {
    if (!isLoaded) return; // Clerk n'a pas encore fini de lire la session sauvegardee — on ne decide rien tant qu'on ne sait pas.

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      // Connecte mais encore sur l'ecran de login/signup (arrive juste apres
      // une connexion reussie, ou ouverture d'app avec une session encore
      // valide) -> on l'envoie vers son vrai accueil selon son role.
      const role = (user?.unsafeMetadata as { role?: string } | undefined)?.role;
      router.replace(role === 'AGENT' ? '/accueil' : '/');
    } else if (!isSignedIn && !inAuthGroup) {
      // Pas connecte et en train d'essayer d'atteindre un ecran protege
      // (tape directement une URL, session expiree...) -> retour force au
      // login. C'est cette ligne, precisement, qui empeche d'acceder a
      // l'app sans etre authentifie.
      router.replace('/login');
    }
  }, [isSignedIn, isLoaded, segments, user]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="(auth)">
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="annonce/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="favoris" options={{ headerShown: false }} />
        <Stack.Screen name="(agent)" options={{ headerShown: false }} />
        <Stack.Screen name="publier-annonce" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}