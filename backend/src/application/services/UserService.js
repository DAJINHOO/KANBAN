export class UserService {
  constructor(userRepo) {
    this.userRepo = userRepo;
  }

  async identify(name) {
    if (!name || name.trim().length < 2) {
      throw Object.assign(new Error('Nome inválido'), { status: 400 });
    }
    return this.userRepo.createByName(name.trim());
  }

  async list(query = {}) {
    return this.userRepo.findAll(query);
  }

  async getById(id) {
    const user = await this.userRepo.findById(id);
    if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });
    return user;
  }

  async update(id, { name }) {
    if (!name || name.trim().length < 2) {
      throw Object.assign(new Error('Nome inválido'), { status: 400 });
    }
    await this.getById(id); // garante 404 se não existir
    return this.userRepo.update(id, { name: name.trim() });
  }

  async remove(id) {
    await this.getById(id);
    await this.userRepo.delete(id);
  }
}