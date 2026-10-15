import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../src/config/theme';
import { getAnnoncesByUser } from '../../src/services/annonceService';
import { mapAnnonceToListing } from '../../src/data/listings';
import SearchBar from '../../src/components/SearchBar';

// Avant : AGENT_LISTINGS mocké, avec un statut "brouillon" qui n'existe pas
// en base (Annonce n'a pas de champ status -- une annonce créée est
// publiée, point) et un compteur de favoris qu'aucun endpoint ne calcule.
// Maintenant : GET /annonces/user/:clerkId, badge "EN LIGNE" toujours vrai
// (puisque toute annonce qui existe est publiée), vraies vues (Annonce.vues),
// pas de compteur de favoris (pas d'agrégat disponible sur cette route).
export default function AgentListingsScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<ReturnType<typeof mapAnnonceToListing>[]>([]);
  const [views, setViews] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    if (!clerkId) return;
    setLoading(true);
    setError(null);
    try {
      const annonces = await getAnnoncesByUser(clerkId);
      setListings(annonces.map(mapAnnonceToListing));
      setViews(Object.fromEntries(annonces.map((a) => [String(a.id), a.vues])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de vos annonces.');
    } finally {
      setLoading(false);
    }
  }, [clerkId]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const query = searchQuery.trim().toLowerCase();
  const filteredListings = listings.filter(
    (listing) => !query || listing.title.toLowerCase().includes(query) || listing.reference.toLowerCase().includes(query)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes annonces</Text>
        <View style={{ marginTop: 14 }}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Titre, référence…" />
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
          {filteredListings.length === 0 ? (
            <Text style={styles.emptyText}>Aucune annonce publiée pour l'instant.</Text>
          ) : (
            filteredListings.map((listing) => (
              <Pressable
                key={listing.id}
                style={styles.listingCard}
                onPress={() => router.push({ pathname: '/annonce/[id]', params: { id: listing.id } })}>
                {listing.images[0] ? (
                  <Image source={{ uri: listing.images[0].uri }} style={styles.listingThumb} />
                ) : (
                  <View style={styles.listingThumb} />
                )}
                <View style={styles.listingInfo}>
                  <View style={styles.listingBadgeRow}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>EN LIGNE</Text>
                    </View>
                    <Text style={styles.listingMeta}>Réf. {listing.reference}</Text>
                  </View>
                  <Text style={styles.listingTitle}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>{listing.price}</Text>
                  <View style={styles.listingStats}>
                    <View style={styles.listingStat}>
                      <MaterialIcons name="visibility" size={15} color={colors.textLight} />
                      <Text style={styles.listingStatText}>{views[listing.id] ?? 0}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, backgroundColor: colors.white },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  emptyText: { marginTop: 40, textAlign: 'center', fontSize: 14, color: colors.textMuted },
  listingCard: {
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: colors.text,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  listingThumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: '#E9EDEA' },
  listingInfo: { flex: 1, minWidth: 0 },
  listingBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  listingMeta: { fontSize: 11, fontWeight: '700', color: colors.textLight },
  listingTitle: { marginTop: 6, fontSize: 14, fontWeight: '800', color: colors.text },
  listingPrice: { marginTop: 2, fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  listingStats: { marginTop: 8, flexDirection: 'row', gap: 14 },
  listingStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listingStatText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
});
