# PLAN ECO TACNA — UNIFICAR TIEMPO DE DISPONIBILIDAD DE SOLICITUD ENTRE EMPRESA Y RECOLECTOR

## Objetivo

Corregir el desfase de tiempos entre el panel empresa/restaurante y el panel recolector cuando una solicitud de recojo está pendiente de ser aceptada.

Actualmente:

```text
Empresa/restaurante:
Muestra una solicitud activa con un contador de 15 minutos aproximadamente.

Recolector:
Muestra la misma solicitud como disponible por varios días, por ejemplo 167 h 47 min.
```

Esto es incoherente.

La regla final debe ser:

```text
La solicitud pendiente debe durar 7 días para ambos lados.
Empresa y recolector deben ver el mismo tiempo restante.
La parte visual azul del tiempo debe ser la misma o reutilizada.
La data del tiempo debe venir de una sola fuente, no calculada por separado en cada pantalla.
```

---

## Decisión funcional

La solicitud de recojo en estado `PENDIENTE` debe tener una ventana de disponibilidad de **7 días**.

Durante ese periodo:

```text
Empresa:
Ve que su solicitud sigue activa y disponible para recolectores.

Recolector:
Ve la solicitud disponible para evaluarla y aceptarla.
```

Cuando venza:

```text
La solicitud debe pasar a estado expirado o dejar de mostrarse como disponible.
Ambos paneles deben mostrar coherencia.
```

No deben existir reglas distintas como:

```text
Empresa: 15 minutos
Recolector: 7 días
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

## Reglas estrictas

- No crear código espagueti.
- No duplicar cálculos de tiempo en varias pantallas.
- No hardcodear 7 días en frontend si backend ya puede entregar la fecha final.
- No dejar un cálculo de 15 minutos escondido en la empresa.
- No tocar pagos.
- No tocar Culqi.
- No tocar ApiPeruDev.
- No tocar login.
- No tocar incidencias.
- No tocar mapas.
- No tocar registro.
- No tocar PDF/constancias.
- No tocar lógica de confirmación de recojo/pago.
- No modificar estados posteriores como `EN_RUTA`, `EN_SITIO`, `COMPLETADO` salvo que sea necesario para mostrar visualmente el tiempo.
- No crear archivos `old`, `copy`, `backup`, `legacy`, `v1`, `v2`.
- No resolver solo visualmente. La data debe ser consistente desde backend o desde una utilidad compartida.

---

# 1. Diagnosticar origen del tiempo en ambos paneles

## 1.1 Buscar cálculo de 15 minutos en frontend

Ejecutar en frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "15|minutos|segundosRestantes|tiempo restante|Esperando aceptación|Solicitud Activa|Disponible por|Fecha de término|fechaTermino|expiresAt|availableUntil|createdAt|scheduledAt" -Context 5,5
```

Archivos probables:

```text
src/pages/empresa/EmpresaSolicitarRecojo.tsx
src/pages/empresa/EmpresaResumen.tsx
src/pages/empresa/EmpresaMisSolicitudes.tsx
src/pages/recolector/RecolectorRecojosDia.tsx
src/pages/recolector/RecolectorSolicitudes.tsx
src/components/...
```

## 1.2 Buscar cálculo de 7 días en frontend

Ejecutar:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "7\s*\*|168|167|dias|días|days|week|semana|Disponible por" -Context 5,5
```

Identificar qué pantalla ya calcula o muestra el tiempo correcto del recolector.

## 1.3 Buscar cálculo en backend

Ejecutar en backend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"

Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "15|minutos|minutes|Duration|plusDays|plusMinutes|segundosRestantes|expiresAt|expiration|availableUntil|getAvailableRequests|PENDIENTE|EXPIRADO" -Context 6,6
```

Archivos probables:

```text
PickupRequestService.java
PickupRequestResponse.java
PickupRequest.java
PickupRequestRepository.java
CollectorPortalService.java
CompanyPortalService.java
```

---

# 2. Definir fuente única de verdad

Debe existir una sola regla para disponibilidad:

```text
pickupRequest.availableUntil = createdAt + 7 días
```

o, si no existe columna:

```text
availableUntil calculado en backend = createdAt + 7 días
```

Recomendación:

```text
Backend calcula y devuelve:
- createdAt
- availableUntil
- remainingSeconds
```

Frontend solo renderiza esa data.

No hacer que empresa calcule 15 min y recolector calcule 7 días por separado.

---

# 3. Backend: unificar regla de expiración

## 3.1 Crear constante central

En backend, crear o ubicar una constante central:

```java
private static final Duration PICKUP_PENDING_AVAILABILITY = Duration.ofDays(7);
```

Debe usarse para:

```text
calcular fecha de término;
calcular segundos restantes;
filtrar solicitudes disponibles;
expirar solicitudes vencidas;
mostrar respuesta a empresa;
mostrar respuesta a recolector.
```

No dejar `15 minutes` en otro servicio.

