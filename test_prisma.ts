import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  const products = await prisma.product.findMany();
  console.log("Products count:", products.length);
}

test().catch(console.error);
