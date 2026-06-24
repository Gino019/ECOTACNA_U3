# PLAN ECO TACNA — SEPARAR RECOMENDACIÓN IA COMO MICROSERVICIO INDEPENDIENTE SIN ROMPER FLUJOS

## Objetivo

Separar la recomendación con IA de recojos disponibles en un **microservicio independiente**, sin romper el funcionamiento actual de EcoTacna.

La idea es pasar de esto:

```text
EcoTacnaSpringBootJPA
  └── cálculo score + llamada Gemini + respuesta al frontend
```

a esto:

```text
EcoTacnaSpringBootJPA
  └── calcula datos objetivos del recojo
  └── llama a microservicio IA
          ↓
EcoTacnaAIRecommendationService
  └── score base
  └── Gemini
  └── ranking recomendado
```

La integración debe aplicar **solo para recolectores**, específicamente en pedidos disponibles/recojos del día.

No debe afectar:

```text
Empresa/restaurante
Administrador
Pagos
Culqi
ApiPeruDev
Google Maps visual
Login/JWT
Incidencias
Historial
Aceptación de recojo
Registro de empresas
Unidades vehiculares
```

---

## Principio de seguridad funcional

No se debe reemplazar directamente la lógica actual.

Se debe implementar con modo configurable:

```text
AI_RECOMMENDATION_MODE=INTERNAL
AI_RECOMMENDATION_MODE=MICROSERVICE
AI_RECOMMENDATION_MODE=OFF
```

Significado:

```text
INTERNAL       → usa la implementación actual dentro del backend principal.
MICROSERVICE  → llama al microservicio IA.
OFF           → no usa IA, solo score base o listado normal.
```

Regla obligatoria:

```text
Si el microservicio IA falla, EcoTacnaSpringBootJPA debe usar fallback interno y seguir mostrando pedidos.
```

---

## Arquitectura final

```text
Frontend React
        ↓
EcoTacnaSpringBootJPA
        ↓
EcoTacnaAIRecommendationService
        ↓
Gemini API
```

El frontend **no debe llamar directamente** al microservicio IA.

El frontend debe seguir consumiendo los endpoints actuales del backend principal:

```text
/api/recolector/solicitudes
/api/recolector/recojos-dia
/api/recolector/solicitudes-disponibles
```

El backend principal se encarga de llamar al microservicio y devolver el mismo DTO enriquecido que ya consume React.

---

## Decisión clave para no romper nada

El microservicio IA **no debe acceder directamente a la base de datos** en esta primera etapa.

Debe recibir desde el backend principal todos los datos ya calculados:

```text
id de solicitud
litros
capacidad
distancia
precio estimado
tiempo restante
si excede capacidad
score base si ya existe
coordenadas solo si son necesarias
```

Ventaja:

```text
No duplicamos conexión a PostgreSQL.
No duplicamos entidades JPA.
No rompemos seguridad.
No exponemos JWT al microservicio.
No cambiamos frontend.
```

---

## Estructura de carpetas propuesta

Crear un nuevo proyecto hermano:

```text
ECOTACNA
├── EcoTacnaSpringBootJPA
├── EcoTacnaFrontend
└── EcoTacnaAIRecommendationService
```

No meter el microservicio dentro de `EcoTacnaSpringBootJPA/src`.

Debe ser un proyecto Spring Boot separado.

---

## Puertos propuestos

Backend principal:

```text
8080 o el puerto actual del proyecto
```

Microservicio IA:

```text
8091
```

Config:

```env
AI_SERVICE_PORT=8091
```

Endpoint health:

```text
GET http://localhost:8091/api/ia/health
```

Endpoint recomendación:

```text
POST http://localhost:8091/api/ia/recojos/recomendar
```

---

# 1. Revisión del estado actual

Antes de tocar código, verificar que el planteamiento IA actual ya compile.

Backend principal:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
.\mvnw.cmd clean compile
```

Frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Buscar implementación actual IA:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"

Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "Gemini|Recommendation|aiScore|baseScore|GEMINI_API_KEY|GEMINI_MODEL|recommendationSource|PickupRecommendation" -Context 6,6
```

Identificar:

