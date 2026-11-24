import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ProposalSection from "./ProposalSection";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  // Verify project exists and belongs to the user
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project || project.userId !== user.userId) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 mt-8">
      <div className="mb-6">
        <Link href="/dashboard/projects" className="text-indigo-600 text-sm font-medium hover:underline">
          ← Back to Projects
        </Link>
      </div>

      <div className="bg-slate-900 p-8 rounded-xl shadow-md text-white flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-slate-400 mt-2">Client: {project.clientName} ({project.clientEmail})</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full border border-slate-700">
            {project.status}
          </span>
          <p className="mt-4 text-xl font-bold text-emerald-400">
            ${project.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Render the Interactive AI Generator */}
      <ProposalSection projectId={project.id} initialProposal={project.proposalText} />
    </div>
  );
}
