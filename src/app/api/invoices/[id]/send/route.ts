import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate the request
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 2. Fetch the invoice and the linked project
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { project: true },
    });

    // 3. Security check: Ensure the invoice exists and belongs to the logged-in user
    if (!invoice || invoice.userId !== user.userId) {
      return NextResponse.json(
        { error: "Invoice not found or unauthorized" },
        { status: 404 }
      );
    }

    if (!invoice.project.clientEmail) {
      return NextResponse.json(
        { error: "Client email is missing on this project." },
        { status: 400 }
      );
    }

    // 4. Construct the public link that we built in Block 1
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const publicInvoiceUrl = `${baseUrl}/public/invoice/${invoice.id}`;

    // 5. Send the email via Resend
    const { data, error } = await resend.emails.send({
      from: "ClientFlow <onboarding@resend.dev>",
      to: [invoice.project.clientEmail],
      subject: `New Invoice ${invoice.invoiceNumber} from ${user.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${invoice.project.clientName},</h2>
          <p>You have a new invoice (<strong>${invoice.invoiceNumber}</strong>) for $${invoice.amount.toFixed(2)}.</p>
          <p>Due Date: ${invoice.dueDate.toDateString()}</p>
          <div style="margin: 30px 0;">
            <a href="${publicInvoiceUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View and Pay Invoice
            </a>
          </div>
          <p>Thank you for your business!</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Email sent successfully", data }, { status: 200 });
  } catch (error) {
    console.error("Email Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
