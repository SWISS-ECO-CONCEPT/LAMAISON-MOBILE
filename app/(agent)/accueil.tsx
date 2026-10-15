import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { getAnnoncesByUser } from '../../src/services/annonceService';
import { getRdvsByAgent } from '../../src/services/rdvService';
import { mapAnnonceToListing } from '../../src/data/listings';

const RECENT_COUNT = 3;

// Avant : AGENT_PROFILE mocké de bout en bout -- "agency"/"verified"
// n'existent pas sur le modèle User, "views7d" prétendait une fenêtre de
// 7 jours qu'aucun endpoint ne calcule (Annonce.vues est un total, pas une
// série temporelle), "pendingRequests"/le bandeau/les stats par annonce
// (favorites, appointments, missingNote) étaient des nombres fixes sans
// rapport avec les vraies données. Remplacé par GET /annonces/user/:clerkId
// + GET /rdvs?agentClerkId=.
export default function AgentHomeScreen() {
  const router = useRouter();
  const { userId: clerkId, getToken } = useAuth();
  const { user: dbUser } = useAuthContext();
  const [listings, setListings] = useState<ReturnType<typeof mapAnnonceToListing>[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clerkId) return;
    setLoading(true);
    setError(null);
    try {
      const [annonces, rdvs] = await Promise.all([
        getAnnoncesByUser(clerkId),
        getToken().then((token) => (token ? getRdvsByAgent(clerkId, token) : [])),
      ]);
      setListings(annonces.map(mapAnnonceToListing));
      setTotalViews(annonces.reduce((sum, a) => sum + (a.vues ?? 0), 0));
      setPendingCount(rdvs.filter((r) => r.status === 'EN_ATTENTE' || r.status === 'PROPOSE').length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [clerkId, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.agency}>Agent LAMAISON</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{dbUser?.firstname ?? '—'}</Text>
            </View>
          </View>
          <Pressable style={styles.notifButton}>
            <MaterialIcons name="notifications" size={22} color={colors.text} />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statTile, styles.statTilePrimary]}>
            <Text style={[styles.statValue, styles.statValuePrimary]}>{listings.length}</Text>
            <Text style={styles.statLabelPrimary}>annonces actives</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{totalViews}</Text>
            <Text style={styles.statLabel}>vues (total)</Text>
          </View>
          <View style={[styles.statTile, styles.statTileWarning]}>
            <Text style={[styles.statValue, styles.statValueWarning]}>{pendingCount}</Text>
            <Text style={styles.statLabelWarning}>demandes</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {pendingCount > 0 && (
            <Pressable style={styles.banner} onPress={() => router.push('/demandes')}>
              <MaterialIcons name="event-available" size={22} color={colors.white} />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>
                  {pendingCount} demande{pendingCount > 1 ? 's' : ''} de visite en attente
                </Text>
                <Text style={styles.bannerSubtitle}>Accepter, refuser ou proposer un autre créneau</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.white} />
            </Pressable>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes annonces</Text>
            <Pressable onPress={() => router.push('/annonces')}>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </Pressable>
          </View>

          {listings.length === 0 ? (
            <Text style={styles.emptyText}>Aucune annonce publiée pour l'instant.</Text>
          ) : (
            listings.slice(0, RECENT_COUNT).map((listing) => (
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
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/publier-annonce')}>
        <MaterialIcons name="add" size={21} color={colors.white} />
        <Text style={styles.fabText}>Publier</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: colors.white,
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  agency: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  nameRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
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
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
  },
  statsRow: { marginTop: 16, flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, backgroundColor: colors.background, borderRadius: radius.md, padding: 12 },
  statTilePrimary: { backgroundColor: colors.primaryLight },
  statTileWarning: { backgroundColor: colors.warningBackground },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statValuePrimary: { color: colors.primaryDark },
  statValueWarning: { color: colors.warningText },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  statLabelPrimary: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  statLabelWarning: { fontSize: 11, fontWeight: '700', color: colors.warningTextStrong },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  emptyText: { marginTop: 24, textAlign: 'center', fontSize: 14, color: colors.textMuted },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: colors.white },
  bannerSubtitle: { marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,.85)' },
  sectionHeader: { marginTop: 18, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  sectionLink: { fontSize: 13, fontWeight: '700', color: colors.primary },
  listingCard: {
    marginTop: 12,
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
  listingMeta: { fontSize: 11, fontWeight: '700', color: colors.textLight, flexShrink: 1 },
  listingTitle: { marginTop: 6, fontSize: 14, fontWeight: '800', color: colors.text },
  listingPrice: { marginTop: 2, fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  fabText: { fontSize: 15, fontWeight: '800', color: colors.white },
});
