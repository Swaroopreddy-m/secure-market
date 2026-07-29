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

export function getProductPlaceholder(name: string): string {
  const n = (name || "").toLowerCase();
  let icon = "📦"; // default
  let bgColor = "#f3f4f6"; // light gray
  let textColor = "#1f2937"; // dark gray
  
  if (n.includes("tomato")) {
    icon = "🍅"; bgColor = "#fee2e2"; textColor = "#991b1b";
  } else if (n.includes("spinach") || n.includes("leafy") || n.includes("coriander") || n.includes("lettuce") || n.includes("mint")) {
    icon = "🥬"; bgColor = "#d1fae5"; textColor = "#065f46";
  } else if (n.includes("apple")) {
    icon = "🍎"; bgColor = "#fee2e2"; textColor = "#991b1b";
  } else if (n.includes("mango")) {
    icon = "🥭"; bgColor = "#fef3c7"; textColor = "#92400e";
  } else if (n.includes("onion")) {
    icon = "🧅"; bgColor = "#f3e8ff"; textColor = "#6b21a8";
  } else if (n.includes("potato")) {
    icon = "🥔"; bgColor = "#fef3c7"; textColor = "#78350f";
  } else if (n.includes("capsicum") || n.includes("chili") || n.includes("pepper")) {
    icon = "🫑"; bgColor = "#d1fae5"; textColor = "#065f46";
  } else if (n.includes("rice")) {
    icon = "🌾"; bgColor = "#fafaf9"; textColor = "#44403c";
  } else if (n.includes("milk") || n.includes("dairy")) {
    icon = "🥛"; bgColor = "#eff6ff"; textColor = "#1e40af";
  } else if (n.includes("egg")) {
    icon = "🥚"; bgColor = "#f5f5f4"; textColor = "#292524";
  } else if (n.includes("banana")) {
    icon = "🍌"; bgColor = "#fef9c3"; textColor = "#854d0e";
  } else if (n.includes("orange") || n.includes("citrus")) {
    icon = "🍊"; bgColor = "#ffedd5"; textColor = "#9a3412";
  } else if (n.includes("carrot")) {
    icon = "🥕"; bgColor = "#ffedd5"; textColor = "#9a3412";
  } else if (n.includes("bread")) {
    icon = "🍞"; bgColor = "#fef3c7"; textColor = "#78350f";
  } else if (n.includes("paneer") || n.includes("cheese")) {
    icon = "🧀"; bgColor = "#fef9c3"; textColor = "#854d0e";
  } else if (n.includes("oil")) {
    icon = "🍾"; bgColor = "#fefcbf"; textColor = "#744210";
  } else if (n.includes("salt") || n.includes("sugar") || n.includes("spice")) {
    icon = "🧂"; bgColor = "#f7fee7"; textColor = "#3f6212";
  } else if (n.includes("atta") || n.includes("flour")) {
    icon = "🛍️"; bgColor = "#fef3c7"; textColor = "#78350f";
  } else if (n.includes("dal") || n.includes("pulse") || n.includes("grain")) {
    icon = "🫘"; bgColor = "#ffedd5"; textColor = "#9a3412";
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="80">${icon}</text>
    <text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="${textColor}">${name}</text>
  </svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
