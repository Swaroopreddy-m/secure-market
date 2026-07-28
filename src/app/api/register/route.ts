import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, address, city, state, country, pincode, password } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Account with this email already exists" }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    // Create the User record
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        username: email, // Use email as username for easy signin
        employeeId: phone, // Store phone number in employeeId
        role: "CUSTOMER",
        passwordHash: hashedPassword,
        status: "ACTIVE"
      }
    });

    // Create associated Address record
    const fullCityString = `${city}, ${state}, ${country} - ${pincode}`;
    await prisma.address.create({
      data: {
        userId: newUser.id,
        street: address,
        city: fullCityString,
        phone: phone,
        isDefault: true
      }
    });

    // Log registration audit log
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: "CUSTOMER_REGISTER",
        module: "AUTH",
        status: "SUCCESS",
        details: `Customer registered successfully: ${newUser.email}`
      }
    });

    return NextResponse.json({ success: true, username: newUser.username });
  } catch (error: any) {
    console.error("[REGISTER_POST]", error);
    return NextResponse.json({ error: error.message || "Failed to register account" }, { status: 500 });
  }
}
