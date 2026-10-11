export class CommentService {
  constructor(commentRepo, cardRepo, historyRepo) {
    this.commentRepo = commentRepo;
    this.cardRepo = cardRepo;
    this.historyRepo = historyRepo;
  }
  async create({ content, cardId, userId }) {
    if (!content || content.trim().length < 1) throw Object.assign(new Error('Comentário vazio'), { status: 400 });
    const card = await this.cardRepo.findById(cardId);
    if (!card) throw Object.assign(new Error('Card não encontrado'), { status: 404 });
    const comment = await this.commentRepo.create({ content: content.trim(), cardId, userId });
    await this.historyRepo.create({
      cardId, userId, action: 'COMMENTED', details: JSON.stringify({ commentId: comment.id }),
    });
    return { comment, card };
  }
  async listByCard(cardId) { return this.commentRepo.findByCard(cardId); }
}