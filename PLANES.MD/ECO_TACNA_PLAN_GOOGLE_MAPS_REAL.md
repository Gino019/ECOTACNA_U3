# ECO TACNA — PLAN DE ACCIÓN GOOGLE MAPS REAL

## 0. API KEY A UTILIZAR

Pegar aquí la API key nueva de Google Maps:

```env
VITE_GOOGLE_MAPS_API_KEY=PEGAR_AQUI_TU_API_KEY
```

Opcional si se crea Map ID propio en Google Cloud:

```env
VITE_GOOGLE_MAPS_MAP_ID=PEGAR_AQUI_TU_MAP_ID
```

Si todavía no hay Map ID propio, usar temporalmente:

```env
VITE_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
```

---

## 1. Objetivo

Corregir y completar la integración de Google Maps en EcoTacna para que:

1. El restaurante pueda seleccionar el punto real de recojo en el mapa.
2. La solicitud guarde `pickupLatitude` y `pickupLongitude`.
3. El recolector pueda ver el punto de recojo en el mapa operativo.
4. El sistema no invente ubicaciones ni use datos simulados.
5. La integración quede preparada para después calcular distancia, tiempo y recolector más cercano.

No implementar todavía:

- rutas reales;
- Directions API;
- Distance Matrix;
- geocoding;
- autocomplete;
- tracking GPS en vivo;
- algoritmo de recolector más cercano;
- reasignación automática.

Primero debe funcionar bien la selección y visualización del punto real.

---

## 2. Estado actual conocido

El proyecto ya tiene base de Google Maps:

```text
EcoTacnaFrontend/src/components/maps/GoogleMapView.tsx
EcoTacnaFrontend/src/components/maps/MapFallback.tsx
EcoTacnaFrontend/src/components/maps/mapTypes.ts
EcoTacnaFrontend/src/components/maps/mapConstants.ts
```

Dependencia existente:

```text
@vis.gl/react-google-maps
```

Variable esperada:

```text
VITE_GOOGLE_MAPS_API_KEY
```

Backend ya tiene campos preparados:

```text
Company.latitude
Company.longitude
PickupRequest.pickupLatitude
PickupRequest.pickupLongitude
TransportUnit.lastLatitude
TransportUnit.lastLongitude
TransportUnit.lastLocationAt
```

Existe script manual:

```text
EcoTacnaSpringBootJPA/src/main/resources/db/migration/manual/20260616_add_location_coordinates.sql
```

---

## 3. Diagnóstico obligatorio antes de modificar

Antes de tocar código, Antigravity debe revisar y responder:

1. ¿Existe `EcoTacnaFrontend/.env.local`?
2. ¿Está definida `VITE_GOOGLE_MAPS_API_KEY`?
3. ¿`GoogleMapView.tsx` lee correctamente `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`?
4. ¿`GoogleMapView.tsx` usa `mapId="DEMO_MAP_ID"` fijo?
5. ¿Conviene leer `VITE_GOOGLE_MAPS_MAP_ID` desde `.env.local`?
6. ¿`EmpresaSolicitarRecojo.tsx` permite seleccionar punto en el mapa?
7. ¿`EmpresaSolicitarRecojo.tsx` manda `pickupLatitude` y `pickupLongitude` en el payload?
8. ¿`empresaApi.ts` tipa esos campos en `crearSolicitud`?
9. ¿`PickupRequestRequest.java` recibe `pickupLatitude` y `pickupLongitude`?
10. ¿`PickupRequestService.create(...)` guarda ambos campos?
11. ¿La BD real tiene columnas `pickup_latitude` y `pickup_longitude`?
12. ¿`EmpresaSeguimiento.tsx` muestra el punto si existe?
13. ¿`RecolectorMapaOperativo.tsx` muestra el punto si existe?
14. ¿Hay algún fallback que siga diciendo ubicación simulada o mock?
15. ¿Qué archivos exactos se propone tocar?

No modificar código hasta responder este diagnóstico.

---

## 4. Configuración de Google Cloud requerida

La API key debe tener habilitada:

```text
Maps JavaScript API
```

Restricciones recomendadas para desarrollo:

```text
http://localhost:8081/*
http://127.0.0.1:8081/*
```

Si se usa otro puerto local, agregarlo también.

Ejemplo:

```text
http://localhost:8080/*
http://localhost:8081/*
http://localhost:5173/*
```

Para producción, agregar el dominio real:

```text
https://TU_DOMINIO/*
```

---

## 5. Archivo `.env.local`

Crear o actualizar:

```text
EcoTacnaFrontend/.env.local
```

Contenido:

```env
VITE_GOOGLE_MAPS_API_KEY=PEGAR_AQUI_TU_API_KEY
VITE_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
```

