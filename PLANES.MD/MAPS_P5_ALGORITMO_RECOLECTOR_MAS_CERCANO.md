# MAPS_P5 — ALGORITMO CONTROLADO DE RECOLECTOR MÁS CERCANO

## Proyecto

EcoTacna

## Estado previo confirmado

Ya se cerraron las fases anteriores del plan operativo de Google Maps:

- **MAPS_P1:** En “Mi empresa” se muestran las sedes registradas y los marcadores aparecen en Google Maps.
- **MAPS_P2:** El registro principal tiene buscador híbrido Google Places + pin manual obligatorio.
- **MAPS_P3:** El modal “Agregar sede adicional” tiene buscador híbrido Google Places + pin manual.
- **MAPS_P4:** En “Solicitar recojo” la empresa puede seleccionar una sede registrada. El formulario envía `pickupLatitude` y `pickupLongitude` sin modificar el backend.

## Objetivo de MAPS_P5

Implementar un algoritmo controlado para identificar el recolector más cercano a una solicitud de recojo usando las coordenadas reales del punto de recojo.

La implementación debe ser segura, gradual y sin romper el flujo actual de aceptación de solicitudes.

## Decisión funcional

En esta fase **NO se debe asignar automáticamente** una solicitud a un recolector.

La lógica inicial será de **recomendación / ordenamiento por cercanía**, no de asignación automática obligatoria.

Flujo esperado:

```text
Empresa selecciona sede → se crea solicitud con pickupLatitude/pickupLongitude
Backend calcula distancia contra recolectores con coordenadas válidas
Sistema muestra o usa ranking de recolectores cercanos
Recolector sigue aceptando manualmente según flujo actual
```

## Por qué no asignar automáticamente todavía

No se debe hacer autoasignación en esta etapa porque todavía pueden faltar variables operativas:

- disponibilidad real del recolector;
- capacidad de unidad;
- horario de atención;
- zonas de cobertura;
- recolector activo en campo;
- confirmación humana;
- tracking GPS real.

Por ahora, la cercanía debe servir para:

- ordenar solicitudes disponibles;
- sugerir recolector cercano;
- mostrar distancia estimada;
- preparar una futura asignación automática.

---

# 1. Alcance de esta fase

## 1.1. Incluido

Implementar:

- cálculo de distancia entre punto de recojo y recolectores;
- validación de coordenadas;
- ranking de recolectores cercanos;
- visualización de distancia estimada;
- ordenamiento de solicitudes por cercanía cuando aplique;
- soporte frontend para mostrar “Recolector sugerido” o “Distancia aproximada”.

## 1.2. No incluido

No implementar todavía:

- asignación automática definitiva;
- rutas con Google Directions;
- navegación GPS;
- tracking en tiempo real;
- cambios en pagos;
- cambios en login;
- cambios en ApiPeruDev;
- certificados ambientales;
- trazabilidad QR;
- selección obligatoria de recolector desde empresa;
- lógica de despacho avanzada.

---

# 2. Reglas estrictas

- No tocar login.
- No tocar pagos.
- No tocar ApiPeruDev.
- No tocar SecurityConfig.
- No tocar BCrypt.
- No tocar captcha.
- No cambiar el flujo certificado de registro.
- No eliminar el flujo manual de aceptación de solicitudes.
- No hardcodear coordenadas.
- No inventar ubicaciones.
- No exponer API keys.
- No crear archivos `backup`, `old`, `copy`, `legacy`, `v1`, `v2`.
- No duplicar carpetas.
- No hacer autoasignación sin autorización expresa.

---

# 3. Fuente de coordenadas

## 3.1. Coordenada del punto de recojo

La solicitud debe usar:

- `pickupLatitude`
- `pickupLongitude`

Estas coordenadas vienen de MAPS_P4 cuando la empresa selecciona sede o marca manualmente el punto.

## 3.2. Coordenada del recolector

Usar esta prioridad:

1. `TransportUnit.lastLatitude` y `TransportUnit.lastLongitude`, si existen y son válidas.
2. Coordenadas de la empresa recolectora (`Company.latitude`, `Company.longitude`), si existen y son válidas.
3. Si no hay coordenadas válidas, el recolector queda como “sin ubicación operativa” y no entra al ranking.

## 3.3. Importante

No presentar estas coordenadas como GPS en tiempo real si no lo son.

Usar textos como:

- “Distancia aproximada”.
- “Ubicación operativa registrada”.
- “Recolector cercano sugerido”.

No usar:

- “Tracking en vivo”.
- “GPS en tiempo real”.
- “Ruta exacta”.

---

# 4. Diagnóstico obligatorio antes de modificar

## 4.1. Revisar columnas disponibles

