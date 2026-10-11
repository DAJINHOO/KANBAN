export class ProjectService {
  constructor(projectRepo) { this.projectRepo = projectRepo; }
  async create({ name, description, ownerId }) {
    if (!name || name.trim().length < 2) throw Object.assign(new Error('Nome do projeto inválido'), { status: 400 });
    const project = await this.projectRepo.create({ name: name.trim(), description, ownerId });
    await this.projectRepo.addMember(project.id, ownerId, 'OWNER');
    // Cria colunas padrão
    return project;
  }
  async list(query) { return this.projectRepo.findAll(query); }
  async getBoard(id) {
    const board = await this.projectRepo.getFullBoard(id);
    if (!board) throw Object.assign(new Error('Projeto não encontrado'), { status: 404 });
    return board;
  }
  async join(projectId, userId) {
    await this.projectRepo.addMember(projectId, userId, 'MEMBER');
    return this.getBoard(projectId);
  }
  async update(id, data) { return this.projectRepo.update(id, data); }
  async remove(id) { return this.projectRepo.delete(id); }
}