# PLAN ECO TACNA — RECOMENDACIÓN IA PARA ORDENAR PEDIDOS DISPONIBLES DEL RECOLECTOR CON GEMINI

## Objetivo

Integrar una recomendación con IA en el módulo de **recolectores**, específicamente en la visualización de pedidos disponibles, para ordenar las solicitudes según lo que más le convenga al recolector.

La IA debe ayudar a priorizar pedidos tomando en cuenta:

```text
Distancia entre recolector y restaurante
Capacidad de la unidad vehicular
Litros solicitados
Compatibilidad con la unidad
Costo-beneficio aproximado
Tiempo restante de disponibilidad
Precio estimado o precio ofertado si existe
Ubicación GPS/coordenadas disponibles
```

Visualmente, el sistema debe mostrar una recomendación en color **morado**, acorde al diseño actual, indicando claramente que se está usando IA.

Ejemplo visual esperado:

```text
✨ Recomendado por IA
Mejor opción para tu unidad
Buena distancia · Compatible con tu capacidad · Mejor costo-beneficio
```

La integración aplica **solo para recolectores**.

No debe afectar:

```text
Panel empresa/restaurante
Panel administrador
Pagos
Culqi
ApiPeruDev
Google Maps actual
Solicitudes de recojo existentes
Incidencias
Historial
Login
```

---

## Decisión técnica correcta

No se debe dejar que Gemini calcule todo desde cero.

La arquitectura correcta será híbrida:

```text
Backend EcoTacna calcula datos objetivos.
Backend EcoTacna calcula score base determinístico.
Gemini recibe datos ya calculados y propone orden/recomendación.
Frontend muestra el resultado visualmente.
Si Gemini falla, se usa el score base y el sistema sigue funcionando.
```

Regla principal:

```text
Las reglas duras del negocio NO dependen de IA.
La IA solo recomienda, ordena y explica.
```

Ejemplo:

```text
Si un pedido supera la capacidad del recolector:
- No debe ser recomendado.
- No debe poder aceptarse.
- Gemini no puede sobreescribir esa regla.
```

---

## Rutas actuales

Frontend:

```text
C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend
```

Backend:

```text
C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA
```

---

## Variables de entorno requeridas

Agregar en backend `.env`:

```env
GEMINI_API_KEY=TU_API_KEY_REAL
GEMINI_MODEL=gemini-2.5-flash
GEMINI_RECOMMENDATIONS_ENABLED=true
```

Agregar en backend `.env.example` sin exponer clave real:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_RECOMMENDATIONS_ENABLED=false
```

Reglas:

```text
La API key de Gemini solo va en backend.
No usar VITE_GEMINI_API_KEY.
No exponer la key en React.
No subir .env real a GitHub.
```

---

## Reglas estrictas

- Aplicar solo a recolectores.
- No tocar módulos de empresa/restaurante.
- No tocar módulos admin.
- No tocar pagos.
- No tocar Culqi.
- No tocar ApiPeruDev.
- No tocar login/JWT salvo lectura de usuario autenticado.
- No tocar Google Maps actual salvo reutilizar coordenadas ya existentes.
- No tocar aceptación de pedido salvo respetar validación existente de capacidad.
- No tocar incidencias.
- No tocar historial.
- No romper `RecolectorRecojosDia`.
- No romper `RecolectorMapaOperativo`.
- No romper `RouteMapView`.
- No duplicar lógica de distancia si ya existe `DistanceUtils`.
- No crear mocks.
- No crear datos inventados.
- No crear archivos `old`, `copy`, `backup`, `legacy`, `v1`, `v2`.
- Si Gemini falla, el sistema debe seguir mostrando pedidos disponibles.
- La recomendación IA nunca debe ocultar pedidos válidos.
- La recomendación IA no debe cambiar estado de solicitudes.
- La recomendación IA no debe aceptar pedidos automáticamente.
- La recomendación IA no debe cancelar pedidos.
- La recomendación IA solo ordena, etiqueta y explica.

---

# 1. Diagnóstico de datos disponibles

## 1.1 Backend: revisar entidades y DTOs

Ejecutar:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"

Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "PickupRequest|PickupRequestResponse|DistanceUtils|latitude|longitude|pickupLatitude|pickupLongitude|collectorLatitude|collectorLongitude|TransportUnit|capacityLiters|precio|price|litros|estimatedLiters|distanceKm|getAvailableRequests" -Context 6,6
```

