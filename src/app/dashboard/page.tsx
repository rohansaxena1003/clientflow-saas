import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  // 1. Authenticate user securely on the server
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch all analytics metrics in parallel for maximum performance
  const [paidData, pendingData, activeProjectsCount, recentInvoices] = await Promise.all([
    prisma.invoice.aggregate({
      where: { userId: user.userId, status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { userId: user.userId, status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.project.count({
      where: { userId: user.userId, status: "ACTIVE" },
    }),
    prisma.invoice.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        project: { select: { clientName: true } },
      },
    }),
  ]);

  // Prisma aggregate returns null if there are no matching records, so we fallback to 0
  const totalRevenue = paidData._sum.amount || 0;
  const pendingAmount = pendingData._sum.amount || 0;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user.name}!
        </h1>
        <p className="text-slate-600 mt-1">
          Here is a real-time overview of your business today.
        </p>
      </div>

      {/* Analytics Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue Collected</p>
          <p className="text-3xl font-bold text-slate-900">
            ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Pending Invoices</p>
          <p className="text-3xl font-bold text-amber-600">
            ${pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Active Projects</p>
          <p className="text-3xl font-bold text-slate-900">{activeProjectsCount}</p>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Recent Invoices</h2>
          <Link href="/dashboard/invoices" className="text-sm text-indigo-600 font-medium hover:underline">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Invoice #</th>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No recent invoices found.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {invoice.project.clientName}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : invoice.status === "OVERDUE"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
