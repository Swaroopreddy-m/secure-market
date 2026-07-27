import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const customerUpdateSchema = z.object({
  companyName: z.string().min(1, "Company Name is required").optional(),
  customerId: z.string().min(1, "Customer ID is required").optional(),
  type: z.string().min(1, "Type is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
  country: z.string().min(1, "Country is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  contactPerson: z.string().min(1, "Contact Person is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  status: z.string().optional(),
  expiry: z.string().optional().or(z.literal(""))
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer tenant not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("[SAAS_CUSTOMER_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = customerUpdateSchema.parse(body);

    const existing = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check code uniqueness if changed
    if (validatedData.customerId && validatedData.customerId !== existing.customerId) {
      const dupe = await prisma.customer.findUnique({
        where: { customerId: validatedData.customerId }
      });
      if (dupe) {
        return NextResponse.json({ error: "Customer ID already exists" }, { status: 400 });
      }
    }

    const expiryDate = validatedData.expiry !== undefined
      ? (validatedData.expiry ? new Date(validatedData.expiry) : null)
      : undefined;

    const updated = await prisma.customer.update({
      where: { id },
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
        action: "UPDATE",
        module: "CUSTOMERS",
        status: "SUCCESS",
        details: `Updated Customer Profile ${updated.customerId}: ${updated.companyName}`
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[SAAS_CUSTOMER_PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "CUSTOMERS",
        status: "SUCCESS",
        details: `Deleted Customer Profile ${customer.customerId}: ${customer.companyName}`
      }
    });

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("[SAAS_CUSTOMER_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
