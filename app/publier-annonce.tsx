import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../src/config/theme';
import { createAnnonce } from '../src/services/annonceService';
import { uploadImage } from '../src/services/imageService';
import { PROPERTY_TYPES, type PropertyType } from '../src/data/propertyTypes';

type TransactionType = 'achat' | 'location';

const MAX_PHOTOS = 12;

// Avant : formulaire 100% visuel -- titre/prix/surface/quartier PRÉREMPLIS
// avec des valeurs fictives ("Villa moderne 4 chambres", "85 000 000"...)
// qu'un agent pressé aurait pu publier sans même s'en rendre compte, un
// compteur de photos qui ne référençait aucune vraie image, et un bouton
// "Publier" qui ne faisait qu'un console.log. Maintenant : champs vides
// (l'utilisateur saisit ses propres données), vraies photos sélectionnées
// via expo-image-picker puis uploadées (POST /images), et un vrai
// POST /annonces/:clerkId à la fin.
export default function PublierAnnonceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { userId: clerkId, getToken } = useAuth();
  const [step, setStep] = useState(1);

  const [propertyType, setPropertyType] = useState<PropertyType>('maison');
  const [transactionType, setTransactionType] = useState<TransactionType>('achat');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [surface, setSurface] = useState('');
  const [ville, setVille] = useState('');
  const [quartier, setQuartier] = useState('');
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [publishedReference, setPublishedReference] = useState<string | null>(null);

  const transactionLabel = transactionType === 'achat' ? t('agent.publishForm.sale') : t('agent.publishForm.rent');
  const propertyLabel = t(`propertyTypes.${propertyType}`);

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage(t('agent.publishForm.photoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const goNext = () => {
    setErrorMessage('');
    if (step === 2 && (!title.trim() || !price.trim() || !ville.trim())) {
      setErrorMessage(t('agent.publishForm.requiredFields'));
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    handlePublish();
  };

  const handlePublish = async () => {
    if (!description.trim()) {
      setErrorMessage(t('agent.publishForm.descriptionRequired'));
      return;
    }
    if (photos.length === 0) {
      setErrorMessage(t('agent.publishForm.photoRequired'));
      return;
    }
    if (!clerkId) {
      setErrorMessage(t('common.sessionExpired'));
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const token = await getToken();
      if (!token) {
        setErrorMessage(t('common.sessionExpired'));
        return;
      }

      // Upload séquentiel -- simple et fiable pour quelques photos ; si l'une
      // échoue, on arrête plutôt que de publier une annonce avec des photos
      // manquantes.
      const uploadedUrls: string[] = [];
      for (const uri of photos) {
        const url = await uploadImage(uri, token);
        uploadedUrls.push(url);
      }

      const annonce = await createAnnonce(
        clerkId,
        {
          titre: title.trim(),
          description: description.trim(),
          prix: Number(price.replace(/\s/g, '')),
          ville: ville.trim(),
          quartier: quartier.trim() || undefined,
          type: propertyType,
          projet: transactionType,
          surface: surface.trim() ? Number(surface) : undefined,
          chambres: bedrooms || undefined,
          douches: bathrooms || undefined,
          images: uploadedUrls,
        },
        token
      );
      setPublishedReference(annonce.bn_reference ?? String(annonce.id));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('agent.publishForm.publishError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (publishedReference) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successState}>
          <MaterialIcons name="check-circle" size={56} color={colors.primary} />
          <Text style={styles.successTitle}>{t('agent.publishForm.successTitle')}</Text>
          <Text style={styles.successText}>
            {t('agent.publishForm.successText', { reference: t('listing.reference', { reference: publishedReference }) })}
          </Text>
          <Pressable style={styles.continueButtonFull} onPress={() => router.back()}>
            <Text style={styles.continueButtonText}>{t('agent.publishForm.back')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{t('agent.publishForm.title')}</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          {[1, 2, 3].map((index) => (
            <View key={index} style={[styles.progressSegment, index <= step && styles.progressSegmentActive]} />
          ))}
          <Text style={styles.progressLabel}>{t('agent.publishForm.step', { step })}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('agent.publishForm.propertyType')}</Text>
            <View style={styles.propertyTypeGrid}>
              {PROPERTY_TYPES.map((type) => {
                const active = propertyType === type.key;
                return (
                  <Pressable
                    key={type.key}
                    style={[styles.propertyTypeCard, active && styles.propertyTypeCardActive]}
                    onPress={() => setPropertyType(type.key)}>
                    <View style={[styles.propertyTypeIconBox, active && styles.propertyTypeIconBoxActive]}>
                      <MaterialIcons name={type.icon} size={22} color={active ? colors.white : colors.primary} />
                    </View>
                    <Text style={[styles.propertyTypeLabel, active && styles.propertyTypeLabelActive]}>
                      {t(`propertyTypes.${type.key}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.cardLabel, { marginTop: 18 }]}>{t('agent.publishForm.project')}</Text>
            <View style={styles.transactionRow}>
              <Pressable
                style={[styles.transactionOption, transactionType === 'achat' && styles.transactionOptionActive]}
                onPress={() => setTransactionType('achat')}>
                <Text style={[styles.transactionOptionText, transactionType === 'achat' && styles.transactionOptionTextActive]}>
                  {t('agent.publishForm.sale')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.transactionOption, transactionType === 'location' && styles.transactionOptionActive]}
                onPress={() => setTransactionType('location')}>
                <Text style={[styles.transactionOptionText, transactionType === 'location' && styles.transactionOptionTextActive]}>
                  {t('agent.publishForm.rent')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 2 && (
          <>
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('agent.publishForm.listingTitle')}</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t('agent.publishForm.listingTitlePlaceholder')} placeholderTextColor={colors.textLight} />
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.field, { flex: 1.3 }]}>
                  <Text style={styles.fieldLabel}>{t('agent.publishForm.price')}</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={styles.inputFlex}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textLight}
                    />
                    <Text style={styles.inputSuffix}>FCFA</Text>
                  </View>
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>{t('agent.publishForm.surface')}</Text>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      style={styles.inputFlex}
                      value={surface}
                      onChangeText={setSurface}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textLight}
                    />
                    <Text style={styles.inputSuffix}>m²</Text>
                  </View>
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>{t('filters.city')}</Text>
                  <View style={styles.inputWithIcon}>
                    <MaterialIcons name="location-on" size={19} color={colors.primary} />
                    <TextInput style={styles.inputFlex} value={ville} onChangeText={setVille} placeholder="Douala" placeholderTextColor={colors.textLight} />
                  </View>
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>{t('filters.district')}</Text>
                  <View style={styles.inputWithIcon}>
                    <TextInput style={styles.inputFlex} value={quartier} onChangeText={setQuartier} placeholder={t('agent.publishForm.optional')} placeholderTextColor={colors.textLight} />
                  </View>
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
                <Text style={styles.fieldLabel}>{t('agent.publishForm.photos')}</Text>
                <Text style={styles.photosCount}>{photos.length} / {MAX_PHOTOS} · min. 1 requise</Text>
              </View>
              <View style={styles.photosRow}>
                {photos.map((uri, index) => (
                  <View key={uri} style={styles.photoThumb}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    {index === 0 && (
                      <View style={styles.photoCoverBadge}>
                        <Text style={styles.photoCoverBadgeText}>{t('agent.publishForm.coverBadge')}</Text>
                      </View>
                    )}
                    <Pressable style={styles.photoRemoveButton} onPress={() => removePhoto(uri)}>
                      <MaterialIcons name="close" size={14} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <Pressable style={styles.addPhotoButton} onPress={pickPhotos}>
                    <MaterialIcons name="add-a-photo" size={22} color={colors.primaryDark} />
                    <Text style={styles.addPhotoText}>{t('agent.publishForm.addPhoto')}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>{t('listing.description')}</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder={t('agent.publishForm.descriptionPlaceholder')}
                placeholderTextColor={colors.textLight}
                multiline
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('agent.publishForm.summary')}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('agent.publishForm.summaryType')}</Text>
                <Text style={styles.summaryValue}>{propertyLabel} · {transactionLabel}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('agent.publishForm.summaryTitle')}</Text>
                <Text style={styles.summaryValue}>{title || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('agent.publishForm.price')}</Text>
                <Text style={styles.summaryValue}>{price ? `${price} FCFA` : '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('agent.publishForm.surface')}</Text>
                <Text style={styles.summaryValue}>{surface ? `${surface} m²` : '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('agent.publishForm.summaryLocation')}</Text>
                <Text style={styles.summaryValue}>{quartier ? `${quartier}, ${ville}` : ville || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('agent.publishForm.summaryRooms')}</Text>
                <Text style={styles.summaryValue}>
                  {t('listing.bedsShort', { count: bedrooms })} · {t('listing.showers', { count: bathrooms })}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryLabel}>{t('agent.publishForm.photos')}</Text>
                <Text style={styles.summaryValue}>{photos.length}</Text>
              </View>
            </View>
          </>
        )}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={submitting}>
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </Pressable>
        <Pressable style={[styles.continueButton, submitting && styles.continueButtonDisabled]} onPress={goNext} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.continueButtonText}>{step < 3 ? t('agent.publishForm.continue') : t('agent.publish')}</Text>}
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
  propertyTypeIconBoxActive: { backgroundColor: 'rgba(255, 255, 255, 0.22)' },
  propertyTypeLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'center' },
  propertyTypeLabelActive: { color: colors.white, fontWeight: '800' },
  transactionRow: { marginTop: 10, flexDirection: 'row', gap: 8, backgroundColor: colors.background, borderRadius: 10, padding: 4 },
  transactionOption: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
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
  photosRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: 66, height: 66, borderRadius: 10, backgroundColor: '#E9EDEA', position: 'relative', overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoCoverBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: colors.primary, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 4 },
  photoCoverBadgeText: { fontSize: 9, fontWeight: '800', color: colors.white },
  photoRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 99,
    backgroundColor: 'rgba(17,24,39,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 66,
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
  errorText: { fontSize: 13, fontWeight: '700', color: colors.danger, textAlign: 'center' },
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
  cancelButton: { flex: 1, backgroundColor: '#F0F2F0', borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  cancelButtonText: { fontSize: 15, fontWeight: '800', color: '#374151' },
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
  continueButtonDisabled: { opacity: 0.7 },
  continueButtonFull: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  continueButtonText: { fontSize: 15, fontWeight: '800', color: colors.white },
  successState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  successText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
