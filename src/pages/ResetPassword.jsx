import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      window.history.replaceState({}, document.title, window.location.pathname);
      onDone(data.user);
    } catch (err) {
      setError(err.message || 'Não foi possível definir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <span className="eyebrow">Primeiro acesso</span>
          <h1>Definir senha</h1>
        </div>
        <label>
          Nova senha
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" />
        </label>
        <label>
          Confirmar senha
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" />
        </label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary-action" type="submit" disabled={loading}>
          <KeyRound size={18} aria-hidden="true" />
          {loading ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </main>
  );
}
