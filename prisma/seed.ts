import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const usersData = [
    { name: 'Aisha', email: 'aisha@example.com' },
    { name: 'Rohan', email: 'rohan@example.com' },
    { name: 'Priya', email: 'priya@example.com' },
    { name: 'Meera', email: 'meera@example.com' },
    { name: 'Dev', email: 'dev@example.com' },
    { name: 'Sam', email: 'sam@example.com' },
  ];

  const users: Record<string, string> = {};

  for (const u of usersData) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
      }
    });
    users[u.name] = created.id;
  }

  // Create group
  const group = await prisma.group.create({
    data: {
      name: 'Flatmates',
      currency: 'INR',
      members: {
        create: [
          { userId: users['Aisha'] },
          { userId: users['Rohan'] },
          { userId: users['Priya'] },
          { userId: users['Meera'] },
          { userId: users['Dev'] },
          { userId: users['Sam'] },
        ]
      }
    }
  });

  console.log("Seed completed. Group ID:", group.id);
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
