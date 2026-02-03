import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Job, formatRelativeDate } from "@/hooks/useJobs";
import { useSwipe } from "@/hooks/useSwipe";

interface SwipeableJobCardProps {
  jobs: Job[];
}

export const SwipeableJobCard = ({ jobs }: SwipeableJobCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(() => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, jobs.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const swipeHandlers = useSwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  if (jobs.length === 0) return null;

  const currentJob = jobs[currentIndex];

  return (
    <div className="lg:hidden">
      {/* Swipeable Card Container */}
      <div
        className="relative overflow-hidden rounded-lg border border-border bg-card"
        {...swipeHandlers}
      >
        {/* Card Content */}
        <Link
          to={`/trabajos/${currentJob.slug}`}
          className="block p-4"
        >
          {/* Header: Company & Date */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs text-muted-foreground font-medium">
              {currentJob.company}
            </span>
            <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
              {formatRelativeDate(currentJob.published_date)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">
            {currentJob.title}
          </h3>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{currentJob.remote_type}</span>
            <span>•</span>
            <span>{currentJob.job_type}</span>
          </div>
        </Link>

        {/* Navigation Arrows */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              goPrev();
            }}
            disabled={currentIndex === 0}
            className="p-2 text-muted-foreground disabled:opacity-30 transition-opacity"
            aria-label="Trabajo anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              goNext();
            }}
            disabled={currentIndex === jobs.length - 1}
            className="p-2 text-muted-foreground disabled:opacity-30 transition-opacity"
            aria-label="Siguiente trabajo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {jobs.length}
        </span>
        <div className="flex gap-1">
          {jobs.length <= 10 ? (
            jobs.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground/50"
                }`}
                aria-label={`Ir al trabajo ${index + 1}`}
              />
            ))
          ) : (
            <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${((currentIndex + 1) / jobs.length) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-xs text-muted-foreground/60 mt-2">
        Desliza para ver más trabajos
      </p>
    </div>
  );
};
