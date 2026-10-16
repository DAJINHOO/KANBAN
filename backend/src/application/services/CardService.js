export class CardService {
  constructor(cardRepo, historyRepo) {
    this.cardRepo = cardRepo;
    this.historyRepo = historyRepo;
  }
  async create({ title, description, columnId, projectId, userId, position = 0 }) {
    if (!title || title.trim().length < 2) throw Object.assign(new Error('Título inválido'), { status: 400 });
    const card = await this.cardRepo.create({ title: title.trim(), description, columnId, projectId, position });
    await this.historyRepo.create({ cardId: card.id, userId, action: 'CREATED', details: JSON.stringify({ title }) });
    return card;
  }
  async update(id, data, userId) {
    const card = await this.cardRepo.update(id, data);
    await this.historyRepo.create({
      cardId: id, userId, action: 'UPDATED', details: JSON.stringify(data),
    });
    return card;
  }
  async delete(id) { return this.cardRepo.delete(id); }
  async move(id, toColumnId, toPosition, userId) {
    return this.cardRepo.move(id, toColumnId, toPosition, userId);
  }
  async getById(id) { return this.cardRepo.findById(id); }
  async listByProject(projectId) { return this.cardRepo.findByProject(projectId); }
  async list({ page, limit, projectId, columnId, assigneeId, title } = {}) {
  return this.cardRepo.findAll({
    page,
    limit,
    filter: { projectId, columnId, assigneeId, title },
  });
}
}