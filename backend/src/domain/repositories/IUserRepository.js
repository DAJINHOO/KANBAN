export class IUserRepository {
  async createByName(name) { throw new Error('not implemented'); }
  async findById(id) { throw new Error('not implemented'); }
  async findAll({ page, limit, name } = {}) { throw new Error('not implemented'); }
  async update(id, data) { throw new Error('not implemented'); }
  async delete(id) { throw new Error('not implemented'); }
}