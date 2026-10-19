import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-expo';
import { colors } from '../../src/config/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import RoleSwitcher from '../../src/components/RoleSwitcher';
import PreferencesCard from '../../src/components/PreferencesCard';

export default function AgentProfilScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { user: dbUser, clearUser } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      clearUser();
      router.replace('/login');
    } catch (err) {
      console.error('Erreur lors de la deconnexion', err);
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatar} />
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{dbUser?.firstname ?? '—'}</Text>
              </View>
              <Text style={styles.contact}>{t('profile.agentBadge')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <RoleSwitcher currentRole="AGENT" />

          <PreferencesCard />

          <Pressable
            style={[styles.logoutButton, signingOut && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={signingOut}>
            {signingOut ? (
              <ActivityIndicator color="#b91c1c" />
            ) : (
              <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
            )}
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
  logoutButton: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutButtonText: { fontSize: 15, fontWeight: '800', color: '#b91c1c' },
});