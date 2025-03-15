import { PrismaClient, RoomType, RoomView } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if there is existing data in the Room table
  const roomCount = await prisma.room.count();

  if (roomCount > 0) {
    console.log('⏭️ Rooms data already exists, skipping seed');
    return;
  }

  await prisma.room.createMany({
    data: [
      // Single Rooms
      ...Array(5)
        .fill(null)
        .map(() => ({
          type: RoomType.SENCILLA,
          view: RoomView.EXTERIOR,
          basePrice: 60000,
          maxCapacity: 1,
        })),
      ...Array(5)
        .fill(null)
        .map(() => ({
          type: RoomType.SENCILLA,
          view: RoomView.INTERIOR,
          basePrice: 60000,
          maxCapacity: 1,
        })),

      // Double Rooms
      ...Array(8)
        .fill(null)
        .map(() => ({
          type: RoomType.DOBLE,
          view: RoomView.EXTERIOR,
          basePrice: 100000,
          maxCapacity: 2,
        })),
      ...Array(7)
        .fill(null)
        .map(() => ({
          type: RoomType.DOBLE,
          view: RoomView.INTERIOR,
          basePrice: 100000,
          maxCapacity: 2,
        })),

      // Presidential Rooms
      ...Array(3)
        .fill(null)
        .map(() => ({
          type: RoomType.PRESIDENCIAL,
          view: RoomView.EXTERIOR,
          basePrice: 160000,
          maxCapacity: 4,
        })),
      ...Array(2)
        .fill(null)
        .map(() => ({
          type: RoomType.PRESIDENCIAL,
          view: RoomView.INTERIOR,
          basePrice: 160000,
          maxCapacity: 4,
        })),
    ],
    skipDuplicates: true,
  });
}

async function runSeed() {
  try {
    await main();
    console.log('🌱 Seeding completed');
  } catch (e) {
    console.error('🚨 Error during seeding:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Prisma connection closed');
  }
}

void runSeed();
