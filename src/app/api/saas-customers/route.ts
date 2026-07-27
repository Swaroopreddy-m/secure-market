import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const customerSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  type: z.string().min(1, "Type is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  contactPerson: z.string().min(1, "Contact Person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  status: z.string().default("ACTIVE"),
  expiry: z.string().optional().or(z.literal(""))
});

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { companyName: "asc" }
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("[SAAS_CUSTOMERS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    // Check code unique
    const existing = await prisma.customer.findUnique({
      where: { customerId: validatedData.customerId }
    });

    if (existing) {
      return NextResponse.json({ error: "Customer ID already exists" }, { status: 400 });
    }

    const expiryDate = validatedData.expiry ? new Date(validatedData.expiry) : null;

    const customer = await prisma.customer.create({
      data: {
        companyName: validatedData.companyName,
        customerId: validatedData.customerId,
        type: validatedData.type,
        address: validatedData.address,
        country: validatedData.country,
        state: validatedData.state,
        city: validatedData.city,
        contactPerson: validatedData.contactPerson,
        email: validatedData.email,
        phone: validatedData.phone,
        status: validatedData.status,
        expiry: expiryDate
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "CUSTOMERS",
        status: "SUCCESS",
        details: `Created Customer Profile ${customer.customerId}: ${customer.companyName}`
      }
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("[SAAS_CUSTOMERS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
