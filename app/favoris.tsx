import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../src/config/theme';
import ListingCard from '../src/components/ListingCard';
import { useFavoris } from '../src/context/FavorisContext';

export default function FavorisScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { favoriteListings, loading } = useFavoris();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('favorites.title')}</Text>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {favoriteListings.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="favorite-border" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
            </View>
          ) : (
            favoriteListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
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