No subir `.env.local` a GitHub.

Verificar que `.gitignore` lo ignore.

---

## 6. Fase 1 — Corregir lectura de API key y Map ID

Archivo principal:

```text
EcoTacnaFrontend/src/components/maps/GoogleMapView.tsx
```

Requerimientos:

1. Leer API key desde:

```text
import.meta.env.VITE_GOOGLE_MAPS_API_KEY
```

2. Leer Map ID desde:

```text
import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
```

3. Si no hay API key, mostrar `MapFallback`.
4. Si no hay Map ID, usar `DEMO_MAP_ID` solo como fallback.
5. No hardcodear API key.
6. No exponer claves en código.

---

## 7. Fase 2 — Restaurante selecciona punto de recojo real

Archivo:

```text
EcoTacnaFrontend/src/pages/empresa/EmpresaSolicitarRecojo.tsx
```

Requerimientos:

1. El mapa debe permitir seleccionar punto.
2. Al hacer click en mapa, guardar:

```text
pickupLatitude
pickupLongitude
```

3. Mostrar coordenadas seleccionadas al usuario.
4. Permitir limpiar selección.
5. Antes de enviar solicitud, validar que exista punto seleccionado.
6. Si no hay punto seleccionado, bloquear envío con mensaje:

```text
Selecciona en el mapa el punto donde se recogerá el aceite.
```

7. Enviar payload con:

```json
{
  "pickupLatitude": -18.xxxxxxx,
  "pickupLongitude": -70.xxxxxxx
}
```

8. No enviar coordenadas inventadas.
9. No usar null si ya se está exigiendo Google Maps real.

---

## 8. Fase 3 — Corregir `empresaApi.ts`

Archivo:

```text
EcoTacnaFrontend/src/services/empresaApi.ts
```

Requerimiento:

El método `crearSolicitud` debe aceptar:

```ts
pickupLatitude?: number | null;
pickupLongitude?: number | null;
```

Si se hará obligatorio desde frontend, puede mantenerse como `number`, pero debe coincidir con el payload real.

Ejemplo esperado:

```ts
crearSolicitud: async (body: {
  volumenAproximado: number;
  direccion: string;
  fechaProgramada: string;
  observaciones?: string;
  pickupLatitude: number;
  pickupLongitude: number;
})
```

No modificar endpoints no relacionados.

---

## 9. Fase 4 — Verificar backend

Archivos:

```text
PickupRequestRequest.java
PickupRequestController.java
PickupRequestService.java
PickupRequest.java
```

Revisar:

1. DTO recibe:

```text
pickupLatitude
pickupLongitude
```

2. Service valida:
   - latitud y longitud vienen juntas;
   - latitud entre `-90` y `90`;
   - longitud entre `-180` y `180`.

3. Service guarda:

```text
pickupLatitude
pickupLongitude
```

4. Response devuelve coordenadas.

No tocar entidad si ya existen campos.

No crear migración si ya se aplicó SQL.

---

## 10. Fase 5 — Verificar BD

Antes de probar, confirmar que la BD tenga columnas:

```sql
pickup_requests.pickup_latitude
pickup_requests.pickup_longitude
companies.latitude
companies.longitude
transport_units.last_latitude
transport_units.last_longitude
transport_units.last_location_at
```

Si faltan, ejecutar manualmente:

```text
EcoTacnaSpringBootJPA/src/main/resources/db/migration/manual/20260616_add_location_coordinates.sql
```

No crear nueva migración salvo que el script no exista o esté incorrecto.

---

## 11. Fase 6 — Mostrar punto al recolector

Archivo probable:

```text
EcoTacnaFrontend/src/pages/recolector/RecolectorMapaOperativo.tsx
```

Requerimientos:

1. Si la solicitud tiene `pickupLatitude` y `pickupLongitude`, mostrar marcador en mapa.
2. Si no tiene coordenadas, mostrar mensaje honesto:

```text
Esta solicitud aún no tiene ubicación seleccionada en mapa.
```

3. No usar coordenadas inventadas.
4. No mostrar mock si hay datos reales.
5. Mantener fallback si falta API key.

---

## 12. Fase 7 — Mostrar punto en seguimiento empresa

Archivo probable:

```text
EcoTacnaFrontend/src/pages/empresa/EmpresaSeguimiento.tsx
```

Requerimientos:

1. Mostrar punto de recojo si hay coordenadas.
2. Si no hay coordenadas, mostrar fallback.
3. Mantener texto referencial si aún no hay tracking real del recolector.
4. No mostrar distancia/tiempo real si no está implementado.

---

## 13. Restricciones estrictas

No tocar:

