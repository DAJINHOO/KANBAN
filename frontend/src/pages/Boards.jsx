import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Boards() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [user] = useState(() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
    });
  const navigate = useNavigate();

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await api.listProjects('?limit=50');
      setProjects(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createProject(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const p = await api.createProject({ name: newName, ownerId: user.id });
      setNewName('');
      await load();
      navigate(`/board/${p.id}`);
    } catch (err) { setError(err.message); }
  }

  async function open(id) {
    try {
      await api.joinProject(id, user.id);
      navigate(`/board/${id}`);
    } catch (e) { setError(e.message); }
  }

  if (!user) { navigate('/'); return null; }
  return (
    <div className="boards">
      <header>
        <h1>Olá, {user.name}</h1>
        <button onClick={() => { localStorage.removeItem('user'); navigate('/'); }}>Sair</button>
      </header>

      <form onSubmit={createProject} className="new-project">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Novo quadro…" />
        <button>Criar</button>
      </form>

      {loading && <p>Carregando…</p>}
      {error && <div className="error">{error}</div>}

      <ul className="project-list">
        {projects.map((p) => (
          <li key={p.id}>
            <button onClick={() => open(p.id)}>
              <strong>{p.name}</strong>
              <span>{p._count?.cards ?? 0} cartões · {p._count?.members ?? 0} membros</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}