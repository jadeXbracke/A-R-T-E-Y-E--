import { Alert, Platform } from 'react-native';

/**
 * Destructive-action confirm that works on native AND in the web export,
 * where RN's Alert renders nothing. Runs onConfirm only on explicit yes.
 */
export function confirmAction(title: string, message: string, onConfirm: () => void): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', style: 'destructive', onPress: onConfirm },
  ]);
}
