export class ProjectService {
  constructor(projectRepo, prisma) {
    this.projectRepo = projectRepo;
    this.prisma = prisma;
  }

  async create({ name, description, ownerId }) {
    if (!name || name.trim().length < 2) {
      throw Object.assign(new Error('Nome do projeto inválido'), { status: 400 });
    }

    // Cria projeto + membro + colunas padrão numa única transação.
    // Se qualquer parte falhar, nada é gravado.
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: name.trim(),
          description,
          members: { create: { userId: ownerId, role: 'OWNER' } },
          columns: {
            create: [
              { name: 'A Fazer', position: 0 },
              { name: 'Em Progresso', position: 1 },
              { name: 'Concluído', position: 2 },
            ],
          },
        },
        include: { columns: { orderBy: { position: 'asc' } } },
      });
      return project;
    });
  }

  async list(query) {
    return this.projectRepo.findAll(query);
  }

  async getBoard(id) {
    const board = await this.projectRepo.getFullBoard(id);
    if (!board) throw Object.assign(new Error('Projeto não encontrado'), { status: 404 });
    return board;
  }

  async join(projectId, userId) {
    await this.projectRepo.addMember(projectId, userId, 'MEMBER');
    return this.getBoard(projectId);
  }

  async update(id, data) {
    return this.projectRepo.update(id, data);
  }

  async remove(id) {
    return this.projectRepo.delete(id);
  }
}