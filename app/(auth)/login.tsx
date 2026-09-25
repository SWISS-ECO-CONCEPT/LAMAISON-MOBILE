import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignIn, useAuth, useUser } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { signInUser } from '../../src/services/authService';

export default function LoginScreen() {
  // `signIn` est l'objet Clerk qui pilote le processus de connexion.
  // `isSignInLoaded` est faux tant que le SDK Clerk n'a pas fini de
  // s'initialiser — tenter une connexion avant ça produirait une erreur
  // confuse, d'où la garde plus bas dans handleLogin.
  const { signIn, isLoaded: isSignInLoaded, setActive } = useSignIn();
  // `getToken` sert APRÈS la connexion, pour prouver au backend qu'on est
  // bien authentifié. `userId` est l'identifiant Clerk une fois connecté.
  const { getToken, userId } = useAuth();
  const { user: clerkUser } = useUser();
  // Le profil métier (rôle, id interne...) vit dans notre propre contexte,
  // pas dans Clerk — voir authService.ts pour pourquoi.
  const { updateUser } = useAuthContext();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    // Rien à faire si Clerk n'est pas prêt ou si les fonctions attendues
    // n'existent pas encore (même défense que côté web).
    if (!isSignInLoaded || !signIn || !setActive) return;
    setErrorMessage('');
    setLoading(true);
    try {
      // Étape 1 : Clerk vérifie lui-même l'email + mot de passe. Notre code
      // ne voit et ne stocke jamais le mot de passe en clair.
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        // Étape 2 : on active la session — à partir d'ici, l'utilisateur
        // est authentifié aux yeux de Clerk.
        await setActive({ session: result.createdSessionId });

        try {
          // Étape 3 : on récupère un token fraîchement émis pour PROUVER
          // au backend qu'on est bien ce compte Clerk (Authorization Bearer).
          const token = await getToken();
          const clerkId = userId || clerkUser?.id;
          if (clerkId && token) {
            // Étape 4 : on va chercher le VRAI profil (id interne, rôle...)
            // dans notre BDD — ce n'est pas Clerk qui décide du rôle.
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
            // Étape 5 : on redirige selon le rôle renvoyé par LA BASE,
            // jamais selon une valeur qu'on aurait pu manipuler côté client.
            router.replace(dbUser?.role === 'AGENT' ? '/accueil' : '/');
          } else {
            // Cas limite : la session Clerk est bien active mais on n'a pas
            // pu récupérer de token/id — on laisse quand même entrer plutôt
            // que de bloquer l'utilisateur, RootLayoutNav gérera la suite.
            router.replace('/');
          }
        } catch (syncErr) {
          // La connexion Clerk a réussi mais la synchro BDD a échoué
          // (réseau, backend down...) — on ne bloque pas l'utilisateur pour
          // autant : il est bien connecté, seul son profil détaillé manque
          // temporairement. On log pour pouvoir diagnostiquer plus tard.
          console.warn('Sync BDD echouee apres connexion', syncErr);
          router.replace('/');
        }
      } else {
        // Cas rare : Clerk demande une étape supplémentaire (2FA, etc.)
        // qu'on ne gère pas encore dans cet écran.
        setErrorMessage('Veuillez compléter la connexion.');
      }
    } catch (err: any) {
      // Message générique par défaut — on affiche le détail Clerk s'il y
      // en a un (ex: "mot de passe incorrect"), sinon un message neutre.
      setErrorMessage(
        err?.errors?.[0]?.longMessage || 'Identifiants incorrects. Vérifie ton e-mail et ton mot de passe.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Bon retour chez vous</Text>
        <Text style={styles.subtitle}>
          Connectez-vous pour suivre vos annonces, vos visites et vos échanges.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Adresse e-mail</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="mail-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="vous@exemple.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperFocused]}>
            <MaterialIcons name="lock-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.row}>
          <Text style={styles.link}>Mot de passe oublié ?</Text>
        </View>

        <Pressable
          style={[styles.primaryButton, (loading || !isSignInLoaded) && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={loading || !isSignInLoaded}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Se connecter</Text>
          )}
        </Pressable>

        {/* <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.divider} />
        </View>

        <Pressable style={styles.secondaryButton}>
          <MaterialIcons name="phone-iphone" size={20} color="#374151" />
          <Text style={styles.secondaryButtonText}>Continuer avec mon numéro</Text>
        </Pressable> */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nouveau sur LAMAISON ? </Text>
          <Link href="/signup" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Créer un compte</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  brand: { alignItems: 'center', marginVertical: 10 },
  logoImage: { width: 180, height: 60 },
  title: { marginTop: 40, fontSize: 30, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  field: { marginTop: 20, gap: 7 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputWrapperFocused: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  errorText: { marginTop: 12, fontSize: 13, fontWeight: '700', color: colors.danger },
  row: { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
  primaryButton: {
    marginTop: 26,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  dividerRow: { marginTop: 26, flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  secondaryButton: {
    marginTop: 18,
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  footer: { marginTop: 'auto', marginBottom: 20, flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: colors.textMuted },
  footerLink: { fontSize: 14, fontWeight: '800', color: colors.primary },
});