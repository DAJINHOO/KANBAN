import { ICommentRepository } from '../../domain/repositories/ICommentRepository.js';
import { prisma } from '../prisma.js';

export class PrismaCommentRepository extends ICommentRepository {
  async create(data) {
    return prisma.comment.create({ data, include: { user: true } });
  }
  async findByCard(cardId) {
    return prisma.comment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
  }
}