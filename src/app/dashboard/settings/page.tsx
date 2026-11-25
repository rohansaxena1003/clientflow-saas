import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-600 mt-1">
          Update your profile information and manage your security.
        </p>
      </div>

      <SettingsForm user={{ name: user.name, email: user.email }} />
    </div>
  );
}
