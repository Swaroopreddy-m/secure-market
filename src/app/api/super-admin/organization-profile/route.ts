import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const profileUpdateSchema = z.object({
  logo: z.string().optional(),
  theme: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  description: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["SUPER_ADMIN", "DEVELOPER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check edit permissions
    const editPerm = await prisma.superAdminPermission.findFirst({
      where: {
        userId: session.user.id,
        module: "Organizations",
        action: "Edit",
        status: "APPROVED"
      }
    });

    // Parse JSON contact/address details stored in remarks if any
    let remarksDetails = { address: "", contactPerson: "", phone: "", email: "" };
    if (org.remarks) {
      try {
        remarksDetails = JSON.parse(org.remarks);
      } catch (e) {
        remarksDetails = { address: org.remarks, contactPerson: org.owner || "", phone: "", email: "" };
      }
    }

    return NextResponse.json({
      id: org.id,
      name: org.name,
      code: org.code,
      logo: org.logo,
      theme: org.theme,
      status: org.status,
      subscription: org.subscription,
      description: org.description,
      owner: org.owner,
      canEdit: !!editPerm || session.user.role === "DEVELOPER",
      ...remarksDetails
    });
  } catch (error) {
    console.error("[ORG_PROFILE_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["SUPER_ADMIN", "DEVELOPER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    // Verify Developer granted Edit right (only for SUPER_ADMIN, DEVELOPER has it by default)
    if (session.user.role === "SUPER_ADMIN") {
      const editPerm = await prisma.superAdminPermission.findFirst({
        where: {
          userId: session.user.id,
          module: "Organizations",
          action: "Edit",
          status: "APPROVED"
        }
      });

      if (!editPerm) {
        return NextResponse.json({ error: "Security Restriction: Developer has not granted Organization Edit rights to this account." }, { status: 403 });
      }
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Parse current JSON or fallback
    let currentDetails = { address: "", contactPerson: "", phone: "", email: "" };
    if (org.remarks) {
      try {
        currentDetails = JSON.parse(org.remarks);
      } catch (e) {
        currentDetails = { address: org.remarks, contactPerson: org.owner || "", phone: "", email: "" };
      }
    }

    const updatedDetails = {
      address: validatedData.address !== undefined ? validatedData.address : currentDetails.address,
      contactPerson: validatedData.contactPerson !== undefined ? validatedData.contactPerson : currentDetails.contactPerson,
      phone: validatedData.phone !== undefined ? validatedData.phone : currentDetails.phone,
      email: validatedData.email !== undefined ? validatedData.email : currentDetails.email
    };

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        logo: validatedData.logo !== undefined ? validatedData.logo : org.logo,
        theme: validatedData.theme !== undefined ? validatedData.theme : org.theme,
        description: validatedData.description !== undefined ? validatedData.description : org.description,
        owner: updatedDetails.contactPerson,
        remarks: JSON.stringify(updatedDetails)
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ORGANIZATION_PROFILE_UPDATED",
        module: "ORGANIZATIONS",
        status: "SUCCESS",
        details: `Super Admin ${session.user.name} updated organization ${org.name} details.`
      }
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error) {
    console.error("[ORG_PROFILE_PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
