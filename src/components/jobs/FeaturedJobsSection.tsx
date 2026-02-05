import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { JobCard } from "./JobCard";
import { useFeaturedJobs } from "@/hooks/useJobs";
import { Skeleton } from "@/components/ui/skeleton";

export const FeaturedJobsSection = () => {
  const { data: jobs, isLoading } = useFeaturedJobs(3);

  if (isLoading) {
    return (
      <section className="container py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Oportunidades Laborales
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (jobs.length === 0) {
    return null;
  }

  return (
    <section className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Oportunidades Laborales
        </h2>
        <Link
          to="/"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Ver todos los trabajos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
};