```text
1. Servicio actual que llama a Gemini.
2. Servicio actual que calcula score base.
3. DTO actual usado para devolver aiRecommended, aiRank, aiScore, aiReason, aiTags.
4. Método actual que enriquece la lista de recojos disponibles.
```

---

# 2. Crear proyecto nuevo EcoTacnaAIRecommendationService

Crear proyecto Spring Boot separado.

Nombre:

```text
EcoTacnaAIRecommendationService
```

Paquete sugerido:

```text
com.ecotacna.ai
```

Dependencias mínimas:

```text
spring-boot-starter-web
spring-boot-starter-validation
jackson
lombok si el proyecto ya lo usa
spring-boot-starter-actuator opcional
```

No agregar JPA en esta primera versión.

No agregar conexión a base de datos.

No agregar Spring Security todavía.

Motivo:

```text
El microservicio será interno/local y recibirá datos desde el backend principal.
La seguridad puede agregarse después con API token interno.
```

---

# 3. Variables del microservicio IA

Crear `.env.example` en `EcoTacnaAIRecommendationService`:

```env
SERVER_PORT=8091
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_ENABLED=false
GEMINI_TIMEOUT_SECONDS=5
INTERNAL_AI_SERVICE_TOKEN=
```

Crear `.env` local real, no versionable:

```env
SERVER_PORT=8091
GEMINI_API_KEY=TU_API_KEY_REAL
GEMINI_MODEL=gemini-2.5-flash
GEMINI_ENABLED=true
GEMINI_TIMEOUT_SECONDS=5
INTERNAL_AI_SERVICE_TOKEN=CAMBIAR_TOKEN_INTERNO
```

Reglas:

```text
No subir .env real.
No pegar API key en código.
No poner VITE_GEMINI_API_KEY.
No exponer Gemini en frontend.
```

---

# 4. Endpoint health del microservicio

Crear:

```text
GET /api/ia/health
```

Respuesta:

```json
{
  "status": "UP",
  "service": "EcoTacnaAIRecommendationService",
  "geminiEnabled": true
}
```

Debe servir para verificar que el microservicio levantó.

---

# 5. Contrato de entrada del microservicio

Crear DTO:

```text
AiRecojoRecommendationRequest
```

Campos:

```java
private CollectorContext collector;
private List<RecojoCandidateRequest> requests;
```

DTO `CollectorContext`:

```java
private Long collectorCompanyId;
private BigDecimal collectorLatitude;
private BigDecimal collectorLongitude;
private BigDecimal capacityLiters;
private String activeUnitPlate;
```

DTO `RecojoCandidateRequest`:

```java
private Long pickupRequestId;
private String restaurantName;
private BigDecimal estimatedLiters;
private BigDecimal distanceKm;
private BigDecimal pricePerLiter;
private BigDecimal estimatedRevenue;
private Long remainingMinutes;
private Boolean exceedsCapacity;
private BigDecimal capacityUsagePercent;
private Boolean hasValidCoordinates;
private BigDecimal baseScore;
```

No enviar:

```text
correo
token
RUC
teléfono
contraseña
datos personales
JWT
```

---

# 6. Contrato de respuesta del microservicio

Crear DTO:

```text
AiRecojoRecommendationResponse
```

Campos:

```java
private Long bestOptionId;
private String source;
private List<Long> orderedRequestIds;
private List<AiRecojoRecommendationItem> recommendations;
private String fallbackReason;
```

DTO `AiRecojoRecommendationItem`:

```java
private Long pickupRequestId;
private Integer aiRank;
private BigDecimal aiScore;
private Boolean aiRecommended;
private String label;
private String reason;
private List<String> tags;
```

Valores de `source`:

```text
GEMINI
BASE_SCORE
OFF
FALLBACK
```

---

# 7. Servicio score base dentro del microservicio

Crear:

```text
RecojoBaseScoringService
```

Responsabilidad:

```text
Ordenar candidatos sin Gemini.
Evitar recomendar solicitudes fuera de capacidad.
Calcular o normalizar score base si viene vacío.
```

Regla:

```text
Si exceedsCapacity = true:
- No debe ser bestOptionId.
- Debe quedar al final.
- aiRecommended = false.
```

Criterio base:

```text
capacidadScore 30%
distanciaScore 30%
ingresoScore 25%
urgenciaScore 10%
coordenadasScore 5%
```

