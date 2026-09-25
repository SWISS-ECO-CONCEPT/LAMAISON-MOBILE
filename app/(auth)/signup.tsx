import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();

  const [firstname, setFirstname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async () => {
    if (!isSignUpLoaded || !signUp) return;
    setErrorMessage('');
    setLoading(true);
    try {
      // Cet appel crée le compte côté Clerk (email + mot de passe) et range
      // firstname/role/phone dans unsafeMetadata — pratique pour les avoir
      // sous la main tout de suite après, mais rappel important : "unsafe"
      // veut dire modifiable côté client, donc ce n'est qu'un porte-valise
      // temporaire. La vraie donnée de référence sera celle qu'on écrit en
      // base via signUpUser() une fois l'email vérifié (dans verify.tsx).
      //
      // role: 'PROSPECT' est volontairement fixe ici — tout nouveau compte
      // mobile démarre particulier, le passage agent se fait plus tard
      // depuis Profil (update-role), pas à l'inscription.
      await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: { firstname, role: 'PROSPECT', phone },
      });

      // Clerk envoie un code à 6 chiffres à l'adresse fournie. Le compte
      // existe déjà côté Clerk à ce stade, mais reste "non vérifié" tant
      // que le code n'est pas confirmé sur l'écran suivant.
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // On transmet ces infos à l'écran suivant par les paramètres de route
      // plutôt que de les re-lire depuis Clerk là-bas — plus simple, et ça
      // évite une dépendance à l'état interne du SDK entre deux écrans.
      router.push({ pathname: '/verify', params: { email, firstname, phone } });
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage || 'Erreur lors de la création du compte. Vérifie tes informations.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Créer un compte</Text>
        </View>

        <Text style={styles.title}>Quelques infos et{'\n'}vous êtes chez vous</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Prénom et nom</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="person-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Votre nom complet"
              placeholderTextColor="#9ca3af"
              value={firstname}
              onChangeText={setFirstname}
            />
          </View>
        </View>

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
          <Text style={styles.label}>Téléphone</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.countryCode}>🇨🇲 +237</Text>
            <View style={styles.separator} />
            <TextInput
              style={styles.input}
              placeholder="6 99 41 08 27"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="••••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.primaryButton, (loading || !isSignUpLoaded) && styles.primaryButtonDisabled]}
          onPress={handleSignup}
          disabled={loading || !isSignUpLoaded}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Créer mon compte</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  title: { marginTop: 22, fontSize: 26, fontWeight: '800', lineHeight: 33, color: colors.text },
  field: { marginTop: 18, gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  countryCode: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  separator: { width: 1, height: 18, backgroundColor: '#DDE1DE' },
  errorText: { marginTop: 14, fontSize: 13, fontWeight: '700', color: colors.danger },
  primaryButton: {
    marginTop: 28,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});