"use client";

import { useState, useEffect } from "react";

interface ProjectOption {
  id: string;
  title: string;
  clientName: string;
}

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch both invoices and projects on initial mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [invoicesRes, projectsRes] = await Promise.all([
          fetch("/api/invoices"),
          fetch("/api/projects"),
        ]);

        if (!invoicesRes.ok || !projectsRes.ok) {
          throw new Error("Failed to load data");
        }

        const [invoicesData, projectsData] = await Promise.all([
          invoicesRes.json(),
          projectsRes.json(),
        ]);

        setInvoices(invoicesData);
        setProjects(projectsData);
        if (projectsData.length > 0) {
          setProjectId(projectsData[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Could not load invoices or projects.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Create a new invoice
  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          amount: parseFloat(amount),
          dueDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create invoice.");
        setSubmitting(false);
        return;
      }

      setInvoices((prev) => [data, ...prev]);
      setAmount("");
      setDueDate("");
      setIsModalOpen(false);
    } catch {
      setError("Network error while creating invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  // Quick update status (e.g., Mark as Paid)
  async function handleMarkAsPaid(id: string) {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });

      if (!res.ok) {
        alert("Failed to update invoice status.");
        return;
      }

      const updatedInvoice = await res.json();
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? updatedInvoice : inv))
      );
    } catch (err) {
      console.error(err);
    }
  }

  // Delete an invoice
  async function handleDeleteInvoice(id: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete invoice.");
        return;
      }

      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function getStatusBadge(status: Invoice["status"]) {
    switch (status) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  }

  if (loading) {
    return <div className="text-slate-600">Loading invoices...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-600 mt-1">
            Generate client invoices and track payment statuses
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={projects.length === 0}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition cursor-pointer"
        >
          + Create Invoice
        </button>
      </div>

      {projects.length === 0 && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          You need to create at least one Project before generating an invoice.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <h3 className="text-lg font-medium text-slate-900">No invoices yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Click &quot;+ Create Invoice&quot; to bill a client for an active project.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-6">Project / Client</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Due Date</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 font-mono font-medium text-slate-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900">
                      {invoice.project.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {invoice.project.clientName}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    ${invoice.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {new Date(invoice.dueDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-3">
                    {invoice.status !== "PAID" && (
                      <button
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer"
                      >
                        Mark as Paid
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Create New Invoice
            </h2>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Project
                </label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.title} ({proj.clientName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500.00"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition cursor-pointer"
                >
                  {submitting ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
