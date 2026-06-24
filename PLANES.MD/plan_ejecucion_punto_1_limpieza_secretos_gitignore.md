# Plan de ejecución exacto — Punto 1
## Limpieza de secretos, archivos `.env`, configuración sensible y `.gitignore` antes de integrar Google Maps

**Proyecto:** EcoTacna  
**Objetivo del punto 1:** dejar el proyecto limpio de credenciales hardcodeadas, archivos `.env` versionables, scripts temporales con acceso directo a BD, documentación interna no usada y artefactos generados.  
**Criterio del usuario:** no conservar versiones antiguas dentro del proyecto, no crear carpetas `backup`, no crear archivos `.bak`, no mantener documentación interna duplicada porque la documentación oficial ya existe aparte.

---

## 1. Resultado esperado al terminar este punto

Al finalizar este bloque, el proyecto debe quedar así:

1. Sin `.env` reales dentro del código entregable.
2. Sin token real de ApiPeruDev en `application.properties`.
3. Sin usuario/contraseña real de Supabase en archivos `.properties`, `.js` o `.java`.
4. Sin contraseña por defecto `Admin123!` ni correo administrador hardcodeado como credencial real.
5. Sin scripts sueltos de prueba que conectan directamente a PostgreSQL/Supabase.
6. Sin `node_modules`, `dist`, `target`, `.class`, PDF/XLSX de prueba ni documentación interna duplicada.
7. Con `.env.example` limpios, solo con placeholders.
8. Con `.gitignore` preparado para que no se vuelvan a subir secretos o artefactos generados.
9. Con variables preparadas para Google Maps, pero todavía sin implementar Google Maps en código.

---

## 2. Punto de partida detectado

En el ZIP actual se detectaron estos problemas de seguridad y limpieza:

### 2.1. Archivos `.env` reales dentro del proyecto

Eliminar directamente:

```txt
EcoTacnaFrontend/.env
EcoTacnaSpringBootJPA/.env
```

Motivo: los `.env` reales no deben formar parte del entregable. Solo deben quedar `.env.example`.

---

### 2.2. Propiedades con secretos o valores peligrosos

Revisar y sanear:

```txt
EcoTacnaSpringBootJPA/src/main/resources/application.properties
EcoTacnaSpringBootJPA/src/main/resources/application-supabase.properties
```

Problemas detectados:

- `jwt.secret` tiene un valor por defecto real.
- `ecotacna.bootstrap.enabled=true` queda activo por defecto.
- `apiperudev.api.token` contiene token real.
- `application-supabase.properties` contiene conexión real a Supabase.

---

### 2.3. Código con credenciales hardcodeadas

Eliminar directamente porque son scripts temporales/no funcionales del sistema:

```txt
check_deps.js
delete_mock_data.js
query_db.js
query_db2.js
query_prices.js
EcoTacnaSpringBootJPA/AddColumn.java
EcoTacnaSpringBootJPA/AddColumn.class
EcoTacnaSpringBootJPA/CheckTransportUnits.java
EcoTacnaSpringBootJPA/CheckTransportUnits.class
```

Motivo: contienen o han contenido conexión directa a Supabase/PostgreSQL y no forman parte de la aplicación productiva.

---

### 2.4. Scripts de prueba y archivos temporales

Eliminar directamente:

```txt
EcoTacnaSpringBootJPA/test_collector.js
EcoTacnaSpringBootJPA/test_endpoint.js
EcoTacnaSpringBootJPA/compile_log.txt
EcoTacnaSpringBootJPA/ficha_test.pdf
EcoTacnaSpringBootJPA/historial-empresa-test.xlsx
EcoTacnaSpringBootJPA/historial-recolector-test.xlsx
Contras#U00f1easRegistro
```

Motivo: no son código fuente funcional del sistema y no deben viajar en el proyecto final.

---

### 2.5. Documentación interna duplicada

Como la documentación oficial está fuera del proyecto y ya fue trabajada aparte, eliminar directamente:

```txt
docs/
README.md
plan_implementacion_panel_resumen_ecotacna.md
resumenrecolector_plan
resumenrestaurante_plan
EcoTacnaFrontend/README.md
```

