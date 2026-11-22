import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch basic invoice details to personalize the thank you page
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      invoiceNumber: true,
      project: {
        select: {
          clientName: true,
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
        {/* Success Checkmark SVG */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-600 mb-6">
          Thank you, <span className="font-semibold text-slate-900">{invoice.project.clientName}</span>. 
          Your payment for Invoice <span className="font-mono font-medium text-slate-900">#{invoice.invoiceNumber}</span> has been processed.
        </p>

        <div className="bg-slate-50 rounded-lg p-4 mb-8 text-sm text-slate-500 border border-slate-200">
          A receipt has been sent to your email. You can safely close this window.
        </div>

        <Link
          href={`/public/invoice/${id}`}
          className="inline-block w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition"
        >
          View Original Invoice
        </Link>
      </div>
    </div>
  );
}
