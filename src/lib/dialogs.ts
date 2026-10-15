import { Alert, Platform } from 'react-native';

// Sur le web, react-native-web implémente `Alert.alert` comme une fonction
// vide : aucune boîte ne s'affiche et les callbacks des boutons ne sont
// jamais appelés. On bascule donc sur les dialogues natifs du navigateur.

export function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Confirmer', onPress: onConfirm },
  ]);
}

export function showError(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