No crear `docs/archive`, `docs_old`, `backup_docs` ni equivalentes.

---

### 2.6. Artefactos generados o pesados

Eliminar directamente:

```txt
node_modules/
EcoTacnaFrontend/node_modules/
EcoTacnaFrontend/dist/
EcoTacnaSpringBootJPA/target/
```

Motivo: son carpetas generadas. Se reconstruyen con `npm install`, `npm run build` o `mvnw clean compile`.

---

## 3. Comandos de ejecución — Windows PowerShell

Ejecutar desde la carpeta interna del proyecto, es decir, donde están:

```txt
EcoTacnaFrontend/
EcoTacnaSpringBootJPA/
db/
db-clean/
```

Ejemplo:

```powershell
cd C:\ruta\a\ECOTACNA\ECOTACNA
```

---

### 3.1. Eliminar historial Git del ZIP si existe

Como no se quiere conservar versiones ni historial con secretos, eliminar `.git` del nivel superior si existe.

Si estás dentro de `ECOTACNA\ECOTACNA`, ejecuta:

```powershell
if (Test-Path ..\.git) { Remove-Item ..\.git -Recurse -Force }
if (Test-Path .\.git) { Remove-Item .\.git -Recurse -Force }
```

Esto evita que queden secretos en historial local.

---

### 3.2. Eliminar `.env` reales

```powershell
Remove-Item .\EcoTacnaFrontend\.env -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaSpringBootJPA\.env -Force -ErrorAction SilentlyContinue
```

Deben quedar únicamente:

```txt
EcoTacnaFrontend/.env.example
EcoTacnaSpringBootJPA/.env.example
```

---

### 3.3. Eliminar scripts temporales con credenciales o acceso directo a BD

```powershell
Remove-Item .\check_deps.js -Force -ErrorAction SilentlyContinue
Remove-Item .\delete_mock_data.js -Force -ErrorAction SilentlyContinue
Remove-Item .\query_db.js -Force -ErrorAction SilentlyContinue
Remove-Item .\query_db2.js -Force -ErrorAction SilentlyContinue
Remove-Item .\query_prices.js -Force -ErrorAction SilentlyContinue

Remove-Item .\EcoTacnaSpringBootJPA\AddColumn.java -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaSpringBootJPA\AddColumn.class -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaSpringBootJPA\CheckTransportUnits.java -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaSpringBootJPA\CheckTransportUnits.class -Force -ErrorAction SilentlyContinue

Remove-Item .\EcoTacnaSpringBootJPA\test_collector.js -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaSpringBootJPA\test_endpoint.js -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaSpringBootJPA\compile_log.txt -Force -ErrorAction SilentlyContinue
Remove-Item .\Contras#U00f1easRegistro -Force -ErrorAction SilentlyContinue
```

---

### 3.4. Eliminar documentación interna duplicada

```powershell
Remove-Item .\docs -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\README.md -Force -ErrorAction SilentlyContinue
Remove-Item .\plan_implementacion_panel_resumen_ecotacna.md -Force -ErrorAction SilentlyContinue
Remove-Item .\resumenrecolector_plan -Force -ErrorAction SilentlyContinue
Remove-Item .\resumenrestaurante_plan -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaFrontend\README.md -Force -ErrorAction SilentlyContinue
```

---

### 3.5. Eliminar artefactos generados

```powershell
Remove-Item .\node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaFrontend\node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaFrontend\dist -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaSpringBootJPA\target -Recurse -Force -ErrorAction SilentlyContinue
```

---

### 3.6. Eliminar archivos PDF/XLSX de prueba

```powershell
Remove-Item .\EcoTacnaSpringBootJPA\ficha_test.pdf -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaSpringBootJPA\historial-empresa-test.xlsx -Force -ErrorAction SilentlyContinue
Remove-Item .\EcoTacnaSpringBootJPA\historial-recolector-test.xlsx -Force -ErrorAction SilentlyContinue
```

---

## 4. Reemplazo exacto de configuración backend

### 4.1. Reemplazar `application.properties`

Archivo:

```txt
EcoTacnaSpringBootJPA/src/main/resources/application.properties
```

Contenido nuevo recomendado:

