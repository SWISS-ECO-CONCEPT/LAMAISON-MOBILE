import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { APPOINTMENTS } from '../../src/data/appointments';

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'En attente' },
  { key: 'accepted', label: 'Acceptés' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function RendezVousScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const visibleAppointments = APPOINTMENTS.filter((appointment) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'accepted') return appointment.status === 'accepted';
    // "En attente" regroupe les demandes en attente et les nouveaux créneaux
    // proposés par l'agent : les deux attendent une action de l'utilisateur.
    return appointment.status === 'pending' || appointment.status === 'proposed';
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes rendez-vous</Text>
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            const count =
              filter.key === 'all'
                ? APPOINTMENTS.length
                : APPOINTMENTS.filter((a) =>
                    filter.key === 'accepted'
                      ? a.status === 'accepted'
                      : a.status === 'pending' || a.status === 'proposed'
                  ).length;
            return (
              <Pressable
                key={filter.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.key)}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter.label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {visibleAppointments.map((appointment) =>
          appointment.status === 'proposed' ? (
            <View key={appointment.id} style={styles.proposedCard}>
              <View style={styles.proposedBanner}>
                <MaterialIcons name="swap-horiz" size={18} color={colors.white} />
                <Text style={styles.proposedBannerText}>NOUVEAU CRÉNEAU PROPOSÉ PAR L'AGENT</Text>
              </View>
              <View style={styles.proposedBody}>
                <View style={styles.proposedHeaderRow}>
                  <View style={styles.thumb} />
                  <View style={styles.proposedInfo}>
                    <Text style={styles.cardTitle}>{appointment.listingTitle}</Text>
                    <Text style={styles.cardMeta}>
                      Réf. {appointment.reference} · {appointment.location}
                    </Text>
                    <Text style={styles.cardPrice}>{appointment.price}</Text>
                    <Text style={styles.cardMeta}>{appointment.agentName}</Text>
                  </View>
                </View>

                <View style={styles.slotRow}>
                  <View style={styles.slotBoxPrevious}>
                    <Text style={styles.slotLabelPrevious}>VOUS AVIEZ DEMANDÉ</Text>
                    <Text style={styles.slotValuePrevious}>{appointment.previousSlot}</Text>
                  </View>
                  <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
                  <View style={styles.slotBoxProposed}>
                    <Text style={styles.slotLabelProposed}>L'AGENT PROPOSE</Text>
                    <Text style={styles.slotValueProposed}>{appointment.proposedSlot}</Text>
                  </View>
                </View>

                <Text style={styles.agentMessage}>{appointment.agentMessage}</Text>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.acceptButton}
                    onPress={() => console.log('Accepter', appointment.id)}>
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                  </Pressable>
                  <Pressable
                    style={styles.declineButton}
                    onPress={() => console.log('Refuser', appointment.id)}>
                    <Text style={styles.declineButtonText}>Refuser</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View key={appointment.id} style={styles.card}>
              <View
                style={[
                  styles.dateBadge,
                  appointment.status === 'pending' && styles.dateBadgePending,
                ]}>
                <Text
                  style={[
                    styles.dateBadgeText,
                    appointment.status === 'pending' && styles.dateBadgeTextPending,
                  ]}>
                  {appointment.day}
                </Text>
                <Text
                  style={[
                    styles.dateBadgeNumber,
                    appointment.status === 'pending' && styles.dateBadgeNumberPending,
                  ]}>
                  {appointment.date}
                </Text>
                <Text
                  style={[
                    styles.dateBadgeText,
                    appointment.status === 'pending' && styles.dateBadgeTextPending,
                  ]}>
                  {appointment.month}
                </Text>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.statusRow}>
                  <MaterialIcons
                    name={appointment.status === 'accepted' ? 'check-circle' : 'schedule'}
                    size={15}
                    color={appointment.status === 'accepted' ? colors.primary : colors.warningText}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      appointment.status === 'pending' && styles.statusTextPending,
                    ]}>
                    {appointment.status === 'accepted' ? 'ACCEPTÉ' : 'EN ATTENTE'} · {appointment.time}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{appointment.listingTitle}</Text>
                <Text style={styles.cardMeta}>
                  Réf. {appointment.reference} · {appointment.location} · {appointment.price}
                </Text>

                {appointment.status === 'accepted' ? (
                  <View style={styles.actionsRowCompact}>
                    <Pressable style={styles.itineraryButton}>
                      <Text style={styles.itineraryButtonText}>Itinéraire</Text>
                    </Pressable>
                    <Pressable style={styles.contactButton}>
                      <Text style={styles.contactButtonText}>Contacter l'agent</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={() => console.log('Annuler', appointment.id)}>
                    <Text style={styles.cancelText}>Annuler ma demande</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  filterRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
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
  proposedBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proposedBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.4,
  },
  proposedBody: {
    padding: 14,
  },
  proposedHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumb: {
    width: 66,
    height: 66,
    borderRadius: 12,
    backgroundColor: '#E9EDEA',
  },
  proposedInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  cardPrice: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  slotRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotBoxPrevious: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 11,
  },
  slotLabelPrevious: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textLight,
  },
  slotValuePrevious: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  slotBoxProposed: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 11,
  },
  slotLabelProposed: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  slotValueProposed: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDarker,
  },
  agentMessage: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    flex: 1.4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  declineButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '800',
  },
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
  dateBadge: {
    width: 60,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    paddingVertical: 9,
    alignItems: 'center',
  },
  dateBadgePending: {
    backgroundColor: colors.warningBackground,
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  dateBadgeTextPending: {
    color: colors.warningText,
  },
  dateBadgeNumber: {
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 24,
    color: colors.primaryDarker,
  },
  dateBadgeNumberPending: {
    color: colors.warningTextStrong,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  statusTextPending: {
    color: colors.warningText,
  },
  actionsRowCompact: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  itineraryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  itineraryButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  contactButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  contactButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '800',
    color: colors.danger,
  },
});