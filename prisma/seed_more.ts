import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get existing users to attach to new groups
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.log("No users found. Please run the main seed script first.");
    return;
  }

  // Create "Goa Trip"
  await prisma.group.create({
    data: {
      name: 'Goa Trip 🏖️',
      currency: 'INR',
      members: {
        create: users.slice(0, 4).map(u => ({ userId: u.id }))
      }
    }
  });

  // Create "Office Lunch"
  await prisma.group.create({
    data: {
      name: 'Office Lunch 🍔',
      currency: 'INR',
      members: {
        create: users.slice(2, 6).map(u => ({ userId: u.id }))
      }
    }
  });

  // Create "Family"
  await prisma.group.create({
    data: {
      name: 'Family 🏡',
      currency: 'INR',
      members: {
        create: users.slice(0, 3).map(u => ({ userId: u.id }))
      }
    }
  });

  console.log("Successfully seeded more groups!");
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
