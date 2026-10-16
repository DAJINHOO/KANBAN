import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { prisma } from '../prisma.js';

export class PrismaUserRepository extends IUserRepository {
  async createByName(name) {
    return prisma.user.create({ data: { name } });
  }

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findAll({ page = 1, limit = 10, name } = {}) {
    const where = name ? { name: { contains: name, mode: 'insensitive' } } : {};
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { memberships: true, comments: true } } },
      }),
      prisma.user.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  }
}