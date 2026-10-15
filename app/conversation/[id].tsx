import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStableGetToken } from '../../src/lib/useStableGetToken';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { getConversation, createMessage, type MessageApi } from '../../src/services/messageService';
import { formatDayLabel, formatTimeOnly } from '../../src/utils/time';

// Avant : conversation entièrement mockée (src/data/conversations.ts),
// aucun appel réseau, les messages envoyés ne survivaient même pas à la
// navigation. Maintenant branché sur GET/POST /messages. Ce qui disparaît
// et pourquoi : pas de statut "en ligne" (aucune présence en base), pas de
// coche "lu" (Message n'a pas de champ `read`), pas de carte "proposition
// de créneau" avec Accepter/Refuser (un message est juste du texte --
// la vraie validation d'un RDV passe par les routes /rdvs, pas par le chat),
// pas de carte "annonce liée" (aucune relation Message <-> Annonce en base).
export default function ConversationScreen() {
  const { id, name, subtitle } = useLocalSearchParams<{ id: string; name?: string; subtitle?: string }>();
  const router = useRouter();
  const getToken = useStableGetToken();
  const { user } = useAuthContext();
  const myDbId = user?.id ? Number(user.id) : undefined;
  const otherUserId = Number(id);

  const [messages, setMessages] = useState<MessageApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!myDbId || !otherUserId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getConversation(myDbId, otherUserId, token);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de la conversation.');
    } finally {
      setLoading(false);
    }
  }, [myDbId, otherUserId, getToken]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !myDbId || !otherUserId || sending) return;
    setSending(true);
    try {
      const token = await getToken();
      if (!token) return;
      const message = await createMessage(myDbId, otherUserId, content, token);
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message', err);
    } finally {
      setSending(false);
    }
  };

  // Regroupe les messages par jour calendaire pour le séparateur -- calculé
  // sur les vraies dates plutôt qu'un "AUJOURD'HUI" fixe qui restait affiché
  // même au-dessus de vieux messages.
  const groups = useMemo(() => {
    const byDay: { label: string; items: MessageApi[] }[] = [];
    for (const message of messages) {
      const label = formatDayLabel(message.createdAt);
      const lastGroup = byDay[byDay.length - 1];
      if (lastGroup && lastGroup.label === label) {
        lastGroup.items.push(message);
      } else {
        byDay.push({ label, items: [message] });
      }
    }
    return byDay;
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerAvatarWrap}>
          <View style={styles.headerAvatar} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name || 'Conversation'}</Text>
          {subtitle ? <Text style={styles.headerStatus}>{subtitle}</Text> : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadMessages}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.thread} contentContainerStyle={styles.threadContent}>
          {messages.length === 0 ? (
            <Text style={styles.emptyText}>Aucun message pour l'instant -- écrivez le premier.</Text>
          ) : (
            groups.map((group) => (
              <View key={group.label}>
                <Text style={styles.dateSeparator}>{group.label}</Text>
                {group.items.map((message) => {
                  const mine = message.senderId === myDbId;
                  return (
                    <View
                      key={message.id}
                      style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
                      <Text style={mine ? styles.bubbleTextMe : styles.bubbleTextThem}>
                        {message.content}
                      </Text>
                      <Text style={mine ? styles.bubbleTimeMe : styles.bubbleTimeThem}>
                        {formatTimeOnly(message.createdAt)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Écrire un message…"
          placeholderTextColor={colors.textLight}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={sendMessage}
        />
        <Pressable style={styles.sendButton} onPress={sendMessage} disabled={sending}>
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <MaterialIcons name="send" size={20} color={colors.white} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  emptyText: { marginTop: 40, textAlign: 'center', fontSize: 14, color: colors.textMuted },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { width: 40, height: 40, borderRadius: 99, backgroundColor: '#E9EDEA' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 16, fontWeight: '800', color: colors.text },
  headerStatus: { fontSize: 12, fontWeight: '700', color: colors.primary },
  thread: { flex: 1 },
  threadContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 10 },
  dateSeparator: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    marginBottom: 10,
  },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12, marginBottom: 10 },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECEFED',
    borderBottomLeftRadius: 5,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
  },
  bubbleTextThem: { fontSize: 14, lineHeight: 21, color: colors.text },
  bubbleTextMe: { fontSize: 14, lineHeight: 21, color: colors.white },
  bubbleTimeThem: { marginTop: 5, fontSize: 10, color: colors.textLight, textAlign: 'right' },
  bubbleTimeMe: { marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,.8)', textAlign: 'right' },
  composer: {
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -1 },
    shadowRadius: 4,
    elevation: 3,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 99,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
});
