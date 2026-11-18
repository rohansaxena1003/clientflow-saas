import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome to ClientFlow, {user.name}!
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Logged in as <span className="font-medium">{user.email}</span> (User ID: {user.userId})
          </p>
        </div>

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition cursor-pointer"
          >
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
}