```properties
# ============================================================
# ECO_TACNA - Configuracion base sin secretos hardcodeados
# ============================================================

spring.application.name=ECOTACNA

# Servidor
server.port=${SERVER_PORT:8082}
server.servlet.context-path=/ecotacna

# Seguridad JWT
# Obligatorio en ejecucion. No colocar valor real en este archivo.
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION:86400000}

# Bootstrap administrador
# Debe permanecer falso por defecto. Activar solo de forma local/controlada.
ecotacna.bootstrap.enabled=${ECOTACNA_BOOTSTRAP_ENABLED:false}
ecotacna.bootstrap.admin.email=${ECOTACNA_BOOTSTRAP_ADMIN_EMAIL:}
ecotacna.bootstrap.admin.password=${ECOTACNA_BOOTSTRAP_ADMIN_PASSWORD:}

# Captcha puzzle
captcha.enabled=${CAPTCHA_ENABLED:true}

# Pagos simulados
payments.enabled=${PAYMENTS_ENABLED:true}
payments.mode=${PAYMENTS_MODE:simulated}

# Consulta RUC
ruc.provider=${RUC_PROVIDER:apiperudev}
apiperudev.api.token=${APIPERUDEV_API_TOKEN:}
apiperudev.api.base-url=${APIPERUDEV_API_BASE_URL:https://apiperu.dev/api}

# Google Maps / Geocoding backend futuro
# No se usa todavia en el punto 1. Queda preparado para la etapa de mapas.
google.maps.api.key=${GOOGLE_MAPS_API_KEY:}
```

---

### 4.2. Reemplazar `application-supabase.properties`

Archivo:

```txt
EcoTacnaSpringBootJPA/src/main/resources/application-supabase.properties
```

Contenido nuevo recomendado:

```properties
# ============================================================
# ECO_TACNA - Perfil Supabase/PostgreSQL sin credenciales hardcodeadas
# ============================================================

spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA / Hibernate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# SQL init desactivado
spring.sql.init.mode=never

# HikariCP
spring.datasource.hikari.maximum-pool-size=${SPRING_DATASOURCE_MAX_POOL_SIZE:3}
spring.datasource.hikari.minimum-idle=0
spring.datasource.hikari.idle-timeout=30000
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.max-lifetime=1800000

# Servidor
server.port=${SERVER_PORT:8082}
server.servlet.context-path=/ecotacna

# Captcha
captcha.enabled=${CAPTCHA_ENABLED:true}
```

---

## 5. Reemplazo exacto de `.env.example`

### 5.1. Reemplazar backend `.env.example`

Archivo:

```txt
EcoTacnaSpringBootJPA/.env.example
```

Contenido nuevo recomendado:

```env
# ============================================================
# ECO_TACNA BACKEND - Variables locales/de despliegue
# Copiar manualmente a variables del sistema o a un archivo local ignorado.
# No pegar valores reales en archivos versionables.
# ============================================================

SPRING_PROFILES_ACTIVE=supabase

SERVER_PORT=8082

SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:6543/postgres?sslmode=require&prepareThreshold=0
SPRING_DATASOURCE_USERNAME=postgres.PROJECT_REF
SPRING_DATASOURCE_PASSWORD=COLOCAR_PASSWORD_REAL_SOLO_EN_LOCAL_O_SERVIDOR

JWT_SECRET=COLOCAR_SECRETO_LARGO_MINIMO_32_CARACTERES
JWT_EXPIRATION=86400000

ECOTACNA_BOOTSTRAP_ENABLED=false
ECOTACNA_BOOTSTRAP_ADMIN_EMAIL=
ECOTACNA_BOOTSTRAP_ADMIN_PASSWORD=

CAPTCHA_ENABLED=true

PAYMENTS_ENABLED=true
PAYMENTS_MODE=simulated

RUC_PROVIDER=apiperudev
APIPERUDEV_API_TOKEN=COLOCAR_TOKEN_REAL_SOLO_EN_LOCAL_O_SERVIDOR
APIPERUDEV_API_BASE_URL=https://apiperu.dev/api

# Futuro backend para Geocoding/Routes si se usa desde servidor
GOOGLE_MAPS_API_KEY=COLOCAR_API_KEY_BACKEND_RESTRINGIDA
```

---

