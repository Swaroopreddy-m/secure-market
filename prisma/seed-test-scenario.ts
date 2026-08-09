import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Starting test scenario seed...");

  // 1. Create Organization
  const orgCode = "ORGTEST";
  let org = await prisma.organization.findUnique({
    where: { code: orgCode }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Test Organization",
        code: orgCode,
        logo: "/images/orgs/default.png",
        description: "Organization seeded for manual verification testing",
        subscription: "ENTERPRISE",
        theme: "light",
        status: "ACTIVE",
        type: "IT & Banking",
        remarks: "Seeded test case"
      }
    });
    console.log(`Created organization: ${org.name} (${org.code})`);
  }

  // 2. Create Super Admin Roles
  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  const productAdminRole = await prisma.role.findUnique({ where: { name: "PRODUCT_ADMIN" } });
  const userRole = await prisma.role.findUnique({ where: { name: "USER" } });

  // 3. Create Super Admins (super_one, super_two)
  const hashedPass = hashPassword("password123");

  const superAdmins = [
    { username: "super_one", email: "super_one@test.com", name: "Super Admin One" },
    { username: "super_two", email: "super_two@test.com", name: "Super Admin Two" }
  ];

  const superAdminUsers: any[] = [];

  for (const sa of superAdmins) {
    let user = await prisma.user.findUnique({ where: { username: sa.username } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          employeeId: `SUP-${sa.username.slice(-3).toUpperCase()}`,
          username: sa.username,
          name: sa.name,
          email: sa.email,
          passwordHash: hashedPass,
          role: "SUPER_ADMIN",
          roleId: superAdminRole?.id || null,
          department: "dashboard,organizations,applications,users,roles,settings,reports,analytics,audit logs",
          status: "ACTIVE",
          userApprovalStatus: "APPROVED",
          roleMatrixStatus: "APPROVED",
          organizationId: org.id
        }
      });
      console.log(`Created Super Admin user: ${user.username}`);
    }
    superAdminUsers.push(user);
  }

  // 4. Create two Applications (IT, bank)
  const apps = [
    { name: "IT Solutions Portal", code: "IT", description: "Application for IT products" },
    { name: "Bank Marketplace", code: "bank", description: "Application for banking services" }
  ];

  const appRecords: any[] = [];

  for (const app of apps) {
    let appRec = await prisma.application.findFirst({ where: { name: app.name } });
    if (!appRec) {
      const settingsObj = {
        code: app.code,
        theme: "light",
        status: "ACTIVE"
      };
      appRec = await prisma.application.create({
        data: {
          name: app.name,
          description: app.description,
          logo: "/images/apps/default.png",
          settings: JSON.stringify(settingsObj),
          organizationId: org.id
        }
      });
      console.log(`Created Application: ${appRec.name} (${app.code})`);
    }
    appRecords.push(appRec);
  }

  // 5. Create two Product Admins for each application (product_one, product_two)
  const productAdmins = [
    { username: "product_one_it", email: "prod1_it@test.com", name: "Product Admin One IT", appName: "IT Solutions Portal" },
    { username: "product_two_it", email: "prod2_it@test.com", name: "Product Admin Two IT", appName: "IT Solutions Portal" },
    { username: "product_one_bank", email: "prod1_bank@test.com", name: "Product Admin One Bank", appName: "Bank Marketplace" },
    { username: "product_two_bank", email: "prod2_bank@test.com", name: "Product Admin Two Bank", appName: "Bank Marketplace" }
  ];

  const productAdminUsers: any[] = [];

  for (const pa of productAdmins) {
    const app = appRecords.find(a => a.name === pa.appName);
    if (!app) continue;

    let user = await prisma.user.findUnique({ where: { username: pa.username } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          employeeId: `PAD-${pa.username.replace("product_", "").toUpperCase()}`,
          username: pa.username,
          name: pa.name,
          email: pa.email,
          passwordHash: hashedPass,
          role: "PRODUCT_ADMIN",
          roleId: productAdminRole?.id || null,
          department: "dashboard,applications,users,merchants,roles,products,reports,notifications,audit logs,settings",
          status: "ACTIVE",
          userApprovalStatus: "APPROVED",
          roleMatrixStatus: "APPROVED",
          organizationId: org.id,
          applicationId: app.id,
          makerUsername: "super_one"
        }
      });
      console.log(`Created Product Admin: ${user.username} for App ${pa.appName}`);
      
      // Seed permissions matrix for this Product Admin
      const modules = ["Dashboard", "Users", "Roles", "Settings", "Products", "Categories", "Inventory", "Reports", "Audit Logs", "Notifications"];
      const actions = ["View", "Create", "Edit", "Delete", "Approve", "Export", "Import", "Assign", "Activate", "Deactivate"];
      
      await prisma.superAdminPermission.createMany({
        data: modules.flatMap(mod => actions.map(act => ({
          userId: user.id,
          module: mod,
          action: act,
          status: "APPROVED",
          makerUsername: "super_one"
        })))
      });
    }
    productAdminUsers.push(user);
  }

  // 6. Create single Merchant User under each of the 4 Product Admins
  const merchantUsers = [
    { username: "merchant_one_it", email: "m1_it@test.com", name: "Merchant One IT", paUser: "product_one_it", appName: "IT Solutions Portal" },
    { username: "merchant_two_it", email: "m2_it@test.com", name: "Merchant Two IT", paUser: "product_two_it", appName: "IT Solutions Portal" },
    { username: "merchant_one_bank", email: "m1_bank@test.com", name: "Merchant One Bank", paUser: "product_one_bank", appName: "Bank Marketplace" },
    { username: "merchant_two_bank", email: "m2_bank@test.com", name: "Merchant Two Bank", paUser: "product_two_bank", appName: "Bank Marketplace" }
  ];

  const merchantUserRecords: any[] = [];

  for (const mu of merchantUsers) {
    const app = appRecords.find(a => a.name === mu.appName);
    const pa = productAdminUsers.find(p => p.username === mu.paUser);
    if (!app || !pa) continue;

    let user = await prisma.user.findUnique({ where: { username: mu.username } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          employeeId: `MU-${mu.username.replace("merchant_", "").toUpperCase()}`,
          username: mu.username,
          name: mu.name,
          email: mu.email,
          passwordHash: hashedPass,
          role: "USER",
          roleId: userRole?.id || null,
          department: "dashboard,categories,products,inventory,product images,price management,reports,notifications,settings",
          status: "ACTIVE",
          userApprovalStatus: "APPROVED",
          roleMatrixStatus: "APPROVED",
          organizationId: org.id,
          applicationId: app.id,
          makerUsername: pa.username
        }
      });
      console.log(`Created Merchant User: ${user.username} under Product Admin ${pa.username}`);

      // Seed permissions matrix for this Merchant User
      const modules = ["Dashboard", "Categories", "Products", "Inventory", "Images", "Prices", "Reports", "Settings"];
      const actions = ["View", "Create", "Edit", "Delete", "Approve", "Export", "Import", "Assign", "Activate", "Deactivate"];
      
      await prisma.superAdminPermission.createMany({
        data: modules.flatMap(mod => actions.map(act => ({
          userId: user.id,
          module: mod,
          action: act,
          status: "APPROVED",
          makerUsername: pa.username
        })))
      });
    }
    merchantUserRecords.push(user);
  }

  // 7. Add sample products, inventory, price, and images under each Merchant User
  for (const merchant of merchantUserRecords) {
    const muKey = merchant.username.toUpperCase().replace(/_/g, "-");

    // 1. Create Category
    const categoryName = `${merchant.username.replace("merchant_", "").toUpperCase()} Category`;
    let category = await prisma.merchantCategory.findFirst({
      where: { name: categoryName, userId: merchant.id }
    });

    if (!category) {
      category = await prisma.merchantCategory.create({
        data: {
          name: categoryName,
          code: `CAT-${muKey}`,
          description: `Custom category for ${merchant.name}`,
          displayOrder: 1,
          status: "ACTIVE",
          approvalStatus: "APPROVED",
          makerUsername: merchant.username,
          userId: merchant.id,
          applicationId: merchant.applicationId!,
          organizationId: merchant.organizationId!
        }
      });
      console.log(`Created Category: ${category.name} for Merchant ${merchant.username}`);
    }

    // 2. Create Product
    const productName = `${merchant.name} Premium Item`;
    let product = await prisma.merchantProduct.findFirst({
      where: { name: productName, userId: merchant.id }
    });

    if (!product) {
      product = await prisma.merchantProduct.create({
        data: {
          categoryId: category.id,
          name: productName,
          code: `PROD-${muKey}`,
          brand: "PremiumBrand",
          sku: `SKU-${muKey}`,
          barcode: `BARCODE-${muKey}`,
          shortDescription: `A high-quality item from ${merchant.name}`,
          longDescription: "Detailed description of the premium test product.",
          unit: "pcs",
          weight: 0.5,
          dimensions: "10x10x5 cm",
          tax: 18.0,
          status: "ACTIVE",
          approvalStatus: "APPROVED",
          makerUsername: merchant.username,
          userId: merchant.id,
          applicationId: merchant.applicationId!,
          organizationId: merchant.organizationId!,
          version: 1
        }
      });
      console.log(`Created Product: ${product.name} for Merchant ${merchant.username}`);

      // Create history version log
      await prisma.merchantProductHistory.create({
        data: {
          productId: product.id,
          name: product.name,
          categoryId: product.categoryId,
          brand: product.brand,
          sku: product.sku,
          barcode: product.barcode,
          shortDescription: product.shortDescription,
          longDescription: product.longDescription,
          unit: product.unit,
          weight: product.weight,
          dimensions: product.dimensions,
          tax: product.tax,
          status: product.status,
          version: 1,
          action: "CREATE",
          details: "Initial setup.",
          changedBy: merchant.username
        }
      });

      // 3. Create Pricing
      const price = await prisma.merchantPrice.create({
        data: {
          productId: product.id,
          mrp: 100.0,
          sellingPrice: 85.0,
          offerPrice: 80.0,
          discount: 15.0,
          gst: 18.0,
          currency: "USD",
          status: "ACTIVE",
          approvalStatus: "APPROVED",
          makerUsername: merchant.username,
          userId: merchant.id,
          applicationId: merchant.applicationId!,
          organizationId: merchant.organizationId!
        }
      });

      // 4. Create Inventory Batch
      const inventory = await prisma.merchantInventory.create({
        data: {
          productId: product.id,
          batchNumber: `BATCH-${muKey}`,
          quantity: 150,
          availableQuantity: 150,
          minimumStock: 10,
          maximumStock: 500,
          purchasePrice: 50.0,
          sellingPrice: 85.0,
          status: "ACTIVE",
          approvalStatus: "APPROVED",
          makerUsername: merchant.username,
          userId: merchant.id,
          applicationId: merchant.applicationId!,
          organizationId: merchant.organizationId!
        }
      });

      // 5. Create Image
      const imageUrl = `/images/products/${merchant.username}_product.png`;
      await prisma.merchantImage.create({
        data: {
          productId: product.id,
          url: imageUrl,
          isPrimary: true,
          isThumbnail: true,
          status: "ACTIVE",
          approvalStatus: "APPROVED",
          userId: merchant.id,
          applicationId: merchant.applicationId!,
          organizationId: merchant.organizationId!
        }
      });

      // 6. Project to Marketplace StoreProduct storefront
      await prisma.storeProduct.create({
        data: {
          id: product.id,
          name: product.name,
          price: price.sellingPrice,
          unit: product.unit || "pcs",
          category: category.name,
          image: imageUrl,
          inStock: true,
          applicationId: merchant.applicationId!,
          organizationId: merchant.organizationId!,
          description: product.shortDescription || "",
          stock: inventory.quantity,
          discount: price.discount
        }
      });
      console.log(`Synced product ${product.name} to global Marketplace storefront.`);
    }
  }

  console.log("Verification Seed Completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
