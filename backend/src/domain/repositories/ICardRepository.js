export class ICardRepository {
  async create(data) { throw new Error('not implemented'); }
  async findById(id) { throw new Error('not implemented'); }
  async findByProject(projectId) { throw new Error('not implemented'); }
  async findAll({ page, limit, filter } = {}) { throw new Error('not implemented'); }
  async update(id, data) { throw new Error('not implemented'); }
  async delete(id) { throw new Error('not implemented'); }
  async move(id, toColumnId, toPosition, userId) { throw new Error('not implemented'); }
}