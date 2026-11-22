"use client";

import { useState } from "react";

export default function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSendEmail() {
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to send email");
      }
      
      setStatus("success");
      
      // Reset the button text back to normal after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="print:hidden relative flex flex-col items-center">
      <button
        onClick={handleSendEmail}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition cursor-pointer shadow-sm flex items-center gap-2"
      >
        {loading ? "Sending..." : status === "success" ? "Sent!" : "Send to Client"}
      </button>
      {status === "error" && (
        <span className="text-xs text-red-600 absolute -bottom-5">Delivery failed</span>
      )}
    </div>
  );
}
