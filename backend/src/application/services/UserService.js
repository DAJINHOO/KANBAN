export class UserService {
  constructor(userRepo) { this.userRepo = userRepo; }
  async identify(name) {
    if (!name || name.trim().length < 2) throw Object.assign(new Error('Nome inválido'), { status: 400 });
    return this.userRepo.createByName(name.trim());
  }
  async list() { return this.userRepo.findAll(); }
  async getById(id) { return this.userRepo.findById(id); }
}