Identificar:

```text
1. Campo de litros solicitados.
2. Campo de precio ofertado o precio estimado.
3. Campo de coordenadas del recojo.
4. Campo de coordenadas de empresa/restaurante.
5. Campo de capacidad de unidad vehicular.
6. Método que devuelve recojos disponibles.
7. DTO que consume el frontend recolector.
```

Archivos probables:

```text
PickupRequestService.java
PickupRequestResponse.java
DistanceUtils.java
TransportUnit.java
TransportUnitRepository.java
CollectorPortalService.java
PickupRequestRepository.java
```

---

## 1.2 Frontend: revisar módulos recolector

Ejecutar:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "RecolectorRecojosDia|Recojos disponibles|Evaluar recojo|Aceptar recojo|distanceKm|pickupLatitude|pickupLongitude|capacidad|capacity|litros|recolectorApi" -Context 6,6
```

Archivos probables:

```text
src/pages/recolector/RecolectorRecojosDia.tsx
src/services/recolectorApi.ts
src/types.ts
src/components/maps/RouteMapView.tsx
```

Identificar:

```text
1. Dónde se lista la tarjeta de recojos disponibles.
2. Dónde se abre el preview/detalle.
3. Qué datos muestra actualmente.
4. Cómo se ordena actualmente la lista.
5. Cómo se maneja la capacidad de unidad.
```

---

# 2. Backend: crear DTO de métricas para recomendación

Crear DTO interno para enviar a Gemini y para devolver al frontend.

Nombre sugerido:

```text
PickupRecommendationMetrics.java
```

Campos sugeridos:

```java
private Long pickupRequestId;
private String restaurantName;
private BigDecimal estimatedLiters;
private BigDecimal collectorCapacityLiters;
private BigDecimal capacityUsagePercent;
private Boolean exceedsCapacity;
private BigDecimal distanceKm;
private BigDecimal estimatedRevenue;
private BigDecimal estimatedProfitabilityScore;
private Long remainingMinutes;
private Boolean hasValidCoordinates;
private String pickupAddress;
private BigDecimal baseScore;
```

Ajustar tipos reales.

Regla:

```text
Este DTO no cambia la base de datos.
Solo representa cálculo temporal para recomendación.
```

---

# 3. Backend: cálculo determinístico obligatorio

Crear servicio o método interno:

```text
PickupRecommendationScoringService
```

Responsabilidad:

```text
Calcular score base de cada pedido disponible antes de Gemini.
```

Fórmula sugerida:

```text
baseScore =
  capacidadScore * 0.30
+ cercaniaScore * 0.30
+ ingresoScore * 0.25
+ urgenciaScore * 0.10
+ coordenadasScore * 0.05
```

Donde:

```text
capacidadScore:
- 0 si excede capacidad.
- Mayor si usa bien la capacidad sin exceder.

cercaniaScore:
- Mayor si está más cerca.
- Usar distanceKm.

ingresoScore:
- Mayor si el ingreso estimado es mayor.
- estimatedRevenue = litros * precio estimado.

urgenciaScore:
- Mayor si queda menos tiempo, pero sin castigar demasiado.

