import { U } from '@/lib/constants';

interface GlassCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function GlassCard({ children, style, className, onMouseEnter, onMouseLeave, onClick }: GlassCardProps) {
  return (
    <div
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        background: U.glass,
        backdropFilter: "var(--backdrop-filter)",
        WebkitBackdropFilter: "var(--backdrop-filter)",
        border: `1px solid ${U.border}`,
        borderRadius: 14,
        ...style
      }}
    >
      {children}
    </div>
  );
}
