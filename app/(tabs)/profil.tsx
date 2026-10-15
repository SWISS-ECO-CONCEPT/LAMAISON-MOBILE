import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useFavoris } from '../../src/context/FavorisContext';
import { updateUserRole } from '../../src/services/authService';
import { getRdvsByProspect } from '../../src/services/rdvService';
import { confirmAction, showError } from '../../src/lib/dialogs';

export default function ProfilScreen() {
    const router = useRouter();
    // `userId`/`getToken` viennent de Clerk (identité + preuve d'identité).
    // `useUser()` donne l'objet Clerk complet — on en a besoin pour appeler
    // `.reload()` après le changement de rôle (le point le plus important
    // de ce fichier, voir plus bas).
    const { signOut, userId, getToken } = useAuth();
    const { user: clerkUser } = useUser();
    // Renommé en `dbUser` pour ne pas entrer en collision avec `clerkUser` :
    // deux objets "user" différents, deux sources différentes (Clerk = identité,
    // AuthContext/BDD = rôle + données métier).
    const { user: dbUser, updateUser, clearUser } = useAuthContext();
    const { favoriteIds } = useFavoris();
    const [signingOut, setSigningOut] = useState(false);
    const [switchingRole, setSwitchingRole] = useState(false);
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

    // Étape 1 : confirmation avant d'agir -- changer de rôle n'est pas un
    // simple réglage cosmétique qu'on veut pouvoir déclencher par erreur.
    // Pas de garde sur `dbUser.role` ici : si on est sur cet écran, c'est que
    // le routage (basé sur Clerk) nous considère particulier. Si la copie
    // locale dit déjà AGENT, les deux sources ont divergé -- bloquer le clic
    // rendrait le bouton inerte sans explication ; on relance plutôt la
    // synchro, l'appel backend est idempotent.
    const handleSwitchToAgent = () => {
        if (switchingRole) return;
        confirmAction('Passer en agent immobilier', 'Vous pourrez publier des annonces et gérer des demandes de rendez-vous.', confirmSwitchToAgent);
    };

    // Étape 2 : l'appel réel, seulement après confirmation.
    const confirmSwitchToAgent = async () => {
        const clerkId = userId || clerkUser?.id;
        if (!clerkId) {
      showError('Erreur', 'Session introuvable, reconnecte-toi.');
      return;
    }

        setSwitchingRole(true);
        try {
            const token = await getToken();
            if (!token) throw new Error('Session invalide, reconnecte-toi.');

            // C'est CET appel qui fait foi : il met à jour la colonne `role`
            // en base (source de vérité) ; le backend patch en plus les
            // métadonnées Clerk de son côté (voir auth.services.ts).
            const result = await updateUserRole(clerkId, 'AGENT', token);
            const updated = result?.user ?? result;

            // Indispensable : RootLayoutNav décide de la redirection d'après
            // `unsafeMetadata.role` de Clerk. Le backend tente de le mettre à
            // jour, mais sans garantie (clé secrète absente, erreur réseau...).
            // `unsafeMetadata` est modifiable côté client : on l'écrit nous-mêmes,
            // ce qui rafraîchit aussi l'objet `clerkUser` en mémoire.
            await clerkUser?.update({
                unsafeMetadata: { ...clerkUser.unsafeMetadata, role: updated?.role ?? 'AGENT' },
            });

            // Mise à jour de la copie locale pour que l'UI change tout de
            // suite, sans attendre un aller-retour réseau supplémentaire.
            updateUser({ ...dbUser, role: updated?.role ?? 'AGENT' });

            router.replace('/accueil');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur lors du changement de rôle.';
            showError('Erreur', message);
        } finally {
            setSwitchingRole(false);
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
                            <Text style={styles.statLabel}>favoris</Text>
                        </Pressable>
                        <Pressable style={styles.statTile} onPress={() => router.push('/rendezvous')}>
                            <Text style={styles.statValue}>{appointmentsCount}</Text>
                            <Text style={styles.statLabel}>rendez-vous</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.body}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>MON RÔLE</Text>
                        <View style={styles.roleRow}>
                            <View style={styles.roleOptionActive}>
                                <Text style={styles.roleOptionTextActive}>Particulier</Text>
                            </View>
                            <Pressable
                                style={styles.roleOption}
                                onPress={handleSwitchToAgent}
                                disabled={switchingRole}>
                                {switchingRole ? (
                                    <ActivityIndicator color={colors.textMuted} />
                                ) : (
                                    <Text style={styles.roleOptionText}>Agent immobilier</Text>
                                )}
                            </Pressable>
                        </View>
                        {/* Texte corrigé : l'ancien disait "nécessite une vérification de
                            votre carte professionnelle", ce qui était faux -- aucune
                            vérification n'existe côté backend (rôle auto-déclaré). */}
                        <Text style={styles.roleHint}>
                            Vous pourrez publier des annonces et gérer des rendez-vous.
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
    logoutButton: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    logoutButtonDisabled: { opacity: 0.6 },
    logoutButtonText: { fontSize: 15, fontWeight: '800', color: '#b91c1c' },
});