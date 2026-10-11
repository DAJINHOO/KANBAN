
import { IProjectRepository } from '../../domain/repositories/IProjectRepository.js';
import { prisma } from '../prisma.js';

export class PrismaProjectRepository extends IProjectRepository {
  async create(data) { return prisma.project.create({ data }); }
  async findById(id) {
    return prisma.project.findUnique({ where: { id }, include: { members: { include: { user: true } } } });
  }
  async findAll({ page = 1, limit = 10, name }) {
    const where = name ? { name: { contains: name, mode: 'insensitive' } } : {};
    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { members: true, cards: true } } },
      }),
      prisma.project.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async update(id, data) { return prisma.project.update({ where: { id }, data }); }
  async delete(id) { return prisma.project.delete({ where: { id } }); }
  async addMember(projectId, userId, role = 'MEMBER') {
    return prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: {},
      create: { projectId, userId, role },
    });
  }
  async getFullBoard(projectId) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: true } },
        columns: {
          orderBy: { position: 'asc' },
          include: { cards: { orderBy: { position: 'asc' } } },
        },
      },
    });
  }
}