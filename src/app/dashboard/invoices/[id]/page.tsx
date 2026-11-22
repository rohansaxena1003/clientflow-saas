"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SendInvoiceButton from "./SendInvoiceButton";


interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  dueDate: string;
  createdAt: string;
  projectId: string;
  project: {
    title: string;
    clientName: string;
  };
}

export default function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch("/api/invoices");
        if (!res.ok) throw new Error("Failed to load invoices");
        
        const data: Invoice[] = await res.json();
        const found = data.find((inv) => inv.id === invoiceId);
        
        if (!found) {
          setError("Invoice not found or unauthorized.");
        } else {
          setInvoice(found);
        }
      } catch (err) {
        setError("Network error while loading invoice.");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [invoiceId]);

  const handleCopyLink = async () => {
    try {
      // Construct the absolute URL to your new public route
      const publicUrl = `${window.location.origin}/public/invoice/${invoiceId}`;
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  if (loading) return <div className="p-8 text-slate-600">Loading invoice data...</div>;
  if (error || !invoice) return (
    <div className="p-8">
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-4">{error}</div>
      <Link href="/dashboard/invoices" className="text-indigo-600 font-medium">← Back to Invoices</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Top Action Bar (Hidden when actually printing) */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href="/dashboard/invoices" className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2 transition">
          ← Back to Invoices
        </Link>
        <div className="flex gap-3">
          {/* New Copy Public Link Button */}
          <button 
            onClick={handleCopyLink}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer shadow-sm flex items-center gap-2"
          >
            {copied ? "Copied!" : "Copy Public Link"}
          </button>
          
          {/* Existing Download PDF Button */}
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition cursor-pointer shadow-sm"
          >
            Download PDF
          </button>
          <SendInvoiceButton invoiceId={invoice.id} />

        </div>
      </div>

      {/* The Actual Invoice Paper (A4 Style) */}
      <div className="bg-white p-10 sm:p-16 rounded-xl shadow-md border border-slate-200">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">INVOICE</h1>
            <p className="text-slate-500 font-medium mt-1">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right text-slate-600 text-sm space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">ClientFlow Agency</h3>
            <p>123 Startup Avenue</p>
            <p>Tech District, 10001</p>
            <p>contact@clientflow.com</p>
          </div>
        </div>

        {/* Client & Dates */}
        <div className="flex justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
            <h3 className="text-lg font-bold text-slate-900">{invoice.project.clientName}</h3>
            <p className="text-slate-600 mt-1">Project: {invoice.project.title}</p>
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Date Issued</p>
              <p className="font-medium text-slate-900">{new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Due Date</p>
              <p className="font-medium text-slate-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200 text-sm font-bold text-slate-900">
              <th className="py-3">Description</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="py-4 text-slate-800">
                Professional services rendered for <span className="font-medium">{invoice.project.title}</span>
              </td>
              <td className="py-4 text-right font-medium text-slate-900">
                ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end pt-4">
          <div className="w-1/2 sm:w-1/3">
            <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-slate-900 text-slate-900">
              <span>Total Due:</span>
              <span>${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500 text-center">
          Please pay within 15 days of receiving this invoice. Thank you for your business!
        </div>
      </div>
    </div>
  );
}
