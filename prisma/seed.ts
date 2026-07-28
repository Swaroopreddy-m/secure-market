import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

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
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80",
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
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
    inStock: false,
  },
  {
    id: "6",
    name: "Fresh Coriander Leaves",
    price: 15,
    unit: "1 bunch",
    category: "Leafy Vegetables",
    image: "https://images.unsplash.com/photo-1588879460493-88522c11559f?w=500&q=80",
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
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&q=80",
    inStock: true,
  },
  {
    id: "10",
    name: "Green Capsicum",
    price: 60,
    unit: "500 g",
    category: "Fresh Vegetables",
    image: "https://images.unsplash.com/photo-1589469702204-c48d498d6ac7?w=500&q=80",
    inStock: true,
  },
  {
    id: "11",
    name: "Carrots",
    price: 50,
    unit: "1 kg",
    category: "Fresh Vegetables",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80",
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
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
    inStock: true,
  },
  {
    id: "17",
    name: "Amul Milk",
    price: 28,
    unit: "500 ml",
    category: "Groceries",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80",
    inStock: true,
  },
  {
    id: "18",
    name: "Tata Salt",
    price: 25,
    unit: "1 kg",
    category: "Groceries",
    image: "https://images.unsplash.com/photo-1589469702204-c48d498d6ac7?w=500&q=80",
    inStock: true,
  },
  {
    id: "19",
    name: "Fortune Sunflower Oil",
    price: 140,
    unit: "1 litre",
    category: "Groceries",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80",
    inStock: true,
  },
  {
    id: "20",
    name: "Toor Dal",
    price: 120,
    unit: "1 kg",
    category: "Groceries",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80",
    inStock: true,
  },
  {
    id: "21",
    name: "Fresh Mint Leaves",
    price: 20,
    unit: "1 bunch",
    category: "Leafy Vegetables",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    inStock: true,
  },
  {
    id: "22",
    name: "Curry Leaves",
    price: 10,
    unit: "1 bunch",
    category: "Leafy Vegetables",
    image: "https://images.unsplash.com/photo-1588879460493-88522c11559f?w=500&q=80",
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

interface SeedSaaSProduct {
  name: string;
  code: string;
  category: string;
  description: string;
  owner: string;
  environment: string;
  documentationUrl?: string;
  repositoryUrl?: string;
}

const SAAS_PRODUCTS: SeedSaaSProduct[] = [
  { name: "Payments", code: "PAY-01", category: "Payments", description: "Multi-gateway payment processing engine", owner: "Fintech Team", environment: "PRODUCTION", documentationUrl: "https://docs.securemarket.local/payments" },
  { name: "Cards", code: "CRD-01", category: "Cards", description: "Virtual and physical debit/credit card issuance", owner: "Cards Team", environment: "PRODUCTION", documentationUrl: "https://docs.securemarket.local/cards" },
  { name: "ATM", code: "ATM-01", category: "ATM", description: "ATM network integration and terminal control", owner: "Banking Team", environment: "PRODUCTION", documentationUrl: "https://docs.securemarket.local/atm" },
  { name: "UPI", code: "UPI-01", category: "UPI", description: "Unified Payments Interface connection portal", owner: "Fintech Team", environment: "PRODUCTION", documentationUrl: "https://docs.securemarket.local/upi" },
  { name: "Wallet", code: "WLT-01", category: "Wallet", description: "Closed and semi-closed digital wallet server", owner: "Fintech Team", environment: "PRODUCTION" },
  { name: "POS", code: "POS-01", category: "POS", description: "Merchant point-of-sale terminal software", owner: "Retail Team", environment: "PRODUCTION" },
  { name: "Merchant Portal", code: "MER-01", category: "Merchant Portal", description: "Merchant settlement and analytics portal", owner: "Retail Team", environment: "PRODUCTION" },
  { name: "Mobile Banking", code: "MBK-01", category: "Mobile Banking", description: "Retail and commercial mobile banking API suite", owner: "Banking Team", environment: "PRODUCTION" },
  { name: "Internet Banking", code: "IBK-01", category: "Internet Banking", description: "Corporate and consumer online banking site", owner: "Banking Team", environment: "PRODUCTION" },
  { name: "Loans", code: "LON-01", category: "Loans", description: "Loan origination and credit underwriting system", owner: "Credit Team", environment: "STAGING" },
  { name: "Marketplace Portal", code: "MKT-01", category: "Marketplace Portal", description: "All-in-one Multi-merchant E-Commerce SaaS Marketplace", owner: "Market Team", environment: "PRODUCTION", documentationUrl: "https://docs.securemarket.local/marketplace" },
  { name: "HRMS", code: "HRM-01", category: "HRMS", description: "Human Resource Management System", owner: "Ops Team", environment: "PRODUCTION" },
  { name: "CRM", code: "CRM-01", category: "CRM", description: "Customer Relationship Management tool", owner: "Sales Team", environment: "PRODUCTION" },
  { name: "CMS", code: "CMS-01", category: "CMS", description: "Content Management System", owner: "Marketing Team", environment: "PRODUCTION" },
  { name: "Inventory", code: "INV-01", category: "Inventory", description: "Inventory management and logistics tracking", owner: "Logistics Team", environment: "PRODUCTION" },
  { name: "Billing", code: "BIL-01", category: "Billing", description: "Recurring billing and invoicing module", owner: "Fintech Team", environment: "PRODUCTION" }
];

const ROLES = [
  { name: "DEVELOPER", description: "Unrestricted root-level access to system configurations, databases, and logs." },
  { name: "SUPER_ADMIN", description: "Full business operation access: managing customers, users, products, and billing." },
  { name: "PRODUCT_ADMIN", description: "Product operations and catalog manager." },
  { name: "USER", description: "Product owner / shop merchant dashboard access." }
];

const PERMISSIONS = [
  { name: "view_dashboard", module: "DASHBOARD", description: "Can view system and analytics dashboards" },
  { name: "manage_products", module: "PRODUCTS", description: "Can CRUD, clone, and archive products" },
  { name: "manage_customers", module: "CUSTOMERS", description: "Can CRUD and manage customers" },
  { name: "manage_users", module: "USERS", description: "Can CRUD and manage users" },
  { name: "view_audit_logs", module: "AUDIT", description: "Can view business audit logs" },
  { name: "view_system_logs", module: "SYSTEM", description: "Can view raw developer system logs" },
  { name: "manage_deployments", module: "DEPLOYMENT", description: "Can control deployments and service status" },
  { name: "manage_database", module: "DATABASE", description: "Can adjust database settings and run backups" },
  { name: "manage_config", module: "CONFIG", description: "Can read/write environment variables and configurations" }
];

async function main() {
  console.log("Start seeding enterprise SaaS models...")

  // 1. Seed Store Products (for grocery storefront)
  for (const product of MOCK_PRODUCTS) {
    await prisma.storeProduct.upsert({
      where: { id: product.id },
      update: product,
      create: product
    })
  }
  console.log("Grocery store products seeded.")

  // 2. Seed Roles
  const dbRoles: Record<string, any> = {}
  for (const role of ROLES) {
    dbRoles[role.name] = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role
    })
  }
  console.log("Roles seeded.")

  // 3. Seed Permissions
  const dbPermissions: Record<string, any> = {}
  for (const perm of PERMISSIONS) {
    dbPermissions[perm.name] = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { module: perm.module, description: perm.description },
      create: perm
    })
  }
  console.log("Permissions seeded.")

  // 4. Map Roles to Permissions (RolePermission)
  const rolePermissionsMap: Record<string, string[]> = {
    DEVELOPER: ["view_dashboard", "manage_products", "manage_customers", "manage_users", "view_audit_logs", "view_system_logs", "manage_deployments", "manage_database", "manage_config"],
    SUPER_ADMIN: ["view_dashboard", "manage_products", "manage_customers", "manage_users", "view_audit_logs"],
    PRODUCT_ADMIN: ["view_dashboard", "manage_products"],
    USER: ["view_dashboard"]
  }

  for (const [roleName, permList] of Object.entries(rolePermissionsMap)) {
    const roleId = dbRoles[roleName].id
    for (const permName of permList) {
      const permissionId = dbPermissions[permName].id
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId }
        },
        update: {},
        create: { roleId, permissionId }
      })
    }
  }
  console.log("Role permissions mapped.")

  // 5. Seed SaaS Products
  const dbProducts: Record<string, any> = {}
  for (const prod of SAAS_PRODUCTS) {
    dbProducts[prod.code] = await prisma.product.upsert({
      where: { code: prod.code },
      update: {
        name: prod.name,
        category: prod.category,
        description: prod.description,
        owner: prod.owner,
        environment: prod.environment,
        documentationUrl: prod.documentationUrl,
        repositoryUrl: prod.repositoryUrl
      },
      create: prod
    })
  }
  console.log("SaaS Products seeded.")

  // 6. Seed default Organization & Customer
  const defaultOrg = await prisma.organization.upsert({
    where: { code: "OAK-01" },
    update: { name: "Oakridge Academy" },
    create: { name: "Oakridge Academy", code: "OAK-01" }
  })

  const defaultCust = await prisma.customer.upsert({
    where: { customerId: "OAK-01-CUST" },
    update: {
      companyName: "Oakridge School",
      type: "School",
      address: "123 Education Lane",
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      contactPerson: "Sarah Principal",
      email: "sarah_principal@oakridge.local",
      phone: "+91 9988776655",
      status: "ACTIVE",
      organizationId: defaultOrg.id
    },
    create: {
      customerId: "OAK-01-CUST",
      companyName: "Oakridge School",
      type: "School",
      address: "123 Education Lane",
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      contactPerson: "Sarah Principal",
      email: "sarah_principal@oakridge.local",
      phone: "+91 9988776655",
      status: "ACTIVE",
      organizationId: defaultOrg.id
    }
  })
  console.log("SaaS Organizations & Customers seeded.")

  // 7. Seed standard configurations
  await prisma.configuration.upsert({
    where: { key: "CONCURRENT_LOGIN_POLICY" },
    update: { value: "FORCE_LOGOUT" },
    create: { key: "CONCURRENT_LOGIN_POLICY", value: "FORCE_LOGOUT", description: "FORCE_LOGOUT or REJECT_LOGIN" }
  })
  await prisma.configuration.upsert({
    where: { key: "PASSWORD_HISTORY_LIMIT" },
    update: { value: "5" },
    create: { key: "PASSWORD_HISTORY_LIMIT", value: "5", description: "Number of passwords stored in history" }
  })
  console.log("System configurations seeded.")

  // 8. Seed credentials users
  const hashedPass = hashPassword("password123")

  const usersToSeed = [
    {
      id: "developer-user-1",
      employeeId: "DEV-001",
      username: "devroot",
      name: "System Developer",
      email: "developer@securemarket.local",
      role: "DEVELOPER",
      roleId: dbRoles["DEVELOPER"].id,
      department: "all",
      passwordHash: hashedPass
    },
    {
      id: "superadmin-user-1",
      employeeId: "SAD-001",
      username: "super_admin_market",
      name: "Sarah Admin",
      email: "sarah.admin@securemarket.local",
      role: "SUPER_ADMIN",
      roleId: dbRoles["SUPER_ADMIN"].id,
      department: "customers,users,reports,settings",
      passwordHash: hashedPass
    },
    {
      id: "productadmin-user-1",
      employeeId: "PAD-001",
      username: "product_admin_market",
      name: "Product Admin",
      email: "product.admin@securemarket.local",
      role: "PRODUCT_ADMIN",
      roleId: dbRoles["PRODUCT_ADMIN"].id,
      department: "product-admin,merchant-accounts",
      passwordHash: hashedPass
    },
    {
      id: "user-shop-1",
      employeeId: "USR-001",
      username: "user_market",
      name: "Shop Owner",
      email: "owner@securemarket.local",
      role: "USER",
      roleId: dbRoles["USER"].id,
      customerId: defaultCust.id,
      organizationId: defaultOrg.id,
      department: "user-dashboard,inventory,orders",
      passwordHash: hashedPass
    }
  ]

  // Clean existing seeded users to prevent unique constraint conflicts on usernames
  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { in: ["developer-user-1", "superadmin-user-1", "productadmin-user-1", "user-shop-1"] } },
        { username: { in: ["devroot", "super_admin_market", "product_admin_market", "user_market"] } }
      ]
    }
  });

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        employeeId: u.employeeId,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        roleId: u.roleId,
        customerId: u.customerId || null,
        organizationId: u.organizationId || null,
        department: u.department,
        passwordHash: u.passwordHash
      },
      create: {
        id: u.id,
        employeeId: u.employeeId,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        roleId: u.roleId,
        customerId: u.customerId || null,
        organizationId: u.organizationId || null,
        department: u.department,
        passwordHash: u.passwordHash
      }
    })
  }

  // 9. Assign Products to default customer
  await prisma.subscription.upsert({
    where: { id: "sub-1" },
    update: {},
    create: {
      id: "sub-1",
      customerId: defaultCust.id,
      productId: dbProducts["MKT-01"].id,
      status: "ACTIVE"
    }
  })

  await prisma.license.upsert({
    where: { key: "MARKETPLACE-LICENSE-KEY-1" },
    update: {},
    create: {
      key: "MARKETPLACE-LICENSE-KEY-1",
      customerId: defaultCust.id,
      productId: dbProducts["MKT-01"].id,
      status: "ACTIVE"
    }
  })

  console.log("Credentials users and initial assignments seeded successfully.")
  console.log("Database seed completed successfully!")
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
