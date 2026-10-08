import { useEffect, useState } from 'react';
import '@/styles/globals.css';
import AuthPage from '@/AuthPage';

const AUTH_SESSION_KEY = 'suraaksha.demoUser';

export default function App({ Component, pageProps }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Unable to save the demo sign-in session:', error);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (error) {
      console.error('Unable to clear the demo sign-in session:', error);
    }
  };

  useEffect(() => {
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
      console.error('Unable to restore the demo sign-in session:', error);
      try {
        window.sessionStorage.removeItem(AUTH_SESSION_KEY);
      } catch (removeError) {
        console.error('Unable to clear the invalid demo sign-in session:', removeError);
      }
    } finally {
      setAuthReady(true);
    }
  }, []);

  if (!authReady) {
    return null;
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <Component {...pageProps} currentUser={currentUser} onSignOut={handleSignOut} />;
}