import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSignUp, useAuth, useUser } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { signUpUser } from '../../src/services/authService';

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; firstname?: string; phone?: string }>();
  const { signUp, isLoaded: isSignUpLoaded, setActive } = useSignUp();
  const { getToken, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const { updateUser } = useAuthContext();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const email = params.email || '';
  const firstname = params.firstname || '';
  const phone = params.phone || '';

  const handleVerify = async () => {
    if (!isSignUpLoaded || !signUp || !setActive) return;
    if (code.trim().length !== 6) {
      setErrorMessage('Le code doit contenir 6 chiffres.');
      return;
    }

    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);

    try {
      // Étape 1 : Valider le code à 6 chiffres auprès de Clerk
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });

      if (result.status === 'complete') {
        // Étape 2 : Activer la session Clerk
        await setActive({ session: result.createdSessionId });

        // Étape 3 : Synchroniser le profil avec la base de données backend
        try {
          await clerkUser?.reload();
          const token = await getToken();
          const clerkId = userId || clerkUser?.id || result.createdUserId;

          if (clerkId && token) {
            const sync = await signUpUser(
              clerkId,
              firstname || 'Utilisateur',
              'PROSPECT',
              phone,
              token
            );
            const dbUser = sync?.user ?? sync;
            updateUser({
              id: dbUser?.id,
              clerkId,
              firstname: dbUser?.firstname ?? firstname,
              email: dbUser?.email ?? email,
              role: dbUser?.role ?? 'PROSPECT',
              phone: dbUser?.phone ?? phone,
            });
          }
        } catch (syncErr: any) {
          console.warn('[VerifyScreen] Échec sync BDD local (le webhook prendra le relais):', syncErr);
        }

        // Étape 4 : Rediriger l'utilisateur vers l'accueil
        router.replace('/');
      } else {
        setErrorMessage('Code incorrect ou expiré. Veuillez réessayer.');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage || 'Erreur lors de la vérification du code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isSignUpLoaded || !signUp) return;
    setErrorMessage('');
    setInfoMessage('');
    setResending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setInfoMessage('Un nouveau code de vérification a été envoyé par e-mail.');
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage || 'Impossible de renvoyer le code. Veuillez réessayer.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Vérification</Text>
        </View>

        <Text style={styles.title}>Vérifiez votre e-mail</Text>
        <Text style={styles.subtitle}>
          Un code de confirmation à 6 chiffres a été envoyé à{' '}
          <Text style={styles.emailHighlight}>{email || 'votre adresse e-mail'}</Text>.
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

        <View style={styles.field}>
          <Text style={styles.label}>Code de vérification</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="verified-user" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor="#9ca3af"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Confirmer le code</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={resending || loading}
        >
          {resending ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.resendButtonText}>Vous n'avez pas reçu le code ? Renvoyer</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  emailHighlight: {
    fontWeight: '600',
    color: colors.text,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    color: colors.primaryDark,
    fontSize: 13,
    flex: 1,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 4,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});