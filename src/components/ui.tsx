import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-brand-600 text-white hover:bg-brand-700": variant === "primary",
          "border border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50":
            variant === "secondary",
          "text-ink-600 hover:bg-ink-100": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2.5 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "brand",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "brand" | "neutral" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        {
          "bg-brand-50 text-brand-700 ring-1 ring-brand-100": tone === "brand",
          "bg-ink-100 text-ink-600 ring-1 ring-ink-200": tone === "neutral",
          "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100":
            tone === "success",
          "bg-amber-50 text-amber-700 ring-1 ring-amber-100": tone === "warning",
        },
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card p-6", className)} {...props} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      {icon ? <div className="text-brand-500">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="max-w-md text-sm text-ink-500">{description}</p>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-ink-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
