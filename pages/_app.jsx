import { useState } from 'react';
import '@/styles/globals.css';
import AuthPage from '@/AuthPage';

export default function App({ Component, pageProps }) {
  const [currentUser, setCurrentUser] = useState(null);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <Component {...pageProps} currentUser={currentUser} onSignOut={handleSignOut} />;
}