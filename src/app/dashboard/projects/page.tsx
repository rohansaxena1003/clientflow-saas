"use client";

import { useState, useEffect } from "react";

interface Project {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD";
  budget: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtering State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to load projects");
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setError("Could not load projects.");
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, clientName, clientEmail, budget: parseFloat(budget) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProjects([data, ...projects]);
      setIsModalOpen(false);
      setTitle(""); setClientName(""); setClientEmail(""); setBudget("");
    } catch (err) {
      alert("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      alert("Failed to delete project");
    }
  }

  const filteredProjects = projects.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(searchLower) || p.clientName.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-slate-600">Loading projects...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition cursor-pointer">
          + New Project
        </button>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search projects or clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <h3 className="font-semibold text-slate-900 text-lg truncate">{project.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{project.clientName}</p>
            <div className="mt-4 flex-1">
              <p className="text-sm font-medium text-slate-900">Budget: ${project.budget.toLocaleString()}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                {project.status}
              </span>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <input type="text" required placeholder="Project Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" required placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              <input type="email" required placeholder="Client Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              <input type="number" required placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
