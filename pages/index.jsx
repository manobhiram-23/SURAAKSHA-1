import Head from 'next/head';
import Dashboard from '@/components/Dashboard';

export default function Home({ currentUser, onSignOut }) {
  return (
    <>
      <Head>
        <title>SURAAKSHA — Threat Alert Dashboard</title>
      </Head>
      <Dashboard currentUser={currentUser} onSignOut={onSignOut} />
    </>
  );
}