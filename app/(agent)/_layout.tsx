import { useEffect, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useStableGetToken } from '../../src/lib/useStableGetToken';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getRdvsByAgent } from '../../src/services/rdvService';

export default function AgentTabLayout() {
  const colorScheme = useColorScheme();
  const { userId: clerkId } = useAuth();
  // getToken stable : celui de useAuth() change à chaque rendu et relançait
  // le chargement en boucle (écran agent qui clignote). Voir src/lib/useStableGetToken.ts.
  const getToken = useStableGetToken();
  const [pendingCount, setPendingCount] = useState(0);

  // Avant : badge fixe (AGENT_PROFILE.stats.pendingRequests, un nombre en
  // dur). Compté désormais à partir des vrais RDV EN_ATTENTE/PROPOSE.
  useEffect(() => {
    if (!clerkId) return;
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const rdvs = await getRdvsByAgent(clerkId, token);
        if (active) {
          setPendingCount(rdvs.filter((r) => r.status === 'EN_ATTENTE' || r.status === 'PROPOSE').length);
        }
      } catch (err) {
        console.error('AgentTabLayout: erreur chargement badge demandes', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [clerkId, getToken]);

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
          tabBarBadge: pendingCount || undefined,
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