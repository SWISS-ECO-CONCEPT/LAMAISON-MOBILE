import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../src/config/theme';
import ListingCard from '../src/components/ListingCard';
import type { Listing } from '../src/data/listings';

export default function FavorisScreen() {
  const router = useRouter();
  // TODO Phase B : brancher favorisService.getUserFavoris(clerkId, token)
  // et récupérer les annonces correspondantes. Pour l'instant, liste vide
  // honnête plutôt que de réafficher l'ancien mock figé sur "favorite: true".
  const favorites: Listing[] = [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Mes favoris</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="favorite-border" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>Aucune annonce en favoris pour l'instant.</Text>
          </View>
        ) : (
          favorites.map((listing) => <ListingCard key={listing.id} listing={listing} />)
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});