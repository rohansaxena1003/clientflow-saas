"use client";

import { useState } from "react";

export default function CheckoutButton({ invoiceId, amount }: { invoiceId: string; amount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // Redirect client to the returned URL (Simulating Stripe Checkout routing)
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {

      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end mt-6 print:hidden">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-lg shadow-md transition cursor-pointer flex items-center justify-center min-w-[200px]"
      >
        {loading ? "Securely redirecting..." : `Pay $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} Now`}
      </button>
      {error && <span className="text-red-600 text-sm mt-2">{error}</span>}
    </div>
  );
}
