import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Redirects to the login screen once the auth state has settled (`appLoading`
 * is false) and there is no authenticated user. Encapsulates the guard that was
 * previously duplicated across protected screens.
 */
export function useRequireAuth(): void {
  const router = useRouter();
  const { user, appLoading } = useAuth() as any;

  useEffect(() => {
    if (!appLoading && !user) {
      router.replace('/login');
    }
  }, [user, appLoading, router]);
}
