import * as ImagePicker from 'expo-image-picker';

// Placeholder for permission request helpers
// Will be implemented in later stages when native modules are added
export async function requestNotificationPermission(): Promise<boolean> {
  // TODO: implement with expo-notifications in Stage 5
  return true;
}

export async function requestCameraPermission(): Promise<boolean> {
  const result = await ImagePicker.requestCameraPermissionsAsync();
  return result.granted;
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return result.granted;
}

export async function requestActivityRecognitionPermission(): Promise<boolean> {
  // TODO: implement with expo-sensors in Stage 8
  return true;
}
