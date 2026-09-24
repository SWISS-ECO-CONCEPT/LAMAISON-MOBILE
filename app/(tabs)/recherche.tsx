import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../src/config/theme';
import { PROPERTY_TYPES } from '../../src/data/propertyTypes';
import { RECENT_SEARCHES, POPULAR_CITIES } from '../../src/data/search';
import SearchBar from '../../src/components/SearchBar';

export default function RechercheScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const goToResults = (q: string) => {
    router.push({ pathname: '/', params: { q } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Recherche</Text>

        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Quartier, ville, référence…"
            onSubmit={() => goToResults(query)}
          />
        </View>

        {RECENT_SEARCHES.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recherches récentes</Text>
            <View style={styles.chipWrap}>
              {RECENT_SEARCHES.map((search) => (
                <Pressable key={search} style={styles.recentChip} onPress={() => goToResults(search)}>
                  <MaterialIcons name="history" size={16} color={colors.textMuted} />
                  <Text style={styles.recentChipText}>{search}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.categoryGrid}>
            {PROPERTY_TYPES.map((type) => (
              <Pressable
                key={type.key}
                style={styles.categoryCard}
                onPress={() => goToResults(type.label)}>
                <View style={styles.categoryIconBox}>
                  <MaterialIcons name={type.icon} size={22} color={colors.primary} />
                </View>
                <Text style={styles.categoryLabel}>{type.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Villes populaires</Text>
          <View style={styles.chipWrap}>
            {POPULAR_CITIES.map((city) => (
              <Pressable key={city} style={styles.cityChip} onPress={() => goToResults(city)}>
                <MaterialIcons name="location-on" size={15} color={colors.primary} />
                <Text style={styles.cityChipText}>{city}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  searchWrap: { marginTop: 16 },
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  chipWrap: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  recentChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  categoryGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '31%',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
  },
  cityChipText: { fontSize: 13, fontWeight: '700', color: colors.text },
});