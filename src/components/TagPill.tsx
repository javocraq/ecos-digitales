import { cn } from "@/lib/utils";

interface TagPillProps {
  category: string;
  className?: string;
}

const categoryColors: Record<string, string> = {
  "Tecnología": "bg-primary/10 text-primary",
  "Economía": "bg-emerald-500/10 text-emerald-600",
  "Negocios": "bg-amber-500/10 text-amber-600",
  "Medio Ambiente": "bg-green-500/10 text-green-600",
  "Startups": "bg-violet-500/10 text-violet-600",
};

export const TagPill = ({ category, className }: TagPillProps) => {
  const colorClass = categoryColors[category] || "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium",
        colorClass,
        className
      )}
    >
      {category}
    </span>
  );
};
