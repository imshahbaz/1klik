import { getApps } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  onMessage,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
  AuthorizationStatus,
  hasPermission,
} from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { CustomNotification } from '../context/AlertContext';


/**
 * Helper to check if Firebase native SDK is fully initialized on the platform.
 */
export function isFirebaseInitialized(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return getApps().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Request notification permission from the user.
 * Supports iOS and Android (including Android 13 runtime permissions).
 */
export async function requestUserPermission(): Promise<boolean> {
  if (!isFirebaseInitialized()) {
    console.log('Firebase is not initialized. Skipping permission request.');
    return false;
  }
  try {
    // Request Android 13+ POST_NOTIFICATIONS permission
    if (Platform.OS === 'android') {
      const apiLevel = typeof Platform.Version === 'number' 
        ? Platform.Version 
        : parseInt(String(Platform.Version), 10);
      
      if (apiLevel >= 33) {
        console.log('FCM Debug: Requesting Android POST_NOTIFICATIONS permission...');
        const granted = await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS' as any
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('FCM Debug: Android POST_NOTIFICATIONS permission denied');
          return false;
        }
        console.log('FCM Debug: Android POST_NOTIFICATIONS permission granted');
      }
      return true;
    }

    const messagingInstance = getMessaging();
    const authStatus = await requestPermission(messagingInstance);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    
    console.log('Authorization status:', authStatus);
    return enabled;
  } catch (error) {
    console.error('Error requesting permission:', error);
    return false;
  }
}

/**
 * Retrieve the FCM registration token for the device.
 */
export async function getFCMToken(): Promise<string | null> {
  if (!isFirebaseInitialized()) {
    console.log('Firebase is not initialized. Skipping FCM token retrieval.');
    return null;
  }
  try {
    const messagingInstance = getMessaging();
    if (Platform.OS === 'ios') {
      // Ensure device is registered for remote notifications on iOS
      if (!isDeviceRegisteredForRemoteMessages(messagingInstance)) {
        await registerDeviceForRemoteMessages(messagingInstance);
      }
    }
    const token = await getToken(messagingInstance);
    console.log('FCM Token retrieved:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM Token:', error);
    return null;
  }
}

/**
 * Listen to FCM token refreshes.
 * Returns an unsubscribe function.
 */
export function registerTokenRefresh(onRefresh: (token: string) => void): () => void {
  if (!isFirebaseInitialized()) return () => {};
  try {
    return onTokenRefresh(getMessaging(), (token) => {
      console.log('FCM Token refreshed:', token);
      onRefresh(token);
    });
  } catch (error) {
    console.error('Error registering token refresh:', error);
    return () => {};
  }
}

/**
 * Listen to messages received in the foreground.
 * Displays a native Alert when a new message arrives.
 * Returns an unsubscribe function.
 */
export function setupForegroundListener(): () => void {
  if (!isFirebaseInitialized()) return () => {};
  try {
    return onMessage(getMessaging(), async (remoteMessage) => {
      console.log('A new FCM message arrived in the foreground!', JSON.stringify(remoteMessage));
      
      // Get title and body from either notification object or custom data fields sent from backend
      const title = String(remoteMessage.notification?.title || remoteMessage.data?.title || 'Notification');
      const body = String(remoteMessage.notification?.body || remoteMessage.data?.body || '');
      
      CustomNotification.show(title, body, remoteMessage.data);
    });
  } catch (error) {
    console.error('Error setting up foreground listener:', error);
    return () => {};
  }
}

/**
 * Check if push notification permissions are granted on the device.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (!isFirebaseInitialized()) return false;
  try {
    if (Platform.OS === 'android') {
      const apiLevel = typeof Platform.Version === 'number' 
        ? Platform.Version 
        : parseInt(String(Platform.Version), 10);
      
      if (apiLevel >= 33) {
        const hasAndroidPermission = await PermissionsAndroid.check(
          'android.permission.POST_NOTIFICATIONS' as any
        );
        return hasAndroidPermission;
      }
      return true;
    }
    const messagingInstance = getMessaging();
    const authStatus = await hasPermission(messagingInstance);
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
}
