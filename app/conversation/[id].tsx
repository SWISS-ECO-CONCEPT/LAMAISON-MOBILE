import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { getConversationById, ChatMessage } from '../../src/data/conversations';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const conversation = getConversationById(id);
  const [messages, setMessages] = useState<ChatMessage[]>(conversation?.messages ?? []);
  const [draft, setDraft] = useState('');

  if (!conversation) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Conversation introuvable.</Text>
        <Link href="/" asChild>
          <Pressable>
            <Text style={styles.notFoundLink}>Retour à l'accueil</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const sendMessage = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, type: 'text', sender: 'me', text: draft.trim(), time: 'à l\'instant' },
    ]);
    setDraft('');
  };

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
          {conversation.online && <View style={styles.headerOnlineDot} />}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{conversation.name}</Text>
          <Text style={styles.headerStatus}>{conversation.online ? 'en ligne' : 'hors ligne'}</Text>
        </View>
        <Pressable>
          <MaterialIcons name="call" size={22} color={colors.primary} />
        </Pressable>
        <Pressable>
          <MaterialIcons name="more-vert" size={22} color={colors.textLight} />
        </Pressable>
      </View>

      {conversation.listing && (
        <View style={styles.listingBar}>
          <View style={styles.listingCard}>
            <View style={styles.listingThumb} />
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>{conversation.listing.title}</Text>
              <Text style={styles.listingPrice}>{conversation.listing.price}</Text>
            </View>
            <Pressable
              style={styles.listingViewButton}
              onPress={() =>
                router.push({ pathname: '/annonce/[id]', params: { id: conversation.listing!.id } })
              }>
              <Text style={styles.listingViewButtonText}>Voir</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView style={styles.thread} contentContainerStyle={styles.threadContent}>
        <Text style={styles.dateSeparator}>AUJOURD'HUI</Text>

        {messages.map((message) =>
          message.type === 'text' ? (
            <View
              key={message.id}
              style={[
                styles.bubble,
                message.sender === 'me' ? styles.bubbleMe : styles.bubbleThem,
              ]}>
              <Text style={message.sender === 'me' ? styles.bubbleTextMe : styles.bubbleTextThem}>
                {message.text}
              </Text>
              <View style={styles.bubbleFooter}>
                <Text style={message.sender === 'me' ? styles.bubbleTimeMe : styles.bubbleTimeThem}>
                  {message.time}
                </Text>
                {message.sender === 'me' && message.read && (
                  <MaterialIcons name="done-all" size={14} color={colors.white} />
                )}
              </View>
            </View>
          ) : (
            <View key={message.id} style={styles.proposalCard}>
              <View style={styles.proposalBanner}>
                <Text style={styles.proposalBannerText}>NOUVELLE PROPOSITION DE CRÉNEAU</Text>
              </View>
              <View style={styles.proposalBody}>
                <Text style={styles.proposalSlot}>{message.slotLabel}</Text>
                <Text style={styles.proposalListing}>{message.listingSummary}</Text>
                <View style={styles.proposalActions}>
                  <Pressable
                    style={styles.proposalAccept}
                    onPress={() => console.log('Accepter créneau', message.id)}>
                    <Text style={styles.proposalAcceptText}>Accepter</Text>
                  </Pressable>
                  <Pressable
                    style={styles.proposalDecline}
                    onPress={() => console.log('Refuser créneau', message.id)}>
                    <Text style={styles.proposalDeclineText}>Refuser</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )
        )}
      </ScrollView>

      <View style={styles.composer}>
        <Pressable style={styles.attachButton}>
          <MaterialIcons name="add" size={22} color="#374151" />
        </Pressable>
        <TextInput
          style={styles.composerInput}
          placeholder="Écrire un message…"
          placeholderTextColor={colors.textLight}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={sendMessage}
        />
        <Pressable style={styles.sendButton} onPress={sendMessage}>
          <MaterialIcons name="send" size={20} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  notFoundText: { fontSize: 15, color: colors.textMuted },
  notFoundLink: { fontSize: 14, fontWeight: '800', color: colors.primary },
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
  headerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 99,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 16, fontWeight: '800', color: colors.text },
  headerStatus: { fontSize: 12, fontWeight: '700', color: colors.primary },
  listingBar: { paddingHorizontal: 16, paddingTop: 12 },
  listingCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.text,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  listingThumb: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#E9EDEA' },
  listingInfo: { flex: 1, minWidth: 0 },
  listingTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  listingPrice: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  listingViewButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
  },
  listingViewButtonText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  thread: { flex: 1 },
  threadContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 10 },
  dateSeparator: { textAlign: 'center', fontSize: 11, fontWeight: '800', color: colors.textLight },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
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
  bubbleFooter: { marginTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bubbleTimeThem: { fontSize: 10, color: colors.textLight },
  bubbleTimeMe: { fontSize: 10, color: 'rgba(255,255,255,.8)' },
  proposalCard: {
    alignSelf: 'flex-start',
    width: '84%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  proposalBanner: { backgroundColor: colors.primaryLight, paddingHorizontal: 13, paddingVertical: 8 },
  proposalBannerText: { fontSize: 11, fontWeight: '800', color: colors.primaryDark, letterSpacing: 0.4 },
  proposalBody: { padding: 13 },
  proposalSlot: { fontSize: 15, fontWeight: '800', color: colors.text },
  proposalListing: { marginTop: 3, fontSize: 12, color: colors.textMuted },
  proposalActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  proposalAccept: {
    flex: 1.3,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  proposalAcceptText: { fontSize: 13, fontWeight: '800', color: colors.white },
  proposalDecline: {
    flex: 1,
    backgroundColor: '#F0F2F0',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  proposalDeclineText: { fontSize: 13, fontWeight: '800', color: '#374151' },
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
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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