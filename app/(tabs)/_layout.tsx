import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // useTranslation : le layout se re-rend au changement de langue, donc les
  // titres d'onglets suivent sans redémarrer l'app.
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        // Chaque écran dessine son propre en-tête (voir index.tsx) — la barre
        // de titre système ne fait pas partie de la maquette.
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'house.fill',
                android: 'home',
                web: 'home',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recherche"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'magnifyingglass',
                android: 'search',
                web: 'search',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rendezvous"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'calendar',
                android: 'event',
                web: 'event',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'message.fill',
                android: 'chat_bubble',
                web: 'chat_bubble',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor={color} size={28} />
          ),
        }}
      /></Tabs>
  );
}