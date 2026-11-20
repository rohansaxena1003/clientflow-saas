import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET: Fetch all invoices for the logged-in user with linked project details
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.userId },
      include: {
        project: {
          select: {
            title: true,
            clientName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("GET Invoices Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Create a new invoice linked to a verified user project
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, amount, dueDate } = body;

    if (!projectId || amount === undefined || !dueDate) {
      return NextResponse.json(
        { error: "Project, amount, and due date are required." },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a valid positive number." },
        { status: 400 }
      );
    }

    // 1. Verify the chosen project exists AND belongs to the current user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.userId) {
      return NextResponse.json(
        { error: "Selected project not found or unauthorized." },
        { status: 404 }
      );
    }

    // 2. Generate a unique invoice number (e.g., INV-839204)
    const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(
      10 + Math.random() * 90
    )}`;
    const invoiceNumber = `INV-${uniqueSuffix}`;

    // 3. Create the invoice in PostgreSQL
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        amount: parsedAmount,
        dueDate: new Date(dueDate),
        projectId: project.id,
        userId: user.userId,
      },
      include: {
        project: {
          select: {
            title: true,
            clientName: true,
          },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("POST Invoice Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
 