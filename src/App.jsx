import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import { getSession } from './services/placasService';
import { isSupabaseConfigured, supabase, supabaseConfigError } from './services/supabaseClient';

export default function App() {
  const [user, setUser] = useState(null);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBooting(false);
      return undefined;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    setNeedsPasswordReset(Boolean(hashParams.get('access_token')) && ['recovery', 'invite', 'signup'].includes(hashParams.get('type')));

    getSession()
      .then((session) => setUser(session?.user || null))
      .finally(() => setBooting(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <main className="login-page">
        <div className="login-card">
          <span className="eyebrow">Configuração pendente</span>
          <h1>CONTROLE DE PLACAS - CARREGAMENTO</h1>
          <div className="alert error">{supabaseConfigError}</div>
        </div>
      </main>
    );
  }

  if (booting) {
    return <main className="loading-screen">Carregando...</main>;
  }

  if (needsPasswordReset) {
    return (
      <ResetPassword
        onDone={(updatedUser) => {
          setNeedsPasswordReset(false);
          setUser(updatedUser);
        }}
      />
    );
  }

  return user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} />;
}
