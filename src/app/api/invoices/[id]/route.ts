import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_STATUSES = ["PENDING", "PAID", "OVERDUE"];

// PATCH: Update invoice status (e.g., Mark as Paid)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid invoice status." },
        { status: 400 }
      );
    }

    // 1. Verify invoice exists and belongs to the logged-in user
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice || existingInvoice.userId !== user.userId) {
      return NextResponse.json(
        { error: "Invoice not found or unauthorized." },
        { status: 404 }
      );
    }

    // 2. Update the invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: {
        project: {
          select: {
            title: true,
            clientName: true,
          },
        },
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("PATCH Invoice Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an invoice securely
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Verify ownership before deletion
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice || existingInvoice.userId !== user.userId) {
      return NextResponse.json(
        { error: "Invoice not found or unauthorized." },
        { status: 404 }
      );
    }

    // 2. Delete the invoice
    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("DELETE Invoice Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
