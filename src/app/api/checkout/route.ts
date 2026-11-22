import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch the invoice to verify it exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // 2. Prevent double-payments
    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "This invoice has already been paid." },
        { status: 400 }
      );
    }

    // 3. Generate Mock Stripe Checkout URL
    // In production, you would pass invoice.amount and invoice.id to Stripe here.
    // For now, we simulate a successful checkout routing back to our success page.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const mockStripeCheckoutUrl = `${baseUrl}/public/invoice/${invoice.id}/success`;

    return NextResponse.json({ url: mockStripeCheckoutUrl }, { status: 200 });
  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