Este score permite que el microservicio funcione aunque Gemini esté apagado.

---

# 8. Cliente Gemini dentro del microservicio

Crear:

```text
GeminiAiClient
```

Responsabilidad:

```text
Llamar a Gemini API usando GEMINI_API_KEY.
Pedir respuesta estrictamente JSON.
Aplicar timeout.
Manejar errores sin romper.
```

Reglas:

```text
No loguear API key.
No enviar datos sensibles.
No permitir que Gemini recomiende pedidos fuera de capacidad.
No aceptar texto libre como respuesta final.
```

Si Gemini falla:

```text
Devolver ranking BASE_SCORE.
```

---

# 9. Prompt interno para Gemini

Usar un prompt estricto:

```text
Eres un asistente de logística para EcoTacna.
Debes ordenar solicitudes de recojo para un recolector.
Usa únicamente los datos proporcionados.
No inventes información.
No recomiendes solicitudes fuera de capacidad.
Devuelve JSON válido.
El campo bestOptionId debe pertenecer a una solicitud con exceedsCapacity=false.
```

Formato de salida exigido:

```json
{
  "bestOptionId": 40,
  "orderedRequestIds": [40, 41, 42],
  "recommendations": [
    {
      "pickupRequestId": 40,
      "aiRank": 1,
      "aiScore": 92,
      "aiRecommended": true,
      "label": "Mejor opción",
      "reason": "Está cerca, es compatible con la capacidad de la unidad y ofrece buen ingreso estimado.",
      "tags": ["Cercano", "Compatible", "Buen costo-beneficio"]
    }
  ]
}
```

---

# 10. Validación de respuesta Gemini

Crear validación post-Gemini:

```text
1. bestOptionId existe en request original.
2. bestOptionId no está fuera de capacidad.
3. orderedRequestIds no contiene IDs desconocidos.
4. aiScore está entre 0 y 100.
5. tags máximo 3.
6. reason no supera longitud razonable.
```

Si falla validación:

```text
Descartar respuesta Gemini.
Usar BASE_SCORE.
```

---

# 11. Controller del microservicio IA

Crear:

```text
AiRecojoRecommendationController
```

Endpoints:

```text
GET /api/ia/health
POST /api/ia/recojos/recomendar
```

El POST debe:

```text
1. Validar request.
2. Aplicar score base.
3. Si GEMINI_ENABLED=true, intentar Gemini.
4. Si Gemini falla, fallback base.
5. Devolver response limpia.
```

---

# 12. Seguridad interna simple

Agregar header opcional:

```text
X-EcoTacna-Internal-Token
```

El microservicio debe validar contra:

```env
INTERNAL_AI_SERVICE_TOKEN=...
```

En primera etapa, si no se quiere bloquear por token, dejarlo configurable:

```env
INTERNAL_TOKEN_REQUIRED=false
```

Recomendación:

```text
Activar token interno cuando ya compile y funcione.
```

No usar JWT de usuario para este microservicio en la primera etapa.

---

# 13. Configurar backend principal para llamar al microservicio

En `EcoTacnaSpringBootJPA/.env.example` agregar:

```env
AI_RECOMMENDATION_MODE=INTERNAL
AI_RECOMMENDATION_SERVICE_URL=http://localhost:8091
AI_RECOMMENDATION_SERVICE_TOKEN=
AI_RECOMMENDATION_TIMEOUT_SECONDS=3
```

En `.env` local:

```env
AI_RECOMMENDATION_MODE=MICROSERVICE
AI_RECOMMENDATION_SERVICE_URL=http://localhost:8091
AI_RECOMMENDATION_SERVICE_TOKEN=CAMBIAR_TOKEN_INTERNO
AI_RECOMMENDATION_TIMEOUT_SECONDS=3
```

---

# 14. Backend principal: crear cliente HTTP hacia microservicio

Crear en backend principal:

```text
AiRecommendationMicroserviceClient
```

Responsabilidad:

```text
Enviar candidatos al microservicio.
Recibir ranking IA.
Manejar timeout/error.
Devolver Optional o fallback controlado.
```

No lanzar excepción hacia frontend si falla el microservicio.

Si falla:

