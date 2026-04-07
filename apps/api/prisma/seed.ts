import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('senha123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'andre@snapprice.app' },
    update: {},
    create: {
      email: 'andre@snapprice.app',
      name: 'André',
      password,
      analyses: {
        create: [
          {
            itemName: 'iPhone 14 Pro',
            estimatedMin: 3200,
            estimatedMax: 4000,
            avgPrice: 3600,
            confidence: 0.92,
            platforms: { ml: 3800, olx: 3400, facebook: 3600, ebay: 3900 },
            tips: ['Inclua a caixa original', 'Mostre o número de ciclos da bateria'],
          },
          {
            itemName: 'Nike Air Max 90',
            estimatedMin: 280,
            estimatedMax: 450,
            avgPrice: 360,
            confidence: 0.85,
            platforms: { ml: 420, olx: 310, facebook: 340, ebay: 400 },
            tips: ['Limpe os solados antes de fotografar'],
          },
        ],
      },
    },
  });

  console.log(`✅ Seed concluído — usuário: ${user.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
