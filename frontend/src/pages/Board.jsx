import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { connect, getSocket } from '../services/socket';

export default function Board() {
  const { id } = useParams();
  const [user] = useState(() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
    });
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState([]);
  const [editing, setEditing] = useState({}); // cardId -> userId
  const [notifications, setNotifications] = useState([]);
  const [openCard, setOpenCard] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setBoard(await api.getBoard(id)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (!user) navigate('/'); else load(); }, [load, user, navigate]);

  // WebSocket
  useEffect(() => {
    if (!user) return;
    const socket = connect();
    socket.emit('board:join', { projectId: id, userId: user.id });

    const onState = (b) => setBoard(b);
    const onMoved = ({ cardId, toColumnId, toPosition, movedBy }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const columns = prev.columns.map((c) => ({ ...c, cards: c.cards.filter((k) => k.id !== cardId) }));
        const moving = prev.columns.flatMap((c) => c.cards).find((k) => k.id === cardId);
        if (!moving) return prev;
        const target = columns.find((c) => c.id === toColumnId);
        target.cards.splice(toPosition, 0, { ...moving, columnId: toColumnId, position: toPosition });
        return { ...prev, columns };
      });
      if (movedBy !== user.id) pushNotification('Cartão movido por outro usuário');
    };
    const onCreated = (card) => setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((c) => c.id === card.columnId
          ? { ...c, cards: [...c.cards, card] } : c),
      };
    });
    const onDeleted = ({ id: cardId }) => setBoard((prev) => prev && {
      ...prev,
      columns: prev.columns.map((c) => ({ ...c, cards: c.cards.filter((k) => k.id !== cardId) })),
    });
    const onEditing = ({ cardId, userId }) => setEditing((prev) => ({ ...prev, [cardId]: userId }));
    const onEditingStop = ({ cardId }) => setEditing((prev) => {
      const copy = { ...prev }; delete copy[cardId]; return copy;
    });
    const onPresence = ({ onlineUserIds }) => setOnline(onlineUserIds || []);
    const onNotif = (n) => pushNotification(n.message);
    const onComment = ({ cardId, comment }) => {
      // Atualiza card aberto se o comentário for dele
      setOpenCard((prev) => prev && prev.id === cardId
        ? { ...prev, comments: [...(prev.comments || []), comment] }
        : prev);
    };

    socket.on('board:state', onState);
    socket.on('card:moved', onMoved);
    socket.on('card:created', onCreated);
    socket.on('card:deleted', onDeleted);
    socket.on('card:editing', onEditing);
    socket.on('card:editing-stop', onEditingStop);
    socket.on('presence:update', onPresence);
    socket.on('notification', onNotif);
    socket.on('comment:new', onComment);

    return () => {
      socket.emit('board:leave');
      socket.off('board:state', onState);
      socket.off('card:moved', onMoved);
      socket.off('card:created', onCreated);
      socket.off('card:deleted', onDeleted);
      socket.off('card:editing', onEditing);
      socket.off('card:editing-stop', onEditingStop);
      socket.off('presence:update', onPresence);
      socket.off('notification', onNotif);
      socket.off('comment:new', onComment);
    };
  }, [id, user, navigate]);

  function pushNotification(msg) {
    const n = { id: Date.now() + Math.random(), msg };
    setNotifications((prev) => [n, ...prev].slice(0, 5));
    setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== n.id)), 4000);
  }

  // ----- Drag & Drop nativo -----
  function onDragStart(e, card) {
    e.dataTransfer.setData('text/plain', card.id);
    getSocket()?.emit('card:editing-start', { cardId: card.id, projectId: id });
  }
  function onDragEnd(e, card) {
    getSocket()?.emit('card:editing-stop', { cardId: card.id, projectId: id });
  }
  function onDrop(e, column) {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId) return;
    // Calcula a nova posição (usa o índice de onde caiu)
    const toPosition = column.cards.length;
    getSocket()?.emit('card:move', { cardId, toColumnId: column.id, toPosition });
  }
  function onDragOver(e) { e.preventDefault(); }

  async function addCard(columnId) {
    const title = prompt('Título do cartão:');
    if (!title) return;
    try {
      await api.createCard({
        title, columnId, projectId: id, userId: user.id, position: 999,
      });
    } catch (e) { setError(e.message); }
  }

  async function openCardDetails(card) {
    try {
      const comments = await api.listComments(card.id);
      setOpenCard({ ...card, comments });
      getSocket()?.emit('card:editing-start', { cardId: card.id, projectId: id });
    } catch (e) { setError(e.message); }
  }
  function closeCard() {
    if (openCard) getSocket()?.emit('card:editing-stop', { cardId: openCard.id, projectId: id });
    setOpenCard(null);
  }

  async function sendComment(text) {
    if (!text.trim()) return;
    try {
      await api.createComment(openCard.id, { content: text, userId: user.id });
    } catch (e) { setError(e.message); }
  }

  if (loading) return <p>Carregando quadro…</p>;
  if (error) return <div className="error">{error}</div>;
  if (!board) return null;

  return (
    <div className="board-page">
      <header>
        <button onClick={() => navigate('/boards')}>← Voltar</button>
        <h1>{board.name}</h1>
        <span className="online">{online.length} online</span>
      </header>

      <div className="notifications">
        {notifications.map((n) => <div key={n.id} className="notif">{n.msg}</div>)}
      </div>

      <div className="columns">
        {board.columns.map((col) => (
          <div
            key={col.id}
            className="column"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col)}
          >
            <div className="column-header">
              <h3>{col.name}</h3>
              <button onClick={() => addCard(col.id)}>+</button>
            </div>
            <ul>
              {col.cards.map((card) => (
                <li
                  key={card.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, card)}
                  onDragEnd={(e) => onDragEnd(e, card)}
                  onClick={() => openCardDetails(card)}
                  className={`card ${editing[card.id] ? 'editing' : ''}`}
                >
                  <strong>{card.title}</strong>
                  {editing[card.id] && (
                    <span className="editing-badge">
                      {editing[card.id] === user.id ? 'Você está editando' : 'Alguém editando'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {openCard && (
        <div className="modal-backdrop" onClick={closeCard}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{openCard.title}</h2>
            <h4>Comentários</h4>
            <ul className="comments">
              {(openCard.comments || []).map((c) => (
                <li key={c.id}><strong>{c.user.name}:</strong> {c.content}</li>
              ))}
            </ul>
            <CommentForm onSubmit={sendComment} />
            <button onClick={closeCard}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentForm({ onSubmit }) {
  const [text, setText] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(text); setText(''); }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva um comentário…" />
      <button>Enviar</button>
    </form>
  );
}