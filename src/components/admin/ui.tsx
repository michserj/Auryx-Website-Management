import Link from "next/link";

export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

const BADGE: Record<string, string> = {
  new: "bg-blue-50 text-blue-800 ring-blue-200",
  contacted: "bg-amber-50 text-amber-800 ring-amber-200",
  in_progress: "bg-violet-50 text-violet-800 ring-violet-200",
  closed: "bg-slate-100 text-slate-700 ring-slate-200",
  open: "bg-blue-50 text-blue-800 ring-blue-200",
  reviewed: "bg-amber-50 text-amber-800 ring-amber-200",
  resolved: "bg-slate-100 text-slate-700 ring-slate-200",
  confirmed: "bg-green-50 text-green-800 ring-green-200",
  cancelled: "bg-red-50 text-red-800 ring-red-200",
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  published: "bg-green-50 text-green-800 ring-green-200",
  archived: "bg-slate-100 text-slate-500 ring-slate-200",
  lead: "bg-gold-500/15 text-navy-900 ring-gold-500/40",
  review: "bg-orange-50 text-orange-800 ring-orange-200",
};

export function Badge({ kind, children }: { kind: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[kind] ?? BADGE.draft}`}>
      {children}
    </span>
  );
}

export function NeedsReview() {
  return <Badge kind="review">Needs Auryx review</Badge>;
}

export function Input({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  hint,
  ...rest
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue" | "type">) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </label>
      <input id={id} name={name} type={type} defaultValue={defaultValue} required={required} className="field" {...rest} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  rows = 4,
  required,
  hint,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
  hint?: string;
  maxLength?: number;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </label>
      <textarea id={id} name={name} rows={rows} defaultValue={defaultValue} required={required} maxLength={maxLength} className="field font-[inherit]" />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className="field">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-sm font-medium">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-navy-600" />
      {label}
    </label>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">{children}</p>;
}

export function Pagination({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => `${base}${base.includes("?") ? "&" : "?"}page=${p}`;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      {page > 1 ? <Link className="btn-outline px-3 py-1.5" href={href(page - 1)}>Previous</Link> : <span />}
      <span className="text-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? <Link className="btn-outline px-3 py-1.5" href={href(page + 1)}>Next</Link> : <span />}
    </nav>
  );
}

export function fmtDate(d: Date | null | undefined, withTime = true) {
  if (!d) return "Not set";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(d);
}
