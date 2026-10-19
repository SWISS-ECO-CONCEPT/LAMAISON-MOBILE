import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../src/config/theme';

type FiltersParams = {
  prixMin?: string;
  prixMax?: string;
  surfaceMin?: string;
  surfaceMax?: string;
  chambres?: string;
  douches?: string;
  ville?: string;
  quartier?: string;
};

// Le bouton filtre de la SearchBar sur l'accueil ne faisait qu'un
// console.log ("Ouvrir les filtres avancés") -- aucun écran n'existait.
// Tous les champs ci-dessous correspondent à des filtres réellement
// supportés par GET /annonces (voir annonce.controller.ts getAllAnnonces :
// prixMin/prixMax/surfaceMin/surfaceMax/chambres/douches/ville/quartier),
// rien n'est inventé.
export default function FiltresScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<FiltersParams>();

  const [prixMin, setPrixMin] = useState(params.prixMin ?? '');
  const [prixMax, setPrixMax] = useState(params.prixMax ?? '');
  const [surfaceMin, setSurfaceMin] = useState(params.surfaceMin ?? '');
  const [surfaceMax, setSurfaceMax] = useState(params.surfaceMax ?? '');
  const [chambres, setChambres] = useState(Number(params.chambres) || 0);
  const [douches, setDouches] = useState(Number(params.douches) || 0);
  const [ville, setVille] = useState(params.ville ?? '');
  const [quartier, setQuartier] = useState(params.quartier ?? '');

  const reset = () => {
    setPrixMin('');
    setPrixMax('');
    setSurfaceMin('');
    setSurfaceMax('');
    setChambres(0);
    setDouches(0);
    setVille('');
    setQuartier('');
  };

  const apply = () => {
    router.push({
      pathname: '/',
      params: {
        prixMin: prixMin.trim() || undefined,
        prixMax: prixMax.trim() || undefined,
        surfaceMin: surfaceMin.trim() || undefined,
        surfaceMax: surfaceMax.trim() || undefined,
        chambres: chambres > 0 ? String(chambres) : undefined,
        douches: douches > 0 ? String(douches) : undefined,
        ville: ville.trim() || undefined,
        quartier: quartier.trim() || undefined,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('filters.title')}</Text>
        <Pressable onPress={reset}>
          <Text style={styles.resetLink}>{t('filters.reset')}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('filters.price')}</Text>
          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('common.min')}</Text>
              <TextInput
                style={styles.input}
                value={prixMin}
                onChangeText={setPrixMin}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('common.max')}</Text>
              <TextInput
                style={styles.input}
                value={prixMax}
                onChangeText={setPrixMax}
                keyboardType="numeric"
                placeholder={t('common.unlimited')}
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('filters.area')}</Text>
          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('common.min')}</Text>
              <TextInput
                style={styles.input}
                value={surfaceMin}
                onChangeText={setSurfaceMin}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('common.max')}</Text>
              <TextInput
                style={styles.input}
                value={surfaceMax}
                onChangeText={setSurfaceMax}
                keyboardType="numeric"
                placeholder={t('common.unlimited')}
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('filters.location')}</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('filters.city')}</Text>
            <TextInput
              style={styles.input}
              value={ville}
              onChangeText={setVille}
              placeholder={t('filters.cityPlaceholder')}
              placeholderTextColor={colors.textLight}
            />
          </View>
          <View style={[styles.field, { marginTop: 10 }]}>
            <Text style={styles.fieldLabel}>{t('filters.district')}</Text>
            <TextInput
              style={styles.input}
              value={quartier}
              onChangeText={setQuartier}
              placeholder={t('filters.districtPlaceholder')}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('filters.minimum')}</Text>
          <View style={styles.fieldRow}>
            <View style={[styles.counterBox, { flex: 1 }]}>
              <MaterialIcons name="bed" size={18} color={colors.primary} />
              <Text style={styles.counterValue}>{chambres}</Text>
              <Pressable onPress={() => setChambres(Math.max(0, chambres - 1))}>
                <Text style={styles.counterMinus}>−</Text>
              </Pressable>
              <Pressable onPress={() => setChambres(chambres + 1)}>
                <Text style={styles.counterPlus}>+</Text>
              </Pressable>
            </View>
            <View style={[styles.counterBox, { flex: 1 }]}>
              <MaterialIcons name="shower" size={18} color={colors.primary} />
              <Text style={styles.counterValue}>{douches}</Text>
              <Pressable onPress={() => setDouches(Math.max(0, douches - 1))}>
                <Text style={styles.counterMinus}>−</Text>
              </Pressable>
              <Pressable onPress={() => setDouches(douches + 1)}>
                <Text style={styles.counterPlus}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.applyButton} onPress={apply}>
          <Text style={styles.applyButtonText}>{t('filters.apply')}</Text>
        </Pressable>
      </View>
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
    justifyContent: 'space-between',
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  resetLink: { fontSize: 13, fontWeight: '800', color: colors.primary },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: colors.text,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  cardLabel: { fontSize: 12, fontWeight: '800', color: colors.textLight, letterSpacing: 0.4 },
  fieldRow: { marginTop: 10, flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  counterBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterValue: { flex: 1, fontSize: 13, fontWeight: '800', color: colors.text },
  counterMinus: { fontSize: 16, fontWeight: '800', color: colors.textLight, paddingHorizontal: 4 },
  counterPlus: { fontSize: 16, fontWeight: '800', color: colors.primary, paddingHorizontal: 4 },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 4,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  applyButtonText: { fontSize: 15, fontWeight: '800', color: colors.white },
});