En backend revisar entidades:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
Get-ChildItem .\src\main\java -Recurse -Include *.java | Select-String -Pattern "pickupLatitude|pickupLongitude|lastLatitude|lastLongitude|latitude|longitude|TransportUnit|Company" | Select-Object Path,LineNumber,Line
```

Confirmar:

- `PickupRequest` tiene `pickupLatitude` y `pickupLongitude`.
- `TransportUnit` tiene `lastLatitude` y `lastLongitude`.
- `Company` tiene `latitude` y `longitude`.

## 4.2. Revisar flujo de solicitudes disponibles para recolector

Buscar endpoints o servicios relacionados con:

```powershell
Get-ChildItem .\src\main\java -Recurse -Include *.java | Select-String -Pattern "solicitudes|solicitudes disponibles|PickupRequest|Recolector|recolector/dashboard|recolector/solicitudes|findAvailable" | Select-Object Path,LineNumber,Line
```

Identificar dónde se cargan las solicitudes disponibles para recolectores.

## 4.3. Revisar frontend recolector

En frontend revisar:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
Get-ChildItem .\src\pages\recolector -Recurse -Include *.tsx,*.ts | Select-String -Pattern "solicitudes|mapa|distancia|pickupLatitude|pickupLongitude|RecolectorSolicitudes|RecolectorMapaOperativo" | Select-Object Path,LineNumber,Line
```

Pantallas probables:

- `src/pages/recolector/RecolectorSolicitudes.tsx`
- `src/pages/recolector/RecolectorMapaOperativo.tsx`
- `src/pages/recolector/RecolectorRecojosDia.tsx`

---

# 5. Backend recomendado

## 5.1. Crear utilidad de distancia Haversine

Crear clase utilitaria, por ejemplo:

`src/main/java/.../util/DistanceUtils.java`

Función:

```java
public static double distanceKm(BigDecimal lat1, BigDecimal lon1, BigDecimal lat2, BigDecimal lon2)
```

Usar fórmula Haversine.

Reglas:

- Si alguna coordenada es nula, no calcular.
- Validar rango de latitud y longitud antes de calcular.
- Retornar distancia en kilómetros.
- Redondear visualmente en frontend, no necesariamente en backend.

## 5.2. Crear DTO de distancia

Crear DTO sugerido:

`CollectorDistanceResponse.java`

Campos recomendados:

```java
private Long collectorCompanyId;
private String collectorName;
private Long transportUnitId;
private String plateNumber;
private BigDecimal latitude;
private BigDecimal longitude;
private Double distanceKm;
private String coordinateSource;
```

`coordinateSource` puede ser:

- `TRANSPORT_UNIT_LAST_LOCATION`
- `COLLECTOR_COMPANY_LOCATION`

## 5.3. Crear servicio de ranking

Crear o ampliar servicio:

`CollectorDistanceService.java`

Método sugerido:

```java
List<CollectorDistanceResponse> findNearestCollectors(BigDecimal pickupLatitude, BigDecimal pickupLongitude, int limit)
```

Reglas:

- Filtrar solo empresas recolectoras.
- Filtrar usuarios/recolectores habilitados.
- Filtrar empresas con suscripción activa si aplica.
- Priorizar unidades activas con coordenadas válidas.
- Si una unidad no tiene coordenadas, usar coordenada de la empresa recolectora si existe.
- Ordenar por `distanceKm` ascendente.
- Limitar resultados a 3 o 5.

## 5.4. No modificar aceptación de solicitud todavía

No cambiar:

- aceptar solicitud;
- rechazar solicitud;
- confirmar pago;
- completar recojo;
- liberar recolector.

La recomendación por cercanía debe ser informativa o de ordenamiento.

---

# 6. Endpoints recomendados

## 6.1. Opción A — Endpoint de sugerencia por solicitud

Crear endpoint:

```text
GET /api/empresa/solicitudes/{id}/recolectores-cercanos
```

Respuesta:

```json
[
  {
    "collectorCompanyId": 22,
    "collectorName": "DISTRIBUCIONES Y SERVICIOS NOVA TACNA E.I.R.L.",
    "transportUnitId": 5,
    "plateNumber": "ABC-123",
    "latitude": -18.0101010,
    "longitude": -70.2452450,
    "distanceKm": 3.42,
    "coordinateSource": "TRANSPORT_UNIT_LAST_LOCATION"
  }
]
```

Ventaja:

- Permite consultar recolectores cercanos para una solicitud específica.
- No altera el flujo principal.

## 6.2. Opción B — Agregar distancia en solicitudes disponibles para recolector

Cuando un recolector ingrese a sus solicitudes disponibles, devolver además:

```json
"distanceKm": 2.85
```

Esto permite ordenar la lista por cercanía desde el punto operativo del recolector.

## 6.3. Recomendación para esta fase

Implementar primero **Opción B** si el objetivo inmediato es mejorar el panel del recolector.

Implementar **Opción A** si se quiere mostrar a la empresa/admin qué recolector está más cerca.

Si hay tiempo, implementar ambas, pero sin autoasignación.

