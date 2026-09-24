import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../src/config/theme';

type PropertyType = 'maison' | 'appartement' | 'terrain'| 'chambre' | 'meublé' | 'studio'| 'duplex';
type TransactionType = 'achat' | 'location';

const PROPERTY_TYPES: { key: PropertyType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'maison', label: 'Maison', icon: 'home' },
  { key: 'appartement', label: 'Appartement', icon: 'apartment' },
  { key: 'terrain', label: 'Terrain', icon: 'landscape' },
  { key: 'chambre', label: 'Chambre', icon: 'bed' },
  { key: 'meublé', label: 'Meublé', icon: 'weekend' },
  { key: 'studio', label: 'Studio', icon: 'meeting-room' },
  { key: 'duplex', label: 'Duplex', icon: 'layers' },
];

const STEP_LABELS = ['Type de bien', 'Détails', 'Description'];

export default function PublierAnnonceScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [propertyType, setPropertyType] = useState<PropertyType>('maison');
  const [transactionType, setTransactionType] = useState<TransactionType>('achat');
  const [title, setTitle] = useState('Villa moderne 4 chambres');
  const [price, setPrice] = useState('85 000 000');
  const [surface, setSurface] = useState('320');
  const [neighborhood, setNeighborhood] = useState('Bonapriso, Douala');
  const [bedrooms, setBedrooms] = useState(4);
  const [bathrooms, setBathrooms] = useState(3);
  const [photoCount, setPhotoCount] = useState(3);
  const [description, setDescription] = useState('');

  const transactionLabel = transactionType === 'achat' ? 'Achat' : 'Location';
  const propertyLabel = PROPERTY_TYPES.find((p) => p.key === propertyType)?.label ?? '';

  const goNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      console.log('Publier annonce', {
        propertyType,
        transactionType,
        title,
        price,
        surface,
        neighborhood,
        bedrooms,
        bathrooms,
        photoCount,
        description,
      });
      router.back();
    }
  };

  const saveDraft = () => {
    console.log('Enregistrer en brouillon');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Nouvelle annonce</Text>
            <Text style={styles.headerRef}>Réf. attribuée : BN-2431</Text>
          </View>
          <Pressable onPress={saveDraft}>
            <Text style={styles.draftLink}>Brouillon</Text>
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          {[1, 2, 3].map((index) => (
            <View
              key={index}
              style={[styles.progressSegment, index <= step && styles.progressSegmentActive]}
            />
          ))}
          <Text style={styles.progressLabel}>Étape {step}/3</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TYPE DE BIEN</Text>
            <View style={styles.propertyTypeGrid}>
              {PROPERTY_TYPES.map((type) => {
                const active = propertyType === type.key;
                return (
                  <Pressable
                    key={type.key}
                    style={[styles.propertyTypeCard, active && styles.propertyTypeCardActive]}
                    onPress={() => setPropertyType(type.key)}>
                    <View style={[styles.propertyTypeIconBox, active && styles.propertyTypeIconBoxActive]}>
                      <MaterialIcons
                        name={type.icon}
                        size={22}
                        color={active ? colors.white : colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.propertyTypeLabel,
                        active && styles.propertyTypeLabelActive,
                      ]}>
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.cardLabel, { marginTop: 18 }]}>PROJET</Text>
            <View style={styles.transactionRow}>
              <Pressable
                style={[
                  styles.transactionOption,
                  transactionType === 'achat' && styles.transactionOptionActive,
                ]}
                onPress={() => setTransactionType('achat')}>
                <Text
                  style={[
                    styles.transactionOptionText,
                    transactionType === 'achat' && styles.transactionOptionTextActive,
                  ]}>
                  Achat
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.transactionOption,
                  transactionType === 'location' && styles.transactionOptionActive,
                ]}
                onPress={() => setTransactionType('location')}>
                <Text
                  style={[
                    styles.transactionOptionText,
                    transactionType === 'location' && styles.transactionOptionTextActive,
                  ]}>
                  Location
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 2 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>TYPE DE BIEN ET PROJET</Text>
              <View style={styles.propertyTypeGrid}>
                {PROPERTY_TYPES.map((type) => {
                  const active = propertyType === type.key;
                  return (
                    <Pressable
                      key={type.key}
                      style={[styles.propertyTypeCard, active && styles.propertyTypeCardActive]}
                      onPress={() => setPropertyType(type.key)}>
                      <View style={[styles.propertyTypeIconBox, active && styles.propertyTypeIconBoxActive]}>
                        <MaterialIcons
                          name={type.icon}
                          size={22}
                          color={active ? colors.white : colors.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.propertyTypeLabel,
                          active && styles.propertyTypeLabelActive,
                        ]}>
                        {type.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.transactionRowCompact}>
                <Pressable
                  style={[
                    styles.transactionOptionCompact,
                    transactionType === 'achat' && styles.transactionOptionActive,
                  ]}
                  onPress={() => setTransactionType('achat')}>
                  <Text
                    style={[
                      styles.transactionOptionText,
                      transactionType === 'achat' && styles.transactionOptionTextActive,
                    ]}>
                    Achat
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.transactionOptionCompact,
                    transactionType === 'location' && styles.transactionOptionActive,
                  ]}
                  onPress={() => setTransactionType('location')}>
                  <Text
                    style={[
                      styles.transactionOptionText,
                      transactionType === 'location' && styles.transactionOptionTextActive,
                    ]}>
                    Location
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Titre de l'annonce</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} />
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.field, { flex: 1.3 }]}>
                  <Text style={styles.fieldLabel}>Prix</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={styles.inputFlex}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputSuffix}>FCFA</Text>
                  </View>
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Surface</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={styles.inputFlex}
                      value={surface}
                      onChangeText={setSurface}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputSuffix}>m²</Text>
                  </View>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Quartier et ville</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialIcons name="location-on" size={19} color={colors.primary} />
                  <TextInput
                    style={styles.inputFlex}
                    value={neighborhood}
                    onChangeText={setNeighborhood}
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.counterBox, { flex: 1 }]}>
                  <MaterialIcons name="bed" size={18} color={colors.primary} />
                  <Text style={styles.counterValue}>{bedrooms}</Text>
                  <Pressable onPress={() => setBedrooms(Math.max(0, bedrooms - 1))}>
                    <Text style={styles.counterMinus}>−</Text>
                  </Pressable>
                  <Pressable onPress={() => setBedrooms(bedrooms + 1)}>
                    <Text style={styles.counterPlus}>+</Text>
                  </Pressable>
                </View>
                <View style={[styles.counterBox, { flex: 1 }]}>
                  <MaterialIcons name="shower" size={18} color={colors.primary} />
                  <Text style={styles.counterValue}>{bathrooms}</Text>
                  <Pressable onPress={() => setBathrooms(Math.max(0, bathrooms - 1))}>
                    <Text style={styles.counterMinus}>−</Text>
                  </Pressable>
                  <Pressable onPress={() => setBathrooms(bathrooms + 1)}>
                    <Text style={styles.counterPlus}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.photosHeader}>
                <Text style={styles.fieldLabel}>Photos</Text>
                <Text style={styles.photosCount}>{photoCount} / 12 · min. 4 requises</Text>
              </View>
              <View style={styles.photosRow}>
                {Array.from({ length: photoCount }).map((_, index) => (
                  <View key={index} style={styles.photoThumb}>
                    {index === 0 && (
                      <View style={styles.photoCoverBadge}>
                        <Text style={styles.photoCoverBadgeText}>COUV.</Text>
                      </View>
                    )}
                  </View>
                ))}
                <Pressable
                  style={styles.addPhotoButton}
                  onPress={() => setPhotoCount(Math.min(12, photoCount + 1))}>
                  <MaterialIcons name="add-a-photo" size={22} color={colors.primaryDark} />
                  <Text style={styles.addPhotoText}>Ajouter</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez le bien : atouts, quartier, équipements…"
                placeholderTextColor={colors.textLight}
                multiline
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>RÉCAPITULATIF</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type</Text>
                <Text style={styles.summaryValue}>
                  {propertyLabel} · {transactionLabel}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Titre</Text>
                <Text style={styles.summaryValue}>{title || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Prix</Text>
                <Text style={styles.summaryValue}>{price ? `${price} FCFA` : '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Surface</Text>
                <Text style={styles.summaryValue}>{surface ? `${surface} m²` : '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Localisation</Text>
                <Text style={styles.summaryValue}>{neighborhood || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Chambres / douches</Text>
                <Text style={styles.summaryValue}>
                  {bedrooms} ch. · {bathrooms} douche{bathrooms > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryLabel}>Photos</Text>
                <Text style={styles.summaryValue}>{photoCount}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.saveButton} onPress={saveDraft}>
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </Pressable>
        <Pressable style={styles.continueButton} onPress={goNext}>
          <Text style={styles.continueButtonText}>{step < 3 ? 'Continuer' : 'Publier'}</Text>
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
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  headerRef: { fontSize: 12, fontWeight: '700', color: colors.textLight, marginTop: 1 },
  draftLink: { fontSize: 13, fontWeight: '800', color: colors.primary },
  progressRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressSegment: { flex: 1, height: 5, borderRadius: 99, backgroundColor: '#E0E4E1' },
  progressSegmentActive: { backgroundColor: colors.primary },
  progressLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
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
  propertyTypeGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  propertyTypeCard: {
    width: '31%',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  propertyTypeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  propertyTypeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  propertyTypeIconBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  propertyTypeLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'center' },
  propertyTypeLabelActive: { color: colors.white, fontWeight: '800' },
  transactionRow: { marginTop: 10, flexDirection: 'row', gap: 8, backgroundColor: colors.background, borderRadius: 10, padding: 4 },
  transactionRowCompact: { marginTop: 9, flexDirection: 'row', gap: 8, backgroundColor: colors.background, borderRadius: 10, padding: 4 },
  transactionOption: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  transactionOptionCompact: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  transactionOptionActive: { backgroundColor: colors.primary },
  transactionOptionText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  transactionOptionTextActive: { color: colors.white, fontWeight: '800' },
  field: { gap: 6 },
  fieldRow: { marginTop: 10, flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#374151' },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  inputWithSuffix: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  inputWithIcon: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  inputFlex: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text, padding: 0 },
  inputSuffix: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
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
  photosHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  photosCount: { fontSize: 11, fontWeight: '700', color: colors.textLight },
  photosRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  photoThumb: { width: 66, height: 66, borderRadius: 10, backgroundColor: '#E9EDEA', position: 'relative' },
  photoCoverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
  },
  photoCoverBadgeText: { fontSize: 9, fontWeight: '800', color: colors.white },
  addPhotoButton: {
    flex: 1,
    minWidth: 66,
    height: 66,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  addPhotoText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  descriptionInput: {
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  summaryRow: {
    marginTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryLabel: { fontSize: 13, color: colors.textMuted },
  summaryValue: { fontSize: 13, fontWeight: '800', color: colors.text, flexShrink: 1, textAlign: 'right' },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    flexDirection: 'row',
    gap: 10,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 4,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#F0F2F0',
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 15, fontWeight: '800', color: '#374151' },
  continueButton: {
    flex: 1.4,
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
  continueButtonText: { fontSize: 15, fontWeight: '800', color: colors.white },
});