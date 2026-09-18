import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { getListingById } from '../../src/data/listings';

export default function AnnonceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listing = getListingById(id);
  const { width, height } = useWindowDimensions();
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const galleryRef = useRef<ScrollView>(null);
  const lightboxRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (lightboxVisible) {
      requestAnimationFrame(() => {
        lightboxRef.current?.scrollTo({ x: activeImage * width, animated: false });
      });
    }
  }, [lightboxVisible]);

  if (!listing) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Annonce introuvable.</Text>
        <Link href="/" asChild>
          <Pressable>
            <Text style={styles.notFoundLink}>Retour à l'accueil</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const isLocation = listing.type === 'LOCATION';

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeImage) setActiveImage(index);
  };

  const goToImage = (index: number) => {
    galleryRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveImage(index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.gallery}>
        <ScrollView
          ref={galleryRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}>
          {listing.images.map((image, index) => (
            <Pressable key={index} onPress={() => setLightboxVisible(true)}>
              <Image source={image} style={{ width, height: 300 }} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>

        {activeImage > 0 && (
          <Pressable style={styles.navButtonLeft} onPress={() => goToImage(activeImage - 1)}>
            <MaterialIcons name="chevron-left" size={26} color={colors.text} />
          </Pressable>
        )}
        {activeImage < listing.images.length - 1 && (
          <Pressable style={styles.navButtonRight} onPress={() => goToImage(activeImage + 1)}>
            <MaterialIcons name="chevron-right" size={26} color={colors.text} />
          </Pressable>
        )}

        <View style={styles.dotsRow}>
          {listing.images.map((_, index) => (
            <View key={index} style={[styles.dot, index === activeImage && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.photoCountBadge}>
          <MaterialIcons name="photo-camera" size={14} color={colors.white} />
          <Text style={styles.photoCountText}>
            {activeImage + 1}/{listing.images.length}
          </Text>
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={styles.galleryActions}>
          <Pressable style={styles.galleryActionButton}>
            <MaterialIcons name="share" size={20} color={colors.text} />
          </Pressable>
          <Pressable style={styles.galleryActionButton}>
            <MaterialIcons
              name={listing.favorite ? 'favorite' : 'favorite-border'}
              size={20}
              color={listing.favorite ? colors.primary : colors.text}
            />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={lightboxVisible}
        animationType="fade"
        onRequestClose={() => setLightboxVisible(false)}>
        <View style={styles.lightboxContainer}>
          <Pressable style={styles.lightboxCloseButton} onPress={() => setLightboxVisible(false)}>
            <MaterialIcons name="close" size={26} color={colors.white} />
          </Pressable>

          <ScrollView
            ref={lightboxRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}>
            {listing.images.map((image, index) => (
              <Image key={index} source={image} style={{ width, height }} resizeMode="contain" />
            ))}
          </ScrollView>

          <View style={styles.lightboxDotsRow}>
            {listing.images.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeImage && styles.dotActive]} />
            ))}
          </View>
          <Text style={styles.lightboxCounter}>
            {activeImage + 1}/{listing.images.length}
          </Text>
        </View>
      </Modal>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, isLocation && styles.typeBadgeLocation]}>
            <Text style={[styles.typeBadgeText, isLocation && styles.typeBadgeTextLocation]}>
              {listing.type}
            </Text>
          </View>
          <Text style={styles.metaText}>
            Réf. {listing.reference} · {listing.publishedAgo}
          </Text>
        </View>

        <Text style={styles.title}>{listing.title}</Text>

        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={17} color={colors.primary} />
          <Text style={styles.addressText}>{listing.fullAddress}</Text>
        </View>

        <Text style={styles.price}>
          {listing.price}
          {listing.priceSuffix ? <Text style={styles.priceSuffix}> {listing.priceSuffix}</Text> : null}
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statTile}>
            <MaterialIcons name="bed" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{listing.beds}</Text>
            <Text style={styles.statLabel}>chambres</Text>
          </View>
          <View style={styles.statTile}>
            <MaterialIcons name="shower" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{listing.showers}</Text>
            <Text style={styles.statLabel}>douches</Text>
          </View>
          <View style={styles.statTile}>
            <MaterialIcons name="square-foot" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{listing.area}</Text>
            <Text style={styles.statLabel}>m²</Text>
          </View>
          <View style={styles.statTile}>
            <MaterialIcons name="directions-car" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{listing.parkings}</Text>
            <Text style={styles.statLabel}>parkings</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{listing.description}</Text>

        <View style={styles.agentCard}>
          <View style={styles.agentAvatar} />
          <View style={styles.agentInfo}>
            <View style={styles.agentNameRow}>
              <Text style={styles.agentName}>{listing.agent.name}</Text>
              {listing.agent.verified && (
                <MaterialIcons name="verified" size={16} color={colors.primary} />
              )}
            </View>
            <Text style={styles.agentRole}>
              {listing.agent.role} · {listing.agent.rating.toFixed(1)} ★ ({listing.agent.reviewsCount} avis)
            </Text>
          </View>
          <Pressable style={styles.agentActionButton}>
            <MaterialIcons name="call" size={20} color={colors.primaryDark} />
          </Pressable>
          <Pressable style={styles.agentActionButton}>
            <MaterialIcons name="chat-bubble" size={20} color={colors.primaryDark} />
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>{listing.nextSlot.label}</Text>
          <Text style={styles.footerValue}>{listing.nextSlot.value}</Text>
        </View>
        <Pressable style={styles.footerButton}>
          <Text style={styles.footerButtonText}>Prendre rendez-vous</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  notFoundText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  notFoundLink: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  gallery: {
    height: 300,
    backgroundColor: '#E9EDEA',
    position: 'relative',
    overflow: 'hidden',
  },
  navButtonLeft: {
    position: 'absolute',
    top: '50%',
    left: 12,
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonRight: {
    position: 'absolute',
    top: '50%',
    right: 12,
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,.65)',
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.white,
  },
  photoCountBadge: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryActions: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  galleryActionButton: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  lightboxCloseButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxDotsRow: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  lightboxCounter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeBadgeLocation: {
    backgroundColor: '#F0F2F0',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  typeBadgeTextLocation: {
    color: '#374151',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
  },
  title: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  addressRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addressText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  price: {
    marginTop: 12,
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  priceSuffix: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statsGrid: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
  },
  statValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  description: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 22,
    color: '#4b5563',
  },
  agentCard: {
    marginTop: 18,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 99,
    backgroundColor: '#E9EDEA',
  },
  agentInfo: {
    flex: 1,
    minWidth: 0,
  },
  agentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  agentName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  agentRole: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  agentActionButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 4,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  footerValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  footerButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});