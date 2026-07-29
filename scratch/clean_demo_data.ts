import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up demo customer and organization...");

  // 1. Delete subscriptions and licenses for default customer
  const defaultCust = await prisma.customer.findUnique({
    where: { customerId: "OAK-01-CUST" }
  });

  if (defaultCust) {
    await prisma.subscription.deleteMany({
      where: { customerId: defaultCust.id }
    });
    await prisma.license.deleteMany({
      where: { customerId: defaultCust.id }
    });
  }

  // 2. Delete customer and organization
  await prisma.customer.deleteMany({
    where: { customerId: "OAK-01-CUST" }
  });

  await prisma.organization.deleteMany({
    where: { code: "OAK-01" }
  });

  console.log("Demo data cleaned successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
