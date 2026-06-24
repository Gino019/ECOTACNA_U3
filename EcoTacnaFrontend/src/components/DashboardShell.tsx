import { NavLink, useNavigate } from "react-router-dom";
import { ReactNode, useMemo } from "react";
import { ChevronDown, LogOut, type LucideIcon } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { clearStoredAuth, getStoredAuth } from "@/services/authStorage";

interface NavItem { to: string; label: string; icon: LucideIcon; }
interface Props {
  role: "Administrador" | "Empresa" | "Recolector";
  user: { name: string; sub: string; avatar?: string };
  nav: NavItem[];
  children: ReactNode;
}

const roleStyles = {
  Administrador: "bg-secondary text-secondary-foreground",
  Empresa: "bg-primary text-primary-foreground",
  Recolector: "bg-accent text-accent-foreground",
};

export const DashboardShell = ({ role, user, nav, children }: Props) => {
  const navigate = useNavigate();
  const storedAuth = getStoredAuth();
  
  const displayUser = storedAuth
    ? {
        name: user.name && !["Empresa", "Empresa Generadora", "Recolector", "Cargando..."].includes(user.name) ? user.name : (storedAuth.companyName || "Información no disponible"),
        sub: user.sub && !["Desconectado", "Sin perfil", "Cargando perfil...", "Cargando..."].includes(user.sub) ? user.sub : (storedAuth.email || "No autenticado"),
      }
    : user;

  return (
    <div className="min-h-screen flex bg-muted/40">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col fixed inset-y-0 z-40">
        <div className="p-5 border-b border-sidebar-border">
          <Logo variant="dark" size="md" />
        </div>
        <div className="px-4 pt-4 pb-2">
          <Badge className={cn("text-[10px] uppercase tracking-wider", roleStyles[role])}>
            Panel {role}
          </Badge>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
          <div>
            <div className="text-xs text-muted-foreground">Bienvenido</div>
            <div className="font-semibold text-sm">{displayUser.name || "Información no disponible"}</div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-eco flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {(displayUser.name || "IN").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <div className="text-xs font-semibold">{displayUser.name || "Información no disponible"}</div>
                    <div className="text-[10px] text-muted-foreground">{displayUser.sub || "No autenticado"}</div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { clearStoredAuth(); navigate("/"); }} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Cerrar sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};
