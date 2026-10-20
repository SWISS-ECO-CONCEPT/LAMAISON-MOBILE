import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSignIn } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { clerkErrorMessage } from '../../src/lib/clerkErrors';
import { useCompleteSignIn } from '../../src/lib/useCompleteSignIn';

export default function LoginScreen() {
  // `signIn` est l'objet Clerk qui pilote le processus de connexion.
  // `isSignInLoaded` est faux tant que le SDK Clerk n'a pas fini de
  // s'initialiser — tenter une connexion avant ça produirait une erreur
  // confuse, d'où la garde plus bas dans handleLogin.
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  // Tout ce qui suit l'acceptation par Clerk (session, synchro du profil
  // avec la base, redirection selon le rôle) est partagé avec la
  // réinitialisation du mot de passe : voir src/lib/useCompleteSignIn.ts.
  const completeSignIn = useCompleteSignIn();
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    // Rien à faire si Clerk n'est pas prêt ou si les fonctions attendues
    // n'existent pas encore (même défense que côté web).
    if (!isSignInLoaded || !signIn) return;
    setErrorMessage('');
    setLoading(true);
    try {
      // Étape 1 : Clerk vérifie lui-même l'email + mot de passe. Notre code
      // ne voit et ne stocke jamais le mot de passe en clair.
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        // Étapes 2 à 5 (session, synchro base, redirection) : fonction partagée.
        await completeSignIn(result.createdSessionId);
      } else {
        // Cas rare : Clerk demande une étape supplémentaire (2FA, etc.)
        // qu'on ne gère pas encore dans cet écran.
        setErrorMessage(t('auth.login.incomplete'));
      }
    } catch (err) {
      // Clerk répond en anglais : clerkErrorMessage traduit l'erreur à partir
      // de son code (voir src/lib/clerkErrors.ts), sinon message générique.
      setErrorMessage(clerkErrorMessage(err, 'auth.login.genericError'));
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

        <Text style={styles.title}>{t('auth.login.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('visitRequest.email')}</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="mail-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder={t('visitRequest.emailPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.password')}</Text>
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
          {/* Avant : simple texte sans action. Ouvre maintenant le parcours de
              réinitialisation (forgot-password -> reset-password). */}
          <Link href="/forgot-password" asChild>
            <Pressable>
              <Text style={styles.link}>{t('auth.login.forgotPassword')}</Text>
            </Pressable>
          </Link>
        </View>

        <Pressable
          style={[styles.primaryButton, (loading || !isSignInLoaded) && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={loading || !isSignInLoaded}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>{t('auth.login.submit')}</Text>
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
          <Text style={styles.footerText}>{t('auth.login.newHere')}</Text>
          <Link href="/signup" asChild>
            <Pressable>
              <Text style={styles.footerLink}>{t('auth.createAccount')}</Text>
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