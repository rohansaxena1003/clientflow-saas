import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: External payment providers (Stripe/Razorpay) send event payloads here
export async function POST(request: Request) {
  try {
    // 1. Security Check: Verify the webhook signature.
    // In a real app, Stripe gives you a secret to verify the request is actually from them.
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    // 2. Parse the payload sent by the payment provider
    const body = await request.json();
    const { eventType, invoiceId } = body;

    // 3. Process the successful payment event
    if (eventType === "payment.success" && invoiceId) {
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "PAID" },
      });

      return NextResponse.json(
        { message: "Webhook processed, invoice marked PAID", invoice: updatedInvoice.id },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "Unhandled event type" }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
