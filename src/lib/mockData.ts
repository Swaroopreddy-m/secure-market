export type Category = string;

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: Category;
  image: string;
  inStock: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const CATEGORIES: Category[] = [
  "All",
  "Fresh Vegetables",
  "Leafy Vegetables",
  "Groceries",
  "Fruits",
];

export const MOCK_PRODUCTS: Product[] = [
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
    image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", /* updated to working rice/grain image */
    inStock: true,
  },
  {
    id: "4",
    name: "Fresh Red Apples",
    price: 150,
    unit: "1 kg",
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", /* updated apples */
    inStock: true,
  },
  {
    id: "5",
    name: "Whole Wheat Ashirvaad Atta",
    price: 350,
    unit: "10 kg",
    category: "Groceries",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", /* updated flour/bread */
    inStock: false,
  },
  {
    id: "6",
    name: "Fresh Coriander Leaves",
    price: 15,
    unit: "1 bunch",
    category: "Leafy Vegetables",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", /* updated greenery/herbs */
    inStock: true,
  },
  {
    id: "7",
    name: "Organic Potatoes",
    price: 35,
    unit: "1 kg",
    category: "Fresh Vegetables",
    image: "https://images.unsplash.com/photo-1580013545454-d08ef651662c?auto=format&fit=crop&w=500&q=80", /* updated onions */
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
  }
];
