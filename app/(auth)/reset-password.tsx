import { useState } from 'react';
import { View, Text, TextInput, Pressable, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import { useSignIn } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../src/config/theme';
import { clerkErrorMessage } from '../../src/lib/clerkErrors';
import { useCompleteSignIn } from '../../src/lib/useCompleteSignIn';
import { authFormStyles as styles } from '../../src/screens/auth/authFormStyles';

// Règle de Clerk (message officiel : « at least 8 characters long »). On la
// vérifie AVANT d'appeler Clerk pour donner un retour immédiat. Le web
// (ResetPassword.tsx) demandait 6 : un mot de passe de 6-7 caractères y
// passait le formulaire puis était refusé par Clerk.
const MIN_PASSWORD_LENGTH = 8;
const CODE_LENGTH = 6;

// Écran 2/2 du parcours « mot de passe oublié ».
//
// Déroulé (API Clerk vérifiée dans les types installés, @clerk/shared) :
//   1. attemptFirstFactor({ strategy: 'reset_password_email_code', code })
//      -> si le code est bon, statut 'needs_new_password' ;
//   2. resetPassword({ password, signOutOfOtherSessions: true })
//      -> statut 'complete' : l'utilisateur est connecté avec le nouveau mot
//         de passe, et ses AUTRES appareils sont déconnectés (si le compte
//         avait été piraté, l'intrus perd l'accès) ;
//   3. completeSignIn() : synchro du profil avec la base + redirection.
// Le web fait 1 et 2 en un seul appel, ce qui ne permet pas l'option
// signOutOfOtherSessions.
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { signIn, isLoaded } = useSignIn();
  const completeSignIn = useCompleteSignIn();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Le code a-t-il déjà été accepté par Clerk ? Si l'étape 2 échoue (mot de
  // passe trop faible...), l'utilisateur corrige son mot de passe et
  // réessaie : il ne faut PAS renvoyer un code déjà consommé (Clerk le
  // refuserait). On repart donc de l'étape 2 directement.
  const [codeVerified, setCodeVerified] = useState(signIn?.status === 'needs_new_password');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const resetPassword = async () => {
    if (!isLoaded || !signIn) return;

    // Vérifications locales : retour immédiat, sans aller-retour réseau.
    if (!codeVerified && code.trim().length !== CODE_LENGTH) {
      setErrorMessage(t('auth.verify.codeLength'));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(t('auth.clerkErrors.passwordTooShort'));
      return;
    }

    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);
    try {
      // Étape 1 : vérifier le code (sauf s'il l'a déjà été).
      if (!codeVerified) {
        const attempt = await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code: code.trim() });
        if (attempt.status !== 'needs_new_password') {
          setErrorMessage(t('auth.reset.genericError'));
          return;
        }
        setCodeVerified(true);
      }

      // Étape 2 : définir le nouveau mot de passe + déconnecter les autres appareils.
      const result = await signIn.resetPassword({ password, signOutOfOtherSessions: true });

      if (result.status === 'complete') {
        // Étape 3 : même fin que la connexion classique (voir useCompleteSignIn).
        await completeSignIn(result.createdSessionId);
      } else {
        // Ex. 'needs_second_factor' (double authentification) : non géré par l'app.
        setErrorMessage(t('auth.login.incomplete'));
      }
    } catch (err) {
      setErrorMessage(clerkErrorMessage(err, 'auth.reset.genericError'));
    } finally {
      setLoading(false);
    }
  };

  // Renvoyer un code = recommencer l'étape de l'écran 1 avec le même e-mail.
  const resendCode = async () => {
    if (!isLoaded || !signIn || !email) return;
    setErrorMessage('');
    setInfoMessage('');
    setResending(true);
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
      // Nouvelle tentative = nouveau code à vérifier.
      setCodeVerified(false);
      setCode('');
      setInfoMessage(t('auth.verify.resent'));
    } catch (err) {
      setErrorMessage(clerkErrorMessage(err, 'auth.verify.resendError'));
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('auth.reset.headerTitle')}</Text>
        </View>

        <Text style={styles.title}>{t('auth.reset.title')}</Text>
        {/* <Trans> : l'e-mail est en gras au milieu de la phrase (voir CLAUDE.md, i18n). */}
        <Text style={styles.subtitle}>
          <Trans
            i18nKey="auth.reset.subtitle"
            values={{ email: email || t('auth.verify.emailFallback') }}
            components={{ bold: <Text style={styles.emailHighlight} /> }}
          />
        </Text>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {infoMessage ? (
          <View style={styles.infoBanner}>
            <MaterialIcons name="check-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{infoMessage}</Text>
          </View>
        ) : null}

        {/* Champ code masqué une fois le code accepté : il ne sert plus. */}
        {!codeVerified && (
          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.verify.codeLabel')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="verified-user" size={20} color="#9ca3af" />
              <TextInput
                style={styles.codeInput}
                placeholder="123456"
                placeholderTextColor="#9ca3af"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH}
              />
            </View>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.reset.newPassword')}</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              onSubmitEditing={resetPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.hint}>{t('auth.reset.passwordHint')}</Text>
        </View>

        <Text style={styles.notice}>{t('auth.reset.otherDevicesNotice')}</Text>

        <Pressable
          style={[styles.submitButton, (loading || !isLoaded) && styles.submitButtonDisabled]}
          onPress={resetPassword}
          disabled={loading || !isLoaded}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitButtonText}>{t('auth.reset.submit')}</Text>}
        </Pressable>

        {/* Renvoyer le code n'a de sens que tant que le code n'est pas accepté,
            et seulement si on connaît l'e-mail (paramètre de l'écran 1). */}
        {!codeVerified && email ? (
          <Pressable style={styles.secondaryButton} onPress={resendCode} disabled={resending || loading}>
            {resending ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.secondaryButtonText}>{t('auth.verify.resend')}</Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
