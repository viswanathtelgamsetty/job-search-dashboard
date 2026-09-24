import type { Job, JobStatus } from "@/types";
import { getStoredJobs as getStorageJobs, saveJobs, updateJobStatusInStorage } from "./storage";

export function getStoredJobs(defaultJobs?: Job[]): Job[] {
  const jobs = getStorageJobs();
  if (jobs && jobs.length > 0) return jobs;
  if (defaultJobs && defaultJobs.length > 0) {
    saveJobs(defaultJobs);
    return defaultJobs;
  }
  return jobs;
}

export { saveJobs };

export function updateJobStatus(
  jobs: Job[],
  jobId: string,
  status: JobStatus
): Job[] {
  return updateJobStatusInStorage(jobId, status);
}