### 5.2. Reemplazar frontend `.env.example`

Archivo:

```txt
EcoTacnaFrontend/.env.example
```

Contenido nuevo recomendado:

```env
# ============================================================
# ECO_TACNA FRONTEND - Variables Vite
# Copiar a .env.local para desarrollo. No subir .env.local.
# ============================================================

VITE_API_BASE_URL=http://localhost:8082/ecotacna/api
VITE_RUC_PROVIDER=apiperudev

# Futuro frontend para Google Maps JavaScript API
# Esta key debe estar restringida por dominio y por APIs permitidas.
VITE_GOOGLE_MAPS_API_KEY=COLOCAR_API_KEY_FRONTEND_RESTRINGIDA
```

---

## 6. Ajuste exacto en `AdminBootstrapConfig.java`

Archivo:

```txt
EcoTacnaSpringBootJPA/src/main/java/com/GAKOM_ECOTACNA/ECOTACNA/config/AdminBootstrapConfig.java
```

Objetivo: quitar credenciales por defecto hardcodeadas.

Buscar estas líneas:

```java
@Value("${ecotacna.bootstrap.admin.email:admin@ecotacna.com}")
private String adminEmail;

@Value("${ecotacna.bootstrap.admin.password:Admin123!}")
private String adminPassword;
```

Reemplazar por:

```java
@Value("${ecotacna.bootstrap.admin.email:}")
private String adminEmail;

@Value("${ecotacna.bootstrap.admin.password:}")
private String adminPassword;
```

Dentro del método `run`, antes de crear el usuario administrador, agregar esta validación:

```java
if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
    throw new IllegalStateException(
        "Bootstrap admin activado, pero faltan ECOTACNA_BOOTSTRAP_ADMIN_EMAIL o ECOTACNA_BOOTSTRAP_ADMIN_PASSWORD."
    );
}
```

Resultado esperado:

- Si `ECOTACNA_BOOTSTRAP_ENABLED=false`, no crea admin automático.
- Si alguien activa el bootstrap, tendrá que pasar usuario y contraseña por variable de entorno.
- Ya no queda una contraseña predeterminada dentro del código.

---

## 7. Reemplazo exacto de `.gitignore`

Archivo principal:

```txt
.gitignore
```

Contenido recomendado:

```gitignore
# ============================================================
# EcoTacna - Ignore limpio para secretos y artefactos generados
# ============================================================

# Entorno / secretos
.env
.env.*
!.env.example
**/.env
**/.env.*
!**/.env.example

# Configuraciones locales con credenciales
application-local.properties
**/application-local.properties
application-dev-local.properties
**/application-dev-local.properties
*.pem
*.key
*.p12
*.jks

# Tokens / respuestas temporales
*token*.txt
admin_token.txt
token.txt
login.json
usuarios.json
empresas*.json
solicitudes*.json
req.json
ruc_test.txt
ruc_verbose.txt

# Dependencias frontend/node
node_modules/
**/node_modules/

# Builds frontend
EcoTacnaFrontend/dist/
EcoTacnaFrontend/dist-ssr/
**/dist/
**/dist-ssr/

# Builds backend Maven/Java
EcoTacnaSpringBootJPA/target/
**/target/
*.class

# Logs y temporales
*.log
*.tmp
*.bak
compile_log.txt

# Reportes/archivos generados por pruebas
*.pdf
*.xlsx

# IDE / sistema operativo
.vscode/
.idea/
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Scripts temporales de auditoria o limpieza manual
check_deps.js
delete_mock_data.js
query_db*.js
query_prices.js
test_endpoint.js
test_collector.js
AddColumn.java
CheckTransportUnits.java
```

También actualizar:

```txt
EcoTacnaFrontend/.gitignore
EcoTacnaSpringBootJPA/.gitignore
```

No tienen que ser idénticos, pero deben cubrir al menos:

```gitignore
.env
.env.*
!.env.example
node_modules/
dist/
target/
*.class
*.log
*.tmp
*.bak
```

---

## 8. Rotación obligatoria de credenciales expuestas

Después de limpiar archivos, realizar esta rotación fuera del código:

