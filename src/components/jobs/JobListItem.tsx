import { Link } from "react-router-dom";
import { Job, formatRelativeDate } from "@/hooks/useJobs";

interface JobListItemProps {
  job: Job;
}

export const JobListItem = ({ job }: JobListItemProps) => {
  return (
    <Link
      to={`/trabajos/${job.slug}`}
      className="block px-3 py-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
    >
      {/* Header: Empresa y Fecha */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs text-muted-foreground font-medium truncate max-w-[60%]">
          {job.company}
        </span>
        <span className="text-xs text-muted-foreground/70 whitespace-nowrap flex-shrink-0">
          {formatRelativeDate(job.published_date)}
        </span>
      </div>

      {/* Título */}
      <h3 className="text-sm sm:text-[15px] lg:text-base font-semibold text-foreground mb-1.5 leading-snug">
        {job.title}
      </h3>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {job.experience_level && <span>{job.experience_level}</span>}
        {job.experience_level && job.remote_type && <span>•</span>}
        {job.remote_type && <span>{job.remote_type}</span>}
      </div>
    </Link>
  );
};
