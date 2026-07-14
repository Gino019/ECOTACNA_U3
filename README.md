# EcoTacna

## Plataforma inteligente para la gestión y trazabilidad del aceite de cocina usado

EcoTacna es una solución tecnológica orientada a mejorar la coordinación entre empresas generadoras de aceite de cocina usado y empresas recolectoras autorizadas.

El proyecto permite registrar empresas, gestionar solicitudes de recojo, controlar unidades vehiculares, consultar ubicaciones, administrar suscripciones, registrar incidencias y mantener un historial de trazabilidad de las operaciones.

La solución está compuesta por una aplicación web, una aplicación de escritorio administrativa, una API REST, un microservicio de recomendación inteligente y una base de datos PostgreSQL alojada en Supabase.

---

## Enlaces principales

### Aplicación web desplegada

[Acceder a EcoTacna](https://ecotacna-u3-1.onrender.com/)

### Repositorio del código fuente

[Repositorio original de EcoTacna](https://github.com/Gino019/ECOTACNA_U3)

### Artículo publicado

[Leer artículo de EcoTacna en Medium](https://medium.com/@ef2023076793/ecotacna-plataforma-web-inteligente-para-la-gesti%C3%B3n-y-trazabilidad-del-aceite-de-cocina-usado-43fbbea0a12a)

### Video de presentación

[Ver demostración del proyecto](https://drive.google.com/drive/u/5/folders/1lSqvfBslmx4JQ2hv_I77DacO7upcgkhA)


## Integrantes GAKOM

***Ana Cecilia Esteban Ramos	             (2023078688)***  
***Milton H. Flores Chino	             (2023078333)***  
***Kevin Elvis Hinojosa Calloapaza	(2023078335)***  
***Eduardo Gino Flores Navarro	(2023076793)***  
***Oscar Salas Cordero	                        (2023078695)***

<div align="center">

# EcoTacna Frontend

### Aplicación web para la gestión y trazabilidad del aceite de cocina usado

Interfaz web desarrollada con **React, TypeScript y Vite** para empresas generadoras, empresas recolectoras y administradores de la plataforma EcoTacna.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Estado](https://img.shields.io/badge/Estado-Prototipo_funcional-success)]()

</div>



---

## Descripción

**EcoTacnaFrontend** es la aplicación web del proyecto EcoTacna. Su función es proporcionar la interfaz de usuario para el registro empresarial, autenticación, gestión de solicitudes de recojo, seguimiento operativo, administración de unidades vehiculares, consulta de mapas, suscripciones y supervisión administrativa.

La aplicación web no se conecta directamente con PostgreSQL o Supabase. Toda la información se consulta o actualiza mediante la **API REST de EcoTacna**.

---

## Roles disponibles

### Empresa generadora

Puede:

- Registrar su empresa.
- Consultar y actualizar sus datos.
- Administrar sedes y ubicaciones.
- Crear solicitudes de recojo.
- Consultar solicitudes registradas.
- Realizar seguimiento de operaciones.
- Revisar su suscripción.

### Empresa recolectora

Puede:

- Consultar solicitudes disponibles.
- Revisar ubicación, litros, precio y distancia.
- Recibir recomendaciones operativas.
- Gestionar unidades vehiculares.
- Consultar recojos asignados.
- Visualizar el mapa operativo.
- Actualizar información de su empresa.

### Administrador

Puede:

- Visualizar indicadores generales.
- Consultar empresas generadoras.
- Consultar empresas recolectoras.
- Aprobar o rechazar registros.
- Consultar unidades de transporte.
- Supervisar información administrativa.

---

# Estructura general del proyecto

```text
EcoTacnaFrontend/
│
├── public/
│   ├── _redirects
│   ├── placeholder.svg
│   ├── robots.txt
│   └── test_image.jpg
│
├── src/
│   ├── assets/
│   │   ├── hero-ecotacna.jpg
│   │   └── landing/
│   │       └── Recursos gráficos de la página principal
│   │
│   ├── components/
│   │   ├── maps/
│   │   ├── pickup/
│   │   ├── profile/
│   │   ├── transport/
│   │   ├── ui/
│   │   ├── AuxiliaryCompanyDataForm.tsx
│   │   ├── ContactoForm.tsx
│   │   ├── DashboardShell.tsx
│   │   ├── Logo.tsx
│   │   ├── NavLink.tsx
│   │   ├── PuzzleCaptcha.tsx
│   │   ├── RucSearchPanel.tsx
│   │   ├── StatCard.tsx
│   │   └── StatusBadge.tsx
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/
│   │   └── utils.ts
│   │
│   ├── pages/
│   │   ├── admin/
│   │   ├── empresa/
│   │   ├── recolector/
│   │   ├── AdminDashboard.tsx
│   │   ├── EmpresaDashboard.tsx
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   ├── PaymentCheckoutPage.tsx
│   │   ├── RecolectorDashboard.tsx
│   │   ├── RegisterCompanyPage.tsx
│   │   └── SubscriptionStatusPage.tsx
│   │
│   ├── services/
│   │   ├── adminApi.ts
│   │   ├── apiClient.ts
│   │   ├── authApi.ts
│   │   ├── authStorage.ts
│   │   ├── empresaApi.ts
│   │   ├── paymentApi.ts
│   │   ├── publicApi.ts
│   │   ├── recolectorApi.ts
│   │   ├── rucApi.ts
│   │   ├── rucService.ts
│   │   └── subscriptionApi.ts
│   │
│   ├── utils/
│   │   └── date.ts
│   │
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── types.ts
│   └── vite-env.d.ts
│
├── .env.example
├── .gitignore
├── check-console.cjs
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

# Descripción de carpetas

## `public/`

Contiene archivos que Vite publica directamente sin procesarlos.

| Archivo | Función |
|---|---|
| `_redirects` | Permite redirigir rutas al `index.html` en despliegues SPA |
| `robots.txt` | Configuración básica para rastreadores |
| `placeholder.svg` | Imagen genérica de respaldo |
| `test_image.jpg` | Recurso gráfico de prueba |

---

## `src/assets/`

Contiene imágenes y recursos visuales utilizados por la aplicación.

```text
src/assets/
├── hero-ecotacna.jpg
└── landing/
```

Los recursos de esta carpeta son importados desde componentes o páginas y son procesados por Vite durante la compilación.

---

## `src/components/`

Contiene componentes reutilizables que pueden ser usados en distintas páginas.

### Componentes generales

| Componente | Responsabilidad |
|---|---|
| `DashboardShell.tsx` | Estructura visual común de los dashboards |
| `Logo.tsx` | Logotipo de EcoTacna |
| `NavLink.tsx` | Enlaces de navegación |
| `StatCard.tsx` | Tarjetas de indicadores |
| `StatusBadge.tsx` | Etiquetas visuales para estados |
| `PuzzleCaptcha.tsx` | CAPTCHA utilizado en procesos definidos |
| `RucSearchPanel.tsx` | Consulta y validación de RUC |
| `ContactoForm.tsx` | Formulario de contacto empresarial |
| `AuxiliaryCompanyDataForm.tsx` | Datos complementarios del registro |

### `components/maps/`

Componentes relacionados con Google Maps y ubicaciones.

```text
maps/
├── GoogleMapView.tsx
├── MapErrorBoundary.tsx
├── MapFallback.tsx
├── PlaceSearchInput.tsx
├── RouteMapView.tsx
├── mapConstants.ts
└── mapTypes.ts
```

Responsabilidades:

- Mostrar mapas.
- Buscar direcciones.
- Seleccionar coordenadas.
- Visualizar rutas.
- Controlar errores de carga.
- Mostrar una alternativa cuando Google Maps no está disponible.

### `components/pickup/`

Componentes asociados con solicitudes de recojo.

```text
pickup/
├── PickupAvailabilityTimer.tsx
└── PickupIncidentSection.tsx
```

### `components/profile/`

Componentes del perfil y suscripción.

```text
profile/
└── SubscriptionStatusCard.tsx
```

### `components/transport/`

Componentes para unidades vehiculares.

```text
transport/
└── TransportUnitForm.tsx
```

### `components/ui/`

Biblioteca de componentes visuales reutilizables basada en Radix UI y Tailwind CSS.

Incluye:

- Botones.
- Tarjetas.
- Formularios.
- Diálogos.
- Tablas.
- Selectores.
- Pestañas.
- Alertas.
- Menús.
- Barra lateral.
- Toasts.
- Tooltips.
- Calendarios.
- Paginación.

Esta carpeta permite mantener una interfaz consistente en toda la aplicación.

---

## `src/hooks/`

Contiene hooks personalizados.

| Hook | Responsabilidad |
|---|---|
| `use-mobile.tsx` | Detectar el tamaño de pantalla o modo móvil |
| `use-toast.ts` | Gestionar notificaciones emergentes |

---

## `src/lib/`

Contiene utilidades compartidas.

```text
lib/
└── utils.ts
```

`utils.ts` incluye funciones auxiliares utilizadas para combinar clases CSS y mantener estilos consistentes.

---

# Estructura de páginas

## Páginas generales

```text
src/pages/
├── Landing.tsx
├── Login.tsx
├── RegisterCompanyPage.tsx
├── SubscriptionStatusPage.tsx
├── PaymentCheckoutPage.tsx
└── NotFound.tsx
```

| Página | Función |
|---|---|
| `Landing.tsx` | Página principal y presentación de EcoTacna |
| `Login.tsx` | Inicio de sesión |
| `RegisterCompanyPage.tsx` | Registro de empresas generadoras y recolectoras |
| `SubscriptionStatusPage.tsx` | Consulta del estado de suscripción |
| `PaymentCheckoutPage.tsx` | Flujo de pago o activación |
| `NotFound.tsx` | Página para rutas inexistentes |

---

## Páginas administrativas

```text
src/pages/admin/
├── AdminCollectorDetailModal.tsx
├── AdminCompanyDetailModal.tsx
├── AdminEmpresas.tsx
├── AdminEmpresasRechazadasModal.tsx
├── AdminRecolectores.tsx
├── AdminTransportes.tsx
└── adminNav.ts
```

Funciones principales:

- Consultar empresas generadoras.
- Consultar empresas recolectoras.
- Revisar empresas rechazadas.
- Visualizar el detalle de una empresa.
- Consultar unidades de transporte.
- Organizar la navegación administrativa.

El dashboard principal se encuentra en:

```text
src/pages/AdminDashboard.tsx
```

---

## Páginas de empresa generadora

```text
src/pages/empresa/
├── EmpresaMiEmpresa.tsx
├── EmpresaMisSolicitudes.tsx
├── EmpresaSeguimiento.tsx
├── EmpresaSolicitarRecojo.tsx
└── empresaNav.ts
```

| Página | Función |
|---|---|
| `EmpresaMiEmpresa.tsx` | Consultar y administrar la información empresarial |
| `EmpresaSolicitarRecojo.tsx` | Crear una solicitud de recojo |
| `EmpresaMisSolicitudes.tsx` | Consultar solicitudes registradas |
| `EmpresaSeguimiento.tsx` | Realizar seguimiento de una operación |
| `empresaNav.ts` | Configurar opciones del menú |

El dashboard principal se encuentra en:

```text
src/pages/EmpresaDashboard.tsx
```

---

## Páginas de empresa recolectora

```text
src/pages/recolector/
├── RecolectorMapaOperativo.tsx
├── RecolectorMiEmpresa.tsx
├── RecolectorRecojosDia.tsx
├── RecolectorSolicitudes.tsx
├── RecolectorTransportes.tsx
└── recolectorNav.ts
```

| Página | Función |
|---|---|
| `RecolectorSolicitudes.tsx` | Consultar solicitudes disponibles |
| `RecolectorRecojosDia.tsx` | Consultar operaciones del día |
| `RecolectorMapaOperativo.tsx` | Visualizar ubicaciones y rutas |
| `RecolectorTransportes.tsx` | Gestionar unidades vehiculares |
| `RecolectorMiEmpresa.tsx` | Consultar información de la empresa |
| `recolectorNav.ts` | Configurar opciones del menú |

El dashboard principal se encuentra en:

```text
src/pages/RecolectorDashboard.tsx
```

---

# Servicios y comunicación con la API

La carpeta `src/services/` centraliza la comunicación con el backend.

```text
services/
├── apiClient.ts
├── authApi.ts
├── authStorage.ts
├── publicApi.ts
├── adminApi.ts
├── empresaApi.ts
├── recolectorApi.ts
├── paymentApi.ts
├── subscriptionApi.ts
├── rucApi.ts
└── rucService.ts
```

| Servicio | Responsabilidad |
|---|---|
| `apiClient.ts` | Cliente HTTP base y configuración de la URL de la API |
| `authApi.ts` | Inicio de sesión y autenticación |
| `authStorage.ts` | Almacenamiento local de la sesión |
| `publicApi.ts` | Endpoints públicos |
| `adminApi.ts` | Operaciones administrativas |
| `empresaApi.ts` | Operaciones de empresas generadoras |
| `recolectorApi.ts` | Operaciones de empresas recolectoras |
| `paymentApi.ts` | Procesos relacionados con pagos |
| `subscriptionApi.ts` | Consulta y gestión de suscripciones |
| `rucApi.ts` | Comunicación con el endpoint de consulta RUC |
| `rucService.ts` | Funciones auxiliares para el proceso de consulta RUC |

La comunicación general sigue este flujo:

```text
Página o componente
        ↓
Servicio específico
        ↓
apiClient
        ↓
API REST EcoTacna
        ↓
PostgreSQL / Supabase
```

---

# Archivos principales

## `src/main.tsx`

Punto de entrada de la aplicación. Monta el componente principal de React dentro del elemento raíz del documento HTML.

## `src/App.tsx`

Define:

- Proveedores globales.
- React Query.
- Tooltips.
- Toasts.
- React Router.
- Rutas de la aplicación.

## `src/types.ts`

Contiene interfaces y tipos TypeScript compartidos entre páginas, componentes y servicios.

## `src/index.css`

Contiene estilos globales, variables y configuración visual general.

## `src/App.css`

Contiene estilos complementarios relacionados con la aplicación.

---

# Rutas de la aplicación

## Rutas públicas

| Ruta | Página |
|---|---|
| `/` | Landing |
| `/login` | Inicio de sesión |
| `/registro` | Registro empresarial |
| `/suscripcion/estado` | Estado de suscripción |
| `/pagos/checkout` | Checkout de pago |

## Rutas administrativas

| Ruta | Página |
|---|---|
| `/admin/resumen` | Dashboard administrativo |
| `/admin/empresas` | Empresas generadoras |
| `/admin/recolectores` | Empresas recolectoras |
| `/admin/transportes` | Unidades de transporte |

## Rutas de empresa generadora

| Ruta | Página |
|---|---|
| `/empresa/resumen` | Dashboard de empresa |
| `/empresa/solicitar-recojo` | Crear solicitud |
| `/empresa/mis-solicitudes` | Listar solicitudes |
| `/empresa/seguimiento` | Seguimiento |
| `/empresa/mi-empresa` | Perfil empresarial |

## Rutas de empresa recolectora

| Ruta | Página |
|---|---|
| `/recolector/resumen` | Dashboard del recolector |
| `/recolector/mapa-operativo` | Mapa operativo |
| `/recolector/solicitudes` | Solicitudes disponibles |
| `/recolector/recojos-dia` | Recojos del día |
| `/recolector/mi-empresa` | Perfil empresarial |
| `/recolector/transportes` | Unidades vehiculares |

Cualquier ruta no registrada dirige a:

```text
NotFound.tsx
```

---

# Tecnologías utilizadas

| Área | Tecnologías |
|---|---|
| Framework | React 18 |
| Lenguaje | TypeScript |
| Compilación | Vite |
| Navegación | React Router DOM |
| Estado remoto | TanStack React Query |
| Formularios | React Hook Form |
| Validación | Zod |
| Mapas | `@vis.gl/react-google-maps` |
| Componentes UI | Radix UI |
| Estilos | Tailwind CSS |
| Iconos | Lucide React |
| Gráficos | Recharts |
| Fechas | date-fns |
| Notificaciones | Sonner y Toast |
| Pruebas | Vitest |
| Calidad | ESLint |

---

# Requisitos

- Node.js `18.18.0` o superior.
- npm.
- Navegador moderno.
- API REST EcoTacna disponible.
- Clave válida de Google Maps para las funciones geográficas.

Verificar versiones:

```bash
node --version
npm --version
```

---

# Instalación

Clonar el repositorio:

```bash
git clone https://github.com/Gino019/ECOTACNA_U3.git
```

Acceder al proyecto web:

```bash
cd ECOTACNA_U3/EcoTacnaFrontend
```

Instalar dependencias:

```bash
npm install
```

---

# Variables de entorno

Copiar el archivo de ejemplo:

```bash
cp .env.example .env.local
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Configurar:

```env
VITE_API_BASE_URL=http://localhost:8082/ecotacna/api
VITE_RUC_PROVIDER=apiperudev
VITE_GOOGLE_MAPS_API_KEY=COLOCAR_API_KEY_FRONTEND_RESTRINGIDA
```

## Descripción de variables

| Variable | Función |
|---|---|
| `VITE_API_BASE_URL` | Dirección base de la API REST |
| `VITE_RUC_PROVIDER` | Proveedor utilizado para consulta de RUC |
| `VITE_GOOGLE_MAPS_API_KEY` | Clave pública restringida de Google Maps |

> La clave de Google Maps debe restringirse por dominio y por las APIs permitidas.

No publicar:

```text
.env
.env.local
```

---

# Ejecución en desarrollo

```bash
npm run dev
```

La aplicación se ejecuta en:

```text
http://localhost:8080
```

El script está configurado para escuchar en todas las interfaces de red:

```json
"dev": "vite --host 0.0.0.0 --port 8080"
```

---

# Compilación de producción

```bash
npm run build
```

Los archivos generados se almacenan en:

```text
dist/
```

---

# Vista previa de producción

```bash
npm run preview
```

La vista previa se ejecuta en:

```text
http://localhost:8080
```

---

# Comandos disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Iniciar el servidor de desarrollo |
| `npm run build` | Generar la compilación de producción |
| `npm run preview` | Visualizar la compilación local |
| `npm run lint` | Ejecutar ESLint |
| `npm run test` | Ejecutar pruebas con Vitest |

---

# Despliegue

La aplicación web puede desplegarse en servicios compatibles con aplicaciones Vite, como Render, Netlify o Vercel.

Para el despliegue se debe configurar:

```env
VITE_API_BASE_URL=https://URL_PUBLICA_DE_LA_API/ecotacna/api
VITE_RUC_PROVIDER=apiperudev
VITE_GOOGLE_MAPS_API_KEY=CLAVE_RESTRINGIDA_PARA_EL_DOMINIO
```

## Configuración recomendada

| Campo | Valor |
|---|---|
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Node.js | 18.18 o superior |

La carpeta `public` incluye `_redirects` para facilitar el funcionamiento de React Router en despliegues SPA.

---

# Arquitectura del frontend

```text
Usuario
   ↓
Página React
   ↓
Componente reutilizable
   ↓
Servicio del módulo
   ↓
apiClient
   ↓
API REST EcoTacna
```

El frontend se encarga de:

- Presentar la interfaz.
- Recoger información.
- Realizar validaciones de formulario.
- Gestionar la navegación.
- Mostrar resultados y errores.
- Mantener la sesión del usuario.
- Consumir la API.

Las reglas críticas del negocio y la autorización deben validarse también en el backend.

---

# Seguridad

Antes de publicar el proyecto:

- No subir `.env` ni `.env.local`.
- No incluir contraseñas.
- No colocar claves privadas.
- Restringir la clave de Google Maps por dominio.
- Configurar correctamente la URL pública de la API.
- Evitar datos personales reales en capturas.
- Verificar que la API controle los roles.
- Revisar el almacenamiento local de la sesión.
- Probar el cierre de sesión y expiración del token.

---

# Estado actual

El proyecto web se encuentra en una etapa de **prototipo funcional**.

Incluye:

- Registro empresarial.
- Inicio de sesión.
- Dashboards por rol.
- Gestión de solicitudes.
- Seguimiento.
- Gestión de transportes.
- Mapas.
- Suscripciones.
- Pagos.
- Administración básica.
- Integración con la API REST.



---

# Información académica

- **Universidad:** Universidad Privada de Tacna.
- **Facultad:** Facultad de Ingeniería.
- **Escuela Profesional:** Ingeniería de Sistemas.
- **Curso:** Programación III.
- **Docente:** Ing. Elard Rodriguez Marca.
- **Lugar:** Tacna, Perú.
- **Año:** 2026.

---

<div align="center">
