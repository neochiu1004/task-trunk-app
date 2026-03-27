import { Toaster as Sonner, toast } from "sonner";

import { useTheme } from "@/hooks/use-theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={{ pointerEvents: 'none' }}
      toastOptions={{
        style: { pointerEvents: 'auto' },
        classNames: {
          toast:
            "group toast group-[.toaster]:backdrop-blur-xl group-[.toaster]:bg-[hsl(var(--glass-bg))] group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-white/15 group-[.toaster]:shadow-xl group-[.toaster]:shadow-black/20 group-[.toaster]:ring-1 group-[.toaster]:ring-white/10 group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
