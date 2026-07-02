import { getApps } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  hasPermission,
  isDeviceRegisteredForRemoteMessages,
  onMessage,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { PermissionsAndroid, Platform } from 'react-native';

export const DEFAULT_CHANNEL_ID = 'default';

let channelPromise: Promise<string> | null = null;

export async function ensureDefaultChannel(): Promise<string> {
  if (Platform.OS !== 'android') return DEFAULT_CHANNEL_ID;
  if (!channelPromise) {
    channelPromise = notifee.createChannel({
      id: DEFAULT_CHANNEL_ID,
      name: 'General Notifications',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
    });
  }
  return channelPromise;
}

export async function displayNotification(
  title: string,
  body: string,
  data?: Record<string, string | object | number>
): Promise<void> {
  try {
    const channelId = await ensureDefaultChannel();
    await notifee.displayNotification({
      title,
      body,
      data: data as any,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        vibrationPattern: [300, 500],
        sound: 'default',
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });
  } catch (error) {
    console.error('Error displaying notification:', error);
  }
}

export function isFirebaseInitialized(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return getApps().length > 0;
  } catch (error) {
    console.warn('Firebase initialization check failed:', error);
    return false;
  }
}

export async function requestUserPermission(): Promise<boolean> {
  if (!isFirebaseInitialized()) {
    console.log('Firebase is not initialized. Skipping permission request.');
    return false;
  }
  try {
    if (Platform.OS === 'android') {
      const apiLevel = typeof Platform.Version === 'number'
        ? Platform.Version
        : Number.parseInt(String(Platform.Version), 10);

      if (apiLevel >= 33) {
        const granted = await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS' as any
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }
      return true;
    }

    const messagingInstance = getMessaging();
    const authStatus = await requestPermission(messagingInstance);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (error) {
    console.error('Error requesting permission:', error);
    return false;
  }
}

export async function getFCMToken(): Promise<string | null> {
  if (!isFirebaseInitialized()) {
    return null;
  }
  try {
    const messagingInstance = getMessaging();
    if (Platform.OS === 'ios') {
      if (!isDeviceRegisteredForRemoteMessages(messagingInstance)) {
        await registerDeviceForRemoteMessages(messagingInstance);
      }
    }
    const token = await getToken(messagingInstance);
    return token;
  } catch (error) {
    console.error('Error getting FCM Token:', error);
    return null;
  }
}

export function registerTokenRefresh(onRefresh: (token: string) => void): () => void {
  if (!isFirebaseInitialized()) return () => { };
  try {
    return onTokenRefresh(getMessaging(), (token) => {
      onRefresh(token);
    });
  } catch (error) {
    console.error('Error registering token refresh:', error);
    return () => { };
  }
}

export function setupForegroundListener(): () => void {
  if (!isFirebaseInitialized()) return () => { };
  try {
    // Make sure the high-importance channel exists before any message arrives.
    ensureDefaultChannel().catch(() => { });

    return onMessage(getMessaging(), async (remoteMessage) => {
      console.log('A new FCM message arrived in the foreground!', JSON.stringify(remoteMessage));

      // Get title and body from either notification object or custom data fields sent from backend
      const title = String(remoteMessage.notification?.title || remoteMessage.data?.title || 'Notification');
      const body = String(remoteMessage.notification?.body || remoteMessage.data?.body || '');

      await displayNotification(title, body, remoteMessage.data);
    });
  } catch (error) {
    console.error('Error setting up foreground listener:', error);
    return () => { };
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (!isFirebaseInitialized()) return false;
  try {
    if (Platform.OS === 'android') {
      const apiLevel = typeof Platform.Version === 'number'
        ? Platform.Version
        : Number.parseInt(String(Platform.Version), 10);

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
