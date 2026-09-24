"use client";

import { useEffect, useState } from "react";
import type { TargetCompany } from "@/types";
import { getStoredCompanies, saveCompanies } from "@/lib/storage";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Adding Company
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [careersUrl, setCareersUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [roles, setRoles] = useState("Frontend Architect, Senior Technical Lead");
  const [presence, setPresence] = useState("USA, Europe");
  const [travelPossibility, setTravelPossibility] = useState(
    "High (Client-site & International travel 20%)"
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const stored = getStoredCompanies();
    queueMicrotask(() => setCompanies(stored));
  }, []);

  function handleAddCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newCompany: TargetCompany = {
      id: `comp-${Date.now()}`,
      name: name.trim(),
      website: website.trim(),
      careersUrl: careersUrl.trim() || website.trim(),
      industry: industry.trim() || "Technology Consulting",
      targetRoleFamilies: roles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      internationalPresence: presence
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      travelPossibility: travelPossibility.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newCompany, ...companies];
    saveCompanies(updated);
    setCompanies(updated);

    // Reset Form
    setName("");
    setWebsite("");
    setCareersUrl("");
    setIndustry("");
    setNotes("");
    setShowAddModal(false);
  }

  function handleDeleteCompany(id: string) {
    const updated = companies.filter((c) => c.id !== id);
    saveCompanies(updated);
    setCompanies(updated);
  }

  const filteredCompanies = companies.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.targetRoleFamilies.some((r) => r.toLowerCase().includes(q)) ||
      c.internationalPresence.some((p) => p.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Target Companies
            </h1>
            <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
              {companies.length} Active Targets
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Maintain high-priority technology consulting firms and digital experience companies with international client travel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search target companies..."
            className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />

          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition whitespace-nowrap"
          >
            + Add Target Company
          </button>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCompanies.map((comp) => (
          <div
            key={comp.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-lg hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">{comp.name}</h3>
                <span className="text-xs text-slate-400 font-medium">
                  {comp.industry}
                </span>
              </div>
              <button
                onClick={() => handleDeleteCompany(comp.id)}
                className="text-xs text-slate-600 hover:text-rose-400 transition"
                title="Remove company"
              >
                ✕
              </button>
            </div>

            {/* Travel Possibility Badge */}
            <div className="rounded-xl bg-indigo-950/70 border border-indigo-800/60 p-2.5 text-xs text-indigo-300 space-y-1">
              <span className="font-semibold text-slate-300 block">✈️ Travel Profile:</span>
              <p>{comp.travelPossibility}</p>
            </div>

            {/* International Presence */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                International Presence:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {comp.internationalPresence.map((loc) => (
                  <span
                    key={loc}
                    className="rounded-md bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 text-xs text-slate-300"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>

            {/* Target Role Families */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Target Role Families:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {comp.targetRoleFamilies.map((role) => (
                  <span
                    key={role}
                    className="rounded-md bg-cyan-950/50 border border-cyan-800/50 px-2 py-0.5 text-xs text-cyan-300"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Notes */}
            {comp.notes && (
              <p className="text-xs text-slate-400 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                💡 {comp.notes}
              </p>
            )}

            {/* Links Footnote */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
              {comp.website && (
                <a
                  href={comp.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition"
                >
                  Website ↗
                </a>
              )}
              {comp.careersUrl && (
                <a
                  href={comp.careersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition"
                >
                  Careers Portal ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add Target Company</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. EPAM Systems"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Careers Portal URL
                  </label>
                  <input
                    type="url"
                    value={careersUrl}
                    onChange={(e) => setCareersUrl(e.target.value)}
                    placeholder="https://careers.example.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Digital Experience & Commerce Consultancy"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target Role Families (comma separated)
                </label>
                <input
                  type="text"
                  value={roles}
                  onChange={(e) => setRoles(e.target.value)}
                  placeholder="Senior Technical Lead, Frontend Architect"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  International Presence (comma separated)
                </label>
                <input
                  type="text"
                  value={presence}
                  onChange={(e) => setPresence(e.target.value)}
                  placeholder="USA, Europe, Singapore, UAE"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Travel Possibility Details
                </label>
                <input
                  type="text"
                  value={travelPossibility}
                  onChange={(e) => setTravelPossibility(e.target.value)}
                  placeholder="e.g. High (20% travel to US client sites)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Consulting & Tech Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Specializes in Contentful, MACH architecture, and Next.js commerce"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 px-4 py-1.5 font-bold text-white hover:bg-cyan-500"
                >
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
