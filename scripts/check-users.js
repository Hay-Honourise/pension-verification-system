/* eslint-disable */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    const rows = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      take: 10,
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
    console.log(JSON.stringify({ count, rows }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


