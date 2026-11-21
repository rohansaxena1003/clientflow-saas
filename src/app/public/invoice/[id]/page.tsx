import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch the invoice along with the linked project and freelancer (user) details
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          title: true,
          clientName: true,
          clientEmail: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // If someone enters an invalid URL, show a 404 page
  if (!invoice) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden border border-slate-200">
        
        {/* Print Action Bar (Hidden when actually printing) */}
        <div className="bg-slate-900 px-8 py-4 flex justify-between items-center print:hidden">
          <p className="text-slate-300 text-sm">Secure Public Invoice View</p>
          <PrintButton />
        </div>

        {/* Invoice Document Header */}
        <div className="p-8 border-b border-slate-200 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">INVOICE</h1>
            <p className="text-sm text-slate-500 mt-1">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-slate-900">{invoice.user.name}</h2>
            <p className="text-sm text-slate-500">{invoice.user.email}</p>
          </div>
        </div>

        {/* Billing Details */}
        <div className="p-8 flex justify-between border-b border-slate-100">
          <div>
            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">Billed To</p>
            <p className="text-base font-medium text-slate-900">{invoice.project.clientName}</p>
            <p className="text-sm text-slate-500">{invoice.project.clientEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">Details</p>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-medium text-slate-900">Date Issued:</span> {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-medium text-slate-900">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Status:</span>{" "}
              <span className={`font-semibold ${invoice.status === 'PAID' ? 'text-green-600' : invoice.status === 'OVERDUE' ? 'text-red-600' : 'text-amber-600'}`}>
                {invoice.status}
              </span>
            </p>
          </div>
        </div>

        {/* Invoice Line Items */}
        <div className="p-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 text-sm font-semibold text-slate-800">Description</th>
                <th className="py-3 text-sm font-semibold text-slate-800 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4 text-sm text-slate-700">Project: {invoice.project.title}</td>
                <td className="py-4 text-sm text-slate-900 font-medium text-right">
                  ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-8 flex justify-end">
            <div className="w-1/2">
              <div className="flex justify-between py-3 border-t-2 border-slate-800">
                <span className="text-lg font-bold text-slate-900">Total Due</span>
                <span className="text-lg font-bold text-slate-900">
                  ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
