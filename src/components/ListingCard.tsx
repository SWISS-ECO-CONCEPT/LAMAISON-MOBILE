import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../config/theme';
import type { Listing } from '../data/listings';

const CARD_IMAGE_HEIGHT = 160;
const LIST_HORIZONTAL_PADDING = 20;

export default function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - LIST_HORIZONTAL_PADDING * 2;
  const [activeImage, setActiveImage] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    if (index !== activeImage) setActiveImage(index);
  };

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/annonce/[id]',
          params: { id: listing.id },
        })
      }>
      <View style={styles.cardImage}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          scrollEnabled={listing.images.length > 1}>
          {listing.images.map((image: any, index: number) => (
            <Image
              key={index}
              source={image}
              style={{ width: cardWidth, height: CARD_IMAGE_HEIGHT }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {listing.images.length > 1 && (
          <View style={styles.imageDotsRow}>
            {listing.images.map((_: any, index: number) => (
              <View
                key={index}
                style={[styles.imageDot, index === activeImage && styles.imageDotActive]}
              />
            ))}
          </View>
        )}

        <Pressable style={styles.favoriteButton}>
          <MaterialIcons
            name={listing.favorite ? 'favorite' : 'favorite-border'}
            size={20}
            color={listing.favorite ? colors.primary : colors.textMuted}
          />
        </Pressable>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice}>
            {listing.price}
            {listing.priceSuffix ? (
              <Text style={styles.cardPriceSuffix}> {listing.priceSuffix}</Text>
            ) : null}
          </Text>
          <View style={[styles.typeBadge, listing.type === 'LOCATION' && styles.typeBadgeLocation]}>
            <Text
              style={[styles.typeBadgeText, listing.type === 'LOCATION' && styles.typeBadgeTextLocation]}>
              {listing.type}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{listing.title}</Text>

        <View style={styles.cardLocationRow}>
          <MaterialIcons name="location-on" size={16} color={colors.textLight} />
          <Text style={styles.cardLocationText}>{listing.location}</Text>
          <Text style={styles.cardReference}>· Réf. {listing.reference}</Text>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <MaterialIcons name="bed" size={18} color={colors.primary} />
            <Text style={styles.cardStatText}>{listing.beds} ch.</Text>
          </View>
          <View style={styles.cardStat}>
            <MaterialIcons name="shower" size={18} color={colors.primary} />
            <Text style={styles.cardStatText}>
              {listing.showers} douche{listing.showers > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.cardStat}>
            <MaterialIcons name="square-foot" size={18} color={colors.primary} />
            <Text style={styles.cardStatText}>{listing.area} m²</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  cardImage: {
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: '#E9EDEA',
    position: 'relative',
    overflow: 'hidden',
  },
  imageDotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  imageDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,.65)',
  },
  imageDotActive: {
    width: 16,
    backgroundColor: colors.white,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 14,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  cardPriceSuffix: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  typeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  cardTitle: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardLocationRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocationText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  cardReference: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
  },
  cardStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F0',
    flexDirection: 'row',
    gap: 16,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardStatText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
});