import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { AGENT_PROFILE } from '../../src/data/agent';
import { AGENT_REQUESTS, AgentRequest } from '../../src/data/agentRequests';

const RESCHEDULE_DAYS = [
  { key: 'mar22', label: 'MAR', date: '22' },
  { key: 'mer23', label: 'MER', date: '23' },
  { key: 'jeu24', label: 'JEU', date: '24' },
  { key: 'ven25', label: 'VEN', date: '25' },
  { key: 'sam26', label: 'SAM', date: '26' },
];

const RESCHEDULE_TIMES = [
  { key: '08h30', label: '08 h 30', available: true },
  { key: '10h00', label: '10 h 00', available: true },
  { key: '11h30', label: '11 h 30', available: true },
  { key: '14h00', label: '14 h 00', available: true },
  { key: '16h00', label: '16 h 00', available: true },
  { key: '17h30', label: '17 h 30', available: false },
];

const FILTERS = [
  { key: 'pending', label: 'En attente' },
  { key: 'accepted', label: 'Acceptés' },
  { key: 'history', label: 'Historique' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function AgentDemandesScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('pending');
  const [rescheduleRequest, setRescheduleRequest] = useState<AgentRequest | null>(null);
  const [selectedDay, setSelectedDay] = useState('jeu24');
  const [selectedTime, setSelectedTime] = useState('10h00');
  const [message, setMessage] = useState(
    'Bonjour, je suis en visite mardi matin. Jeudi 10 h vous convient-il ?'
  );

  const pendingCount = AGENT_REQUESTS.filter((r) => r.status === 'pending').length;
  const acceptedCount = AGENT_REQUESTS.filter((r) => r.status === 'accepted').length;

  const visibleRequests = AGENT_REQUESTS.filter((request) => {
    if (activeFilter === 'history') return false;
    return request.status === activeFilter;
  });

  const openReschedule = (request: AgentRequest) => {
    setSelectedDay('jeu24');
    setSelectedTime('10h00');
    setRescheduleRequest(request);
  };

  const sendProposal = () => {
    console.log('Proposer un créneau', rescheduleRequest?.id, selectedDay, selectedTime, message);
    setRescheduleRequest(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Demandes de visite</Text>
            <Text style={styles.subtitle}>
              {AGENT_PROFILE.name} · {AGENT_PROFILE.agency}
            </Text>
          </View>
          <Pressable style={styles.calendarButton}>
            <MaterialIcons name="calendar-month" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            const count =
              filter.key === 'pending' ? pendingCount : filter.key === 'accepted' ? acceptedCount : null;
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

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {activeFilter === 'history' ? (
          <Text style={styles.emptyText}>Aucune demande dans l'historique pour le moment.</Text>
        ) : (
          visibleRequests.map((request) =>
            request.status === 'pending' ? (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeaderRow}>
                  <View style={styles.avatar} />
                  <View style={styles.requestHeaderInfo}>
                    <Text style={styles.clientName}>{request.clientName}</Text>
                    <Text style={styles.clientMeta}>
                      {request.clientType} · {request.receivedAgo}
                    </Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>EN ATTENTE</Text>
                  </View>
                </View>

                <View style={styles.listingRow}>
                  <View style={styles.listingThumb} />
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle}>{request.listingTitle}</Text>
                    <Text style={styles.listingMeta}>
                      Réf. {request.reference} · {request.listingLocation} · {request.price}
                    </Text>
                  </View>
                </View>

                <View style={styles.slotRow}>
                  <MaterialIcons name="event" size={19} color={colors.primary} />
                  <Text style={styles.slotText}>Créneau demandé : {request.requestedSlot}</Text>
                </View>

                {request.message && <Text style={styles.messageText}>« {request.message} »</Text>}

                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.acceptButton}
                    onPress={() => console.log('Accepter', request.id)}>
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                  </Pressable>
                  <Pressable
                    style={styles.declineButton}
                    onPress={() => console.log('Refuser', request.id)}>
                    <Text style={styles.declineButtonText}>Refuser</Text>
                  </Pressable>
                </View>

                <Pressable style={styles.rescheduleButton} onPress={() => openReschedule(request)}>
                  <MaterialIcons name="swap-horiz" size={18} color={colors.primaryDark} />
                  <Text style={styles.rescheduleButtonText}>Proposer un autre créneau</Text>
                </Pressable>
              </View>
            ) : (
              <View key={request.id} style={styles.acceptedCard}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>{request.acceptedDay}</Text>
                  <Text style={styles.dateBadgeNumber}>{request.acceptedDate}</Text>
                  <Text style={styles.dateBadgeText}>{request.acceptedMonth}</Text>
                </View>
                <View style={styles.acceptedInfo}>
                  <View style={styles.acceptedStatusRow}>
                    <MaterialIcons name="check-circle" size={15} color={colors.primary} />
                    <Text style={styles.acceptedStatusText}>ACCEPTÉ · {request.acceptedTime}</Text>
                  </View>
                  <Text style={styles.listingTitle}>
                    {request.clientName} · {request.listingTitle}
                  </Text>
                  <Text style={styles.listingMeta}>
                    Réf. {request.reference} · {request.listingLocation} · {request.price}
                  </Text>
                </View>
              </View>
            )
          )
        )}
      </ScrollView>

      <Modal
        visible={rescheduleRequest !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleRequest(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setRescheduleRequest(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Proposer un autre créneau</Text>
          <Text style={styles.sheetSubtitle}>
            {rescheduleRequest?.clientName} recevra la proposition et pourra l'accepter ou la refuser.
          </Text>

          <View style={styles.initialRequestBox}>
            <Text style={styles.initialRequestLabel}>DEMANDE INITIALE</Text>
            <Text style={styles.initialRequestValue}>
              {rescheduleRequest?.requestedSlot} — {rescheduleRequest?.listingTitle}, Réf. {rescheduleRequest?.reference}
            </Text>
          </View>

          <Text style={styles.sheetSectionLabel}>Nouvelle date</Text>
          <View style={styles.dayRow}>
            {RESCHEDULE_DAYS.map((day) => {
              const active = selectedDay === day.key;
              return (
                <Pressable
                  key={day.key}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => setSelectedDay(day.key)}>
                  <Text style={[styles.dayChipLabel, active && styles.dayChipLabelActive]}>{day.label}</Text>
                  <Text style={[styles.dayChipDate, active && styles.dayChipDateActive]}>{day.date}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sheetSectionLabel}>Heure</Text>
          <View style={styles.timeRow}>
            {RESCHEDULE_TIMES.map((time) => {
              const active = selectedTime === time.key;
              return (
                <Pressable
                  key={time.key}
                  disabled={!time.available}
                  style={[
                    styles.timeChip,
                    active && styles.timeChipActive,
                    !time.available && styles.timeChipDisabled,
                  ]}
                  onPress={() => setSelectedTime(time.key)}>
                  <Text
                    style={[
                      styles.timeChipText,
                      active && styles.timeChipTextActive,
                      !time.available && styles.timeChipTextDisabled,
                    ]}>
                    {time.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sheetSectionLabel}>Message (optionnel)</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <Pressable style={styles.sendButton} onPress={sendProposal}>
            <Text style={styles.sendButtonText}>Envoyer la proposition</Text>
          </Pressable>
        </View>
      </Modal>
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
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 3, fontSize: 13, color: colors.textMuted },
  calendarButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: { marginTop: 14, flexDirection: 'row', gap: 8 },
  filterChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  filterChipTextActive: { color: colors.white },
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
  pendingBadge: {
    backgroundColor: colors.warningBackground,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '800', color: colors.warningText },
  listingRow: {
    marginTop: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  listingThumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#E0E5E2' },
  listingInfo: { flex: 1, minWidth: 0 },
  listingTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  listingMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  slotRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotText: { fontSize: 14, fontWeight: '800', color: colors.text },
  messageText: { marginTop: 8, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  actionsRow: { marginTop: 14, flexDirection: 'row', gap: 8 },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  acceptButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  declineButton: {
    flex: 1,
    backgroundColor: '#F0F2F0',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
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
  dateBadge: {
    width: 60,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    paddingVertical: 9,
    alignItems: 'center',
  },
  dateBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  dateBadgeNumber: { fontSize: 21, fontWeight: '800', lineHeight: 24, color: colors.primaryDarker },
  acceptedInfo: { flex: 1, minWidth: 0 },
  acceptedStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acceptedStatusText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#E0E4E1',
    alignSelf: 'center',
  },
  sheetTitle: { marginTop: 16, fontSize: 20, fontWeight: '800', color: colors.text },
  sheetSubtitle: { marginTop: 5, fontSize: 13, lineHeight: 20, color: colors.textMuted },
  initialRequestBox: {
    marginTop: 18,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  initialRequestLabel: { fontSize: 10, fontWeight: '800', color: colors.textLight },
  initialRequestValue: { marginTop: 3, fontSize: 14, fontWeight: '700', color: colors.textMuted },
  sheetSectionLabel: { marginTop: 18, fontSize: 13, fontWeight: '800', color: '#374151' },
  dayRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  dayChipActive: { backgroundColor: colors.primary },
  dayChipLabel: { fontSize: 10, fontWeight: '800', color: colors.textLight },
  dayChipLabelActive: { color: 'rgba(255,255,255,.85)' },
  dayChipDate: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 2 },
  dayChipDateActive: { color: colors.white },
  timeRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  timeChipActive: { backgroundColor: colors.primary },
  timeChipDisabled: { opacity: 0.6 },
  timeChipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  timeChipTextActive: { color: colors.white, fontWeight: '800' },
  timeChipTextDisabled: { color: colors.textLight, textDecorationLine: 'line-through' },
  messageInput: {
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
  },
  sendButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});