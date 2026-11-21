"use client";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition"
    >
      Download / Print PDF
    </button>
  );
}
