import { Link } from "react-router-dom";
import { MapPin, Building2 } from "lucide-react";
import { Job, useJobs, formatRelativeDate } from "@/hooks/useJobs";

interface SimilarJobsProps {
  currentJob: Job;
}

export const SimilarJobs = ({ currentJob }: SimilarJobsProps) => {
  const { data: jobs } = useJobs();

  const similarJobs = jobs
    ?.filter(
      (job) =>
        job.id !== currentJob.id &&
        job.category === currentJob.category
    )
    .slice(0, 3) || [];

  if (similarJobs.length === 0) {
    return (
      <p className="text-sm text-[#6b7280]">
        No hay más oportunidades en esta categoría por el momento.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {similarJobs.map((job) => (
        <Link
          key={job.id}
          to={`/trabajos/${job.slug}`}
          className="group block rounded-xl border border-[#e5e7eb] bg-white p-5 transition-all duration-200 hover:border-[#2563eb]/30 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            {/* Company Logo */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f3f4f6]">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-5 w-5 text-[#6b7280]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-[#1f2937] group-hover:text-[#2563eb] transition-colors line-clamp-2">
                {job.title}
              </h4>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#6b7280]">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span>{job.remote_type}</span>
              </div>
              <div className="mt-1 text-xs text-[#6b7280]">
                {formatRelativeDate(job.published_date)}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