```text
Culqi
pagos de suscripción
precio del aceite
rechazo/cancelación
login
roles
seguridad
.env del backend
application.properties
ApiPeruDev/SUNAT
constancia PDF
base de datos salvo ejecutar/verificar script manual existente
migraciones nuevas salvo justificación
```

No hacer refactor general.

No cambiar diseño global.

No implementar todavía:

```text
Directions API
Distance Matrix
Routes API
Places Autocomplete
Geocoding
tracking GPS real
algoritmo de recolector cercano
reasignación automática
```

---

## 14. Archivos permitidos

Frontend:

```text
EcoTacnaFrontend/.env.local
EcoTacnaFrontend/src/components/maps/GoogleMapView.tsx
EcoTacnaFrontend/src/components/maps/MapFallback.tsx
EcoTacnaFrontend/src/components/maps/mapTypes.ts
EcoTacnaFrontend/src/components/maps/mapConstants.ts
EcoTacnaFrontend/src/pages/empresa/EmpresaSolicitarRecojo.tsx
EcoTacnaFrontend/src/pages/empresa/EmpresaSeguimiento.tsx
EcoTacnaFrontend/src/pages/recolector/RecolectorMapaOperativo.tsx
EcoTacnaFrontend/src/services/empresaApi.ts
EcoTacnaFrontend/src/types.ts
```

Backend solo si se confirma que falta conexión:

```text
PickupRequestRequest.java
PickupRequestResponse.java
PickupRequestController.java
PickupRequestService.java
```

---

## 15. Validaciones técnicas

### Frontend

```powershell
cd "C:\Users\MSI\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm.cmd run build
```

Opcional:

```powershell
npx.cmd tsc --noEmit
```

### Backend

```powershell
cd "C:\Users\MSI\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"

$env:JAVA_HOME="C:\Program Files\Java\jdk-17"
$env:Path="$env:JAVA_HOME\bin;$env:Path"

Test-Path "$env:JAVA_HOME\bin\javac.exe"
java -version

.\mvnw.cmd clean compile
```

---

## 16. Pruebas funcionales obligatorias

### Prueba 1 — API key

1. Colocar API key en `.env.local`.
2. Reiniciar frontend.
3. Verificar que el mapa carga.
4. Si no carga, mostrar fallback honesto.

### Prueba 2 — selección de punto

1. Restaurante entra a `Solicitar recojo`.
2. Selecciona punto en mapa.
3. Coordenadas aparecen en pantalla.
4. Si no selecciona punto, no puede enviar.

### Prueba 3 — guardado en backend

1. Crear solicitud con punto seleccionado.
2. Revisar response o BD.
3. Confirmar que se guardan:

```text
pickup_latitude
pickup_longitude
```

### Prueba 4 — recolector ve punto

1. Entrar como recolector.
2. Ir a Mapa operativo.
3. Ver marcador del punto de recojo.

### Prueba 5 — empresa ve seguimiento

1. Entrar como restaurante.
2. Ir a Seguimiento.
3. Ver punto de recojo en mapa.

### Prueba 6 — sin API key

1. Quitar temporalmente key.
2. Reiniciar frontend.
3. Debe aparecer fallback.
4. No debe romper pantalla.

---

## 17. Resultado esperado

Al terminar:

- mapa carga con API key real;
- restaurante selecciona punto real;
- solicitud guarda latitud/longitud;
- recolector ve punto en mapa operativo;
- empresa ve punto en seguimiento;
- no hay coordenadas inventadas;
- no hay mock visual engañoso;
- no se toca Culqi;
- no se toca seguridad;
- no se toca precios;
- no se toca rechazo/cancelación;
- queda preparado para fase siguiente: distancia, rutas y recolector más cercano.

---

## 18. Prompt corto para Antigravity

```text
Lee primero los .md existentes del proyecto sobre arquitectura, refactor y reglas de no tocar configuración sensible.

Necesito cerrar la integración básica de Google Maps real.

API key a usar:
VITE_GOOGLE_MAPS_API_KEY=PEGAR_AQUI_TU_API_KEY
VITE_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID

Objetivo:
1. Cargar Google Maps con la API key real desde .env.local.
2. Permitir que el restaurante seleccione punto de recojo en el mapa.
3. Enviar pickupLatitude y pickupLongitude al backend.
4. Guardar coordenadas en la solicitud.
5. Mostrar el punto al recolector en Mapa operativo.
6. Mostrar el punto en Seguimiento de empresa.
7. No inventar coordenadas ni usar mocks engañosos.

Primero diagnostica sin modificar.
Luego aplica cambios mínimos.

No tocar Culqi, pagos, precio, rechazo/cancelación, login, roles, seguridad, backend .env, ApiPeruDev/SUNAT ni constancia PDF.
No implementar todavía rutas, Distance Matrix, geocoding, Places, tracking real ni recolector más cercano.
```
