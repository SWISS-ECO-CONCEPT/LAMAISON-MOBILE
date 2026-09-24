import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AGENT_PROFILE } from '../../src/data/agent';

export default function AgentTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="accueil"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="annonces"
        options={{
          title: 'Annonces',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'building.2', android: 'apartment', web: 'apartment' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="demandes"
        options={{
          title: 'Demandes',
          tabBarBadge: AGENT_PROFILE.stats.pendingRequests || undefined,
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'calendar', android: 'event', web: 'event' }} tintColor={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'message.fill', android: 'chat_bubble', web: 'chat_bubble' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}