## 3.2 Corregir filtro de solicitudes disponibles

Si existe algo como:

```java
createdAt.isAfter(now.minusMinutes(15))
```

debe cambiarse por la regla de 7 días.

Conceptualmente:

```java
createdAt.plusDays(7).isAfter(now)
```

o por campo `availableUntil > now`.

## 3.3 Corregir respuesta de empresa

La empresa debe recibir el mismo `availableUntil` y `remainingSeconds` que el recolector.

DTO recomendado:

```java
private LocalDateTime createdAt;
private LocalDateTime availableUntil;
private Long remainingSeconds;
```

Usar nombres reales del proyecto si ya existen:

```text
segundosRestantes
fechaTermino
expiresAt
availableUntil
```

No duplicar campos con significados iguales.

## 3.4 Corregir respuesta de recolector

Recolector debe seguir recibiendo el mismo tiempo, pero desde la misma función/método de enriquecimiento.

Si el recolector ya recibe `segundosRestantes`, usar ese mismo campo para empresa.

---

# 4. Backend: no romper estados posteriores

La regla de 7 días aplica solo a solicitudes pendientes de aceptación.

Estados relevantes:

```text
PENDIENTE:
usa ventana de disponibilidad de 7 días.

EN_RUTA / EN_SITIO:
ya fue aceptada, no debe depender de disponibilidad pendiente.

COMPLETADO / CANCELADO / EXPIRADO:
estados terminales.
```

No aplicar contador de disponibilidad a solicitudes aceptadas.

---

# 5. Frontend: crear/reutilizar componente visual azul

El bloque azul del tiempo debe ser el mismo para ambos paneles.

Actualmente recolector ya tiene una caja azul con labels como:

```text
Fecha actual:
Fecha de término:
Disponible por:
```

La empresa debe usar esa misma presentación o un componente reutilizable.

## 5.1 Crear componente compartido si no existe

Ubicación sugerida:

```text
src/components/pickup/PickupAvailabilityTimer.tsx
```

o reutilizar componente existente si ya existe.

Props sugeridas:

```ts
type PickupAvailabilityTimerProps = {
  createdAt?: string;
  availableUntil?: string;
  remainingSeconds?: number;
  currentTimeLabel?: string;
  endTimeLabel?: string;
  remainingLabel?: string;
  expired?: boolean;
};
```

Labels visuales obligatorios:

```text
Fecha actual:
Fecha de término:
Disponible por:
```

El texto debe ser igual o equivalente en empresa y recolector.

## 5.2 No duplicar timers

Si el recolector tiene lógica local del contador, extraer esa lógica a un helper o componente compartido.

Ubicación sugerida:

```text
src/utils/pickupAvailability.ts
```

Funciones sugeridas:

```ts
formatRemainingTime(seconds)
formatPickupDate(date)
getRemainingSeconds(availableUntil)
```

Pero si backend ya entrega `remainingSeconds`, solo hacer decremento visual local a partir de ese valor.

---

# 6. Frontend empresa: reemplazar bloque de 15 minutos

En la pantalla empresa donde aparece:

```text
Tienes una solicitud activa
Esperando aceptación del recolector
03:29
Tiempo restante de visibilidad
```

Reemplazar ese bloque por el mismo componente azul usado por recolector.

Debe mostrar:

```text
Fecha actual:
23-jun., 02:58 p. m.

Fecha de término:
30-jun., 02:45 p. m.

Disponible por:
167 h 47 min
```

Los valores deben venir de la misma solicitud activa.

No mostrar más `15 minutos`.

---

# 7. Frontend recolector: reutilizar mismo componente

En la tarjeta de recojos disponibles, reemplazar la caja azul actual por el componente compartido o confirmar que ya usa el componente compartido.

No cambiar diseño general de la tarjeta.

Solo asegurar que:

```text
la data venga de availableUntil/remainingSeconds;
el formato sea igual al de empresa;
no exista cálculo independiente de 7 días hardcodeado en esta pantalla.
```

---

# 8. Contrato de datos esperado en frontend

El objeto solicitud debe tener, idealmente:

```json
{
  "id": 48,
  "createdAt": "2026-06-23T14:45:00",
  "availableUntil": "2026-06-30T14:45:00",
  "remainingSeconds": 604000,
  "status": "PENDIENTE"
}
```

Si usa nombres actuales:

```json
{
  "segundosRestantes": 604000,
  "fechaTermino": "...",
  "createdAt": "..."
}
```

Usar los nombres reales, pero que ambos paneles lean los mismos campos.

---

# 9. Corregir solicitud activa de empresa

Buscar la función que carga solicitud activa:

```text
getActiveRequest
getSolicitudActiva
getCurrentRequest
solicitudActiva
```

Asegurar que su endpoint devuelve:

```text
availableUntil / remainingSeconds / createdAt
```

Si no lo devuelve, enriquecer DTO backend.

No calcular `createdAt + 15 minutos` en la UI.

