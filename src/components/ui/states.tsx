import { AlertCircle, WifiOff } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

interface StateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, body, action, className }: StateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {icon && (
        <div className="mb-5 grid size-14 place-items-center rounded-[18px] border border-line bg-surface text-ink-2 shadow-[var(--shadow-sm)] [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h3 className="text-h3 font-semibold text-ink text-balance">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-small text-ink-3 text-pretty">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, body, action, className, offline }: StateProps & { offline?: boolean }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-5 grid size-14 place-items-center rounded-[18px] border border-out-line bg-out-soft text-out [&_svg]:size-6">
        {offline ? <WifiOff aria-hidden /> : <AlertCircle aria-hidden />}
      </div>
      <h3 className="text-h3 font-semibold text-ink text-balance">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-small text-ink-3 text-pretty">{body}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function InlineNotice({
  tone = "info",
  icon,
  children,
  className,
}: {
  tone?: "info" | "warn" | "ok";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const cls = {
    info: "bg-info-soft text-info",
    warn: "bg-warn-soft text-warn",
    ok: "bg-ok-soft text-ok",
  }[tone];
  return (
    <div className={cn("flex items-start gap-2.5 rounded-[12px] px-3.5 py-3 text-small", cls, className)}>
      {icon && <span className="mt-0.5 [&_svg]:size-4">{icon}</span>}
      <div className="min-w-0 flex-1 text-pretty">{children}</div>
    </div>
  );
}
