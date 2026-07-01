import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { signIn } from '../services/placasService';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user } = await signIn(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <span className="eyebrow">Transportadora</span>
          <h1>CONTROLE DE PLACAS - CARREGAMENTO</h1>
        </div>
        <label>
          E-mail
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
        </label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary-action" type="submit" disabled={loading}>
          <LogIn size={18} aria-hidden="true" />
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
