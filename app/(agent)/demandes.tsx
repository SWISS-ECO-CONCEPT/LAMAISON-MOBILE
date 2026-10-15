import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { mapAnnonceToListing } from '../../src/data/listings';
import {
  getRdvsByAgent,
  acceptRdv,
  rejectRdv,
  proposeRdv,
  type RdvApi,
} from '../../src/services/rdvService';
import { formatDateBadge, formatDateTime, formatRelativeTime, formatTimeOnly } from '../../src/utils/time';

const FILTERS = [
  { key: 'pending', label: 'En attente' },
  { key: 'accepted', label: 'Acceptés' },
  { key: 'history', label: 'Historique' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

// Avant : AGENT_REQUESTS mocké, aucune action réelle (console.log),
// l'onglet "Historique" était câblé pour ne JAMAIS rien afficher. Maintenant
// branché sur GET /rdvs?agentClerkId=... + /accept, /reject, /propose. Le
// sélecteur de créneau à cases fixes ("MAR 22", "10h00"...) disparaît : il
// n'existe aucun calcul de disponibilité côté backend, remplacé par une
// vraie saisie de date/heure. Le champ "message" de la proposition
// disparaît aussi -- /rdvs/:id/propose n'accepte qu'une date, le serveur
// génère lui-même le message automatique envoyé dans la messagerie.
export default function AgentDemandesScreen() {
  const router = useRouter();
  const { userId: clerkId, getToken } = useAuth();
  const { user: dbUser } = useAuthContext();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('pending');
  const [rdvs, setRdvs] = useState<RdvApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOnId, setActingOnId] = useState<number | null>(null);

  const [rescheduleRdv, setRescheduleRdv] = useState<RdvApi | null>(null);
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const loadRdvs = useCallback(async () => {
    if (!clerkId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getRdvsByAgent(clerkId, token);
      setRdvs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des demandes.');
    } finally {
      setLoading(false);
    }
  }, [clerkId, getToken]);

  useEffect(() => {
    loadRdvs();
  }, [loadRdvs]);

  const pendingCount = rdvs.filter((r) => r.status === 'EN_ATTENTE' || r.status === 'PROPOSE').length;
  const acceptedCount = rdvs.filter((r) => r.status === 'ACCEPTE').length;

  const visibleRdvs = rdvs.filter((rdv) => {
    if (activeFilter === 'history') return rdv.status === 'REFUSE' || rdv.status === 'ANNULE';
    if (activeFilter === 'accepted') return rdv.status === 'ACCEPTE';
    return rdv.status === 'EN_ATTENTE' || rdv.status === 'PROPOSE';
  });

  const runAction = async (rdv: RdvApi, action: (id: number, token: string) => Promise<unknown>) => {
    setActingOnId(rdv.id);
    try {
      const token = await getToken();
      if (!token) return;
      await action(rdv.id, token);
      await loadRdvs();
    } catch (err) {
      console.error('Erreur action RDV', err);
    } finally {
      setActingOnId(null);
    }
  };

  const openReschedule = (rdv: RdvApi) => {
    setDate('');
    setHeure('');
    setRescheduleError('');
    setRescheduleRdv(rdv);
  };

  const sendProposal = async () => {
    if (!rescheduleRdv) return;
    setRescheduleError('');
    const dateMatch = date.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const timeMatch = heure.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!dateMatch || !timeMatch) {
      setRescheduleError('Date ou heure invalide -- utilisez JJ/MM/AAAA et HH:MM.');
      return;
    }
    const [, day, month, year] = dateMatch;
    const [, hour, minute] = timeMatch;
    const proposed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    if (Number.isNaN(proposed.getTime()) || proposed.getTime() < Date.now()) {
      setRescheduleError('La date proposée doit être valide et dans le futur.');
      return;
    }

    setRescheduling(true);
    try {
      const token = await getToken();
      if (!token) return;
      await proposeRdv(rescheduleRdv.id, proposed.toISOString(), token);
      setRescheduleRdv(null);
      await loadRdvs();
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : 'Erreur lors de la proposition de créneau.');
    } finally {
      setRescheduling(false);
    }
  };

  const goToConversation = (rdv: RdvApi) => {
    const prospect = rdv.prospect;
    if (!prospect) return;
    router.push({
      pathname: '/conversation/[id]',
      params: { id: String(prospect.id), name: prospect.firstname ?? 'Client', subtitle: 'Particulier' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Demandes de visite</Text>
            {dbUser?.firstname ? <Text style={styles.subtitle}>{dbUser.firstname}</Text> : null}
          </View>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            const count = filter.key === 'pending' ? pendingCount : filter.key === 'accepted' ? acceptedCount : null;
            return (
              <Pressable
                key={filter.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.key)}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter.label}
                  {count !== null ? ` (${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadRdvs}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {visibleRdvs.length === 0 ? (
            <Text style={styles.emptyText}>Aucune demande ici pour l'instant.</Text>
          ) : (
            visibleRdvs.map((rdv) => {
              const listing = rdv.annonce ? mapAnnonceToListing(rdv.annonce) : null;
              const acting = actingOnId === rdv.id;

              if (rdv.status === 'EN_ATTENTE') {
                return (
                  <View key={rdv.id} style={styles.requestCard}>
                    <View style={styles.requestHeaderRow}>
                      <View style={styles.avatar} />
                      <View style={styles.requestHeaderInfo}>
                        <Text style={styles.clientName}>{rdv.prenom} {rdv.nom}</Text>
                        <Text style={styles.clientMeta}>Reçue {formatRelativeTime(rdv.createdAt)}</Text>
                      </View>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>EN ATTENTE</Text>
                      </View>
                    </View>

                    <View style={styles.listingRow}>
                      {listing?.images[0] ? (
                        <Image source={{ uri: listing.images[0].uri }} style={styles.listingThumb} />
                      ) : (
                        <View style={styles.listingThumb} />
                      )}
                      <View style={styles.listingInfo}>
                        <Text style={styles.listingTitle}>{listing?.title}</Text>
                        <Text style={styles.listingMeta}>
                          Réf. {listing?.reference} · {listing?.location} · {listing?.price}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.slotRow}>
                      <MaterialIcons name="event" size={19} color={colors.primary} />
                      <Text style={styles.slotText}>Créneau demandé : {formatDateTime(rdv.date)}</Text>
                    </View>

                    {rdv.message ? <Text style={styles.messageText}>« {rdv.message} »</Text> : null}

                    <View style={styles.actionsRow}>
                      <Pressable style={styles.acceptButton} disabled={acting} onPress={() => runAction(rdv, acceptRdv)}>
                        {acting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.acceptButtonText}>Accepter</Text>}
                      </Pressable>
                      <Pressable style={styles.declineButton} disabled={acting} onPress={() => runAction(rdv, rejectRdv)}>
                        <Text style={styles.declineButtonText}>Refuser</Text>
                      </Pressable>
                    </View>

                    <Pressable style={styles.rescheduleButton} onPress={() => openReschedule(rdv)}>
                      <MaterialIcons name="swap-horiz" size={18} color={colors.primaryDark} />
                      <Text style={styles.rescheduleButtonText}>Proposer un autre créneau</Text>
                    </Pressable>
                  </View>
                );
              }

              if (rdv.status === 'PROPOSE') {
                return (
                  <View key={rdv.id} style={styles.requestCard}>
                    <View style={styles.requestHeaderRow}>
                      <View style={styles.avatar} />
                      <View style={styles.requestHeaderInfo}>
                        <Text style={styles.clientName}>{rdv.prenom} {rdv.nom}</Text>
                        <Text style={styles.clientMeta}>{listing?.title}</Text>
                      </View>
                      <View style={styles.proposedBadge}>
                        <Text style={styles.proposedBadgeText}>EN ATTENTE DU CLIENT</Text>
                      </View>
                    </View>
                    <Text style={styles.waitingText}>
                      Créneau proposé : {rdv.proposedDate ? formatDateTime(rdv.proposedDate) : '—'}
                    </Text>
                  </View>
                );
              }

              // ACCEPTE, REFUSE, ANNULE
              return (
                <View key={rdv.id} style={styles.acceptedCard}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>{formatDateBadge(rdv.date).day}</Text>
                    <Text style={styles.dateBadgeNumber}>{formatDateBadge(rdv.date).date}</Text>
                    <Text style={styles.dateBadgeText}>{formatDateBadge(rdv.date).month}</Text>
                  </View>
                  <View style={styles.acceptedInfo}>
                    <View style={styles.acceptedStatusRow}>
                      <MaterialIcons
                        name={rdv.status === 'ACCEPTE' ? 'check-circle' : 'cancel'}
                        size={15}
                        color={rdv.status === 'ACCEPTE' ? colors.primary : colors.danger}
                      />
                      <Text style={styles.acceptedStatusText}>
                        {rdv.status === 'ACCEPTE' ? 'ACCEPTÉ' : rdv.status === 'REFUSE' ? 'REFUSÉ' : 'ANNULÉ'} · {formatTimeOnly(rdv.date)}
                      </Text>
                    </View>
                    <Text style={styles.listingTitle}>
                      {rdv.prenom} {rdv.nom} · {listing?.title}
                    </Text>
                    <Text style={styles.listingMeta}>
                      Réf. {listing?.reference} · {listing?.location} · {listing?.price}
                    </Text>
                    {rdv.status === 'ACCEPTE' ? (
                      <Pressable style={styles.contactButton} onPress={() => goToConversation(rdv)}>
                        <Text style={styles.contactButtonText}>Contacter le client</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal
        visible={rescheduleRdv !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleRdv(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setRescheduleRdv(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Proposer un autre créneau</Text>
          <Text style={styles.sheetSubtitle}>
            {rescheduleRdv?.prenom} {rescheduleRdv?.nom} recevra la proposition et pourra l'accepter ou la refuser.
          </Text>

          <View style={styles.initialRequestBox}>
            <Text style={styles.initialRequestLabel}>DEMANDE INITIALE</Text>
            <Text style={styles.initialRequestValue}>
              {rescheduleRdv ? formatDateTime(rescheduleRdv.date) : ''}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.fieldHalf]}>
              <Text style={styles.sheetSectionLabel}>Nouvelle date</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
            </View>
            <View style={[styles.field, styles.fieldHalf]}>
              <Text style={styles.sheetSectionLabel}>Heure</Text>
              <TextInput style={styles.input} value={heure} onChangeText={setHeure} placeholder="HH:MM" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
            </View>
          </View>

          {rescheduleError ? <Text style={styles.rescheduleErrorText}>{rescheduleError}</Text> : null}

          <Pressable style={styles.sendButton} onPress={sendProposal} disabled={rescheduling}>
            {rescheduling ? <ActivityIndicator color={colors.white} /> : <Text style={styles.sendButtonText}>Envoyer la proposition</Text>}
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, backgroundColor: colors.white },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 3, fontSize: 13, color: colors.textMuted },
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
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  requestCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  requestHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 99, backgroundColor: '#E9EDEA' },
  requestHeaderInfo: { flex: 1, minWidth: 0 },
  clientName: { fontSize: 15, fontWeight: '800', color: colors.text },
  clientMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  pendingBadge: { backgroundColor: colors.warningBackground, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 },
  pendingBadgeText: { fontSize: 11, fontWeight: '800', color: colors.warningText },
  proposedBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 },
  proposedBadgeText: { fontSize: 11, fontWeight: '800', color: colors.primaryDark },
  waitingText: { marginTop: 10, fontSize: 13, fontWeight: '700', color: colors.textMuted },
  listingRow: { marginTop: 12, backgroundColor: colors.background, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  listingThumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#E0E5E2' },
  listingInfo: { flex: 1, minWidth: 0 },
  listingTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  listingMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  slotRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotText: { fontSize: 14, fontWeight: '800', color: colors.text },
  messageText: { marginTop: 8, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  actionsRow: { marginTop: 14, flexDirection: 'row', gap: 8 },
  acceptButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  acceptButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  declineButton: { flex: 1, backgroundColor: '#F0F2F0', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  declineButtonText: { color: '#374151', fontSize: 14, fontWeight: '800' },
  rescheduleButton: {
    marginTop: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  rescheduleButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  acceptedCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
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
  dateBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  dateBadgeNumber: { fontSize: 21, fontWeight: '800', lineHeight: 24, color: colors.primaryDarker },
  acceptedInfo: { flex: 1, minWidth: 0 },
  acceptedStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acceptedStatusText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  contactButton: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: colors.background, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  contactButtonText: { color: '#374151', fontSize: 12, fontWeight: '800' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30 },
  sheetHandle: { width: 40, height: 4, borderRadius: 99, backgroundColor: '#E0E4E1', alignSelf: 'center' },
  sheetTitle: { marginTop: 16, fontSize: 20, fontWeight: '800', color: colors.text },
  sheetSubtitle: { marginTop: 5, fontSize: 13, lineHeight: 20, color: colors.textMuted },
  initialRequestBox: { marginTop: 18, backgroundColor: colors.background, borderRadius: 12, padding: 12 },
  initialRequestLabel: { fontSize: 10, fontWeight: '800', color: colors.textLight },
  initialRequestValue: { marginTop: 3, fontSize: 14, fontWeight: '700', color: colors.textMuted },
  row: { flexDirection: 'row', gap: 12 },
  field: { marginTop: 18, gap: 6 },
  fieldHalf: { flex: 1 },
  sheetSectionLabel: { fontSize: 13, fontWeight: '800', color: '#374151' },
  input: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rescheduleErrorText: { marginTop: 14, fontSize: 13, fontWeight: '700', color: colors.danger },
  sendButton: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 17, alignItems: 'center' },
  sendButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
