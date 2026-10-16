export class CommentService {
  constructor(commentRepo, cardRepo, historyRepo) {
    this.commentRepo = commentRepo;
    this.cardRepo = cardRepo;
    this.historyRepo = historyRepo;
  }

  async create({ content, cardId, userId }) {
    if (!content || content.trim().length < 1) {
      throw Object.assign(new Error('Comentário vazio'), { status: 400 });
    }
    const card = await this.cardRepo.findById(cardId);
    if (!card) throw Object.assign(new Error('Card não encontrado'), { status: 404 });

    const comment = await this.commentRepo.create({
      content: content.trim(),
      cardId,
      userId,
    });

    await this.historyRepo.create({
      cardId,
      userId,
      action: 'COMMENTED',
      details: JSON.stringify({ commentId: comment.id }),
    });

    return { comment, card };
  }

  async listByCard(cardId) {
    return this.commentRepo.findByCard(cardId);
  }

  async getById(id) {
    const c = await this.commentRepo.findById(id);
    if (!c) throw Object.assign(new Error('Comentário não encontrado'), { status: 404 });
    return c;
  }

  async update(id, { content, userId }) {
    if (!content || content.trim().length < 1) {
      throw Object.assign(new Error('Conteúdo vazio'), { status: 400 });
    }
    const existing = await this.getById(id);
    const updated = await this.commentRepo.update(id, { content: content.trim() });

    // Registra a edição no histórico do cartão
    await this.historyRepo.create({
      cardId: existing.cardId,
      userId,
      action: 'COMMENT_EDITED',
      details: JSON.stringify({ commentId: id }),
    });

    return { comment: updated, cardId: existing.cardId };
  }

async remove(id, userId) {
  const existing = await this.getById(id);
  const card = await this.cardRepo.findById(existing.cardId);
  await this.commentRepo.delete(id);

  await this.historyRepo.create({
    cardId: existing.cardId,
    userId,
    action: 'COMMENT_DELETED',
    details: JSON.stringify({ commentId: id }),
  });

  return { cardId: existing.cardId, projectId: card?.projectId };
}
}