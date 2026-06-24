import { Leaf } from "lucide-react";

interface Props {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

export const Logo = ({ variant = "light", size = "md", withText = true }: Props) => {
  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-base", inner: "h-4 w-4" },
    md: { icon: "h-9 w-9", text: "text-lg", inner: "h-5 w-5" },
    lg: { icon: "h-12 w-12", text: "text-2xl", inner: "h-7 w-7" },
  }[size];
  const textColor = variant === "dark" ? "text-primary-foreground" : "text-foreground";
  const muted = variant === "dark" ? "text-primary-foreground/70" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-2.5 group">
      <div className={`${sizes.icon} rounded-xl bg-gradient-eco flex items-center justify-center shadow-eco group-hover:scale-105 transition-transform`}>
        <Leaf className={`${sizes.inner} text-primary-foreground`} strokeWidth={2.5} />
      </div>
      {withText && (
        <div className="leading-none">
          <div className={`font-display font-extrabold ${sizes.text} ${textColor}`}>
            Eco<span className="text-gradient-eco">Tacna</span>
          </div>
          <div className={`text-[10px] font-medium tracking-widest uppercase ${muted}`}>
            Gestión Sostenible
          </div>
        </div>
      )}
    </div>
  );
};