1. Regenerar o cambiar token de ApiPeruDev.
2. Cambiar contraseña del pooler/base de datos Supabase usada por el proyecto.
3. Generar nuevo `JWT_SECRET` largo.
4. No reutilizar la contraseña de administrador anterior.
5. Cuando se cree Google Maps API Key, crearla nueva y restringida desde el inicio.

Regla: toda credencial que estuvo dentro del ZIP debe considerarse expuesta.

---

## 9. Verificación final con PowerShell

Ejecutar desde la raíz interna del proyecto:

```powershell
# 1. Verificar que no quedan .env reales
Get-ChildItem -Recurse -Force -File | Where-Object {
    $_.Name -match '^\.env' -and $_.Name -ne '.env.example'
} | Select-Object FullName

# 2. Verificar que no quedan .class, target, node_modules ni dist
Get-ChildItem -Recurse -Force -Directory | Where-Object {
    $_.Name -in @('node_modules','target','dist','dist-ssr')
} | Select-Object FullName

Get-ChildItem -Recurse -Force -File -Filter *.class | Select-Object FullName

# 3. Buscar cadenas sensibles conocidas sin escribirlas en el codigo
Select-String -Path .\* -Pattern "Admin123!", "admin@ecotacna.com", "apiperudev.api.token=", "spring.datasource.password=" -Recurse -ErrorAction SilentlyContinue
```

Además, buscar manualmente cualquier valor real conocido:

```txt
- contraseña real de Supabase
- project ref de Supabase si no quieres mostrarlo
- token real de ApiPeruDev
- JWT secret anterior
- correos personales usados como admin temporal
```

La búsqueda debe devolver cero resultados relevantes, salvo placeholders en `.env.example`.

---

## 10. Validación de compilación después de limpiar

### 10.1. Backend

```powershell
cd .\EcoTacnaSpringBootJPA
.\mvnw.cmd clean compile
```

Resultado esperado:

```txt
BUILD SUCCESS
```

No es necesario levantar el backend todavía si no configuraste variables reales en el entorno.

---

### 10.2. Frontend

```powershell
cd ..\EcoTacnaFrontend
npm install
npm run lint
npx tsc --noEmit
npm run build
```

Resultado esperado:

```txt
lint sin errores
TypeScript OK
build OK
```

Puede quedar warnings existentes, pero no errores.

---

## 11. Qué NO se toca en este punto

En el punto 1 todavía no se implementa Google Maps. No tocar todavía:

```txt
MapMock.tsx
EmpresaSolicitarRecojo.tsx
EmpresaSeguimiento.tsx
RecolectorMapaOperativo.tsx
PickupRequest.java
Company.java
TransportUnit.java
```

Esos archivos corresponden al punto 2 y punto 3, cuando se agreguen coordenadas y mapa real.

---

## 12. Estado de cierre del punto 1

El punto 1 se considera cerrado cuando se cumple esta lista:

- [ ] No existe `.git` antiguo con historial del ZIP.
- [ ] No existen `.env` reales en frontend/backend.
- [ ] `application.properties` no contiene token real, JWT real ni bootstrap activo por defecto.
- [ ] `application-supabase.properties` no contiene credenciales reales.
- [ ] `AdminBootstrapConfig.java` no contiene `admin@ecotacna.com` ni `Admin123!` como fallback.
- [ ] No existen scripts JS/Java sueltos con conexión directa a Supabase.
- [ ] No existen `node_modules`, `dist`, `target` ni `.class` en el entregable.
- [ ] No existe documentación interna duplicada dentro del proyecto.
- [ ] `.gitignore` bloquea secretos y artefactos generados.
- [ ] Backend compila.
- [ ] Frontend instala dependencias, pasa TypeScript y genera build.

---

## 13. Siguiente punto después de cerrar este bloque

Después de cerrar el punto 1, recién corresponde pasar al siguiente bloque:

**Punto 2 — Preparar modelo de datos para Google Maps:**

1. Agregar `latitude` y `longitude` a `Company`.
2. Agregar `pickupLatitude` y `pickupLongitude` a `PickupRequest`.
3. Agregar DTOs con coordenadas.
4. Actualizar endpoints de solicitud, seguimiento y mapa operativo.
5. Mantener `MapMock` hasta que las coordenadas estén listas.

