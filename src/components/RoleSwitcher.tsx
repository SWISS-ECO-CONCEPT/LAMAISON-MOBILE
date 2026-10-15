import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { colors } from '../config/theme';
import { useAuthContext } from '../context/AuthContext';
import { updateUserRole } from '../services/authService';
import { confirmAction, showError } from '../lib/dialogs';
import { useStableGetToken } from '../lib/useStableGetToken';

type SelfAssignableRole = 'PROSPECT' | 'AGENT';

// Tout ce qui dépend du rôle CIBLE : texte de confirmation, aide affichée
// sous le sélecteur, et écran d'arrivée (chaque rôle a son propre groupe de
// routes : (tabs) pour le particulier, (agent) pour l'agent).
const SWITCH_TO = {
  AGENT: { titleKey: 'role.toAgent.title', messageKey: 'role.toAgent.message', homeRoute: '/accueil' },
  PROSPECT: { titleKey: 'role.toProspect.title', messageKey: 'role.toProspect.message', homeRoute: '/' },
} as const satisfies Record<SelfAssignableRole, { titleKey: string; messageKey: string; homeRoute: '/' | '/accueil' }>;

const OPTIONS = [
  { role: 'PROSPECT', labelKey: 'role.prospect' },
  { role: 'AGENT', labelKey: 'role.agent' },
] as const;

// Sélecteur de rôle commun aux profils particulier et agent : même rendu et
// même logique des deux côtés (avant, ~40 lignes dupliquées qui divergeaient).
//
// `currentRole` vient de l'écran qui l'affiche (le groupe de routes où l'on
// se trouve), pas de la copie locale `dbUser.role` : si les deux sources
// divergent, bloquer le clic rendrait le bouton inerte sans explication.
// Le backend reste seul juge : PUT /auth/update-role vérifie que le clerkId
// est celui du token et n'accepte que AGENT/PROSPECT.
export default function RoleSwitcher({ currentRole }: { currentRole: SelfAssignableRole }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { userId } = useAuth();
  const { user: clerkUser } = useUser();
  const getToken = useStableGetToken();
  const { user: dbUser, updateUser } = useAuthContext();
  const [switching, setSwitching] = useState(false);

  const targetRole: SelfAssignableRole = currentRole === 'AGENT' ? 'PROSPECT' : 'AGENT';
  const target = SWITCH_TO[targetRole];

  const switchRole = async () => {
    const clerkId = userId || clerkUser?.id;
    if (!clerkId) {
      showError(t('common.error'), t('common.sessionNotFound'));
      return;
    }

    setSwitching(true);
    try {
      const token = await getToken();
      if (!token) throw new Error(t('common.sessionInvalid'));

      // La colonne `role` en base fait foi (voir CLAUDE.md, « Identité vs rôle »).
      const result = await updateUserRole(clerkId, targetRole, token);
      const newRole: string = (result?.user ?? result)?.role ?? targetRole;

      // RootLayoutNav redirige d'après `unsafeMetadata.role` de Clerk ; le
      // backend tente de le mettre à jour sans garantie, on l'écrit donc aussi
      // côté client (ce qui rafraîchit l'objet `clerkUser` en mémoire).
      await clerkUser?.update({ unsafeMetadata: { ...clerkUser.unsafeMetadata, role: newRole } });
      updateUser({ ...dbUser, role: newRole });

      router.replace(target.homeRoute);
    } catch (err) {
      showError(t('common.error'), err instanceof Error ? err.message : t('role.switchError'));
    } finally {
      setSwitching(false);
    }
  };

  // Confirmation obligatoire : changer de rôle change tout l'espace de l'app.
  const handlePress = () => {
    if (switching) return;
    confirmAction(t(target.titleKey), t(target.messageKey), switchRole);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{t('role.sectionTitle')}</Text>
      <View style={styles.roleRow}>
        {OPTIONS.map(({ role, labelKey }) =>
          role === currentRole ? (
            <View key={role} style={styles.roleOptionActive}>
              <Text style={styles.roleOptionTextActive}>{t(labelKey)}</Text>
            </View>
          ) : (
            <Pressable key={role} style={styles.roleOption} onPress={handlePress} disabled={switching}>
              {switching ? (
                <ActivityIndicator color={colors.textMuted} />
              ) : (
                <Text style={styles.roleOptionText}>{t(labelKey)}</Text>
              )}
            </Pressable>
          )
        )}
      </View>
      <Text style={styles.roleHint}>{t(target.messageKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
