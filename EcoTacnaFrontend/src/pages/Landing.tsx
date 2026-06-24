import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImg from "@/assets/landing/LANDING.jpg";
import { publicApi, PublicStatsResponse } from "@/services/publicApi";
import {
  ArrowRight, Building2, Truck, ShieldCheck, FileCheck2, Recycle,
  Droplets, BarChart3, Sparkles, CheckCircle2, AlertTriangle,
  TrendingUp, Phone, Mail, Facebook, Instagram, Linkedin, MapPin
} from "lucide-react";

const navLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#problema", label: "Impacto" },
  { href: "#flujo", label: "Cómo funciona" },
  { href: "#roles", label: "Roles" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#planes", label: "Planes" },
  { href: "#contacto", label: "Contacto" },
];

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`} 
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  const [stats, setStats] = useState<PublicStatsResponse | null>(null);

  useEffect(() => {
    publicApi.getLandingStats()
      .then(setStats)
      .catch(err => console.error("Error cargando estadísticas", err));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Logo size="md" />
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Ingresar</Button></Link>
            <Link to="/registro"><Button size="sm" className="bg-gradient-eco shadow-eco">Registrar empresa</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="inicio" className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 eco-radial" />
        <div className="absolute inset-0 eco-grid-bg opacity-50" />
        <div className="container relative grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn className="space-y-7">
            <Badge className="bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/20 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Plataforma autorizada · Tacna
            </Badge>
            <h1 className="font-display text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Gestión digital del <span className="text-gradient-eco">aceite usado</span> en Tacna
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Conectamos restaurantes, pollerías y locales de comida con recolectores autorizados. Registra tu empresa, solicita recojos, acuerda el precio por litro y consulta el historial de tus operaciones desde una sola plataforma.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/registro">
                <Button size="lg" className="bg-gradient-eco shadow-eco h-12 px-6">
                  Registrar mi empresa <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <a href="#flujo">
                <Button size="lg" variant="outline" className="h-12 px-6 border-2">Ver cómo funciona</Button>
              </a>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success"/> Validación interna</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success"/> Recojos programados</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success"/> Pago por litro acordado</div>
            </div>
          </FadeIn>

          <FadeIn delay={200} className="relative">
            <div className="absolute -inset-6 bg-gradient-eco opacity-20 blur-3xl rounded-full" />
            <div className="relative rounded-3xl overflow-hidden shadow-eco hover:-translate-y-2 transition-transform duration-700 ease-out">
              <img src={heroImg} alt="Vista referencial de Tacna con recolección de aceite usado" className="w-full h-auto object-cover" width={1920} height={1080} />
            </div>
            {/* Floating cards */}
            {stats && stats.litrosRecolectados > 0 && (
              <Card className="absolute -bottom-6 -left-6 p-4 shadow-lg bg-card/95 backdrop-blur w-56 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-eco flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-display">{stats.litrosRecolectados} L</div>
                    <div className="text-[11px] text-muted-foreground">Litros Recolectados</div>
                  </div>
                </div>
              </Card>
            )}
            {stats && stats.empresasActivas > 0 && (
              <Card className="absolute -top-4 -right-4 p-3 shadow-lg bg-card/95 backdrop-blur hidden md:block">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse-dot" />
                  <span className="text-xs font-semibold">{stats.empresasActivas} empresas activas</span>
                </div>
              </Card>
            )}
          </FadeIn>
        </div>
      </section>

      {/* INDICADORES */}
      <section className="border-y border-border bg-card">
        <div className="container py-10">
          <FadeIn className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: stats ? `${stats.litrosRecolectados ?? 0} L` : "0 L", l: "Litros Recolectados", i: Droplets },
              { v: stats ? (stats.empresasActivas ?? 0).toString() : "0", l: "Empresas Generadoras", i: Building2 },
              { v: stats ? (stats.recolectoresActivos ?? 0).toString() : "0", l: "Recolectores Activos", i: Truck },
              { v: stats ? `S/ ${stats.pagosProcesados ?? 0}` : "S/ 0", l: "Pagos Procesados", i: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="text-center space-y-1">
                <s.i className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-display font-bold text-foreground">{s.v}</div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="problema" className="py-24">
        <div className="container">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4 border-destructive/30 text-destructive">El problema</Badge>
            <h2 className="font-display text-4xl font-bold mb-4">El aceite usado contamina y nadie lo controla</h2>
            <p className="text-muted-foreground">Cada litro de aceite vertido al desagüe contamina miles de litros de agua. En la región se generan grandes cantidades sin control formal.</p>
          </FadeIn>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { i: Droplets, t: "Contaminación de agua", d: "1 L de aceite contamina 1,000 L de agua potable." },
              { i: AlertTriangle, t: "Daño al alcantarillado", d: "Atascos y daños en redes de desagüe." },
              { i: Building2, t: "Informalidad", d: "Disposición sin control ni registro por parte de locales." },
              { i: ShieldCheck, t: "Falta de formalidad", d: "Ausencia de un registro histórico y seguro de recojos." },
            ].map((p, i) => (
              <FadeIn key={i} delay={i * 100}>
                <Card className="p-6 border-border hover:shadow-md transition-all h-full">
                  <div className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                    <p.i className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{p.t}</h3>
                  <p className="text-sm text-muted-foreground">{p.d}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="flujo" className="py-24 bg-gradient-soft">
        <div className="container">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">El proceso</Badge>
            <h2 className="font-display text-4xl font-bold mb-4">Cómo funciona EcoTacna</h2>
            <p className="text-muted-foreground">Un flujo digital simple, formal y controlado de principio a fin.</p>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { n: "01", i: Building2, t: "Empresa se registra", d: "Consulta RUC con ApiPeruDev y completa datos de contacto." },
              { n: "02", i: ShieldCheck, t: "Validación interna", d: "El administrador aprueba o rechaza el acceso." },
              { n: "03", i: Recycle, t: "Solicita recojo", d: "La empresa indica litros estimados, precio por litro, dirección y fecha disponible." },
              { n: "04", i: Truck, t: "Recolector acepta", d: "La recolectora autorizada acepta la solicitud y usa su unidad registrada." },
              { n: "05", i: FileCheck2, t: "Recojo y confirmación", d: "Se confirma el recojo con litros reales y monto final." },
              { n: "06", i: BarChart3, t: "Historial operativo", d: "Empresa y recolector consultan solicitudes, pagos y registros completados." },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <Card className="p-6 relative overflow-hidden group hover:shadow-eco transition-all hover:-translate-y-1 h-full">
                  <div className="absolute top-3 right-4 text-5xl font-display font-extrabold text-primary/10 group-hover:text-primary/20 transition-colors">{s.n}</div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-eco flex items-center justify-center mb-4 shadow-eco">
                    <s.i className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{s.t}</h3>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="py-24">
        <div className="container">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4">Tres roles, una plataforma</Badge>
            <h2 className="font-display text-4xl font-bold mb-4">¿Quiénes participan?</h2>
            <p className="text-muted-foreground">Cada actor tiene su propio panel, permisos y herramientas operativas.</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                role: "Administrador",
                color: "bg-secondary text-secondary-foreground",
                badge: "Gobierno / Operador",
                d: "Valida empresas generadoras y recolectoras, supervisa suscripciones, revisa indicadores y mantiene el control institucional de la plataforma.",
                features: ["Aprobar empresas y recolectoras", "Revisar panel financiero", "Consultar empresas registradas", "Revisar unidades de transporte", "Exportar reportes"]
              },
              {
                role: "Empresa / Generador",
                color: "bg-primary text-primary-foreground",
                badge: "Restaurantes y locales",
                d: "Restaurantes, pollerías y locales de comida que generan aceite usado y solicitan recojos de manera digital.",
                features: ["Solicitar recojo", "Indicar litros estimados y precio", "Ver recolector y placa asignada", "Consultar historial", "Administrar suscripción"]
              },
              {
                role: "Recolector",
                color: "bg-accent text-accent-foreground",
                badge: "Empresas autorizadas",
                d: "Empresas autorizadas que aceptan recojos, registran su unidad vehicular y confirman litros reales recolectados.",
                features: ["Registrar unidad vehicular", "Aceptar recojos disponibles", "Confirmar litros reales", "Consultar historial", "Administrar suscripción"]
              },
            ].map((r, i) => (
              <FadeIn key={i} delay={i * 150}>
                <Card className="p-7 border-2 hover:border-primary/40 transition-all relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-eco opacity-5 rounded-full -translate-y-16 translate-x-16" />
                  <Badge className={`${r.color} mb-4`}>{r.badge}</Badge>
                  <h3 className="font-display text-2xl font-bold mb-3">{r.role}</h3>
                  <p className="text-sm text-muted-foreground mb-5">{r.d}</p>
                  <ul className="space-y-2">
                    {r.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="beneficios" className="py-24 bg-secondary text-secondary-foreground relative overflow-hidden">
        <div className="absolute inset-0 eco-grid-bg opacity-20" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <Badge className="bg-accent text-accent-foreground mb-4">Beneficios</Badge>
              <h2 className="font-display text-4xl font-bold mb-6 leading-tight">
                Más que recoger aceite, <br />
                <span className="text-accent">creamos formalidad y control</span>
              </h2>
              <p className="text-secondary-foreground/80 mb-8">
                EcoTacna convierte un residuo problemático en un recurso valorizado y controlado.
                Gana cumplimiento, trazabilidad y control de pagos por litro.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: "100%", l: "Control operativo" },
                  { v: "Rápido", l: "Registro y solicitud" },
                  { v: "Seguro", l: "Validación interna" },
                  { v: "Claro", l: "Suscripciones mensuales" },
                ].map((s, i) => (
                  <div key={i} className="border-l-2 border-accent pl-4">
                    <div className="text-3xl font-display font-bold">{s.v}</div>
                    <div className="text-xs text-secondary-foreground/70">{s.l}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={200} className="grid grid-cols-2 gap-4">
              {[
                { i: ShieldCheck, t: "Formalidad", d: "Registro y validación interna de empresas." },
                { i: BarChart3, t: "Información centralizada", d: "Solicitudes, recojos y pagos en un solo lugar." },
                { i: TrendingUp, t: "Pago por litro", d: "Propón el precio y recibe pagos justos." },
                { i: Truck, t: "Control operativo", d: "Cada recolector usa una unidad registrada." },
                { i: FileCheck2, t: "Historial", d: "Consulta todas tus operaciones completadas." },
                { i: CheckCircle2, t: "Suscripciones claras", d: "Planes transparentes con montos definidos." },
              ].map((b, i) => (
                <Card key={i} className="p-5 bg-card/10 border-card/20 backdrop-blur text-secondary-foreground hover:bg-card/15 transition">
                  <b.i className="h-6 w-6 text-accent mb-3" />
                  <h4 className="font-semibold mb-1">{b.t}</h4>
                  <p className="text-xs text-secondary-foreground/70">{b.d}</p>
                </Card>
              ))}
            </FadeIn>
          </div>
        </div>
      </section>

      {/* PLANES Y SUSCRIPCIÓN */}
      <section id="planes" className="py-24 bg-gray-50 border-t border-border">
        <div className="container">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Suscripciones</Badge>
            <h2 className="font-display text-4xl font-bold mb-4">Planes y acceso a la plataforma</h2>
            <p className="text-muted-foreground">Opciones diseñadas para cada tipo de empresa, garantizando transparencia y formalidad.</p>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FadeIn delay={100}>
              <Card className="p-8 border-2 border-border relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Generadores
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">Restaurantes y Locales</h3>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold">S/ 29.90</span>
                  <span className="text-muted-foreground"> / mes</span>
                </div>
                <p className="text-muted-foreground mb-6 flex-grow">
                  Ideal para empezar a disponer correctamente tu aceite usado y gestionar tus recojos formales. <br/>
                  <strong className="text-primary mt-2 block">Incluye 7 días de prueba gratis al registrarte.</strong>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> Inscripción y validación rápida</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> Solicitudes ilimitadas</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> Recibe S/ por litro confirmado</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> Historial de recojos detallado</li>
                </ul>
                <Link to="/registro">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Comenzar 7 días de prueba
                  </Button>
                </Link>
              </Card>
            </FadeIn>

            <FadeIn delay={200}>
              <Card className="p-8 border-2 border-accent relative overflow-hidden flex flex-col shadow-lg shadow-accent/10 h-full">
                <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Recolectores
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">Empresas Autorizadas</h3>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold">S/ 299.90</span>
                  <span className="text-muted-foreground"> / mes</span>
                </div>
                <p className="text-muted-foreground mb-6 flex-grow">
                  Acceso completo a la bolsa de recojos, registro de flota y confirmación de operaciones.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-accent" /> Aceptar solicitudes en tiempo real</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-accent" /> Registro de unidades de transporte</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-accent" /> Confirmar litros exactos</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-accent" /> Historial y panel de control</li>
                </ul>
                <Link to="/registro">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Registrar Empresa Recolectora
                  </Button>
                </Link>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20">
        <div className="container">
          <FadeIn>
            <Card className="p-12 bg-gradient-hero text-primary-foreground border-0 relative overflow-hidden">
              <div className="absolute inset-0 eco-grid-bg opacity-15" />
              <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
                <div>
                  <h2 className="font-display text-3xl lg:text-4xl font-bold mb-3">
                    Formaliza la disposición de tu aceite usado hoy
                  </h2>
                  <p className="text-primary-foreground/80 max-w-2xl">
                    Regístrate para conocer la plataforma y solicita tu primer recojo.
                    Sin papeleo, de forma 100% digital.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/registro"><Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-6 shadow-lg">Registrar empresa</Button></Link>
                  <Link to="/login"><Button size="lg" variant="outline" className="h-12 px-6 border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 hover:text-primary-foreground">Ya tengo cuenta</Button></Link>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="bg-secondary text-secondary-foreground border-t border-secondary/30">
        <div className="container py-14 grid md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <Logo variant="dark" />
            <p className="text-sm text-secondary-foreground/70">
              Plataforma digital de gestión, recolección y formalización del aceite de cocina usado en la región Tacna.
            </p>
            <div className="flex gap-2">
              {[Facebook, Instagram, Linkedin].map((I, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-card/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 text-sm uppercase tracking-wider text-accent">Plataforma</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><a href="#flujo" className="hover:text-accent">Cómo funciona</a></li>
              <li><a href="#roles" className="hover:text-accent">Roles</a></li>
              <li><a href="#beneficios" className="hover:text-accent">Beneficios</a></li>
              <li><a href="#planes" className="hover:text-accent">Planes</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 text-sm uppercase tracking-wider text-accent">Acceso</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/login" className="hover:text-accent">Iniciar sesión</Link></li>
              <li><Link to="/registro" className="hover:text-accent">Registrar empresa</Link></li>
              <li><Link to="/admin" className="hover:text-accent">Acceso administrador</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 text-sm uppercase tracking-wider text-accent">Contacto</h4>
            <ul className="space-y-3 text-sm text-secondary-foreground/70">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent"/> Av. Bolognesi 1247, Tacna</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent"/> (052) 415-887</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent"/> contacto@upt.edu.pe</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/10 py-5">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-secondary-foreground/60">
            <div>© 2026 EcoTacna · Plataforma de gestión sostenible</div>
            <div className="flex gap-5">
              <a href="#" className="hover:text-accent">Términos</a>
              <a href="#" className="hover:text-accent">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
