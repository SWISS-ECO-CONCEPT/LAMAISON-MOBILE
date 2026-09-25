import { Stack } from 'expo-router';

// Un _layout.tsx à l'intérieur d'un groupe (ici (auth)) définit comment LES
// ÉCRANS DE CE GROUPE s'enchaînent entre eux — indépendamment du reste de l'app.
// headerShown: false partout : nos maquettes ont leurs propres en-têtes dessinés
// à la main (logo, flèche retour...), pas besoin de la barre de titre système.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}