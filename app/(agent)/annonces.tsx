import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../src/config/theme';
import { AGENT_LISTINGS } from '../../src/data/agentListings';
import SearchBar from '../../src/components/SearchBar';

export default function AgentListingsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const query = searchQuery.trim().toLowerCase();
  const filteredListings = AGENT_LISTINGS.filter(
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
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredListings.map((listing) => (
          <View key={listing.id} style={styles.listingCard}>
            <View style={styles.listingThumb} />
            <View style={styles.listingInfo}>
              <View style={styles.listingBadgeRow}>
                <View
                  style={[styles.statusBadge, listing.status === 'draft' && styles.statusBadgeDraft]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      listing.status === 'draft' && styles.statusBadgeTextDraft,
                    ]}>
                    {listing.status === 'online' ? 'EN LIGNE' : 'BROUILLON'}
                  </Text>
                </View>
                <Text style={styles.listingMeta}>Réf. {listing.reference}</Text>
              </View>
              <Text style={styles.listingTitle}>{listing.title}</Text>
              <Text style={styles.listingPrice}>{listing.price}</Text>
              {(listing.views != null || listing.favorites != null) && (
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
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: colors.white,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
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
  statusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  statusBadgeDraft: { backgroundColor: '#F0F2F0' },
  statusBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  statusBadgeTextDraft: { color: colors.textMuted },
  listingMeta: { fontSize: 11, fontWeight: '700', color: colors.textLight },
  listingTitle: { marginTop: 6, fontSize: 14, fontWeight: '800', color: colors.text },
  listingPrice: { marginTop: 2, fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  listingStats: { marginTop: 8, flexDirection: 'row', gap: 14 },
  listingStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listingStatText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
});