coordenadasScore:
- Mayor si tiene coordenadas válidas.
```

Regla dura:

```text
Si exceedsCapacity = true:
baseScore debe ser muy bajo o 0.
No debe marcarse como mejor opción.
```

---

# 4. Backend: reutilizar DistanceUtils

Si ya existe:

```text
DistanceUtils.java
```

usar ese cálculo.

No crear otra fórmula Haversine duplicada.

Si `distanceKm` ya está en `PickupRequestResponse`, reutilizarlo.

Si aún no se calcula para disponibles, hacerlo en el servicio que arma la lista de recojos disponibles.

---

# 5. Backend: cálculo de precio/ingreso estimado

Usar lo que ya tenga el sistema.

Orden de prioridad:

```text
1. precioOfertadoPorLitro si existe.
2. precioPorLitro si existe.
3. rango referencial actual usado en UI, por ejemplo S/ 2.00 a S/ 3.00.
4. Valor promedio configurable, por ejemplo 2.50, si el proyecto ya usa ese rango.
```

No inventar precios si el proyecto tiene una fuente real.

Si no existe precio cerrado, usar:

```text
estimatedRevenue = estimatedLiters * estimatedPricePerLiterReference
```

y marcarlo como aproximado.

---

# 6. Backend: crear cliente Gemini

Crear servicio:

```text
GeminiRecommendationClient.java
```

Responsabilidad:

```text
Enviar a Gemini una lista de pedidos con métricas ya calculadas.
Recibir JSON con orden recomendado, mejor opción y explicación.
```

Leer variables:

```text
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_RECOMMENDATIONS_ENABLED
```

Si `GEMINI_RECOMMENDATIONS_ENABLED=false` o falta API key:

```text
No llamar a Gemini.
Usar ranking base.
```

No romper la app si falta key.

---

# 7. Backend: prompt para Gemini

El prompt debe ser estricto y pedir JSON.

Ejemplo conceptual:

```text
Eres un asistente de logística para EcoTacna.
Debes ordenar solicitudes de recojo para un recolector.
Usa solo los datos proporcionados.
No inventes datos.
No recomiendes pedidos fuera de capacidad.
Devuelve JSON válido.
```

Entrada resumida:

```json
{
  "collector": {
    "companyId": 12,
    "capacityLiters": 250,
    "currentLatitude": -18.01,
    "currentLongitude": -70.25
  },
  "requests": [
    {
      "pickupRequestId": 40,
      "distanceKm": 1.8,
      "estimatedLiters": 90,
      "capacityUsagePercent": 36,
      "estimatedRevenue": 252.0,
      "remainingMinutes": 10000,
      "exceedsCapacity": false,
      "baseScore": 84.5
    }
  ]
}
```

Salida esperada:

```json
{
  "bestOptionId": 40,
  "orderedRequestIds": [40, 41, 42],
  "recommendations": [
    {
      "pickupRequestId": 40,
      "aiScore": 92,
      "label": "Mejor opción",
      "reason": "Está cerca, aprovecha bien la capacidad de la unidad y ofrece buen ingreso estimado.",
      "tags": ["Cercano", "Buen costo-beneficio", "Compatible"]
    }
  ]
}
```

---

# 8. Backend: parsing seguro de JSON

No confiar en texto libre.

Crear DTOs:

```text
AiPickupRecommendationResponse
AiPickupRecommendationItem
```

Validar:

```text
1. bestOptionId existe en la lista original.
2. orderedRequestIds solo contiene IDs originales.
3. aiScore entre 0 y 100.
4. reason no vacío.
5. tags máximo 3 o 4.
```

Si Gemini responde mal:

```text
Usar ranking base.
Loguear warning.
No lanzar error al frontend.
```

---

# 9. Backend: endpoint recomendado

Opción recomendada: modificar o enriquecer el endpoint actual de recojos disponibles.

Si actualmente existe:

```text
GET /api/recolector/solicitudes
GET /api/recolector/solicitudes-disponibles
GET /api/recolector/recojos-dia
```

No crear endpoint paralelo si no hace falta.

Agregar campos al DTO `PickupRequestResponse`:

```java
private Boolean aiRecommended;
private Integer aiRank;
private BigDecimal aiScore;
private String aiReason;
private List<String> aiTags;
private String recommendationSource;
```

Valores:

```text
aiRecommended = true solo para la mejor opción.
aiRank = 1, 2, 3...
aiScore = score final.
aiReason = explicación corta.
aiTags = etiquetas.
recommendationSource = "GEMINI" o "BASE_SCORE".
```

Si se prefiere endpoint separado:

```text
GET /api/recolector/solicitudes/recomendadas
```

Pero evitar duplicar lógica.

---

# 10. Backend: fallback sin Gemini

Si falla Gemini:

```text
Ordenar por baseScore descendente.
Marcar la primera opción como recomendada.
recommendationSource = BASE_SCORE.
aiReason = "Recomendación calculada con datos de distancia, capacidad e ingreso estimado."
```

La UI puede seguir diciendo:

```text
Recomendación inteligente
```

Pero si se quiere ser honesto:

```text
Optimizado por EcoTacna
```

Si se muestra explícitamente “IA”, solo cuando `recommendationSource = GEMINI`.

---

# 11. Backend: timeout y tolerancia

La llamada a Gemini debe tener timeout corto.

Recomendado:

```text
2 a 5 segundos máximo.
```

Si Gemini demora:

```text
Usar ranking base.
No congelar panel recolector.
```

No hacer que los recojos disponibles dependan 100% de la IA.

---

# 12. Backend: no enviar datos sensibles

Enviar a Gemini solo datos operativos necesarios.

Permitido:

```text
ID de solicitud
distancia
litros
capacidad
precio estimado
tiempo restante
coordenadas aproximadas si son necesarias
```

Evitar enviar:

```text
correos
teléfonos
RUC
datos personales
tokens
direcciones completas si no son necesarias
```

Para recomendación, bastan métricas calculadas.

---

# 13. Frontend: tipos

Actualizar `src/types.ts` o tipos equivalentes:

```ts
aiRecommended?: boolean;
aiRank?: number;
aiScore?: number;
aiReason?: string;
aiTags?: string[];
recommendationSource?: 'GEMINI' | 'BASE_SCORE' | 'NONE';
exceedsCollectorCapacity?: boolean;
capacityMessage?: string;
```

No romper consumidores existentes.

Campos opcionales para compatibilidad.

---

# 14. Frontend: ordenar visualmente

En `RecolectorRecojosDia.tsx`, usar el orden que ya viene del backend.

No reordenar otra vez en frontend salvo fallback.

Regla:

```text
Backend devuelve la lista ya ordenada.
Frontend solo renderiza.
```

---

# 15. Frontend: tarjeta morada de recomendación IA

En la primera tarjeta recomendada, mostrar bloque morado:

```text
✨ Recomendado por IA
Mejor opción para tu unidad
[aiReason]
```

Diseño sugerido:

```text
Fondo morado muy suave
Borde morado
Texto morado oscuro
Badge morado: IA
```

No cambiar todo el diseño verde del sistema. Solo agregar acento morado.

Clases Tailwind aproximadas si aplica:

```text
bg-purple-50
border-purple-200
text-purple-700
bg-purple-100
```

---

# 16. Frontend: badges/tags

Mostrar máximo 3 etiquetas:

```text
Cercano
Buen costo-beneficio
Compatible
```

No saturar la tarjeta.

---

# 17. Frontend: indicar origen de recomendación

Si `recommendationSource = GEMINI`:

```text
Recomendado por IA
```

Si `recommendationSource = BASE_SCORE`:

```text
Mejor opción calculada
```

Recomendación honesta:

```text
GEMINI → “Recomendado por IA”
BASE_SCORE → “Mejor opción calculada”
```

---

# 18. Frontend: estado sin pedidos

Si no hay pedidos disponibles, mantener el estado actual:

```text
No hay recojos disponibles actualmente.
```

No mostrar bloque IA vacío.

---

# 19. Frontend: fuera de capacidad

Si un pedido supera capacidad:

```text
No recomendar.
Mostrar badge:
Fuera de capacidad
```

No permitir aceptar.

Este flujo ya fue trabajado antes; solo respetarlo.

---

# 20. Frontend: preview/detalle

Cuando el recolector abre un pedido recomendado, mostrar también el bloque morado en el preview:

```text
✨ Recomendación IA
Esta solicitud es conveniente por distancia, capacidad e ingreso estimado.
```

No repetir demasiado texto.

---

# 21. UX esperada

Lista de recojos disponibles:

```text
[Tarjeta 1]
✨ Recomendado por IA
Mejor opción para tu unidad
PERU AMBIENTAL S.A.C.
250 L aprox.
1.8 km
S/ estimado
Tags: Cercano · Compatible · Buen ingreso
Botón: Evaluar recojo

