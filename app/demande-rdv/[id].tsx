import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { createRdv } from '../../src/services/rdvService';

// nom/prenom/email/telephone sont de simples champs du formulaire RendezVous
// (voir prisma/schema.prisma) -- PAS des colonnes du modèle User (qui n'a
// que firstname/phone). Impossible de tout déduire du compte connecté :
// on préremplit ce qu'on sait vraiment (email Clerk, téléphone BDD,
// prénom BDD) et on laisse le "nom" vide plutôt que de deviner en coupant
// le prénom en deux.
export default function DemandeRdvScreen() {
  const { id, listingTitle, listingReference } = useLocalSearchParams<{
    id: string;
    listingTitle?: string;
    listingReference?: string;
  }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { user: dbUser } = useAuthContext();

  const [prenom, setPrenom] = useState(dbUser?.firstname ?? '');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState(clerkUser?.primaryEmailAddress?.emailAddress ?? '');
  const [telephone, setTelephone] = useState(dbUser?.phone ?? '');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [message, setMessage] = useState(
    listingTitle ? `Bonjour, je souhaite visiter "${listingTitle}"${listingReference ? ` (Réf. ${listingReference})` : ''}.` : ''
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // "JJ/MM/AAAA" + "HH:MM" -> Date réelle, validée (pas de date invalide,
  // pas de date déjà passée) plutôt que de laisser passer n'importe quoi
  // vers le backend.
  const parseRequestedDate = (): Date | null => {
    const dateMatch = date.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const timeMatch = heure.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!dateMatch || !timeMatch) return null;
    const [, day, month, year] = dateMatch;
    const [, hour, minute] = timeMatch;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );
    if (Number.isNaN(parsed.getTime())) return null;
    if (parsed.getTime() < Date.now()) return null;
    return parsed;
  };

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!prenom.trim() || !nom.trim() || !email.trim() || !telephone.trim() || !message.trim()) {
      setErrorMessage('Merci de remplir tous les champs.');
      return;
    }
    const requestedDate = parseRequestedDate();
    if (!requestedDate) {
      setErrorMessage('Date ou heure invalide -- utilisez JJ/MM/AAAA et HH:MM, dans le futur.');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setErrorMessage('Session expirée, reconnectez-vous.');
        return;
      }
      await createRdv(
        {
          annonceId: Number(id),
          date: requestedDate.toISOString(),
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          telephone: telephone.trim(),
          message: message.trim(),
        },
        token
      );
      setSuccess(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erreur lors de la demande de rendez-vous.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successState}>
          <MaterialIcons name="check-circle" size={56} color={colors.primary} />
          <Text style={styles.successTitle}>Demande envoyée</Text>
          <Text style={styles.successText}>
            Le propriétaire a reçu votre demande de rendez-vous et vous répondra via la messagerie.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Retour à l'annonce</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Demander un rendez-vous</Text>
        </View>

        {listingTitle ? <Text style={styles.listingTitle}>{listingTitle}</Text> : null}

        <View style={styles.row}>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>Prénom</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Prénom" placeholderTextColor="#9ca3af" />
            </View>
          </View>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>Nom</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Nom" placeholderTextColor="#9ca3af" />
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Adresse e-mail</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="mail-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Téléphone</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="call" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              value={telephone}
              onChangeText={setTelephone}
              placeholder="6 99 41 08 27"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>Date souhaitée</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
            </View>
          </View>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>Heure</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={heure} onChangeText={setHeure} placeholder="HH:MM" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Message</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={message}
              onChangeText={setMessage}
              placeholder="Votre message au propriétaire…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Envoyer la demande</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  listingTitle: { marginTop: 16, fontSize: 20, fontWeight: '800', lineHeight: 27, color: colors.text },
  row: { flexDirection: 'row', gap: 12 },
  field: { marginTop: 18, gap: 6 },
  fieldHalf: { flex: 1 },
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
  inputWrapperMultiline: { alignItems: 'flex-start', paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
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
  successState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  successText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
