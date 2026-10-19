import { Alert, Platform } from 'react-native';
import i18n from '../i18n';

// Sur le web, react-native-web implémente `Alert.alert` comme une fonction
// vide : aucune boîte ne s'affiche et les callbacks des boutons ne sont
// jamais appelés. On bascule donc sur les dialogues natifs du navigateur.
// Hors composant, donc pas de useTranslation() : on lit l'instance i18n
// directement, dans la langue active au moment de l'appel.

export function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    { text: i18n.t('common.confirm'), onPress: onConfirm },
  ]);
}

export function showError(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