```text
Usar implementación INTERNAL o BASE_SCORE.
```

---

# 15. Backend principal: mantener contrato actual con frontend

No cambiar frontend todavía.

El backend principal debe seguir devolviendo los mismos campos:

```text
aiRecommended
aiRank
aiScore
aiReason
aiTags
recommendationSource
```

Esto permite que React no se entere si la recomendación vino de:

```text
INTERNAL
MICROSERVICE
BASE_SCORE
```

El frontend solo pinta.

---

# 16. Backend principal: modo de ejecución

Crear lógica:

```text
if AI_RECOMMENDATION_MODE = MICROSERVICE:
    intentar microservicio
    si falla → internal/base score

if AI_RECOMMENDATION_MODE = INTERNAL:
    usar implementación actual

if AI_RECOMMENDATION_MODE = OFF:
    no llamar IA
    usar score base o listado normal
```

Esto evita romper lo ya implementado.

---

# 17. No duplicar Gemini innecesariamente

Cuando el modo sea `MICROSERVICE`, el backend principal no debe llamar a Gemini directamente.

La API key de Gemini debe moverse idealmente al microservicio.

Backend principal puede conservar fallback interno sin Gemini o con score base.

Recomendación:

```text
Gemini solo en EcoTacnaAIRecommendationService.
EcoTacnaSpringBootJPA solo calcula métricas y consume respuesta.
```

---

# 18. Frontend

No tocar frontend salvo que sea estrictamente necesario.

Si ya muestra:

```text
Recomendado por IA
aiReason
aiTags
aiRank
```

entonces no modificarlo.

La separación a microservicio debe ser transparente para React.

---

# 19. Orden de implementación seguro

## Fase A — Crear microservicio aislado

1. Crear `EcoTacnaAIRecommendationService`.
2. Crear DTOs.
3. Crear score base.
4. Crear endpoint health.
5. Crear endpoint recomendar.
6. Probar con Postman sin Gemini.
7. Probar con Postman con Gemini.

No tocar backend principal todavía.

---

## Fase B — Conectar backend principal en modo opcional

1. Agregar variables `AI_RECOMMENDATION_MODE`.
2. Crear cliente HTTP.
3. Mapear métricas existentes al request del microservicio.
4. Procesar response.
5. Mantener fallback.
6. Probar con modo `INTERNAL`.
7. Probar con modo `MICROSERVICE`.
8. Probar con microservicio apagado.

---

## Fase C — Validación frontend

1. Levantar backend principal.
2. Levantar microservicio IA.
3. Levantar frontend.
4. Ingresar como recolector.
5. Revisar `/recolector/recojos-dia`.
6. Confirmar que visualmente no se rompió nada.
7. Confirmar que aparece recomendación morada igual que antes.

---

# 20. Pruebas con Postman del microservicio

## Health

```text
GET http://localhost:8091/api/ia/health
```

Respuesta esperada:

```json
{
  "status": "UP",
  "service": "EcoTacnaAIRecommendationService",
  "geminiEnabled": true
}
```

## Recomendar

```text
POST http://localhost:8091/api/ia/recojos/recomendar
Content-Type: application/json
X-EcoTacna-Internal-Token: CAMBIAR_TOKEN_INTERNO
```

Body:

```json
{
  "collector": {
    "collectorCompanyId": 22,
    "collectorLatitude": -18.011,
    "collectorLongitude": -70.253,
    "capacityLiters": 250,
    "activeUnitPlate": "Z9A-123"
  },
  "requests": [
    {
      "pickupRequestId": 40,
      "restaurantName": "Restaurante A",
      "estimatedLiters": 90,
      "distanceKm": 1.8,
      "pricePerLiter": 2.8,
      "estimatedRevenue": 252,
      "remainingMinutes": 10000,
      "exceedsCapacity": false,
      "capacityUsagePercent": 36,
      "hasValidCoordinates": true,
      "baseScore": 84.5
    },
    {
      "pickupRequestId": 41,
      "restaurantName": "Restaurante B",
      "estimatedLiters": 300,
      "distanceKm": 0.9,
      "pricePerLiter": 2.8,
      "estimatedRevenue": 840,
      "remainingMinutes": 10000,
      "exceedsCapacity": true,
      "capacityUsagePercent": 120,
      "hasValidCoordinates": true,
      "baseScore": 0
    }
  ]
}
```

