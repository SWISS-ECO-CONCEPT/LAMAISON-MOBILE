import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useFavoris } from '../../src/context/FavorisContext';
import { getRdvsByProspect } from '../../src/services/rdvService';
import { useStableGetToken } from '../../src/lib/useStableGetToken';
import RoleSwitcher from '../../src/components/RoleSwitcher';
import PreferencesCard from '../../src/components/PreferencesCard';

export default function ProfilScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    // `userId`/`getToken` viennent de Clerk (identité + preuve d'identité).
    // Le changement de rôle vit désormais dans <RoleSwitcher />.
    const { signOut, userId } = useAuth();
    // getToken stable : celui de useAuth() change à chaque rendu et relancerait
    // l'effet du compteur de RDV en boucle. Voir src/lib/useStableGetToken.ts.
    const getToken = useStableGetToken();
    const { user: clerkUser } = useUser();
    // Renommé en `dbUser` pour ne pas entrer en collision avec `clerkUser` :
    // deux objets "user" différents, deux sources différentes (Clerk = identité,
    // AuthContext/BDD = rôle + données métier).
    const { user: dbUser, clearUser } = useAuthContext();
    const { favoriteIds } = useFavoris();
    const [signingOut, setSigningOut] = useState(false);
    const [appointmentsCount, setAppointmentsCount] = useState(0);

    // Pas de GET /me cote backend pour un compteur tout pret -- on reutilise
    // le meme endpoint que (tabs)/rendezvous.tsx (GET /rdvs?prospectClerkId=)
    // plutot que d'inventer un chiffre.
    useEffect(() => {
        const clerkId = userId || clerkUser?.id;
        if (!clerkId) return;
        let active = true;
        (async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const rdvs = await getRdvsByProspect(clerkId, token);
                if (active) setAppointmentsCount(rdvs.length);
            } catch (err) {
                console.error('Erreur lors du chargement du compteur de rendez-vous', err);
            }
        })();
        return () => {
            active = false;
        };
    }, [userId, clerkUser?.id, getToken]);

    const handleLogout = async () => {
        setSigningOut(true);
        try {
            await signOut();
            // Vide le profil BDD local (id, role, phone...) stocké dans
            // AuthContext + AsyncStorage -- sinon le rôle de l'ancien compte
            // reste affiché au prochain lancement, avant même un nouveau login.
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
                            <Text style={styles.name}>{dbUser?.firstname ?? '—'}</Text>
                            {dbUser?.phone ? <Text style={styles.contact}>{dbUser.phone}</Text> : null}
                            {clerkUser?.primaryEmailAddress?.emailAddress ? (
                                <Text style={styles.contact}>{clerkUser.primaryEmailAddress.emailAddress}</Text>
                            ) : null}
                        </View>
                        <Pressable style={styles.editButton}>
                            <MaterialIcons name="edit" size={20} color={colors.white} />
                        </Pressable>
                    </View>

                    <View style={styles.statsRow}>
                        <Pressable style={styles.statTile} onPress={() => router.push('/favoris')}>
                            <Text style={styles.statValue}>{favoriteIds.size}</Text>
                            <Text style={styles.statLabel}>{t('profile.favorites')}</Text>
                        </Pressable>
                        <Pressable style={styles.statTile} onPress={() => router.push('/rendezvous')}>
                            <Text style={styles.statValue}>{appointmentsCount}</Text>
                            <Text style={styles.statLabel}>{t('profile.appointments')}</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.body}>
                    <RoleSwitcher currentRole="PROSPECT" />

                    <PreferencesCard />

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
    listRow: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    listRowLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
    divider: { height: 1, backgroundColor: '#F0F2F0', marginLeft: 33 },
    logoutButton: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    logoutButtonDisabled: { opacity: 0.6 },
    logoutButtonText: { fontSize: 15, fontWeight: '800', color: '#b91c1c' },
});