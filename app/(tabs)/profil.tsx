import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { CURRENT_USER } from '../../src/data/user';

export default function ProfilScreen() {
    const router = useRouter();
    const { signOut } = useAuth();
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const [signingOut, setSigningOut] = useState(false);

    const handleLogout = async () => {
        setSigningOut(true);
        try {
            // signOut() invalide la session cote Clerk ET vide le tokenCache
            // (expo-secure-store) -- sans ca, le jeton reste dans le Keychain/
            // Keystore de l'appareil et l'app rouvre toujours sur l'accueil,
            // meme apres un `expo start -c` (qui ne touche que le cache Metro,
            // jamais le stockage securise de l'OS).
            await signOut();
            // Filet de securite : useAuth() dans RootLayoutNav et dans
            // (tabs)/index.tsx redirige deja vers /login des que isSignedIn
            // passe a false, mais un replace() explicite evite d'attendre
            // le prochain re-render pour un retour visuel immediat.
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
                            <Text style={styles.name}>{CURRENT_USER.name}</Text>
                            <Text style={styles.contact}>{CURRENT_USER.phone}</Text>
                            <Text style={styles.contact}>{CURRENT_USER.email}</Text>
                        </View>
                        <Pressable style={styles.editButton}>
                            <MaterialIcons name="edit" size={20} color={colors.white} />
                        </Pressable>
                    </View>

                    <View style={styles.statsRow}>
                        <Pressable style={styles.statTile} onPress={() => router.push('/favoris')}>
                            <Text style={styles.statValue}>{CURRENT_USER.stats.favorites}</Text>
                            <Text style={styles.statLabel}>favoris</Text>
                        </Pressable>
                        <View style={styles.statTile}>
                            <Text style={styles.statValue}>{CURRENT_USER.stats.appointments}</Text>
                            <Text style={styles.statLabel}>rendez-vous</Text>
                        </View>
                        <View style={styles.statTile}>
                            <Text style={styles.statValue}>{CURRENT_USER.stats.alerts}</Text>
                            <Text style={styles.statLabel}>alertes</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.body}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>MON RÔLE</Text>
                        <View style={styles.roleRow}>
                            <View style={styles.roleOptionActive}>
                                <Text style={styles.roleOptionTextActive}>Particulier</Text>
                            </View>
                            <Pressable style={styles.roleOption} onPress={() => router.push('/accueil')}>
                                <Text style={styles.roleOptionText}>Agent immobilier</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.roleHint}>
                            Passer en agent nécessite une vérification de votre carte professionnelle.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.listRow}>
                            <MaterialIcons name="translate" size={21} color={colors.primary} />
                            <Text style={styles.listRowLabel}>Langue</Text>
                            <Text style={styles.listRowValue}>Français</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.listRow}>
                            <MaterialIcons name="notifications-active" size={21} color={colors.primary} />
                            <Text style={styles.listRowLabel}>Alertes nouvelles annonces</Text>
                            <Pressable
                                style={[styles.toggle, alertsEnabled && styles.toggleActive]}
                                onPress={() => setAlertsEnabled(!alertsEnabled)}>
                                <View style={[styles.toggleKnob, alertsEnabled && styles.toggleKnobActive]} />
                            </Pressable>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.listRow}>
                            <MaterialIcons name="payments" size={21} color={colors.primary} />
                            <Text style={styles.listRowLabel}>Devise</Text>
                            <Text style={styles.listRowValue}>FCFA (XAF)</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.listRow}>
                            <MaterialIcons name="shield" size={21} color={colors.textMuted} />
                            <Text style={styles.listRowLabel}>Sécurité et confidentialité</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.listRow}>
                            <MaterialIcons name="help" size={21} color={colors.textMuted} />
                            <Text style={styles.listRowLabel}>Aide et contact</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
                        </View>
                    </View>

                    <Pressable
                        style={[styles.logoutButton, signingOut && styles.logoutButtonDisabled]}
                        onPress={handleLogout}
                        disabled={signingOut}>
                        {signingOut ? (
                            <ActivityIndicator color="#b91c1c" />
                        ) : (
                            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
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
    name: { fontSize: 19, fontWeight: '800', color: colors.white },
    contact: { marginTop: 2, fontSize: 13, color: 'rgba(255,255,255,.85)' },
    editButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: { marginTop: 18, flexDirection: 'row', gap: 10 },
    statTile: { flex: 1, backgroundColor: 'rgba(255,255,255,.16)', borderRadius: 12, padding: 11 },
    statValue: { fontSize: 18, fontWeight: '800', color: colors.white },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,.85)' },
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
    roleHint: { marginTop: 9, fontSize: 12, lineHeight: 18, color: colors.textMuted },
    listRow: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    listRowLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
    listRowValue: { fontSize: 14, fontWeight: '800', color: colors.textMuted },
    divider: { height: 1, backgroundColor: '#F0F2F0', marginLeft: 33 },
    toggle: {
        width: 46,
        height: 27,
        borderRadius: 99,
        backgroundColor: '#E0E4E1',
        padding: 3,
        justifyContent: 'center',
    },
    toggleActive: { backgroundColor: colors.primary },
    toggleKnob: { width: 21, height: 21, borderRadius: 99, backgroundColor: colors.white },
    toggleKnobActive: { alignSelf: 'flex-end' },
    logoutButton: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    logoutButtonDisabled: { opacity: 0.6 },
    logoutButtonText: { fontSize: 15, fontWeight: '800', color: '#b91c1c' },
});