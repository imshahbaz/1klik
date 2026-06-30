import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import { authAPI, initializeBaseUrl, notificationAPI } from '../services/api';
import {
    getFCMToken,
    isFirebaseInitialized,
    registerTokenRefresh,
    requestUserPermission,
    setupForegroundListener,
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

/**
 * Authenticated user as returned by `/auth/me`. Known fields are typed; the
 * index signature tolerates additional backend fields without `any` casts.
 */
export interface User {
    id?: string | number;
    userId?: string | number;
    name?: string;
    username?: string;
    email?: string;
    mobile?: string;
    profile?: string;
    theme?: string;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User, showLoading?: boolean) => void;
    logout: () => Promise<void>;
    appLoading: boolean;
    authLoading: boolean;
    refreshUserData: () => Promise<void>;
    configLoading: boolean;
    appConfig: AppConfig;
    setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
    bootProgress: number;
}

const AuthContext = createContext<AuthContextType | null>(null);
const CONFIG_CACHE_KEY = 'app_global_config';
const CACHE_EXPIRY = 300000;

// Notification permissions and listener handling is managed within the AuthProvider useEffect below

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [appConfig, setAppConfig] = useState<AppConfig>({
        auth: { google: true, email: true, truecaller: true },
        components: { heatMap: true }
    });

    const [appLoading, setAppLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);
    const [bootProgress, setBootProgress] = useState(0);

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

    const refreshUserData = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        const initApp = async () => {
            try {
                setBootProgress(0.1);
                await initializeBaseUrl();
                setBootProgress(0.4);
            } catch (err) {
                console.error("FCM Debug: Base URL initialization failed:", err);
                setBootProgress(0.4);
            } finally {
                let completed = 0;
                const checkDone = () => {
                    completed += 1;
                    if (completed === 1) {
                        setBootProgress(0.7);
                    } else if (completed === 2) {
                        setBootProgress(1);
                    }
                };
                fetchGlobalConfig().finally(checkDone);
                refreshUserData().finally(checkDone);
            }
        };

        if (!isInitialized.current) {
            isInitialized.current = true;
            initApp();
        }

        const handleFocus = async () => {
            try {
                await initializeBaseUrl();
            } catch (err) {
                console.error("FCM Debug: Base URL refresh on focus failed:", err);
            }
            fetchGlobalConfig(true);
            if (isInitialized.current) {
                refreshUserData();
            }
        };

        const handleExpiry = async () => {
            try {
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
    }, [refreshUserData]); // refreshUserData is stable

    useEffect(() => {
        let unsubscribeTokenRefresh: (() => void) | undefined;
        let unsubscribeForegroundListener: (() => void) | undefined;

        const initializeNotifications = async () => {
            try {
                const permissionGranted = await requestUserPermission();
                if (!permissionGranted) {
                    return;
                }

                const token = await getFCMToken();
                if (token) {
                    await notificationAPI.saveToken(token);
                }

                // Register token refresh handler
                unsubscribeTokenRefresh = registerTokenRefresh(async (newToken) => {
                    try {
                        await notificationAPI.saveToken(newToken);
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

        if (user && isFirebaseInitialized()) {
            initializeNotifications();
        }

        return () => {
            if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
            if (unsubscribeForegroundListener) unsubscribeForegroundListener();
        };
    }, [user]);

    const login = useCallback((userData: any, showLoading = true) => {
        if (showLoading) { setAuthLoading(true) }
        setUser(userData);
        if (showLoading) { setAuthLoading(false) }
    }, []);

    const logout = useCallback(async () => {
        setAuthLoading(true);
        try {
            // 1. Call backend API to destroy session cookie on the server
            await authAPI.logout();

            // 2. Safely call native Google SDK sign-out if active
            try {
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
    }, []);

    const value = useMemo(() => ({
        user,
        login,
        logout,
        appLoading,
        authLoading,
        refreshUserData,
        configLoading,
        appConfig,
        setAuthLoading,
        bootProgress
    }), [user, login, logout, appLoading, authLoading, refreshUserData, configLoading, appConfig, setAuthLoading, bootProgress]);

    return (
        <AuthContext.Provider value={value}>
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
