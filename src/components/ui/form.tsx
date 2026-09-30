import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink outline-none transition placeholder:text-muted/60 focus:border-ink/40 focus:ring-4 focus:ring-ink/5 disabled:opacity-60 dark:focus:border-lime/50 dark:focus:ring-lime/10",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted/60 focus:border-ink/40 focus:ring-4 focus:ring-ink/5 dark:focus:border-lime/50 dark:focus:ring-lime/10",
        className,
      )}
      {...props}
    />
  );
});

export function Label({ children, htmlFor, hint, className }: { children: React.ReactNode; htmlFor?: string; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-1.5 flex items-baseline justify-between gap-3", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {children}
      </label>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export function Field({ label, htmlFor, hint, help, children, className }: { label: string; htmlFor?: string; hint?: React.ReactNode; help?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
      {help && <p className="mt-1.5 text-xs leading-relaxed text-muted">{help}</p>}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "lime";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export const buttonClass = (variant: ButtonProps["variant"] = "primary", size: ButtonProps["size"] = "md") =>
  cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-4 text-sm",
    size === "lg" && "h-12 px-5 text-[15px]",
    variant === "primary" && "bg-accent text-accent-ink shadow-sm hover:opacity-90",
    variant === "lime" && "bg-lime text-night hover:shadow-[0_0_30px_-6px_rgba(212,255,63,0.8)]",
    variant === "secondary" && "border border-line bg-surface text-ink hover:bg-surface-2",
    variant === "ghost" && "text-ink hover:bg-surface-2",
    variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, loading, children, disabled, ...props }, ref) {
  return (
    <button ref={ref} className={cn(buttonClass(variant, size), className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

export function Switch({ checked, onChange, label, name }: { checked: boolean; onChange?: (v: boolean) => void; label?: string; name?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", checked ? "bg-emerald-500" : "bg-ink/15")}
    >
      {name && <input type="hidden" name={name} value={checked ? "1" : "0"} />}
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}
