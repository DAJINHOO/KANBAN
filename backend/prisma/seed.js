import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ana = await prisma.user.create({ data: { name: 'Ana' } });
  const bia = await prisma.user.create({ data: { name: 'Bia' } });

  const project = await prisma.project.create({
    data: {
      name: 'Trabalho de História',
      description: 'Quadro colaborativo do grupo',
      members: {
        create: [
          { userId: ana.id, role: 'OWNER' },
          { userId: bia.id, role: 'MEMBER' },
        ],
      },
      columns: {
        create: [
          { name: 'A Fazer', position: 0 },
          { name: 'Em Progresso', position: 1 },
          { name: 'Concluído', position: 2 },
        ],
      },
    },
    include: { columns: true },
  });

  const [todo, doing] = project.columns;
  await prisma.card.create({
    data: { title: 'Pesquisar fontes', columnId: todo.id, projectId: project.id, position: 0 },
  });
  await prisma.card.create({
    data: { title: 'Escrever introdução', columnId: doing.id, projectId: project.id, position: 0, assigneeId: ana.id },
  });

  console.log('Seed concluído.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());