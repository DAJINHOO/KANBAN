export class IProjectRepository {
  async create(data) { throw new Error('not implemented'); }
  async findById(id) { throw new Error('not implemented'); }
  async findAll({ page, limit, name }) { throw new Error('not implemented'); }
  async update(id, data) { throw new Error('not implemented'); }
  async delete(id) { throw new Error('not implemented'); }
  async addMember(projectId, userId, role) { throw new Error('not implemented'); }
  async getFullBoard(projectId) { throw new Error('not implemented'); }
}