import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-lg bg-white/25 border border-white/35 rounded-2xl",
        hover && "hover:transform hover:-translate-y-1 hover:shadow-2xl hover:bg-white/30 transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}
