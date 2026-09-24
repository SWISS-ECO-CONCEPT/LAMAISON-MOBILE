import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';
import { CONVERSATIONS } from '../../src/data/conversations';

export default function MessagesScreen() {
  const router = useRouter();
  const unreadCount = CONVERSATIONS.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Messages</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} non lus</Text>
            </View>
          )}
        </View>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.textLight} />
          <Text style={styles.searchPlaceholder}>Rechercher une conversation</Text>
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {CONVERSATIONS.map((conversation) => (
          <Pressable
            key={conversation.id}
            style={[styles.row, conversation.dimmed && styles.rowDimmed]}
            onPress={() =>
              router.push({
                pathname: '/conversation/[id]',
                params: { id: conversation.id },
              })
            }>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar} />
              {conversation.online && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.rowInfo}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{conversation.name}</Text>
                <Text style={[styles.time, conversation.unreadCount ? styles.timeUnread : null]}>
                  {conversation.timeLabel}
                </Text>
              </View>
              <Text style={[styles.subtitle, conversation.unreadCount ? styles.subtitleUnread : null]}>
                {conversation.subtitle}
              </Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
            </View>
            {conversation.unreadCount ? (
              <View style={styles.unreadCountBadge}>
                <Text style={styles.unreadCountText}>{conversation.unreadCount}</Text>
              </View>
            ) : conversation.read ? (
              <MaterialIcons name="done-all" size={17} color="#d1d5db" />
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, backgroundColor: colors.white },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  unreadBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8 },
  unreadBadgeText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  searchBar: {
    marginTop: 14,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchPlaceholder: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 10 },
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
  rowDimmed: { opacity: 0.8 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 99, backgroundColor: '#E9EDEA' },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 99,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  time: { fontSize: 11, fontWeight: '700', color: colors.textLight },
  timeUnread: { color: colors.primary, fontWeight: '800' },
  subtitle: { marginTop: 1, fontSize: 11, fontWeight: '700', color: colors.textMuted },
  subtitleUnread: { color: colors.primary },
  lastMessage: { marginTop: 3, fontSize: 13, fontWeight: '700', color: colors.text },
  unreadCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 99,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCountText: { fontSize: 11, fontWeight: '800', color: colors.white },
});