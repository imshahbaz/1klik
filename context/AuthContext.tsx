import React, { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';
import { AppState, DeviceEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authAPI, notificationAPI } from '../services/api';
import {
    requestUserPermission,
    getFCMToken,
    registerTokenRefresh,
    setupForegroundListener,
    isFirebaseInitialized,
} from '../services/notificationService';

interface AppConfig {
    auth: {
        google: boolean;
        email: boolean;
        truecaller: boolean;
    };
    components: {
        heatMap: boolean;
    };
}

interface AuthContextType {
    user: any;
    login: (userData: any, showLoading?: boolean) => void;
    logout: () => Promise<void>;
    appLoading: boolean;
    authLoading: boolean;
    refreshUserData: () => Promise<void>;
    configLoading: boolean;
    appConfig: AppConfig;
    setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const CONFIG_CACHE_KEY = 'app_global_config';
const CACHE_EXPIRY = 300000;

// Notification permissions and listener handling is managed within the AuthProvider useEffect below

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [appConfig, setAppConfig] = useState<AppConfig>({
        auth: { google: true, email: true, truecaller: true },
        components: { heatMap: true }
    });

    const [appLoading, setAppLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);

    const fetchGlobalConfig = async (forceRefresh = false) => {
        try {
            const cachedStr = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
            const cached = cachedStr ? JSON.parse(cachedStr) : null;
            const now = Date.now();

            if (!forceRefresh && cached && (now - cached.timestamp < CACHE_EXPIRY)) {
                setAppConfig(cached.data);
                setConfigLoading(false);
                return;
            }

            const res = await authAPI.clientConfig();
            const data = res.data.data;
            if (data) {
                setAppConfig(data);
                await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({ data, timestamp: now }));
            }
        } catch (err) {
            console.error("Public config fetch failed", err);
        } finally {
            setConfigLoading(false);
        }
    };

    const isInitialized = useRef(false);

    const refreshUserData = async () => {
        try {
            const res = await authAPI.getMe();
            setUser(res.data.data);
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                setUser(null);
            }
        } finally {
            setAppLoading(false);
        }
    };

    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            Promise.all([fetchGlobalConfig(), refreshUserData()]);
        }

        const handleFocus = () => {
            fetchGlobalConfig(true);
            if (isInitialized.current) {
                refreshUserData();
            }
        };

        const handleExpiry = async () => {
            try {
                console.log("Session expired. Signing out from native Google SDK...");
                await GoogleSignin.signOut();
            } catch (googleErr) {
                console.log("Failed or no active native Google session to sign out of during expiry:", googleErr);
            } finally {
                setUser(null);
            }
        };

        const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                handleFocus();
            }
        });

        const eventSubscription = DeviceEventEmitter.addListener('auth-expired', handleExpiry);

        return () => {
            appStateSubscription.remove();
            eventSubscription.remove();
        };
    }, []);

    useEffect(() => {
        let unsubscribeTokenRefresh: (() => void) | undefined;
        let unsubscribeForegroundListener: (() => void) | undefined;

        const initializeNotifications = async () => {
            try {
                console.log('FCM Debug: Starting notification initialization...');
                const permissionGranted = await requestUserPermission();
                console.log('FCM Debug: Permission granted status:', permissionGranted);
                if (!permissionGranted) {
                    console.log('FCM Debug: Notification permission not granted');
                    return;
                }

                // Retrieve and save the initial token
                console.log('FCM Debug: Retrieving FCM Token...');
                const token = await getFCMToken();
                console.log('FCM Debug: Retrieved token:', token ? `${token.substring(0, 10)}...` : 'null');
                if (token) {
                    console.log('FCM Debug: Saving token to backend via notificationAPI.saveToken...');
                    await notificationAPI.saveToken(token);
                    console.log('FCM Debug: FCM token saved successfully to backend');
                }

                // Register token refresh handler
                unsubscribeTokenRefresh = registerTokenRefresh(async (newToken) => {
                    try {
                        console.log('FCM Debug: Token refreshed. Saving new token to backend...');
                        await notificationAPI.saveToken(newToken);
                        console.log('FCM Debug: Refreshed FCM token saved successfully to backend');
                    } catch (err) {
                        console.error('FCM Debug: Failed to save refreshed FCM token:', err);
                    }
                });

                // Register foreground listener
                unsubscribeForegroundListener = setupForegroundListener();
            } catch (error) {
                console.error('FCM Debug: Error initializing notifications:', error);
            }
        };

        console.log('FCM Debug: useEffect check triggered. Status:', {
            hasUser: !!user,
            isFirebaseInitialized: isFirebaseInitialized()
        });
        if (user && isFirebaseInitialized()) {
            initializeNotifications();
        }

        return () => {
            if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
            if (unsubscribeForegroundListener) unsubscribeForegroundListener();
        };
    }, [user]);

    const login = (userData: any, showLoading = true) => {
        if (showLoading) { setAuthLoading(true) }
        setUser(userData);
        if (showLoading) { setAuthLoading(false) }
    };

    const logout = async () => {
        setAuthLoading(true);
        try {
            // 1. Call backend API to destroy session cookie on the server
            await authAPI.logout();
            
            // 2. Safely call native Google SDK sign-out if active
            try {
                console.log("Signing out from native Google SDK...");
                await GoogleSignin.signOut();
            } catch (googleErr) {
                console.log("No active native Google session to sign out of:", googleErr);
            }
        } catch (err) {
            console.error("Logout API execution failed:", err);
        } finally {
            setUser(null);
            setAuthLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            appLoading,
            authLoading,
            refreshUserData,
            configLoading,
            appConfig,
            setAuthLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
