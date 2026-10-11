import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Login() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await api.identify(name);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/boards');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="card-login">
      <h1>Kanban Colaborativo</h1>
      <p>Digite seu nome para entrar</p>
      <form onSubmit={handleSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required minLength={2} />
        <button disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
  );
}