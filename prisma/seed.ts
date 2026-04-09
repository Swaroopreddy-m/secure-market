import { PrismaClient } from '@prisma/client'
/**npx tsx prisma/seed.ts */
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Farm Fresh Tomatoes",
    price: 40,
    unit: "1 kg",
    category: "Fresh Vegetables",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "2",
    name: "Organic Spinach",
    price: 25,
    unit: "1 bunch",
    category: "Leafy Vegetables",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "3",
    name: "Premium Basmati Rice",
    price: 180,
    unit: "1 kg",
    category: "Groceries",
    image: "/images/rice.png",
    inStock: true,
  },
  {
    id: "4",
    name: "Fresh Red Apples",
    price: 150,
    unit: "1 kg",
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "5",
    name: "Whole Wheat Ashirvaad Atta",
    price: 350,
    unit: "10 kg",
    category: "Groceries",
    image: "/images/atta.png",
    inStock: false,
  },
  {
    id: "6",
    name: "Fresh Coriander Leaves",
    price: 15,
    unit: "1 bunch",
    category: "Leafy Vegetables",
    image: "/images/coriander.png",
    inStock: true,
  },
  {
    id: "7",
    name: "Organic Potatoes",
    price: 35,
    unit: "1 kg",
    category: "Fresh Vegetables",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "8",
    name: "Alphonso Mango",
    price: 500,
    unit: "1 Dozen",
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "9",
    name: "Fresh Onions",
    price: 30,
    unit: "1 kg",
    category: "Fresh Vegetables",
    image: "/images/onions.png",
    inStock: true,
  },
  {
    id: "10",
    name: "Green Capsicum",
    price: 60,
    unit: "500 g",
    category: "Fresh Vegetables",
    image: "/images/capsicum.png",
    inStock: true,
  },
  {
    id: "11",
    name: "Carrots",
    price: 50,
    unit: "1 kg",
    category: "Fresh Vegetables",
    image: "/images/carrots.png",
    inStock: true,
  },
  {
    id: "12",
    name: "Cauliflower",
    price: 45,
    unit: "1 piece",
    category: "Fresh Vegetables",
    image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "13",
    name: "Bananas",
    price: 60,
    unit: "1 dozen",
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "14",
    name: "Watermelon",
    price: 90,
    unit: "1 piece",
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "15",
    name: "Pineapple",
    price: 80,
    unit: "1 piece",
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "16",
    name: "Brown Bread",
    price: 45,
    unit: "400 g",
    category: "Groceries",
    image: "/images/bread.png",
    inStock: true,
  },
  {
    id: "17",
    name: "Amul Milk",
    price: 28,
    unit: "500 ml",
    category: "Groceries",
    image: "/images/milk.png",
    inStock: true,
  },
  {
    id: "18",
    name: "Tata Salt",
    price: 25,
    unit: "1 kg",
    category: "Groceries",
    image: "/images/salt.png",
    inStock: true,
  },
  {
    id: "19",
    name: "Fortune Sunflower Oil",
    price: 140,
    unit: "1 litre",
    category: "Groceries",
    image: "/images/oil.png",
    inStock: true,
  },
  {
    id: "20",
    name: "Toor Dal",
    price: 120,
    unit: "1 kg",
    category: "Groceries",
    image: "/images/dal.png",
    inStock: true,
  },
  {
    id: "21",
    name: "Fresh Mint Leaves",
    price: 20,
    unit: "1 bunch",
    category: "Leafy Vegetables",
    image: "/images/mint.png",
    inStock: true,
  },
  {
    id: "22",
    name: "Curry Leaves",
    price: 10,
    unit: "1 bunch",
    category: "Leafy Vegetables",
    image: "/images/curry leaves.png",
    inStock: true,
  },
  {
    id: "23",
    name: "Lettuce",
    price: 70,
    unit: "1 piece",
    category: "Leafy Vegetables",
    image: "https://images.unsplash.com/photo-1546793665-c74683c3f38d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "24",
    name: "Paneer",
    price: 90,
    unit: "200 g",
    category: "Groceries",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    inStock: true,
  }
];

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)
  for (const product of MOCK_PRODUCTS) {
    const p = await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    })
    console.log(`Created/updated product with id: ${p.id}`)
  }
  console.log(`Seeding finished.`)
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