[Tarjeta 2]
Ranking #2
...

[Tarjeta fuera de capacidad]
Fuera de capacidad
No puedes aceptar este pedido con tu unidad actual.
```

---

# 22. No modificar aceptación

La recomendación no debe aceptar automáticamente.

El recolector conserva decisión manual:

```text
Evaluar recojo
Aceptar recojo
```

La IA solo recomienda.

---

# 23. Logs backend

Agregar logs controlados:

```text
Gemini recommendation enabled
Gemini recommendation fallback used
Gemini recommendation failed: [motivo resumido]
```

No loguear API key.

---

# 24. Manejo de cuota/error Gemini

Si Gemini devuelve:

```text
401 / 403 / API key inválida
429 / cuota
500 / error temporal
timeout
JSON inválido
```

Entonces:

```text
Usar ranking base.
No mostrar error al usuario final.
No bloquear pedidos.
```

En consola backend loguear warning.

---

# 25. Prueba manual con Gemini activo

1. Configurar backend `.env`:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_RECOMMENDATIONS_ENABLED=true
```

2. Levantar backend.
3. Crear 3 solicitudes con coordenadas y litros distintos.
4. Entrar como recolector con unidad activa.
5. Ir a:

```text
/recolector/recojos-dia
```

6. Confirmar:

