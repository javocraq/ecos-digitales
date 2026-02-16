interface SectionHeaderProps {
  title: string;
}

export const SectionHeader = ({ title }: SectionHeaderProps) => (
  <div className="text-center mb-6">
    <div className="h-px w-full bg-border mb-3" />
    <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground mb-3">
      {title}
    </h2>
    <div className="h-px w-full bg-border" />
  </div>
);
