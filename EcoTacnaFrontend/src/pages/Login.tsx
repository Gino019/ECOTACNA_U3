import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PuzzleCaptcha from "@/components/PuzzleCaptcha";
import { ArrowLeft, ArrowRight, Building2, Mail, ShieldCheck, Truck, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authApi } from "@/services/authApi";
import { clearStoredAuth, saveAuth } from "@/services/authStorage";
import { toast } from "sonner";

const isOperativeStatus = (status?: string | null) => status === "ACTIVA" || status === "PRUEBA_ACTIVA";

const Login = () => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<"empresa" | "recolector">("empresa");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");

  // Limpiar sesión al cargar la vista de login
  useEffect(() => {
    clearStoredAuth();
  }, []);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [captchaTokenAdmin, setCaptchaTokenAdmin] = useState("");
  const [captchaTokenUser, setCaptchaTokenUser] = useState("");
  
  const [captchaKeyAdmin, setCaptchaKeyAdmin] = useState(0);
  const [captchaKeyUser, setCaptchaKeyUser] = useState(0);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) return;
    if (!captchaTokenAdmin) {
      toast.error("Marca la verificación \"No soy un robot\" para continuar");
      return;
    }
    setIsLoadingAdmin(true);
    try {
      const response = await authApi.login(adminEmail, adminPassword, captchaTokenAdmin);
      if (response.data) {
        if (response.data.role !== "ADMIN") {
           throw new Error("El usuario no tiene rol de administrador");
        }
        saveAuth(response.data);
        toast.success("Acceso autorizado");
        navigate("/admin");
      }
    } catch (error: any) {
      toast.error(error.message || "Error de credenciales");
      setCaptchaKeyAdmin(prev => prev + 1);
      setCaptchaTokenAdmin("");
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userPassword) return;
    /*if (!captchaTokenUser) {
      toast.error("Marca la verificación \"No soy un robot\" para continuar");
      return;
    }*/
    setIsLoadingUser(true);
    try {
      const response = await authApi.login(userEmail, userPassword, captchaTokenUser);
      if (response.data) {
        const expectedRole = tipo === "empresa" ? "GENERADOR" : "RECOLECTOR";
        if (response.data.role !== expectedRole) {
          throw new Error(`El usuario no tiene rol de ${expectedRole}`);
        }
        if (!isOperativeStatus(response.data.subscriptionStatus)) {
          clearStoredAuth();

          if (response.data.subscriptionStatus === "PENDIENTE_PAGO" && response.data.companyId) {
            toast.info("Tu empresa esta aprobada, pero aun debe completar el pago para operar.");
            navigate(`/pagos/checkout?companyId=${response.data.companyId}`);
            return;
          }

          if (response.data.subscriptionStatus === "PENDIENTE") {
            toast.info("Tu empresa aun esta en revision administrativa.");
            navigate("/registro");
            return;
          }

          toast.error("Tu empresa no tiene una suscripcion activa para ingresar al panel operativo.");
          navigate("/suscripcion/estado");
          return;
        }
        saveAuth(response.data);
        toast.success("Acceso autorizado");
        navigate(`/${tipo}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Error de credenciales");
      setCaptchaKeyUser(prev => prev + 1);
      setCaptchaTokenUser("");
    } finally {
      setIsLoadingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft eco-radial flex flex-col">
      <header className="container py-5 flex items-center justify-between">
        <Logo />
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
      </header>

      <div className="flex-1 container py-10 grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-center">
        <Card className="p-8 lg:p-10 bg-gradient-hero text-primary-foreground border-0 relative overflow-hidden shadow-eco">
          <div className="absolute inset-0 eco-grid-bg opacity-15" />
          <div className="relative space-y-6">
            <Badge className="bg-accent text-accent-foreground border-0">
              <ShieldCheck className="h-3 w-3 mr-1" /> Acceso administradores
            </Badge>
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Acceso Administrador</h2>
              <p className="text-primary-foreground/80 text-sm">Ingreso exclusivo para administradores autorizados de la plataforma EcoTacna.</p>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-3">
              <Input type="email" placeholder="Correo administrador" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="bg-primary-foreground text-foreground border-0 h-12" required />
              <Input type="password" placeholder="Contraseña" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="bg-primary-foreground text-foreground border-0 h-12" required />
              
              <div className="flex justify-center py-2 w-full">
                <PuzzleCaptcha key={captchaKeyAdmin} onVerify={setCaptchaTokenAdmin} />
              </div>

              <Button type="submit" size="lg" disabled={isLoadingAdmin} className="w-full h-12 bg-card text-foreground hover:bg-card/90 shadow-lg justify-center text-base font-semibold">
                {isLoadingAdmin ? "Validando..." : "Ingresar"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>


          </div>
        </Card>

        <Card className="p-8 lg:p-10 shadow-lg">
          <Badge variant="outline" className="mb-4">Usuarios externos</Badge>
          <h2 className="font-display text-3xl font-bold mb-2">Acceso EcoTacna</h2>
          <p className="text-muted-foreground text-sm mb-6">Empresas generadoras y recolectores autorizados.</p>

          <Tabs value={tipo} onValueChange={(v) => setTipo(v as "empresa" | "recolector")} className="mb-5">
            <TabsList className="grid grid-cols-2 w-full h-12">
              <TabsTrigger value="empresa" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Building2 className="h-4 w-4 mr-2" /> Empresa
              </TabsTrigger>
              <TabsTrigger value="recolector" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Truck className="h-4 w-4 mr-2" /> Recolector
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="Correo electrónico" className="pl-9 h-11" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-9 h-11" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
              </div>
            </div>
            
            <div className="flex justify-center py-2 w-full">
              <PuzzleCaptcha key={captchaKeyUser} onVerify={setCaptchaTokenUser} />
            </div>

            <Button type="submit" disabled={isLoadingUser} className="w-full h-11 bg-gradient-eco shadow-eco">
              {isLoadingUser ? "Validando..." : `Ingresar como ${tipo === "empresa" ? "Empresa" : "Recolector"}`}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
             ¿No tienes cuenta? <Link to="/registro" className="text-primary hover:underline">Regístrate aquí</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
