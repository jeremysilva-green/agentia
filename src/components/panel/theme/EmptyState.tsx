import { SpotlightCard } from "./SpotlightCard";

// Generic empty-state shell matching the mockups' dashed/solid illustrated
// cards (Solicitudes, Agendamientos, Avisos, Chats, Acuerdo Privado). Each
// caller supplies its own inline decorative SVG as `illustration`.
export function EmptyState({
  illustration,
  title,
  message,
  hint,
  action,
}: {
  illustration?: React.ReactNode;
  title?: string;
  message: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <SpotlightCard className="flex min-h-[260px] flex-col items-center justify-center gap-1 rounded-[24px] border border-[var(--line)] bg-[var(--ink-2)] px-6 py-10 text-center">
      {illustration && <div className="relative z-10 mb-3">{illustration}</div>}
      {title && <b className="relative z-10 font-display text-lg text-white">{title}</b>}
      <p className="relative z-10 max-w-sm text-[15.5px] text-[#c9c9c9]">{message}</p>
      {hint && <div className="relative z-10 mt-2 text-xs text-[var(--muted)]">{hint}</div>}
      {action && <div className="relative z-10 mt-3">{action}</div>}
    </SpotlightCard>
  );
}
