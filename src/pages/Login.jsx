import { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { signIn } from '../services/placasService';
import { isSupabaseConfigured } from '../services/supabaseClient';

const rememberedEmailKey = 'controle_placas_remembered_email';

function getLoginErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase();

  if (!isSupabaseConfigured || message.includes('configuração do supabase')) {
    return 'Configuração do Supabase não encontrada.';
  }

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('tempo esgotado') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('load failed')
  ) {
    return 'Não foi possível conectar ao servidor. Tente novamente.';
  }

  return 'Não foi possível entrar. Tente novamente.';
}

export default function Login({ onLogin }) {
  const savedEmail = localStorage.getItem(rememberedEmailKey) || '';
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [keepConnected, setKeepConnected] = useState(true);
  const [rememberEmail, setRememberEmail] = useState(Boolean(savedEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRememberEmailChange = (checked) => {
    setRememberEmail(checked);
    if (!checked) {
      localStorage.removeItem(rememberedEmailKey);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Configuração do Supabase não encontrada.');
      }

      if (rememberEmail) {
        localStorage.setItem(rememberedEmailKey, email);
      } else {
        localStorage.removeItem(rememberedEmailKey);
      }

      const { user } = await signIn(email, password, { keepConnected });
      onLogin(user);
    } catch (err) {
      console.error('Erro completo do Supabase ao fazer login:', err);
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-logo-wrap login-logo">
          <img className="brand-logo" src="/assets/logo-grupo-dago.png" alt="Grupo Dago" />
        </div>
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
          <span className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </span>
        </label>
        <div className="login-options">
          <label className="checkbox-field">
            <input type="checkbox" checked={keepConnected} onChange={(event) => setKeepConnected(event.target.checked)} />
            <span>Manter conectado</span>
          </label>
          <label className="checkbox-field">
            <input type="checkbox" checked={rememberEmail} onChange={(event) => handleRememberEmailChange(event.target.checked)} />
            <span>Lembrar e-mail</span>
          </label>
        </div>
        {error && <div className="alert error">{error}</div>}
        <button className="primary-action" type="submit" disabled={loading}>
          <LogIn size={18} aria-hidden="true" />
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
