import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check: ensures all nested dashboard routes are secure
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight">ClientFlow</h2>
          <p className="text-slate-400 text-sm mt-1 truncate">{user.name}</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link
            href="/dashboard"
            className="block px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/projects"
            className="block px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            Projects
          </Link>
          <Link
            href="/dashboard/invoices"
            className="block px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            Invoices
          </Link>
          <Link
            href="/dashboard/settings"
            className="block px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm">
          <h1 className="text-lg font-medium text-slate-800">Workspace</h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
