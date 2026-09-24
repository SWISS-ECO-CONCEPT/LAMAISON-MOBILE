import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { LISTINGS } from '../../src/data/listings';
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
  const [activeTransaction, setActiveTransaction] = useState('location');
  const [searchQuery, setSearchQuery] = useState(q ?? '');

  const query = searchQuery.trim().toLowerCase();
  const filteredListings = LISTINGS.filter((listing) => {
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
            <Text style={styles.greeting}>Bonjour Arlette 👋</Text>
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
                onPress={() => setActiveTransaction(filter.key)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
          <View style={styles.chipDivider} />
          {CATEGORY_FILTERS.map((category) => (
            <Pressable key={category.key} style={styles.chip}>
              <MaterialIcons name={category.icon} size={16} color={colors.text} />
              <Text style={styles.chipText}>{category.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

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
    paddingTop: 16,
    paddingBottom: 16,
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
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  locationRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 17,
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
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  searchWrap: {
    marginTop: 16,
  },
  chipRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  chipTextActive: {
    color: colors.white,
  },
  chipDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 4,
    backgroundColor: colors.border,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  listCount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  listMapLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 14,
    color: colors.textMuted,
  },
});