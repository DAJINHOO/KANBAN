import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { prisma } from '../prisma.js';

export class PrismaUserRepository extends IUserRepository {
  async createByName(name) { return prisma.user.create({ data: { name } }); }
  async findById(id) { return prisma.user.findUnique({ where: { id } }); }
  async findAll() { return prisma.user.findMany({ orderBy: { createdAt: 'desc' } }); }
}