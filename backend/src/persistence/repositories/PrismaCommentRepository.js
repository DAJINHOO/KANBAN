import { ICommentRepository } from '../../domain/repositories/ICommentRepository.js';
import { prisma } from '../prisma.js';

export class PrismaCommentRepository extends ICommentRepository {
  async create(data) {
    return prisma.comment.create({ data, include: { user: true } });
  }

  async findById(id) {
    return prisma.comment.findUnique({
      where: { id },
      include: { user: true, card: true },
    });
  }

  async findByCard(cardId) {
    return prisma.comment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
  }

  async update(id, data) {
    return prisma.comment.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  async delete(id) {
    return prisma.comment.delete({ where: { id } });
  }
}