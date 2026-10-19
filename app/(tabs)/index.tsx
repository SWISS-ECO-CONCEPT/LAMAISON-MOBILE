import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { mapAnnonceToListing, type Listing } from '../../src/data/listings';
import { getAnnonces } from '../../src/services/annonceService';
import { useAuthContext } from '../../src/context/AuthContext';
import ListingCard from '../../src/components/ListingCard';
import SearchBar from '../../src/components/SearchBar';

// `key` = valeur envoyée au backend (filtres `projet` / `type`), `labelKey` =
// texte affiché, traduit.
const TRANSACTION_FILTERS = [
  { key: 'location', labelKey: 'home.rent' },
  { key: 'achat', labelKey: 'home.sale' },
] as const;

const CATEGORY_FILTERS = [
  { key: 'maison', labelKey: 'home.house', icon: 'home' },
  { key: 'appartement', labelKey: 'home.apartmentShort', icon: 'apartment' },
] as const;

export default function HomeScreen() {
  // `(tabs)/index.tsx` est le SEUL fichier de app/ nomme "index" -> c'est lui
  // que Expo Router ouvre pour "/", quoi que dise unstable_settings dans
  // _layout.tsx (ce reglage n'est pas fiable, cf. github.com/expo/router/issues/723).
  // La garde doit donc vivre ICI, en <Redirect> declaratif (execute pendant
  // le rendu, avant tout affichage) plutot qu'en useEffect + router.replace
  // dans RootLayoutNav (qui s'execute APRES le premier rendu commite -> flash
  // visible de cet ecran avant la redirection). Reintegree apres avoir
  // disparu sur cette branche -- voir la revue du 15/10.
  const { isLoaded, isSignedIn } = useAuth();
  const { t } = useTranslation();
  const { user: dbUser } = useAuthContext();
  const router = useRouter();
  const params = useLocalSearchParams<{
    q?: string;
    prixMin?: string;
    prixMax?: string;
    surfaceMin?: string;
    surfaceMax?: string;
    chambres?: string;
    douches?: string;
    ville?: string;
    quartier?: string;
  }>();
  const [activeTransaction, setActiveTransaction] = useState<'location' | 'achat'>('location');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(params.q ?? '');
  const [filters, setFilters] = useState({
    prixMin: params.prixMin ?? '',
    prixMax: params.prixMax ?? '',
    surfaceMin: params.surfaceMin ?? '',
    surfaceMax: params.surfaceMax ?? '',
    chambres: params.chambres ?? '',
    douches: params.douches ?? '',
    ville: params.ville ?? '',
    quartier: params.quartier ?? '',
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // L'écran reste monté dans la pile des tabs : revenir ici depuis
  // recherche.tsx ou filtres.tsx change les params de la même instance,
  // ça ne remonte pas le composant -- sans cet effet, le `useState`
  // initial ne verrait jamais la mise à jour.
  useEffect(() => {
    setSearchQuery(params.q ?? '');
    setFilters({
      prixMin: params.prixMin ?? '',
      prixMax: params.prixMax ?? '',
      surfaceMin: params.surfaceMin ?? '',
      surfaceMax: params.surfaceMax ?? '',
      chambres: params.chambres ?? '',
      douches: params.douches ?? '',
      ville: params.ville ?? '',
      quartier: params.quartier ?? '',
    });
  }, [
    params.q,
    params.prixMin,
    params.prixMax,
    params.surfaceMin,
    params.surfaceMax,
    params.chambres,
    params.douches,
    params.ville,
    params.quartier,
  ]);

  // `activeTransaction` existait déjà avant (les chips Location/Achat
  // changeaient bien de couleur au clic) mais ne filtrait jamais rien --
  // exactement le même genre de bouton "mort" que les rôles PROSPECT/AGENT
  // qu'on a corrigés. Maintenant qu'on a un vrai service avec un filtre
  // `projet` côté backend, on le branche pour de vrai. Même chose pour
  // `activeCategory` : le backend normalise "maison"/"appartement" (voir
  // normalizeTypeBien côté annonce.controller.ts), donc les clés des chips
  // peuvent être envoyées telles quelles.
  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const annonces = await getAnnonces({
        projet: activeTransaction,
        type: activeCategory ?? undefined,
        ville: filters.ville || undefined,
        quartier: filters.quartier || undefined,
        prixMin: filters.prixMin ? Number(filters.prixMin) : undefined,
        prixMax: filters.prixMax ? Number(filters.prixMax) : undefined,
        surfaceMin: filters.surfaceMin ? Number(filters.surfaceMin) : undefined,
        surfaceMax: filters.surfaceMax ? Number(filters.surfaceMax) : undefined,
        chambres: filters.chambres ? Number(filters.chambres) : undefined,
        douches: filters.douches ? Number(filters.douches) : undefined,
      });
      setListings(annonces.map(mapAnnonceToListing));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('home.loadError'));
    } finally {
      setLoading(false);
    }
  }, [activeTransaction, activeCategory, filters, t]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Les hooks ci-dessus tournent toujours dans le meme ordre (regle des
  // hooks) ; c'est seulement APRES qu'on peut retourner un rendu different
  // selon l'etat d'auth, sans jamais appeler de hook de facon conditionnelle.
  if (!isLoaded) return null; // Clerk relit encore la session sauvegardee.
  if (!isSignedIn) return <Redirect href="/login" />;

  // La recherche texte reste filtrée côté app (pas de nouvel appel réseau
  // à chaque frappe) -- le backend sait filtrer par `search`, mais ça
  // demanderait un debounce pour ne pas spammer l'API ; hors scope ici.
  const query = searchQuery.trim().toLowerCase();
  const filteredListings = listings.filter((listing) => {
    if (!query) return true;
    return (
      listing.title.toLowerCase().includes(query) ||
      listing.location.toLowerCase().includes(query) ||
      listing.reference.toLowerCase().includes(query)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {dbUser?.firstname ? t('home.greetingName', { name: dbUser.firstname }) : t('home.greeting')} 👋
            </Text>
          </View>
          <Pressable style={styles.notifButton}>
            <MaterialIcons name="notifications" size={22} color={colors.text} />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('home.searchPlaceholder')}
            onFilterPress={() => router.push({ pathname: '/filtres', params: filters })}
            filtersActive={Object.values(filters).some(Boolean)}
          />
        </View>

        <View style={styles.chipRow}>
          {TRANSACTION_FILTERS.map((filter) => {
            const active = activeTransaction === filter.key;
            return (
              <Pressable
                key={filter.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveTransaction(filter.key)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(filter.labelKey)}</Text>
              </Pressable>
            );
          })}
          <View style={styles.chipDivider} />
          {CATEGORY_FILTERS.map((category) => {
            const active = activeCategory === category.key;
            return (
              <Pressable
                key={category.key}
                style={[styles.chip, active && styles.chipActive]}
                // Retaper sur la catégorie déjà active désélectionne (retour à "tous les types") --
                // il n'y a pas de chip "Tous" séparée, donc il faut bien pouvoir revenir en arrière.
                onPress={() => setActiveCategory(active ? null : category.key)}>
                <MaterialIcons name={category.icon} size={16} color={active ? colors.white : colors.text} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(category.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadListings}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>{t('home.listingsCount', { count: filteredListings.length })}</Text>
            <Text style={styles.listMapLink}>{t('home.map')}</Text>
          </View>

          {filteredListings.length === 0 ? (
            <Text style={styles.emptyText}>{t('home.empty')}</Text>
          ) : (
            filteredListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.white,
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  searchWrap: { marginTop: 16 },
  chipRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  chipTextActive: { color: colors.white },
  chipDivider: { width: 1, alignSelf: 'stretch', marginVertical: 4, backgroundColor: colors.border },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  listHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  listCount: { fontSize: 16, fontWeight: '800', color: colors.text },
  listMapLink: { fontSize: 13, fontWeight: '700', color: colors.primary },
  emptyText: { marginTop: 40, textAlign: 'center', fontSize: 14, color: colors.textMuted },
});