```text
La mejor opción aparece primero.
Tiene bloque morado “Recomendado por IA”.
Tiene explicación corta.
Tiene tags.
```

---

# 26. Prueba manual con Gemini apagado

Configurar:

```env
GEMINI_RECOMMENDATIONS_ENABLED=false
```

Resultado esperado:

```text
La lista sigue cargando.
Se ordena por score base.
No aparece error.
Puede aparecer “Mejor opción calculada” si se decide mostrar fallback.
```

---

# 27. Prueba manual sin API key

Quitar API key.

Resultado esperado:

```text
Backend no cae.
Frontend no cae.
Lista de pedidos sigue disponible.
No se muestra error visual al recolector.
```

---

# 28. SQL de apoyo

Ver solicitudes pendientes:

```sql
SELECT
    id,
    company_id,
    estimated_liters,
    pickup_latitude,
    pickup_longitude,
    status,
    created_at
FROM pickup_requests
WHERE status = 'PENDIENTE'
ORDER BY created_at DESC;
```

Ver unidad del recolector:

```sql
SELECT
    tu.id,
    tu.company_id,
    tu.plate,
    tu.capacity_liters,
    tu.active
FROM transport_units tu
WHERE tu.company_id = [COLLECTOR_COMPANY_ID];
```

Ajustar nombres reales.

---

# 29. Seguridad de API key

Verificar:

```text
GEMINI_API_KEY no aparece en frontend.
GEMINI_API_KEY no aparece en dist.
GEMINI_API_KEY no aparece en consola.
GEMINI_API_KEY no aparece en Network.
GEMINI_API_KEY no aparece en Git.
```

Buscar:

```powershell
Get-ChildItem . -Recurse -File |
  Select-String -Pattern "GEMINI_API_KEY|AIza" -ErrorAction SilentlyContinue
```

No debe aparecer clave real en archivos versionables.

---

# 30. Limpieza de residuos

Frontend:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "aiRecommended|recommendationSource|Recomendado por IA|Gemini|purple|morado|aiScore" -Context 4,4
```

Backend:

```powershell
Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "Gemini|Recommendation|aiScore|baseScore|GEMINI_API_KEY|GEMINI_MODEL|recommendationSource" -Context 4,4
```

Confirmar:

```text
No hay código duplicado innecesario.
No hay API key hardcodeada.
No hay mocks.
```

---

# 31. Builds obligatorios

Backend:

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

# 32. Reporte final obligatorio

```text
CIERRE IA RECOMENDACION RECOJOS RECOLECTOR

1. Ruta frontend actual:
2. Ruta backend actual:
3. Variables agregadas en backend:
4. Archivos backend modificados:
5. Archivos frontend modificados:
6. Servicio Gemini creado:
7. Servicio score base creado:
8. ¿DistanceUtils fue reutilizado? Sí/No
9. ¿La API key queda solo en backend? Sí/No
10. ¿Recojos disponibles se ordenan por recomendación? Sí/No
11. ¿La mejor opción aparece primero? Sí/No
12. ¿Se muestra bloque morado “Recomendado por IA”? Sí/No
13. ¿Se muestran tags/razón de recomendación? Sí/No
14. ¿Pedidos fuera de capacidad quedan excluidos de recomendación? Sí/No
15. ¿Gemini falla y el sistema usa fallback? Sí/No
16. ¿Gemini apagado mantiene lista funcionando? Sí/No
17. ¿No se tocó empresa/admin/pagos/mapas? Sí/No
18. ¿mvnw clean compile pasa? Sí/No
19. ¿npm run build pasa? Sí/No
20. Observaciones:
```

No cerrar hasta probar con Gemini activo, Gemini apagado y Gemini sin API key.
