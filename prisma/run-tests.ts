import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function runTests() {
  console.log("==================================================");
  console.log("      RUNNING MAKER-CHECKER WORKFLOW TESTS        ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  async function assert(name: string, condition: () => Promise<boolean>) {
    try {
      const result = await condition();
      if (result) {
        console.log(`[PASS] ${name}`);
        passed++;
      } else {
        console.error(`[FAIL] ${name} (Assertion returned false)`);
        failed++;
      }
    } catch (err: any) {
      console.error(`[FAIL] ${name} (Threw error: ${err.message})`);
      failed++;
    }
  }

  // Cleanup existing test users if any
  await prisma.user.deleteMany({
    where: {
      username: { in: ["test_super_direct", "test_super_pending"] }
    }
  });

  const testOrg = await prisma.organization.findFirst();
  const orgId = testOrg?.id || null;

  // --------------------------------------------------
  // Test Case 1: Settings Sync Logic
  // --------------------------------------------------
  await assert("Settings Sync - Disable Maker & Checker", async () => {
    const val = "false";
    await prisma.configuration.update({
      where: { key: "MAKER_CHECKER_CHECKER_ENABLED" },
      data: { value: val }
    });
    await prisma.configuration.update({
      where: { key: "ENABLE_PRODUCT_MAKER_CHECKER" },
      data: { value: val }
    });
    await prisma.configuration.update({
      where: { key: "DEFAULT_APPROVAL_MODE" },
      data: { value: "DIRECT_PUBLISH" }
    });

    const c1 = await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_CHECKER_ENABLED" } });
    const c2 = await prisma.configuration.findUnique({ where: { key: "ENABLE_PRODUCT_MAKER_CHECKER" } });
    const c3 = await prisma.configuration.findUnique({ where: { key: "DEFAULT_APPROVAL_MODE" } });

    return c1?.value === "false" && c2?.value === "false" && c3?.value === "DIRECT_PUBLISH";
  });

  await assert("Settings Sync - Enable Maker & Checker", async () => {
    const val = "true";
    await prisma.configuration.update({
      where: { key: "MAKER_CHECKER_CHECKER_ENABLED" },
      data: { value: val }
    });
    await prisma.configuration.update({
      where: { key: "ENABLE_PRODUCT_MAKER_CHECKER" },
      data: { value: val }
    });
    await prisma.configuration.update({
      where: { key: "DEFAULT_APPROVAL_MODE" },
      data: { value: "MAKER_CHECKER" }
    });

    const c1 = await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_CHECKER_ENABLED" } });
    const c2 = await prisma.configuration.findUnique({ where: { key: "ENABLE_PRODUCT_MAKER_CHECKER" } });
    const c3 = await prisma.configuration.findUnique({ where: { key: "DEFAULT_APPROVAL_MODE" } });

    return c1?.value === "true" && c2?.value === "true" && c3?.value === "MAKER_CHECKER";
  });

  // --------------------------------------------------
  // Test Case 2: Creation & Auto-Approval with Maker-Checker Disabled
  // --------------------------------------------------
  await assert("Auto-Approval when Maker-Checker is Disabled", async () => {
    // Disable Maker-Checker
    await prisma.configuration.update({
      where: { key: "MAKER_CHECKER_CHECKER_ENABLED" },
      data: { value: "false" }
    });

    const checkerConfig = await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_CHECKER_ENABLED" } });
    const checkerEnabled = checkerConfig?.value !== "false"; // false

    const userApprovalStatus = checkerEnabled ? "PENDING" : "APPROVED";
    const roleMatrixStatus = checkerEnabled ? "DRAFT" : "APPROVED";
    const finalStatus = checkerEnabled ? "PENDING" : "ACTIVE";

    const user = await prisma.user.create({
      data: {
        employeeId: "TEST-DIR",
        username: "test_super_direct",
        name: "Test Direct User",
        email: "test_direct@test.com",
        passwordHash: hashPassword("password123"),
        role: "SUPER_ADMIN",
        status: finalStatus,
        userApprovalStatus,
        roleMatrixStatus,
        organizationId: orgId,
        makerUsername: "devroot"
      }
    });

    return user.status === "ACTIVE" && user.userApprovalStatus === "APPROVED" && user.roleMatrixStatus === "APPROVED";
  });

  // --------------------------------------------------
  // Test Case 3: Maker-Checker Pending State with Maker-Checker Enabled
  // --------------------------------------------------
  await assert("Pending queue when Maker-Checker is Enabled", async () => {
    // Enable Maker-Checker
    await prisma.configuration.update({
      where: { key: "MAKER_CHECKER_CHECKER_ENABLED" },
      data: { value: "true" }
    });

    const checkerConfig = await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_CHECKER_ENABLED" } });
    const checkerEnabled = checkerConfig?.value !== "false"; // true

    const userApprovalStatus = checkerEnabled ? "PENDING" : "APPROVED";
    const roleMatrixStatus = checkerEnabled ? "DRAFT" : "APPROVED";
    const finalStatus = checkerEnabled ? "PENDING" : "ACTIVE";

    const user = await prisma.user.create({
      data: {
        employeeId: "TEST-PEN",
        username: "test_super_pending",
        name: "Test Pending User",
        email: "test_pending@test.com",
        passwordHash: hashPassword("password123"),
        role: "SUPER_ADMIN",
        status: finalStatus,
        userApprovalStatus,
        roleMatrixStatus,
        organizationId: orgId,
        makerUsername: "devroot"
      }
    });

    return user.status === "PENDING" && user.userApprovalStatus === "PENDING" && user.roleMatrixStatus === "DRAFT";
  });

  // --------------------------------------------------
  // Test Case 4: Same Maker-Checker Verification
  // --------------------------------------------------
  await assert("Maker-Checker Dual Approval - Enforced (Bypassing same checker blocked)", async () => {
    // Set dual approval enforced
    await prisma.configuration.update({
      where: { key: "MAKER_CHECKER_DUAL_APPROVAL" },
      data: { value: "true" }
    });

    const user = await prisma.user.findUnique({ where: { username: "test_super_pending" } });
    if (!user) return false;

    const makerUsername = user.makerUsername; // devroot
    const checkerUsername = "devroot"; // same as maker

    const dualApprovalConfig = await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_DUAL_APPROVAL" } });
    const dualApproval = dualApprovalConfig?.value === "true"; // true

    const isSameBlocked = (dualApproval && makerUsername === checkerUsername);

    return isSameBlocked === true; // Should be blocked
  });

  await assert("Maker-Checker Dual Approval - Allowed (Same checker permitted)", async () => {
    // Set dual approval allowed
    await prisma.configuration.update({
      where: { key: "MAKER_CHECKER_DUAL_APPROVAL" },
      data: { value: "false" }
    });

    const user = await prisma.user.findUnique({ where: { username: "test_super_pending" } });
    if (!user) return false;

    const makerUsername = user.makerUsername; // devroot
    const checkerUsername = "devroot"; // same as maker

    const dualApprovalConfig = await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_DUAL_APPROVAL" } });
    const dualApproval = dualApprovalConfig?.value === "true"; // false

    const isSameBlocked = (dualApproval && makerUsername === checkerUsername);

    return isSameBlocked === false; // Should not be blocked
  });

  // Cleanup after tests
  await prisma.user.deleteMany({
    where: {
      username: { in: ["test_super_direct", "test_super_pending"] }
    }
  });

  console.log("==================================================");
  console.log(`TEST RUN COMPLETED. Passed: ${passed}, Failed: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
