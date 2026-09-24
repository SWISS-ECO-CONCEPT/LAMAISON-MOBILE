import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { AGENT_PROFILE } from '../../src/data/agent';
import { AGENT_LISTINGS } from '../../src/data/agentListings';

export default function AgentHomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.agency}>{AGENT_PROFILE.agency}</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{AGENT_PROFILE.name}</Text>
              {AGENT_PROFILE.verified && (
                <MaterialIcons name="verified" size={18} color={colors.primary} />
              )}
            </View>
          </View>
          <Pressable style={styles.notifButton}>
            <MaterialIcons name="notifications" size={22} color={colors.text} />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statTile, styles.statTilePrimary]}>
            <Text style={[styles.statValue, styles.statValuePrimary]}>
              {AGENT_PROFILE.stats.activeListings}
            </Text>
            <Text style={styles.statLabelPrimary}>annonces actives</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{AGENT_PROFILE.stats.views7d}</Text>
            <Text style={styles.statLabel}>vues (7 j)</Text>
          </View>
          <View style={[styles.statTile, styles.statTileWarning]}>
            <Text style={[styles.statValue, styles.statValueWarning]}>
              {AGENT_PROFILE.stats.pendingRequests}
            </Text>
            <Text style={styles.statLabelWarning}>demandes</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Pressable style={styles.banner} onPress={() => router.push('/demandes')}>
          <MaterialIcons name="event-available" size={22} color={colors.white} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{AGENT_PROFILE.nextRequestBanner.summary}</Text>
            <Text style={styles.bannerSubtitle}>{AGENT_PROFILE.nextRequestBanner.detail}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.white} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes annonces</Text>
          <Pressable onPress={() => router.push('/annonces')}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </Pressable>
        </View>

        {AGENT_LISTINGS.map((listing) => (
          <View key={listing.id} style={styles.listingCard}>
            <View style={styles.listingThumb} />
            <View style={styles.listingInfo}>
              <View style={styles.listingBadgeRow}>
                <View
                  style={[
                    styles.statusBadge,
                    listing.status === 'draft' && styles.statusBadgeDraft,
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      listing.status === 'draft' && styles.statusBadgeTextDraft,
                    ]}>
                    {listing.status === 'online' ? 'EN LIGNE' : 'BROUILLON'}
                  </Text>
                </View>
                <Text style={styles.listingMeta}>
                  {listing.missingNote ? `Réf. ${listing.reference} · ${listing.missingNote}` : `Réf. ${listing.reference}`}
                </Text>
              </View>
              <Text style={styles.listingTitle}>{listing.title}</Text>
              <Text style={styles.listingPrice}>{listing.price}</Text>
              {(listing.views || listing.favorites || listing.appointments) && (
                <View style={styles.listingStats}>
                  {listing.views != null && (
                    <View style={styles.listingStat}>
                      <MaterialIcons name="visibility" size={15} color={colors.textLight} />
                      <Text style={styles.listingStatText}>{listing.views}</Text>
                    </View>
                  )}
                  {listing.favorites != null && (
                    <View style={styles.listingStat}>
                      <MaterialIcons name="favorite" size={15} color={colors.textLight} />
                      <Text style={styles.listingStatText}>{listing.favorites}</Text>
                    </View>
                  )}
                  {listing.appointments != null && (
                    <View style={styles.listingStat}>
                      <MaterialIcons name="event" size={15} color={colors.textLight} />
                      <Text style={styles.listingStatText}>{listing.appointments}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/publier-annonce')}>
        <MaterialIcons name="add" size={21} color={colors.white} />
        <Text style={styles.fabText}>Publier</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agency: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  nameRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
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
  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 12,
  },
  statTilePrimary: {
    backgroundColor: colors.primaryLight,
  },
  statTileWarning: {
    backgroundColor: colors.warningBackground,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  statValuePrimary: {
    color: colors.primaryDark,
  },
  statValueWarning: {
    color: colors.warningText,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statLabelPrimary: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  statLabelWarning: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warningTextStrong,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  bannerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(255,255,255,.85)',
  },
  sectionHeader: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
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
  listingThumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: '#E9EDEA',
  },
  listingInfo: {
    flex: 1,
    minWidth: 0,
  },
  listingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  statusBadgeDraft: {
    backgroundColor: '#F0F2F0',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statusBadgeTextDraft: {
    color: colors.textMuted,
  },
  listingMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
    flexShrink: 1,
  },
  listingTitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  listingPrice: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  listingStats: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 14,
  },
  listingStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingStatText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
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
  fabText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
});