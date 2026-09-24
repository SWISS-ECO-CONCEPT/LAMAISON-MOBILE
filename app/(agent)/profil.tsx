import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../src/config/theme';
import { AGENT_PROFILE } from '../../src/data/agent';

export default function AgentProfilScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatar} />
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{AGENT_PROFILE.name}</Text>
                {AGENT_PROFILE.verified && (
                  <MaterialIcons name="verified" size={17} color={colors.white} />
                )}
              </View>
              <Text style={styles.contact}>{AGENT_PROFILE.agency}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>MON RÔLE</Text>
            <View style={styles.roleRow}>
              <Pressable style={styles.roleOption} onPress={() => router.push('/')}>
                <Text style={styles.roleOptionText}>Particulier</Text>
              </Pressable>
              <View style={styles.roleOptionActive}>
                <Text style={styles.roleOptionTextActive}>Agent immobilier</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, backgroundColor: colors.primary },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.3)', borderWidth: 3, borderColor: 'rgba(255,255,255,.65)' },
  headerInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 19, fontWeight: '800', color: colors.white },
  contact: { marginTop: 3, fontSize: 13, color: 'rgba(255,255,255,.85)' },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
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
  roleRow: { marginTop: 10, flexDirection: 'row', gap: 8, backgroundColor: colors.background, borderRadius: 12, padding: 4 },
  roleOptionActive: { flex: 1, backgroundColor: colors.primary, borderRadius: 9, paddingVertical: 11, alignItems: 'center' },
  roleOption: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  roleOptionTextActive: { fontSize: 14, fontWeight: '800', color: colors.white },
  roleOptionText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  logoutButton: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  logoutButtonText: { fontSize: 15, fontWeight: '800', color: '#b91c1c' },
});