const BASE = '/api';
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Erro de rede' } }));
    throw new Error(err.error?.message || 'Erro');
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  identify: (name) => req('/users', { method: 'POST', body: { name } }),
  listProjects: (query = '') => req('/projects' + query),
  createProject: (data) => req('/projects', { method: 'POST', body: data }),
  getBoard: (id) => req(`/projects/${id}/board`),
  joinProject: (id, userId) => req(`/projects/${id}/join`, { method: 'POST', body: { userId } }),
  createCard: (data) => req('/cards', { method: 'POST', body: data }),
  updateCard: (id, data) => req(`/cards/${id}`, { method: 'PUT', body: data }),
  moveCard: (id, data) => req(`/cards/${id}/move`, { method: 'POST', body: data }),
  listComments: (cardId) => req(`/cards/${cardId}/comments`),
  createComment: (cardId, data) => req(`/cards/${cardId}/comments`, { method: 'POST', body: data }),
};