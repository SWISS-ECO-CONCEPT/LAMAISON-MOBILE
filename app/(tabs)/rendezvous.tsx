import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-expo';
import { useStableGetToken } from '../../src/lib/useStableGetToken';
import { showError } from '../../src/lib/dialogs';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { mapAnnonceToListing } from '../../src/data/listings';
import {
  getRdvsByProspect,
  acceptProposal,
  rejectProposal,
  cancelRdv,
  type RdvApi,
} from '../../src/services/rdvService';
import { formatDateBadge, formatTimeOnly } from '../../src/utils/time';

const FILTERS = [
  { key: 'all', labelKey: 'appointments.filterAll' },
  { key: 'pending', labelKey: 'appointments.filterPending' },
  { key: 'accepted', labelKey: 'appointments.filterAccepted' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

// Avant : liste 100% mockée (src/data/appointments.ts), les actions
// (accepter/refuser/annuler) ne faisaient qu'un console.log. Maintenant
// branché sur GET /rdvs + les routes dédiées (/proposal/accept, /proposal/
// reject, DELETE /rdvs/:id). Ce qui disparaît avec le mock, faute
// d'équivalent réel : le bouton "Itinéraire" (aucune adresse précise ni
// intégration carte), et le message libre de l'agent lors d'une
// proposition (le serveur envoie son propre message automatique dans la
// messagerie -- /rdvs/:id/propose n'accepte qu'une date, pas de texte).
export default function RendezVousScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { userId: clerkId } = useAuth();
  const getToken = useStableGetToken();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [rdvs, setRdvs] = useState<RdvApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOnId, setActingOnId] = useState<number | null>(null);

  const loadRdvs = useCallback(async () => {
    if (!clerkId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error(t('common.sessionExpired'));
      const data = await getRdvsByProspect(clerkId, token);
      setRdvs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('appointments.loadError'));
    } finally {
      setLoading(false);
    }
  }, [clerkId, getToken, t]);

  useEffect(() => {
    loadRdvs();
  }, [loadRdvs]);

  const visibleRdvs = rdvs.filter((rdv) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'accepted') return rdv.status === 'ACCEPTE';
    return rdv.status === 'EN_ATTENTE' || rdv.status === 'PROPOSE';
  });

  const goToConversation = (rdv: RdvApi) => {
    const owner = rdv.annonce?.proprietaire;
    if (!owner) return;
    router.push({
      pathname: '/conversation/[id]',
      params: {
        id: String(owner.id),
        name: owner.firstname ?? t('common.owner'),
        subtitle: owner.role === 'AGENT' ? t('common.roleAgent') : t('common.roleProspect'),
      },
    });
  };

  const runAction = async (rdv: RdvApi, action: (id: number, token: string) => Promise<unknown>) => {
    setActingOnId(rdv.id);
    try {
      const token = await getToken();
      if (!token) throw new Error(t('common.sessionExpired'));
      await action(rdv.id, token);
      await loadRdvs();
    } catch (err) {
      // L'agent/le prospect doit savoir que son action n'a pas abouti -- un
      // simple log console laissait croire que le clic avait fonctionné.
      showError(t('appointments.actionFailed'), err instanceof Error ? err.message : t('appointments.actionError'));
    } finally {
      setActingOnId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('appointments.title')}</Text>
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.key)}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {t(filter.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Spinner plein écran au premier chargement seulement : après une
          action (accepter, refuser...), loadRdvs() recharge en gardant la
          liste affichée, sinon elle disparaîtrait un instant (effet flash). */}
      {loading && rdvs.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadRdvs}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {visibleRdvs.length === 0 ? (
            <Text style={styles.emptyText}>{t('appointments.empty')}</Text>
          ) : (
            visibleRdvs.map((rdv) => {
              const listing = rdv.annonce ? mapAnnonceToListing(rdv.annonce) : null;
              const acting = actingOnId === rdv.id;

              if (rdv.status === 'PROPOSE' && rdv.proposedDate) {
                const previous = formatDateBadge(rdv.date);
                const proposed = formatDateBadge(rdv.proposedDate);
                return (
                  <View key={rdv.id} style={styles.proposedCard}>
                    <View style={styles.proposedBanner}>
                      <MaterialIcons name="swap-horiz" size={18} color={colors.white} />
                      <Text style={styles.proposedBannerText}>{t('appointments.proposedBanner')}</Text>
                    </View>
                    <View style={styles.proposedBody}>
                      <View style={styles.proposedHeaderRow}>
                        {listing?.images[0] ? (
                          <Image source={{ uri: listing.images[0].uri }} style={styles.thumb} />
                        ) : (
                          <View style={styles.thumb} />
                        )}
                        <View style={styles.proposedInfo}>
                          <Text style={styles.cardTitle}>{listing?.title}</Text>
                          <Text style={styles.cardMeta}>
                            {t('listing.reference', { reference: listing?.reference ?? '' })} · {listing?.location}
                          </Text>
                          <Text style={styles.cardPrice}>{listing?.price}</Text>
                        </View>
                      </View>

                      <View style={styles.slotRow}>
                        <View style={styles.slotBoxPrevious}>
                          <Text style={styles.slotLabelPrevious}>{t('appointments.youRequested')}</Text>
                          <Text style={styles.slotValuePrevious}>
                            {previous.day} {previous.date} {previous.month} · {formatTimeOnly(rdv.date)}
                          </Text>
                        </View>
                        <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
                        <View style={styles.slotBoxProposed}>
                          <Text style={styles.slotLabelProposed}>{t('appointments.agentProposes')}</Text>
                          <Text style={styles.slotValueProposed}>
                            {proposed.day} {proposed.date} {proposed.month} · {formatTimeOnly(rdv.proposedDate)}
                          </Text>
                        </View>
                      </View>

                      <Pressable onPress={() => goToConversation(rdv)}>
                        <Text style={styles.messagingLink}>{t('appointments.seeAgentMessage')}</Text>
                      </Pressable>

                      <View style={styles.actionsRow}>
                        <Pressable
                          style={styles.acceptButton}
                          disabled={acting}
                          onPress={() => runAction(rdv, acceptProposal)}>
                          {acting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.acceptButtonText}>{t('appointments.accept')}</Text>}
                        </Pressable>
                        <Pressable
                          style={styles.declineButton}
                          disabled={acting}
                          onPress={() => runAction(rdv, rejectProposal)}>
                          <Text style={styles.declineButtonText}>{t('appointments.decline')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              }

              const badge = formatDateBadge(rdv.date);
              const pending = rdv.status === 'EN_ATTENTE';
              // PROPOSE est traité plus haut (carte dédiée) ; tout autre statut
              // non final s'affiche « en attente », comme avant.
              const statusKey =
                rdv.status === 'ACCEPTE' || rdv.status === 'REFUSE' || rdv.status === 'ANNULE' ? rdv.status : 'EN_ATTENTE';
              const statusLabel = t(`appointments.status.${statusKey}`);

              return (
                <View key={rdv.id} style={styles.card}>
                  <View style={[styles.dateBadge, pending && styles.dateBadgePending]}>
                    <Text style={[styles.dateBadgeText, pending && styles.dateBadgeTextPending]}>{badge.day}</Text>
                    <Text style={[styles.dateBadgeNumber, pending && styles.dateBadgeNumberPending]}>{badge.date}</Text>
                    <Text style={[styles.dateBadgeText, pending && styles.dateBadgeTextPending]}>{badge.month}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.statusRow}>
                      <MaterialIcons
                        name={rdv.status === 'ACCEPTE' ? 'check-circle' : pending ? 'schedule' : 'cancel'}
                        size={15}
                        color={rdv.status === 'ACCEPTE' ? colors.primary : pending ? colors.warningText : colors.danger}
                      />
                      <Text style={[styles.statusText, pending && styles.statusTextPending]}>
                        {statusLabel} · {formatTimeOnly(rdv.date)}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle}>{listing?.title}</Text>
                    <Text style={styles.cardMeta}>
                      {t('listing.reference', { reference: listing?.reference ?? '' })} · {listing?.location} · {listing?.price}
                    </Text>

                    {rdv.status === 'ACCEPTE' ? (
                      <Pressable style={styles.contactButton} onPress={() => goToConversation(rdv)}>
                        <Text style={styles.contactButtonText}>{t('appointments.contactAgent')}</Text>
                      </Pressable>
                    ) : pending ? (
                      <Pressable disabled={acting} onPress={() => runAction(rdv, cancelRdv)}>
                        <Text style={styles.cancelText}>{acting ? t('appointments.cancelling') : t('appointments.cancelRequest')}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: colors.white },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  filterRow: { marginTop: 14, flexDirection: 'row', gap: 8 },
  filterChip: { backgroundColor: colors.background, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  filterChipTextActive: { color: colors.white },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 14 },
  emptyText: { marginTop: 40, textAlign: 'center', fontSize: 14, color: colors.textMuted },
  proposedCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  proposedBanner: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  proposedBannerText: { fontSize: 12, fontWeight: '800', color: colors.white, letterSpacing: 0.4 },
  proposedBody: { padding: 14 },
  proposedHeaderRow: { flexDirection: 'row', gap: 12 },
  thumb: { width: 66, height: 66, borderRadius: 12, backgroundColor: '#E9EDEA' },
  proposedInfo: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  cardPrice: { marginTop: 4, fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  slotRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  slotBoxPrevious: { flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 11 },
  slotLabelPrevious: { fontSize: 10, fontWeight: '800', color: colors.textLight },
  slotValuePrevious: { marginTop: 3, fontSize: 13, fontWeight: '700', color: colors.textMuted, textDecorationLine: 'line-through' },
  slotBoxProposed: { flex: 1, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 11 },
  slotLabelProposed: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  slotValueProposed: { marginTop: 3, fontSize: 13, fontWeight: '800', color: colors.primaryDarker },
  messagingLink: { marginTop: 12, fontSize: 12, fontWeight: '800', color: colors.primary },
  actionsRow: { marginTop: 14, flexDirection: 'row', gap: 10 },
  acceptButton: { flex: 1.4, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  acceptButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  declineButton: { flex: 1, backgroundColor: colors.background, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  declineButtonText: { color: '#374151', fontSize: 15, fontWeight: '800' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    shadowColor: colors.text,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  dateBadge: { width: 60, borderRadius: 12, backgroundColor: colors.primaryLight, paddingVertical: 9, alignItems: 'center' },
  dateBadgePending: { backgroundColor: colors.warningBackground },
  dateBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  dateBadgeTextPending: { color: colors.warningText },
  dateBadgeNumber: { fontSize: 21, fontWeight: '800', lineHeight: 24, color: colors.primaryDarker },
  dateBadgeNumberPending: { color: colors.warningTextStrong },
  cardInfo: { flex: 1, minWidth: 0 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  statusTextPending: { color: colors.warningText },
  contactButton: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: colors.background, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  contactButtonText: { color: '#374151', fontSize: 12, fontWeight: '800' },
  cancelText: { marginTop: 10, fontSize: 12, fontWeight: '800', color: colors.danger },
});
