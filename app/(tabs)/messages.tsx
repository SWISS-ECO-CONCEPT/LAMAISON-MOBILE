import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { getUserConversations, type ConversationSummaryApi } from '../../src/services/messageService';
import { formatRelativeTime } from '../../src/utils/time';

// Pas de badge "non lus", pas de pastille "en ligne" : le modèle Message
// n'a ni statut de lecture ni présence -- l'ancien mock les inventait.
export default function MessagesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummaryApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getUserConversations(token);
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des conversations.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const roleLabel = (role: ConversationSummaryApi['otherUser']['role']) =>
    role === 'AGENT' ? 'Agent LAMAISON' : 'Particulier';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Messages</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadConversations}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {conversations.length === 0 ? (
            <Text style={styles.emptyText}>Aucune conversation pour l'instant.</Text>
          ) : (
            conversations.map((conversation) => (
              <Pressable
                key={conversation.id}
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: '/conversation/[id]',
                    params: {
                      id: String(conversation.otherUser.id),
                      name: conversation.otherUser.firstname,
                      subtitle: roleLabel(conversation.otherUser.role),
                    },
                  })
                }>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatar} />
                </View>
                <View style={styles.rowInfo}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name}>{conversation.otherUser.firstname}</Text>
                    <Text style={styles.time}>{formatRelativeTime(conversation.lastMessage.createdAt)}</Text>
                  </View>
                  <Text style={styles.subtitle}>{roleLabel(conversation.otherUser.role)}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {conversation.lastMessage.content}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, backgroundColor: colors.white },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 10 },
  emptyText: { marginTop: 40, textAlign: 'center', fontSize: 14, color: colors.textMuted },
  row: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.text,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 99, backgroundColor: '#E9EDEA' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  time: { fontSize: 11, fontWeight: '700', color: colors.textLight },
  subtitle: { marginTop: 1, fontSize: 11, fontWeight: '700', color: colors.textMuted },
  lastMessage: { marginTop: 3, fontSize: 13, fontWeight: '700', color: colors.text },
});
