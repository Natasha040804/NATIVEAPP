import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

const openSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

async function requestForegroundPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.warn('Location permission request failed:', e?.message || e);
    return false;
  }
}

async function ensureServicesEnabled() {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (e) {
    return true; // if unknown, don’t block
  }
}

const LocationPermissionService = {
  // Call this right after login succeeds
  async ensureAfterLogin() {
    // 1) Ask for permission
    const granted = await requestForegroundPermission();
    if (!granted) {
      Alert.alert(
        'Enable Location Permission',
        'Delivery tracking needs your location. Open settings to allow access?',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ]
      );
      return false;
    }

    // 2) Make sure device location (GPS) is ON
    const servicesOn = await ensureServicesEnabled();
    if (!servicesOn) {
      Alert.alert(
        'Turn On Location Services',
        'Please turn on Location (GPS) in system settings to start tracking.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ]
      );
      return false;
    }

    return true;
  },
};

export default LocationPermissionService;
