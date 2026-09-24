"use client";

import { useState } from "react";
import type { Application, ApplicationStatus, Job } from "@/types";
import { markFollowUpDone, updateApplication } from "@/lib/applicationStore";

interface ApplicationDetailModalProps {
  application: Application;
  job?: Job;
  onClose: () => void;
  onUpdate: (updated: Application) => void;
  onDelete?: (appId: string) => void;
}

const ALL_STATUSES: Array<{ id: ApplicationStatus; label: string; badge: string }> = [
  { id: "SAVED", label: "Saved", badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40" },
  { id: "APPLIED", label: "Applied", badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/40" },
  { id: "SCREENING", label: "Screening", badge: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  { id: "TECHNICAL", label: "Technical Round", badge: "bg-purple-500/15 text-purple-300 border-purple-500/40" },
  { id: "FINAL", label: "Final Stage", badge: "bg-rose-500/15 text-rose-300 border-rose-500/40" },
  { id: "OFFER", label: "Offer Received", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  { id: "REJECTED", label: "Rejected", badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  { id: "WITHDRAWN", label: "Withdrawn", badge: "bg-slate-700/40 text-slate-400 border-slate-600" },
  { id: "IGNORED", label: "Ignored", badge: "bg-slate-800 text-slate-500 border-slate-700" },
];

export function ApplicationDetailModal({
  application,
  job,
  onClose,
  onUpdate,
  onDelete,
}: ApplicationDetailModalProps) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [resumeVersion, setResumeVersion] = useState(application.resumeVersion || "");
  const [coverLetterUsed, setCoverLetterUsed] = useState(application.coverLetterUsed || "");
  const [referral, setReferral] = useState(application.referral || false);
  const [referralName, setReferralName] = useState(application.referralName || "");
  const [recruiterName, setRecruiterName] = useState(application.recruiterName || "");
  const [recruiterEmail, setRecruiterEmail] = useState(application.recruiterEmail || "");
  const [recruiterLinkedIn, setRecruiterLinkedIn] = useState(application.recruiterLinkedIn || "");
  const [salaryExpected, setSalaryExpected] = useState<string>(
    application.salaryExpected !== undefined ? String(application.salaryExpected) : ""
  );
  const [salaryOffered, setSalaryOffered] = useState<string>(
    application.salaryOffered !== undefined ? String(application.salaryOffered) : ""
  );
  const [salaryCurrency, setSalaryCurrency] = useState(application.salaryCurrency || "INR");
  const [noticePeriodDiscussed, setNoticePeriodDiscussed] = useState(
    application.noticePeriodDiscussed || ""
  );
  const [notes, setNotes] = useState(application.notes || "");
  const [rejectionReason, setRejectionReason] = useState(application.rejectionReason || "");
  const [withdrawalReason, setWithdrawalReason] = useState(application.withdrawalReason || "");
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(
    application.nextFollowUpAt ? application.nextFollowUpAt.slice(0, 10) : ""
  );
  const [interviewDates, setInterviewDates] = useState<string[]>(application.interviewDates || []);
  const [newInterviewDate, setNewInterviewDate] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleSaveAll() {
    const now = new Date().toISOString();
    const updates: Partial<Application> = {
      status,
      appliedAt:
        status === "APPLIED" && !application.appliedAt
          ? now
          : application.appliedAt,
      savedAt:
        status === "SAVED" && !application.savedAt
          ? now
          : application.savedAt,
      resumeVersion: resumeVersion.trim() || undefined,
      coverLetterUsed: coverLetterUsed.trim() || undefined,
      referral,
      referralName: referral ? referralName.trim() || undefined : undefined,
      recruiterName: recruiterName.trim() || undefined,
      recruiterEmail: recruiterEmail.trim() || undefined,
      recruiterLinkedIn: recruiterLinkedIn.trim() || undefined,
      salaryExpected: salaryExpected ? Number(salaryExpected) : undefined,
      salaryOffered: salaryOffered ? Number(salaryOffered) : undefined,
      salaryCurrency,
      noticePeriodDiscussed: noticePeriodDiscussed.trim() || undefined,
      notes: notes.trim() || undefined,
      rejectionReason: status === "REJECTED" ? rejectionReason.trim() || undefined : undefined,
      withdrawalReason: status === "WITHDRAWN" ? withdrawalReason.trim() || undefined : undefined,
      nextFollowUpAt: nextFollowUpDate ? `${nextFollowUpDate}T09:00:00.000Z` : undefined,
      interviewDates,
    };

    const updated = updateApplication(application.id, updates);
    if (updated) {
      onUpdate(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  }

  function handleMarkFollowUpDone() {
    const updated = markFollowUpDone(application.id);
    if (updated) {
      setNextFollowUpDate("");
      onUpdate(updated);
    }
  }

  function handleAddInterviewDate() {
    if (newInterviewDate && !interviewDates.includes(newInterviewDate)) {
      const next = [...interviewDates, newInterviewDate].sort();
      setInterviewDates(next);
      setNewInterviewDate("");
    }
  }

  function handleRemoveInterviewDate(dateStr: string) {
    setInterviewDates(interviewDates.filter((d) => d !== dateStr));
  }

  const currentStatusConfig =
    ALL_STATUSES.find((s) => s.id === status) || ALL_STATUSES[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 bg-slate-950/80 p-4 sm:p-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${currentStatusConfig.badge}`}>
                {currentStatusConfig.label}
              </span>
              {job?.opportunityPriority && (
                <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                  Opportunity: {job.opportunityPriority}
                </span>
              )}
              {job?.careerFit && (
                <span className="rounded-full bg-cyan-950/60 border border-cyan-800 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                  Fit: {job.careerFit.replace("_RELEVANCE", "")}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {job?.title || "Tracked Application"}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-400">
              {job?.company || "Target Company"} • {job?.location || "Location not set"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: JOB INFORMATION */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                1. Job Information
              </span>
              {application.applicationUrl && (
                <a
                  href={application.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1"
                >
                  Open Vacancy Source ↗
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Company</span>
                <span className="text-slate-200 font-semibold">{job?.company || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
                <span className="text-slate-200 font-semibold">{job?.location || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Source</span>
                <span className="text-slate-200 font-semibold">{job?.source || application.source || "Manual"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Travel</span>
                <span className="text-slate-200 font-semibold">
                  {job?.travel?.type?.replace(/_/g, " ") || "No travel"}
                </span>
              </div>
            </div>

            {/* Matched Technologies & Domains */}
            {job?.matchedTargetTechnologies && job.matchedTargetTechnologies.length > 0 && (
              <div className="pt-2 border-t border-slate-900">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1.5">
                  Matched Target Technologies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {job.matchedTargetTechnologies.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-cyan-950/50 border border-cyan-800/60 px-2 py-0.5 text-[11px] font-medium text-cyan-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job?.domains && job.domains.length > 0 && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1.5">
                  Career Domains
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {job.domains.map((d) => (
                    <span
                      key={d}
                      className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                    >
                      {d.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: APPLICATION STATUS & RECRUITER */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block border-b border-slate-800/80 pb-2">
              2. Application Pipeline Status & Contacts
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Stage / Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Saved Date
                </label>
                <div className="text-xs text-slate-300 py-2">
                  {application.savedAt ? new Date(application.savedAt).toLocaleDateString() : "Not saved"}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Applied Date
                </label>
                <div className="text-xs text-slate-300 py-2">
                  {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "Not applied yet"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Resume Version Used
                </label>
                <input
                  type="text"
                  value={resumeVersion}
                  onChange={(e) => setResumeVersion(e.target.value)}
                  placeholder="e.g. v2.4-Technical-Architect.pdf"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Notice Period Discussed
                </label>
                <input
                  type="text"
                  value={noticePeriodDiscussed}
                  onChange={(e) => setNoticePeriodDiscussed(e.target.value)}
                  placeholder="e.g. 30 days buyout negotiable"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Recruiter Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-900">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Recruiter Name
                </label>
                <input
                  type="text"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  placeholder="Recruiter contact"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Recruiter Email
                </label>
                <input
                  type="email"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  placeholder="email@company.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Recruiter LinkedIn
                </label>
                <input
                  type="text"
                  value={recruiterLinkedIn}
                  onChange={(e) => setRecruiterLinkedIn(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Referral Toggle & Name */}
            <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={referral}
                  onChange={(e) => setReferral(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
                <span>Internal Referral Applied</span>
              </label>

              {referral && (
                <div className="flex-1">
                  <input
                    type="text"
                    value={referralName}
                    onChange={(e) => setReferralName(e.target.value)}
                    placeholder="Referral contact name / relation"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Compensation Discussion */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-900">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Expected Salary
                </label>
                <input
                  type="number"
                  value={salaryExpected}
                  onChange={(e) => setSalaryExpected(e.target.value)}
                  placeholder="e.g. 4500000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Offered Salary
                </label>
                <input
                  type="number"
                  value={salaryOffered}
                  onChange={(e) => setSalaryOffered(e.target.value)}
                  placeholder="e.g. 4800000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Currency
                </label>
                <select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Cover letter */}
            <div className="pt-2 border-t border-slate-900">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Cover Letter / Pitch Summary
              </label>
              <textarea
                value={coverLetterUsed}
                onChange={(e) => setCoverLetterUsed(e.target.value)}
                rows={2}
                placeholder="Key value proposition or custom note tailored for this role..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* SECTION 3: ACTIVITY, FOLLOW-UPS & INTERVIEWS */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block border-b border-slate-800/80 pb-2">
              3. Activity & Next Follow-up
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Next Follow-up Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                  {nextFollowUpDate && (
                    <button
                      type="button"
                      onClick={handleMarkFollowUpDone}
                      className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition whitespace-nowrap"
                    >
                      ✓ Mark Done
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Last Activity
                </label>
                <div className="text-xs text-slate-400 py-2">
                  {new Date(application.lastActivityAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Interview Dates List */}
            <div className="pt-2 border-t border-slate-900 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-400">
                Scheduled Interview Dates
              </label>

              <div className="flex flex-wrap gap-2 items-center">
                {interviewDates.map((date) => (
                  <span
                    key={date}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-800 bg-purple-950/40 px-2.5 py-1 text-xs font-medium text-purple-300"
                  >
                    📅 {date}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterviewDate(date)}
                      className="text-purple-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}

                <div className="flex gap-1.5 items-center">
                  <input
                    type="date"
                    value={newInterviewDate}
                    onChange={(e) => setNewInterviewDate(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddInterviewDate}
                    disabled={!newInterviewDate}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-2 border-t border-slate-900">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Progress Notes & Feedback
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Log interview round details, architecture discussions, salary counters, or next steps..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* SECTION 4: OUTCOME (REJECTION / WITHDRAWAL) */}
          {(status === "REJECTED" || status === "WITHDRAWN" || status === "IGNORED") && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  4. Terminal Outcome Reason
                </span>
                <button
                  type="button"
                  onClick={() => setStatus("APPLIED")}
                  className="text-xs font-semibold text-cyan-400 hover:underline"
                >
                  ↺ Reopen Application
                </button>
              </div>

              {status === "REJECTED" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Rejection Reason / Feedback
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Budget cut, position put on hold, chose internal candidate"
                    className="w-full rounded-xl border border-rose-900/60 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {status === "WITHDRAWN" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Withdrawal Reason
                  </label>
                  <input
                    type="text"
                    value={withdrawalReason}
                    onChange={(e) => setWithdrawalReason(e.target.value)}
                    placeholder="e.g. Compensation below target, role misaligned with architect scope"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-slate-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/90 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this tracked application?")) {
                    onDelete(application.id);
                    onClose();
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                🗑 Delete Application
              </button>
            )}
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-400">
                ✓ Saved successfully!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
