import { IHistoryRepository } from '../../domain/repositories/IHistoryRepository.js';
import { prisma } from '../prisma.js';

export class PrismaHistoryRepository extends IHistoryRepository {
  async create(data) {
    return prisma.cardHistory.create({ data, include: { user: true } });
  }
  async findByCard(cardId) {
    return prisma.cardHistory.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }
}