Validar:

```text
La solicitud 41 no puede salir como bestOptionId porque excede capacidad.
```

---

# 21. Pruebas de backend principal

## Modo INTERNAL

```env
AI_RECOMMENDATION_MODE=INTERNAL
```

Resultado:

```text
Debe funcionar igual que antes.
```

## Modo MICROSERVICE con servicio levantado

```env
AI_RECOMMENDATION_MODE=MICROSERVICE
AI_RECOMMENDATION_SERVICE_URL=http://localhost:8091
```

Resultado:

```text
Debe llamar al microservicio.
Debe ordenar pedidos.
Debe devolver recommendationSource=GEMINI o BASE_SCORE/FALLBACK.
```

## Modo MICROSERVICE con servicio apagado

Apagar microservicio.

Resultado:

```text
Backend principal no debe caer.
Frontend no debe mostrar error.
Recojos disponibles deben seguir cargando.
Debe usar fallback.
```

## Modo OFF

```env
AI_RECOMMENDATION_MODE=OFF
```

Resultado:

```text
No debe llamar microservicio.
No debe llamar Gemini.
Debe mantener listado funcional.
```

---

# 22. Pruebas de no ruptura

Validar que siguen funcionando:

```text
Login recolector
Dashboard recolector
Recojos disponibles
Evaluar recojo
Aceptar recojo
Capacidad de unidad
Mapa operativo
Panel empresa/restaurante
Solicitud de recojo
Historial
Incidencias
Admin empresas
Pagos simulados/actuales
```

---

# 23. Comandos de ejecución

## Microservicio IA

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaAIRecommendationService"
.\mvnw.cmd spring-boot:run
```

Debe levantar en:

```text
http://localhost:8091
```

## Backend principal

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
.\mvnw.cmd spring-boot:run
```

## Frontend

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run dev
```

---

# 24. Builds obligatorios

Microservicio IA:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaAIRecommendationService"
.\mvnw.cmd clean compile
```

Backend principal:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
.\mvnw.cmd clean compile
```

Frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

---

# 25. Búsqueda de claves expuestas

Desde raíz:

```powershell
Get-ChildItem . -Recurse -File |
  Select-String -Pattern "GEMINI_API_KEY|AIza|INTERNAL_AI_SERVICE_TOKEN" -ErrorAction SilentlyContinue
```

Validar:

```text
No debe aparecer API key real en archivos versionables.
.env real debe estar ignorado.
.env.example no debe contener clave real.
```

---

# 26. Reporte final obligatorio

```text
CIERRE MICROSERVICIO IA ECOTACNA

1. Ruta frontend:
2. Ruta backend principal:
3. Ruta microservicio IA:
4. Puerto backend principal:
5. Puerto microservicio IA:
6. Endpoint health probado:
7. Endpoint recomendar probado:
8. Variables agregadas al backend principal:
9. Variables agregadas al microservicio:
10. ¿Frontend fue modificado? Sí/No
11. ¿Backend principal conserva fallback INTERNAL? Sí/No
12. ¿Modo MICROSERVICE funciona? Sí/No
13. ¿Modo INTERNAL funciona? Sí/No
14. ¿Modo OFF funciona? Sí/No
15. ¿Microservicio apagado rompe recojos? Sí/No
16. ¿Gemini API key está solo en microservicio/backend y no en React? Sí/No
17. ¿Pedidos fuera de capacidad nunca son recomendados? Sí/No
18. ¿Panel recolector muestra recomendación morada igual que antes? Sí/No
19. ¿Empresa/restaurante/admin siguen funcionando? Sí/No
20. ¿Microservicio IA compile OK? Sí/No
21. ¿Backend principal compile OK? Sí/No
22. ¿Frontend build OK? Sí/No
23. Archivos creados:
24. Archivos modificados:
25. Observaciones:
```

No cerrar hasta probar:

```text
1. Microservicio IA encendido.
2. Microservicio IA apagado.
3. Gemini habilitado.
4. Gemini deshabilitado.
5. Pedido dentro de capacidad.
6. Pedido fuera de capacidad.
```
