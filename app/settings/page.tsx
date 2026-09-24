"use client";

import { useEffect, useState } from "react";
import type { RemoteType, SearchProfile, TravelType } from "@/types";
import { getStoredJobs, getStoredProfile, saveJobs, saveProfile } from "@/lib/storage";
import { evaluateJobMatch } from "@/lib/matchingEngine";

export default function SettingsPage() {
  const [profile, setProfile] = useState<SearchProfile | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Editable fields
  const [minSalaryLpa, setMinSalaryLpa] = useState(35);
  const [experienceYears, setExperienceYears] = useState(12);
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [roleFamilies, setRoleFamilies] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [travelDestinations, setTravelDestinations] = useState<string[]>([]);
  const [newDestination, setNewDestination] = useState("");
  const [travelTypes, setTravelTypes] = useState<TravelType[]>([]);
  const [remoteTypes, setRemoteTypes] = useState<RemoteType[]>([]);
  const [enabledProviders, setEnabledProviders] = useState<string[]>([]);

  useEffect(() => {
    const p = getStoredProfile();
    queueMicrotask(() => {
      setProfile(p);
      setMinSalaryLpa(p.minSalaryLpa);
      setExperienceYears(p.experienceYears);
      setLocations(p.targetLocations);
      setRoleFamilies(p.targetRoleFamilies);
      setSkills(p.targetSkills);
      setTravelDestinations(p.preferredTravelDestinations);
      setTravelTypes(p.preferredTravelTypes);
      setRemoteTypes(p.preferredRemoteTypes);
      setEnabledProviders(p.enabledProviders);
    });
  }, []);

  function handleSaveSettings() {
    if (!profile) return;

    const updatedProfile: SearchProfile = {
      ...profile,
      minSalaryLpa,
      experienceYears,
      targetLocations: locations,
      targetRoleFamilies: roleFamilies,
      targetSkills: skills,
      preferredTravelDestinations: travelDestinations,
      preferredTravelTypes: travelTypes,
      preferredRemoteTypes: remoteTypes,
      enabledProviders,
    };

    saveProfile(updatedProfile);
    setProfile(updatedProfile);

    // Re-evaluate matching scores across all currently stored jobs using new profile rules!
    const currentJobs = getStoredJobs();
    const reEvaluated = currentJobs.map((j) => {
      const match = evaluateJobMatch(
        {
          title: j.title,
          company: j.company,
          location: j.location,
          remoteType: j.remoteType,
          skills: j.skills,
          roleFamily: j.roleFamily,
          experienceMin: j.experienceMin,
          experienceMax: j.experienceMax,
          salaryLpaMin: j.salaryLpaMin,
          salaryDisclosed: j.salaryDisclosed,
          travelType: j.travel.type,
          travelPercentage: j.travel.percentage,
          travelDestinations: j.travel.destinations,
          description: j.description,
        },
        updatedProfile
      );
      return { ...j, match };
    });
    saveJobs(reEvaluated);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  function addTag(
    list: string[],
    setList: (val: string[]) => void,
    val: string,
    setVal: (v: string) => void
  ) {
    if (!val.trim()) return;
    if (!list.includes(val.trim())) {
      setList([...list, val.trim()]);
    }
    setVal("");
  }

  function removeTag(list: string[], setList: (val: string[]) => void, item: string) {
    setList(list.filter((x) => x !== item));
  }

  function toggleTravelType(type: TravelType) {
    if (travelTypes.includes(type)) {
      setTravelTypes(travelTypes.filter((t) => t !== type));
    } else {
      setTravelTypes([...travelTypes, type]);
    }
  }

  function toggleRemoteType(type: RemoteType) {
    if (remoteTypes.includes(type)) {
      setRemoteTypes(remoteTypes.filter((r) => r !== type));
    } else {
      setRemoteTypes([...remoteTypes, type]);
    }
  }

  function toggleProvider(providerId: string) {
    if (enabledProviders.includes(providerId)) {
      setEnabledProviders(enabledProviders.filter((p) => p !== providerId));
    } else {
      setEnabledProviders([...enabledProviders, providerId]);
    }
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl flex items-center gap-2">
            <span>⚙️</span> Search Configuration & Target Profile
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Customize target role families, compensation targets, travel preferences, and active job providers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-lg animate-fade-in">
              ✓ Settings saved & Radar re-calculated!
            </span>
          )}
          <button
            onClick={handleSaveSettings}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* SECTION 1: Target Compensation & Experience */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>💰</span> Compensation & Seniority Requirements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Min Salary LPA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">
                Minimum Preferred Salary (LPA)
              </label>
              <span className="text-sm font-extrabold text-cyan-400">
                ₹{minSalaryLpa} LPA+
              </span>
            </div>
            <input
              type="range"
              min={25}
              max={70}
              step={1}
              value={minSalaryLpa}
              onChange={(e) => setMinSalaryLpa(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              * Per policy: Jobs with undisclosed salary remain surfaced so you never miss high-value opportunities where compensation is negotiable.
            </p>
          </div>

          {/* Experience Years */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">
                Target Experience Profile
              </label>
              <span className="text-sm font-extrabold text-indigo-400">
                {experienceYears}+ Years
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={20}
              step={1}
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-400"
            />
            <p className="text-[11px] text-slate-400">
              Evaluates seniority alignment (Senior Tech Lead, Associate Technical Architect, Solutions Architect).
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Travel Requirements (Customer & International) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>✈️</span> International & Client-Site Travel Preferences
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Prioritize roles where an India-based architect travels internationally for customer/project delivery.
          </p>
        </div>

        {/* Travel Types Toggles */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Accepted Travel Types
          </label>
          <div className="flex flex-wrap gap-2 text-xs">
            {(
              [
                { id: "INTERNATIONAL_TRAVEL", label: "International Travel" },
                { id: "CLIENT_SITE_TRAVEL", label: "Client-Site Travel (10–30%)" },
                { id: "REMOTE_GLOBAL", label: "Remote Global" },
                { id: "RELOCATION", label: "Relocation Required / Global Mobility" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTravelType(t.id)}
                className={`rounded-xl border px-3.5 py-2 font-medium transition ${
                  travelTypes.includes(t.id)
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Travel Destinations */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Target International Customer Destinations
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {travelDestinations.map((dest) => (
              <span
                key={dest}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/80 px-2.5 py-1 text-xs text-indigo-300"
              >
                <span>🌍 {dest}</span>
                <button
                  type="button"
                  onClick={() =>
                    removeTag(travelDestinations, setTravelDestinations, dest)
                  }
                  className="hover:text-rose-400"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 pt-1 max-w-sm">
            <input
              type="text"
              value={newDestination}
              onChange={(e) => setNewDestination(e.target.value)}
              placeholder="e.g. USA, Europe, Singapore, UAE"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={() =>
                addTag(
                  travelDestinations,
                  setTravelDestinations,
                  newDestination,
                  setNewDestination
                )
              }
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
            >
              + Add
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: Role Families */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🎯</span> Target Role Families
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Jobs matching any of these role families receive highest match weighting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {roleFamilies.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs text-slate-200"
            >
              <span>{role}</span>
              <button
                type="button"
                onClick={() => removeTag(roleFamilies, setRoleFamilies, role)}
                className="hover:text-rose-400 text-slate-500"
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2 pt-1 max-w-md">
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="Add role family (e.g. Solutions Architect)..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={() => addTag(roleFamilies, setRoleFamilies, newRole, setNewRole)}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            + Add Role
          </button>
        </div>
      </section>

      {/* SECTION 4: Technologies & Skills */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>💻</span> Technologies & Core Skills
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Transparently scored against job requirements and description text.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 text-xs text-cyan-300"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeTag(skills, setSkills, skill)}
                className="hover:text-rose-400 text-cyan-500"
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2 pt-1 max-w-md">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add technology (e.g. Contentful, Next.js)..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={() => addTag(skills, setSkills, newSkill, setNewSkill)}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            + Add Skill
          </button>
        </div>
      </section>

      {/* SECTION 5: Location & Remote Preferences */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>📍</span> Location & Work Model
        </h2>

        {/* Remote Types */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Preferred Workplace Models
          </label>
          <div className="flex gap-3 text-xs">
            {(["REMOTE", "HYBRID", "ONSITE"] as RemoteType[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => toggleRemoteType(r)}
                className={`rounded-xl border px-3.5 py-2 font-medium transition ${
                  remoteTypes.includes(r)
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Target Locations */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Target Locations
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs text-slate-300"
              >
                <span>📍 {loc}</span>
                <button
                  type="button"
                  onClick={() => removeTag(locations, setLocations, loc)}
                  className="hover:text-rose-400 text-slate-500"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 pt-1 max-w-sm">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g. Hyderabad, Remote India"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={() =>
                addTag(locations, setLocations, newLocation, setNewLocation)
              }
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
            >
              + Add
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6: Permitted Job Sources */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>📡</span> Permitted Job Ingestion Providers
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Legitimate APIs and public career boards active in your Market Radar scan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            {
              id: "remotive",
              name: "Remotive Remote API",
              desc: "Public open API for verified engineering, architect & lead vacancies.",
              status: "Active (No Key Required)",
            },
            {
              id: "arbeitnow",
              name: "Arbeitnow Open Job Board",
              desc: "Public open European & international tech vacancies.",
              status: "Active (No Key Required)",
            },
            {
              id: "greenhouse",
              name: "Greenhouse Public Career Boards",
              desc: "Official public endpoints for target consulting & CMS leaders.",
              status: "Active (No Key Required)",
            },
            {
              id: "adzuna",
              name: "Adzuna Search API",
              desc: "Authorized job search integration for India and international roles.",
              status: "Configured via .env (ADZUNA_APP_ID)",
            },
          ].map((provider) => {
            const isEnabled = enabledProviders.includes(provider.id);
            return (
              <div
                key={provider.id}
                onClick={() => toggleProvider(provider.id)}
                className={`rounded-xl border p-4 cursor-pointer transition ${
                  isEnabled
                    ? "border-cyan-500/50 bg-slate-950 shadow-md"
                    : "border-slate-800 bg-slate-950/40 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{provider.name}</h4>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      isEnabled
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="text-slate-400 mt-1">{provider.desc}</p>
                <span className="text-[10px] text-slate-500 block mt-2">
                  Status: {provider.status}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveSettings}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
        >
          Save Configuration & Re-index Radar
        </button>
      </div>
    </div>
  );
}
