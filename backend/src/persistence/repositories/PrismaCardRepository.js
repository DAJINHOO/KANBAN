import { ICardRepository } from '../../domain/repositories/ICardRepository.js';
import { prisma } from '../prisma.js';

export class PrismaCardRepository extends ICardRepository {
  async create(data) { return prisma.card.create({ data }); }
  async findById(id) {
    return prisma.card.findUnique({
      where: { id },
      include: { comments: { include: { user: true }, orderBy: { createdAt: 'asc' } }, assignee: true },
    });
  }
  async findByProject(projectId) {
    return prisma.card.findMany({ where: { projectId }, orderBy: { position: 'asc' } });
  }
  async update(id, data) { return prisma.card.update({ where: { id }, data }); }
  async delete(id) { return prisma.card.delete({ where: { id } }); }

  // Movimentação transacional: reordena origem e destino e registra histórico
  async move(cardId, toColumnId, toPosition, userId) {
    return prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({ where: { id: cardId } });
      if (!card) throw Object.assign(new Error('Card não encontrado'), { status: 404 });

      const fromColumnId = card.columnId;
      const fromPosition = card.position;

      // Remove do lugar de origem (reordena os que vinham depois)
      if (fromColumnId === toColumnId) {
        if (fromPosition < toPosition) {
          await tx.card.updateMany({
            where: { columnId: fromColumnId, position: { gt: fromPosition, lte: toPosition } },
            data: { position: { decrement: 1 } },
          });
        } else if (fromPosition > toPosition) {
          await tx.card.updateMany({
            where: { columnId: fromColumnId, position: { gte: toPosition, lt: fromPosition } },
            data: { position: { increment: 1 } },
          });
        }
      } else {
        await tx.card.updateMany({
          where: { columnId: fromColumnId, position: { gt: fromPosition } },
          data: { position: { decrement: 1 } },
        });
        await tx.card.updateMany({
          where: { columnId: toColumnId, position: { gte: toPosition } },
          data: { position: { increment: 1 } },
        });
      }

      const updated = await tx.card.update({
        where: { id: cardId },
        data: { columnId: toColumnId, position: toPosition },
      });

      await tx.cardHistory.create({
        data: {
          cardId,
          userId,
          action: 'MOVED',
          details: JSON.stringify({ fromColumnId, fromPosition, toColumnId, toPosition }),
        },
      });

      return updated;
    });
  }
}
