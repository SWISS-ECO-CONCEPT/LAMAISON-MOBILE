import { useState } from 'react';
import { View, Text, TextInput, Pressable, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSignIn } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../src/config/theme';
import { clerkErrorMessage } from '../../src/lib/clerkErrors';
import { authFormStyles as styles } from '../../src/screens/auth/authFormStyles';

// Écran 1/2 du parcours « mot de passe oublié » (même logique que le web,
// frontend/src/pages/Auth/ForgotPassword.tsx) :
//   1. l'utilisateur saisit son e-mail ;
//   2. Clerk lui envoie un code à 6 chiffres (stratégie reset_password_email_code) ;
//   3. on passe à reset-password.tsx avec l'e-mail en paramètre.
// Clerk gère seul l'envoi de l'e-mail et la validité du code : notre code ne
// voit jamais le mot de passe et ne stocke rien.
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signIn, isLoaded } = useSignIn();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sendCode = async () => {
    if (!isLoaded || !signIn) return;
    const trimmedEmail = email.trim();
    // Vérification minimale côté app (champ vide) ; le FORMAT de l'e-mail est
    // vérifié par Clerk, dont l'erreur est traduite par clerkErrorMessage.
    if (!trimmedEmail) {
      setErrorMessage(t('auth.forgot.emailRequired'));
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      // Démarre une tentative de connexion « par réinitialisation » : Clerk
      // envoie le code. La tentative est gardée par Clerk et retrouvée telle
      // quelle sur l'écran suivant via useSignIn().
      await signIn.create({ strategy: 'reset_password_email_code', identifier: trimmedEmail });
      router.push({ pathname: '/reset-password', params: { email: trimmedEmail } });
    } catch (err) {
      setErrorMessage(clerkErrorMessage(err, 'auth.forgot.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('auth.forgot.headerTitle')}</Text>
        </View>

        <Text style={styles.title}>{t('auth.forgot.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.forgot.subtitle')}</Text>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

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
              autoComplete="email"
              keyboardType="email-address"
              onSubmitEditing={sendCode}
            />
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, (loading || !isLoaded) && styles.submitButtonDisabled]}
          onPress={sendCode}
          disabled={loading || !isLoaded}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitButtonText}>{t('auth.forgot.submit')}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