---

# 7. Frontend recomendado

## 7.1. En solicitudes disponibles del recolector

Pantalla probable:

`src/pages/recolector/RecolectorSolicitudes.tsx`

Agregar visualmente:

- badge “A 2.8 km aprox.”
- ordenamiento por cercanía si existe `distanceKm`.
- si no hay distancia: “Distancia no disponible”.

No bloquear aceptación si no hay distancia.

## 7.2. En mapa operativo del recolector

Pantalla probable:

`src/pages/recolector/RecolectorMapaOperativo.tsx`

Agregar:

- marcadores de solicitudes con coordenadas.
- si existe ubicación operativa del recolector, mostrarla como marcador distinto.
- si existe distancia calculada, mostrarla en tarjeta/lista.

No llamar “GPS en vivo”.

## 7.3. En panel empresa, si se implementa endpoint de sugerencia

En seguimiento o detalle de solicitud mostrar:

```text
Recolector cercano sugerido: Servicios Nova Tacna — 3.4 km aprox.
```

Solo si existe recomendación.

No prometer asignación automática.

---

# 8. Comportamiento esperado

## 8.1. Solicitud con coordenadas válidas

- El backend calcula ranking.
- El frontend muestra distancia aproximada.
- Las solicitudes pueden ordenarse por cercanía.

## 8.2. Solicitud sin coordenadas

- No calcular distancia.
- Mostrar “Ubicación no registrada”.
- Mantener flujo manual.

## 8.3. Recolector sin coordenadas

- No entra al ranking.
- Puede seguir usando el sistema manualmente.
- Mostrar “Sin ubicación operativa registrada” si aplica.

## 8.4. Coordenadas inválidas

- Ignorar coordenada.
- No romper frontend.
- No lanzar error 500 por cálculo.

---

# 9. Validaciones técnicas

## 9.1. Backend

Ejecutar:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
.\mvnw.cmd clean compile
```

Debe compilar sin errores.

## 9.2. Frontend

Ejecutar:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Debe compilar sin errores.

---

# 10. Prueba manual mínima

## 10.1. Preparación

Confirmar que existe al menos:

- una solicitud de recojo con `pickupLatitude` y `pickupLongitude`;
- un recolector con coordenadas válidas en unidad o empresa;
- un recolector sin coordenadas para validar fallback.

## 10.2. Prueba recolector

1. Iniciar sesión como recolector.
2. Ir a solicitudes disponibles.
3. Confirmar que las solicitudes con coordenadas muestran distancia aproximada.
4. Confirmar que se ordenan por cercanía si se implementó ordenamiento.
5. Confirmar que aceptar solicitud sigue funcionando igual.

## 10.3. Prueba empresa/admin si aplica

1. Iniciar sesión como empresa.
2. Abrir una solicitud creada con sede.
3. Ver recolector cercano sugerido si se implementó.
4. Confirmar que no se autoasignó sin autorización.

---

# 11. Criterios de aceptación

La fase MAPS_P5 se considera terminada cuando:

- El backend puede calcular distancia con fórmula Haversine.
- Solo se usan coordenadas reales guardadas.
- Los recolectores sin coordenadas no rompen el sistema.
- Las solicitudes con coordenadas muestran distancia aproximada.
- El flujo de aceptación manual sigue intacto.
- No hay autoasignación.
- El frontend compila.
- El backend compila.
- No se tocaron login, pagos, ApiPeruDev ni SecurityConfig.

---

# 12. Reporte final obligatorio

Al terminar, entregar:

```text
REPORTE MAPS_P5 — RECOLECTOR MÁS CERCANO

1. Archivos backend modificados:
2. Archivos frontend modificados:
3. ¿Se creó DistanceUtils/Haversine? Sí/No
4. ¿Se creó endpoint de recolectores cercanos? Sí/No
5. ¿Se agregó distancia a solicitudes disponibles? Sí/No
6. ¿Se hizo autoasignación? No
7. ¿Se mantiene aceptación manual? Sí/No
8. ¿Se usan pickupLatitude/pickupLongitude? Sí/No
9. ¿Se usan coordenadas reales de recolector/unidad? Sí/No
10. ¿Se filtran coordenadas inválidas? Sí/No
11. ¿Recolector sin coordenadas rompe el sistema? Sí/No
12. ¿npm run build pasa? Sí/No
13. ¿mvnw clean compile pasa? Sí/No
14. ¿Se tocó login? Sí/No
15. ¿Se tocó pagos? Sí/No
16. ¿Se tocó ApiPeruDev? Sí/No
17. ¿Se tocó SecurityConfig? Sí/No
18. Observaciones:
```

---

# 13. Nota final

Esta fase debe dejar el sistema listo para una futura **asignación automática controlada**, pero no debe activarla todavía.

Primero se valida que la cercanía se calcule bien y que el panel del recolector/empresa la muestre de forma clara.