---

# 10. Corregir listados del recolector

Buscar dónde se renderiza:

```text
Disponible por:
167 h 47 min
```

Esa lógica debe ser migrada a componente compartido.

No dejar duplicado.

---

# 11. Expiración real

Verificar que cuando una solicitud supera 7 días:

```text
no aparece como disponible para recolector;
empresa la ve como EXPIRADA o vencida;
no bloquea para siempre crear nuevas solicitudes si ya venció.
```

Si actualmente hay job o validación de expiración, debe usar 7 días.

Si no hay job, al consultar solicitud activa/disponibles debe evaluarse expiración.

---

# 12. SQL diagnóstico opcional

Para revisar fechas reales:

```sql
SELECT
    id,
    status,
    created_at,
    scheduled_at,
    created_at + interval '7 days' AS calculated_available_until,
    now() AS current_time
FROM pickup_requests
WHERE status = 'PENDIENTE'
ORDER BY id DESC
LIMIT 10;
```

No modificar BD todavía.

Solo diagnóstico.

---

# 13. Validación manual empresa

1. Crear solicitud como restaurante.
2. Ir a pantalla donde aparece:

```text
Tienes una solicitud activa
```

3. Confirmar que la caja azul ya no muestra 15 minutos.
4. Confirmar que muestra:

```text
Fecha actual
Fecha de término
Disponible por
```

5. Confirmar que el tiempo restante es cercano a 7 días.
6. Confirmar que coincide con lo que verá el recolector.

---

# 14. Validación manual recolector

1. Entrar como recolector.
2. Ir a:

```text
/recolector/recojos-dia
```

3. Confirmar que la misma solicitud muestra el mismo bloque azul.
4. Confirmar que el tiempo restante coincide con empresa.
5. Confirmar que aceptar recojo sigue funcionando.

---

# 15. Validación de sincronía

Crear solicitud nueva y comparar:

```text
Empresa:
Disponible por: 167 h XX min

Recolector:
Disponible por: 167 h XX min
```

Deben diferir solo por segundos/minutos normales de refresco, no por días ni por 15 minutos.

---

# 16. Validación de UI

En ambos lados, el bloque azul debe tener los mismos labels:

```text
Fecha actual:
Fecha de término:
Disponible por:
```

No mantener textos distintos como:

```text
Esperando aceptación del recolector
Tiempo restante de visibilidad
03:29
```

Ese diseño queda eliminado o reemplazado por la misma caja azul.

---

# 17. Validar que el bloqueo de solicitud activa sigue funcionando

Mientras la solicitud está `PENDIENTE` y dentro de 7 días:

```text
Empresa no puede crear otra solicitud.
```

Cuando expire o se cancele:

```text
Empresa sí puede crear otra solicitud.
```

No cambiar esta regla salvo para usar el nuevo tiempo de 7 días.

---

# 18. Limpieza de residuos

Buscar después de corregir:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "15|minutos|03:|Tiempo restante de visibilidad|Esperando aceptación del recolector|167 h|Disponible por" -Context 4,4
```

Validar:

```text
No queda cálculo de 15 minutos para solicitud pendiente.
Disponible por solo se calcula/renderiza desde componente compartido.
```

Backend:

```powershell
Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "plusMinutes\(15\)|minusMinutes\(15\)|Duration.ofMinutes\(15\)|15" -Context 4,4
```

No deben quedar reglas de 15 minutos aplicadas a disponibilidad de solicitudes pendientes.

---

# 19. Builds

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

# Reporte final obligatorio

```text
CIERRE UNIFICACION TIEMPO DISPONIBILIDAD SOLICITUD

1. Ruta frontend actual:
2. Ruta backend actual:
3. Archivos frontend modificados:
4. Archivos backend modificados:
5. Causa exacta del desfase de tiempos:
6. Regla final aplicada:
7. ¿Disponibilidad pendiente dura 7 días? Sí/No
8. ¿Empresa usa la misma data que recolector? Sí/No
9. ¿Recolector usa la misma data que empresa? Sí/No
10. Campo backend usado para fecha final:
11. Campo backend usado para segundos restantes:
12. ¿Se eliminó cálculo de 15 minutos? Sí/No
13. ¿Se creó/reutilizó componente visual compartido? Sí/No
14. Nombre del componente/helper compartido:
15. ¿Empresa muestra Fecha actual / Fecha de término / Disponible por? Sí/No
16. ¿Recolector muestra Fecha actual / Fecha de término / Disponible por? Sí/No
17. ¿Ambos muestran tiempos coherentes? Sí/No
18. ¿Aceptar recojo sigue funcionando? Sí/No
19. ¿Bloqueo de solicitud activa sigue funcionando? Sí/No
20. ¿mvnw clean compile pasa? Sí/No
21. ¿npm run build pasa? Sí/No
22. Observaciones:
```

No cerrar hasta crear una solicitud nueva y comparar visualmente el tiempo en empresa y recolector.
