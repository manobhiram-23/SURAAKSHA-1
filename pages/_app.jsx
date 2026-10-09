import { useEffect, useState } from 'react';
import '@/styles/globals.css';
import AuthPage from '@/AuthPage';
import { supabase, supabaseSignOut } from '@/supabase';

const AUTH_SESSION_KEY = 'suraaksha.authenticatedUser';

export default function App({ Component, pageProps }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Unable to save the sign-in session:', error);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      try {
        await supabaseSignOut();
      } catch (err) {
        console.error('Supabase sign-out error:', err);
      }
    }
    setCurrentUser(null);
    try {
      window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (error) {
      console.error('Unable to clear the sign-in session:', error);
    }
  };

  useEffect(() => {
    // 1. Check for stored session in sessionStorage
    try {
      const storedUser = window.sessionStorage.getItem(AUTH_SESSION_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (
          user &&
          typeof user.name === 'string' &&
          typeof user.email === 'string' &&
          typeof user.role === 'string' &&
          typeof user.badge === 'string'
        ) {
          setCurrentUser(user);
        } else {
          window.sessionStorage.removeItem(AUTH_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('Unable to restore the sign-in session:', error);
      try {
        window.sessionStorage.removeItem(AUTH_SESSION_KEY);
      } catch (removeError) {
        console.error('Unable to clear the invalid sign-in session:', removeError);
      }
    }

    // 2. Listen for Supabase Auth changes (such as email confirmation or token exchange)
    let authSubscription = null;
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u = session.user;
          const userObj = {
            name: u.user_metadata?.name || u.email.split('@')[0],
            email: u.email,
            role: u.user_metadata?.role || 'officer',
            badge: u.user_metadata?.badge || 'SOC-' + u.id.slice(0, 4).toUpperCase(),
          };
          handleAuthSuccess(userObj);
        }
      });

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const u = session.user;
          const userObj = {
            name: u.user_metadata?.name || u.email.split('@')[0],
            email: u.email,
            role: u.user_metadata?.role || 'officer',
            badge: u.user_metadata?.badge || 'SOC-' + u.id.slice(0, 4).toUpperCase(),
          };
          handleAuthSuccess(userObj);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          try {
            window.sessionStorage.removeItem(AUTH_SESSION_KEY);
          } catch (_) {}
        }
      });
      authSubscription = data?.subscription;
    }

    setAuthReady(true);

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  if (!authReady) {
    return null;
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <Component {...pageProps} currentUser={currentUser} onSignOut={handleSignOut} />;
}