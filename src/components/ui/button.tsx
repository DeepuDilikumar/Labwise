import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:size-[1.125em] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.12),var(--shadow-xs)] hover:bg-primary-hover",
        secondary: "border border-line-strong bg-surface text-ink shadow-[var(--shadow-xs)] hover:bg-surface-2",
        ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
        soft: "bg-primary-soft text-primary-soft-ink hover:brightness-[0.97] dark:hover:brightness-110",
        danger: "border border-crit-line bg-surface text-crit hover:bg-crit-soft",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-9 rounded-[10px] px-3 text-small",
        md: "h-11 rounded-[12px] px-4 text-body",
        lg: "h-13 rounded-[14px] px-6 text-body",
        icon: "size-11 rounded-[12px]",
        "icon-sm": "size-9 rounded-[10px]",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild, loading, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
});

export { buttonVariants };
