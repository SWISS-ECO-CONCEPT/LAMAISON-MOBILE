import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { mapAnnonceToListing, type Listing } from '../../src/data/listings';
import { getAnnonces } from '../../src/services/annonceService';
import ListingCard from '../../src/components/ListingCard';
import SearchBar from '../../src/components/SearchBar';

const TRANSACTION_FILTERS = [
  { key: 'location', label: 'Location' },
  { key: 'achat', label: 'Achat' },
];

const CATEGORY_FILTERS = [
  { key: 'maison', label: 'Maison', icon: 'home' as const },
  { key: 'appartement', label: 'Appart', icon: 'apartment' as const },
];

export default function HomeScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [activeTransaction, setActiveTransaction] = useState<'location' | 'achat'>('location');
  const [searchQuery, setSearchQuery] = useState(q ?? '');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `activeTransaction` existait déjà avant (les chips Location/Achat
  // changeaient bien de couleur au clic) mais ne filtrait jamais rien --
  // exactement le même genre de bouton "mort" que les rôles PROSPECT/AGENT
  // qu'on a corrigés. Maintenant qu'on a un vrai service avec un filtre
  // `projet` côté backend, on le branche pour de vrai.
  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const annonces = await getAnnonces({ projet: activeTransaction });
      setListings(annonces.map(mapAnnonceToListing));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des annonces.');
    } finally {
      setLoading(false);
    }
  }, [activeTransaction]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

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
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Pressable style={styles.locationRow}>
              <MaterialIcons name="location-on" size={18} color={colors.primary} />
              <Text style={styles.locationText}>Douala</Text>
              <MaterialIcons name="expand-more" size={19} color={colors.textMuted} />
            </Pressable>
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
            placeholder="Quartier, ville, type de bien…"
            onFilterPress={() => console.log('Ouvrir les filtres avancés')}
          />
        </View>

        <View style={styles.chipRow}>
          {TRANSACTION_FILTERS.map((filter) => {
            const active = activeTransaction === filter.key;
            return (
              <Pressable
                key={filter.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveTransaction(filter.key as 'location' | 'achat')}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
          <View style={styles.chipDivider} />
          {/* Chips catégorie (maison/appart) : toujours sans filtrage réel --
              contrairement au toggle achat/location, il n'y avait même pas
              d'état de sélection avant. Laissé en l'état, hors scope de la
              Phase A (pure migration de données), à traiter séparément. */}
          {CATEGORY_FILTERS.map((category) => (
            <Pressable key={category.key} style={styles.chip}>
              <MaterialIcons name={category.icon} size={16} color={colors.text} />
              <Text style={styles.chipText}>{category.label}</Text>
            </Pressable>
          ))}
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
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>
              {filteredListings.length} annonce{filteredListings.length > 1 ? 's' : ''} autour de vous
            </Text>
            <Text style={styles.listMapLink}>Carte</Text>
          </View>

          {filteredListings.length === 0 ? (
            <Text style={styles.emptyText}>Aucune annonce ne correspond à votre recherche.</Text>
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
  locationRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { fontSize: 17, fontWeight: '800', color: colors.text },
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