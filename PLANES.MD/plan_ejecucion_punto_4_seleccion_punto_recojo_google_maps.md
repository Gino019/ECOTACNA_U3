# Plan de ejecucion exacto - Punto 4

## EcoTacna - Seleccion real del punto de recojo desde Google Maps

**Estado previo obligatorio:**

- Punto 1 cerrado: repositorio limpio, sin secretos, sin archivos temporales, sin artefactos generados y con `.gitignore` robusto.
- Punto 2 cerrado: modelo de datos preparado para coordenadas opcionales en backend/frontend.
- Punto 3 cerrado: Google Maps integrado visualmente en frontend con `@vis.gl/react-google-maps`, fallback sin API key y sin rutas/tracking real.

---

# 1. Objetivo del Punto 4

Implementar la seleccion real del **punto exacto de recojo** desde el mapa en la pantalla de solicitud de recojo de la empresa generadora.

El usuario debe poder hacer clic en Google Maps, seleccionar una ubicacion, visualizar el marcador del punto elegido y enviar esas coordenadas al backend dentro del payload de creacion de solicitud.

Esta etapa convierte el mapa de `EmpresaSolicitarRecojo.tsx` de un mapa solo referencial a un mapa interactivo de seleccion.

---

# 2. Alcance exacto

## 2.1. Incluido

- Habilitar modo seleccion en el componente `GoogleMapView.tsx`.
- Capturar latitud y longitud al hacer clic en el mapa.
- Mostrar marcador del punto seleccionado.
- Mostrar coordenadas seleccionadas en la interfaz.
- Permitir limpiar/reseleccionar el punto.
- Enviar `pickupLatitude` y `pickupLongitude` en el payload de creacion de recojo.
- Validar coordenadas antes de enviar.
- Mantener compatibilidad con solicitudes antiguas sin coordenadas.
- Verificar que seguimiento y mapa operativo ya muestren el pin real cuando el backend devuelva coordenadas.

## 2.2. No incluido

- No integrar Geocoding API.
- No integrar Places API.
- No integrar Routes API.
- No integrar Directions API.
- No integrar Navigation SDK.
- No implementar tracking GPS real.
- No calcular distancia ni tiempo estimado.
- No autocompletar direcciones.
- No convertir direccion textual a coordenadas automaticamente.
- No tocar pagos simulados.
- No tocar ApiPeruDev.
- No tocar captcha.
- No tocar login/autenticacion.
- No tocar SecurityConfig.
- No tocar suscripciones.
- No tocar documentacion academica.

---

# 3. Reglas estrictas de ejecucion

1. No hardcodear API keys.
2. No imprimir la API key en consola ni logs.
3. No modificar `.env.local` salvo que sea estrictamente local y no versionado.
4. No crear archivos `backup`, `old`, `legacy`, `v1`, `v2`, `copy` ni copias duplicadas.
5. No dejar codigo muerto.
6. No reintroducir `MapMock.tsx`.
7. No prometer GPS real en textos de interfaz.
8. No modificar backend si el contrato actual ya recibe `pickupLatitude` y `pickupLongitude`.
9. Si se detecta que el backend ya soporta los campos, limitar el cambio al frontend.
10. Si la base de datos real aun no tiene columnas, aplicar primero el script manual del Punto 2 antes de probar solicitudes reales.

---

# 4. Precondicion critica de base de datos

Antes de probar el envio real de coordenadas, confirmar que la base de datos activa tiene estas columnas:

```sql
pickup_requests.pickup_latitude
pickup_requests.pickup_longitude
```

Si aun no existen, ejecutar el script creado en el Punto 2:

```txt
EcoTacnaSpringBootJPA/src/main/resources/db/migration/manual/20260616_add_location_coordinates.sql
```

Columnas esperadas:

```sql
latitude NUMERIC(10,7)
longitude NUMERIC(10,7)
pickup_latitude NUMERIC(10,7)
pickup_longitude NUMERIC(10,7)
last_latitude NUMERIC(10,7)
last_longitude NUMERIC(10,7)
```

No avanzar con pruebas funcionales si la base activa no tiene las columnas, porque el frontend enviara coordenadas y el backend intentara persistirlas.

---

# 5. Archivos a revisar antes de modificar

## Frontend

```txt
EcoTacnaFrontend/src/components/maps/GoogleMapView.tsx
EcoTacnaFrontend/src/components/maps/mapTypes.ts
EcoTacnaFrontend/src/components/maps/mapConstants.ts
EcoTacnaFrontend/src/components/maps/MapFallback.tsx
EcoTacnaFrontend/src/pages/empresa/EmpresaSolicitarRecojo.tsx
EcoTacnaFrontend/src/pages/empresa/EmpresaSeguimiento.tsx
EcoTacnaFrontend/src/pages/recolector/RecolectorMapaOperativo.tsx
EcoTacnaFrontend/src/types.ts
```

## Backend, solo revision

```txt
EcoTacnaSpringBootJPA/src/main/java/.../dto/PickupRequestRequest.java
EcoTacnaSpringBootJPA/src/main/java/.../dto/PickupRequestResponse.java
EcoTacnaSpringBootJPA/src/main/java/.../dto/PickupTrackingResponse.java
EcoTacnaSpringBootJPA/src/main/java/.../service/PickupRequestService.java
```

El backend solo debe tocarse si se confirma que el Punto 2 no dejo completo el contrato de coordenadas.

---

# 6. Diseno funcional esperado

## 6.1. Pantalla principal afectada

```txt
EmpresaSolicitarRecojo.tsx
```

## 6.2. Comportamiento esperado

1. El usuario abre la pantalla de solicitud de recojo.
2. El mapa se muestra centrado en Tacna.
3. La interfaz indica claramente:

```txt
Seleccione en el mapa el punto exacto donde se recogera el aceite usado.
```

4. El usuario hace clic sobre el mapa.
5. El sistema guarda:

```txt
pickupLatitude
pickupLongitude
```

6. Se muestra un marcador en el punto seleccionado.
7. Se muestran las coordenadas de forma legible.
8. El usuario puede volver a hacer clic para cambiar el punto.
9. El usuario puede limpiar la seleccion con un boton.
10. Al enviar la solicitud, el payload incluye la direccion textual y las coordenadas seleccionadas.

---

# 7. Cambios tecnicos exactos

## 7.1. Actualizar `mapTypes.ts`

Agregar o confirmar tipos para coordenadas seleccionables.

Estructura sugerida:

```ts
export type MapMarkerType = "pickup" | "company" | "collector" | "reference" | "selected";

export interface MapLatLng {
  latitude: number;
  longitude: number;
}

export interface MapMarker {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  type: MapMarkerType;
}
```

Si ya existe una estructura equivalente, no duplicarla. Adaptarla sin romper pantallas existentes.

---

## 7.2. Actualizar `GoogleMapView.tsx`

Agregar soporte opcional para seleccion por clic.

Props sugeridas:

```ts
interface GoogleMapViewProps {
  markers?: MapMarker[];
  height?: string;
  zoom?: number;
  center?: MapLatLng;
  showMissingCoordinatesWarning?: boolean;
  selectable?: boolean;
  selectedPosition?: MapLatLng | null;
  onSelectPosition?: (position: MapLatLng) => void;
  selectionLabel?: string;
}
```

Comportamiento requerido:

- Si `selectable` es `false` o no viene, el mapa funciona como hasta ahora.
- Si `selectable` es `true`, el usuario puede hacer clic en el mapa.
- Al hacer clic, se obtiene latitud y longitud.
- Se ejecuta `onSelectPosition({ latitude, longitude })`.
- Si `selectedPosition` existe, se muestra un marcador especial en esa ubicacion.
- Si no hay API key, se mantiene el fallback actual.
- Si no hay coordenadas, se centra en Tacna.
- No se debe calcular ruta.
- No se debe llamar ninguna API adicional.

Validacion interna de coordenadas:

```ts
const isValidLatitude = (value: number) => value >= -90 && value <= 90;
const isValidLongitude = (value: number) => value >= -180 && value <= 180;
```

Para eventos del mapa, usar el mecanismo de `@vis.gl/react-google-maps` disponible en el componente `Map`. No usar acceso directo inseguro al objeto global `window.google` si no es necesario.

---

## 7.3. Actualizar `EmpresaSolicitarRecojo.tsx`

Agregar estado para el punto seleccionado.

Estructura sugerida:

```ts
const [selectedPickupLocation, setSelectedPickupLocation] = useState<MapLatLng | null>(null);
```

Agregar handler:

```ts
const handlePickupLocationSelect = (position: MapLatLng) => {
  setSelectedPickupLocation(position);
};
```

Agregar boton para limpiar seleccion:

```txt
Limpiar punto seleccionado
```

Agregar validacion antes de enviar.

Opcion recomendada para este Punto 4:

- Hacer obligatorio seleccionar el punto en el mapa para nuevas solicitudes creadas desde la UI.
- Mantener backend con coordenadas opcionales para no romper datos antiguos ni integraciones existentes.

Mensaje si no selecciono punto:

```txt
Seleccione en el mapa el punto exacto de recojo antes de enviar la solicitud.
```

Payload esperado:

```ts
const payload = {
  direccion,
  observaciones,
  litrosEstimados,
  fechaProgramada,
  precioOfertadoPorLitro,
  pickupLatitude: selectedPickupLocation?.latitude ?? null,
  pickupLongitude: selectedPickupLocation?.longitude ?? null,
};
```

No modificar nombres reales si el archivo ya usa otros campos. Adaptar respetando el contrato existente.

---

# 8. Reglas de UI/UX

## 8.1. Textos permitidos

Usar textos honestos:

```txt
Seleccion de punto de recojo
Punto exacto de recojo
Ubicacion referencial
Mapa operativo
Seguimiento visual
Coordenadas registradas
```

## 8.2. Textos prohibidos

No usar:

```txt
GPS en vivo
Tracking real
Ruta en tiempo real
Navegacion activa
Recolector en movimiento real
```

## 8.3. Mensajes visuales requeridos

Cuando no hay punto seleccionado:

```txt
Seleccione en el mapa el punto exacto donde se realizara el recojo.
```

Cuando ya existe punto seleccionado:

```txt
Punto de recojo seleccionado correctamente.
```

Mostrar coordenadas con formato:

```txt
Latitud: -18.0146000
Longitud: -70.2536000
```

Usar maximo 7 decimales para coincidir con `NUMERIC(10,7)` del backend.

---

# 9. Integracion con seguimiento y mapa operativo

No se debe reescribir `EmpresaSeguimiento.tsx` ni `RecolectorMapaOperativo.tsx` salvo ajustes pequenos.

Verificar que:

- Si una solicitud nueva tiene `pickupLatitude` y `pickupLongitude`, el seguimiento muestre el marcador real.
- Si el recolector ve el mapa operativo y la solicitud activa tiene coordenadas, aparezca el pin real.
- Si la solicitud es antigua y no tiene coordenadas, se mantenga fallback centrado en Tacna con mensaje referencial.

---

# 10. Validaciones tecnicas

## 10.1. Validacion frontend antes de enviar

Validar que:

```txt
pickupLatitude no sea null
pickupLongitude no sea null
pickupLatitude este entre -90 y 90
pickupLongitude este entre -180 y 180
```

Si falla, bloquear envio y mostrar mensaje claro.

## 10.2. Validacion backend existente

El backend ya deberia validar por Punto 2:

- Si llega latitud, debe llegar longitud.
- Si llega longitud, debe llegar latitud.
- Latitud entre -90 y 90.
- Longitud entre -180 y 180.

No duplicar logica innecesaria si ya existe.

---

# 11. Pruebas manuales obligatorias

## 11.1. Prueba visual de seleccion

1. Abrir frontend.
2. Iniciar sesion como empresa generadora.
3. Ir a:

```txt
/empresa/solicitar-recojo
```

4. Verificar que el mapa carga.
5. Hacer clic en una zona de Tacna.
6. Confirmar que aparece marcador.
7. Confirmar que se muestran latitud y longitud.
8. Cambiar el punto haciendo otro clic.
9. Confirmar que el marcador se mueve.
10. Limpiar seleccion.
11. Confirmar que el marcador desaparece.

## 11.2. Prueba de validacion

1. Intentar enviar sin seleccionar punto.
2. Debe aparecer mensaje:

```txt
Seleccione en el mapa el punto exacto de recojo antes de enviar la solicitud.
```

3. No debe enviarse el POST.

## 11.3. Prueba de creacion real

1. Completar los datos requeridos de solicitud.
2. Seleccionar punto en el mapa.
3. Enviar solicitud.
4. Confirmar respuesta exitosa.
5. Confirmar que el payload enviado incluye:

```json
{
  "pickupLatitude": -18.0146000,
  "pickupLongitude": -70.2536000
}
```

Los valores seran los seleccionados realmente.

## 11.4. Prueba en seguimiento

1. Abrir seguimiento de empresa.
2. Verificar que la solicitud nueva muestra pin real si el endpoint devuelve coordenadas.
3. Si no devuelve coordenadas, revisar DTO/backend antes de avanzar.

## 11.5. Prueba en mapa operativo recolector

1. Iniciar sesion como recolector.
2. Ir a mapa operativo.
3. Verificar que la solicitud activa o disponible muestra pin real si tiene coordenadas.
4. Si no hay solicitud con coordenadas, no forzar datos falsos.

---

# 12. Comandos de validacion obligatoria

## Frontend

Desde:

```bash
cd EcoTacnaFrontend
```

Ejecutar:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Resultado esperado:

```txt
lint: 0 errores criticos, warnings heredados permitidos
TypeScript: sin errores
build: exitoso
```

## Backend

Solo si se toca backend:

```bash
cd EcoTacnaSpringBootJPA
./mvnw clean compile
```

En Windows:

```bash
mvnw.cmd clean compile
```

Resultado esperado:

```txt
BUILD SUCCESS
```

---

# 13. Entrega esperada de Antigravity

Al finalizar, reportar exactamente:

1. Archivos modificados.
2. Archivos creados, si hubo alguno.
3. Confirmacion de que no se creo ningun backup ni copia duplicada.
4. Confirmacion de que no se modifico `.env.local` ni se expuso la API key.
5. Confirmacion de que no se integro Geocoding, Places, Routes, Directions, Navigation SDK ni tracking GPS real.
6. Explicacion de como se selecciona el punto de recojo.
7. Explicacion de como se guarda el punto seleccionado en el payload.
8. Resultado de `npm run lint`.
9. Resultado de `npx tsc --noEmit`.
10. Resultado de `npm run build`.
11. Resultado de backend compile solo si se toco backend.
12. Confirmacion de que solicitudes antiguas sin coordenadas siguen funcionando.

---

# 14. Criterios de aceptacion

El Punto 4 se considera terminado solo si:

- `EmpresaSolicitarRecojo.tsx` permite seleccionar un punto desde Google Maps.
- El marcador aparece en el punto seleccionado.
- El usuario puede cambiar el punto haciendo otro clic.
- El usuario puede limpiar el punto seleccionado.
- El envio de solicitud incluye `pickupLatitude` y `pickupLongitude`.
- El frontend bloquea el envio si no se selecciona punto, para solicitudes nuevas desde la UI.
- El backend sigue aceptando coordenadas opcionales para compatibilidad.
- Seguimiento y mapa operativo pueden mostrar el pin real cuando el backend devuelva coordenadas.
- No se agregaron servicios de Google Maps adicionales.
- No se expuso la API key.
- `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores criticos.

---

# 15. Instruccion exacta para ejecutar

Copiar y pegar a Antigravity:

```md
Ejecuta el Punto 4 de EcoTacna: Seleccion real del punto de recojo desde Google Maps.

Contexto:
- Punto 1 cerrado: limpieza de secretos, archivos temporales, artefactos y gitignore.
- Punto 2 cerrado: backend/frontend soportan coordenadas opcionales.
- Punto 3 cerrado: Google Maps ya esta integrado visualmente en frontend con @vis.gl/react-google-maps.

Objetivo:
Implementar en EmpresaSolicitarRecojo.tsx la seleccion interactiva del punto exacto de recojo mediante clic sobre Google Maps. El punto seleccionado debe mostrar marcador, guardar latitud/longitud en estado y enviarse al backend como pickupLatitude y pickupLongitude al crear la solicitud.

Reglas estrictas:
- No hardcodear API keys.
- No imprimir ni exponer la API key.
- No modificar .env.local.
- No crear backups, old, legacy, copy, v1 ni v2.
- No reintroducir MapMock.
- No integrar Geocoding API.
- No integrar Places API.
- No integrar Routes API.
- No integrar Directions API.
- No integrar Navigation SDK.
- No implementar tracking GPS real.
- No tocar pagos simulados.
- No tocar ApiPeruDev.
- No tocar captcha.
- No tocar login/autenticacion.
- No tocar SecurityConfig.
- No tocar suscripciones.
- No tocar documentacion academica.
- No modificar backend salvo que el contrato de coordenadas del Punto 2 este incompleto.

Tareas:
1. Revisar GoogleMapView.tsx y mapTypes.ts.
2. Agregar modo seleccion opcional al mapa mediante props:
   - selectable
   - selectedPosition
   - onSelectPosition
   - selectionLabel
3. Capturar latitud y longitud al hacer clic en el mapa.
4. Mostrar un marcador especial para el punto seleccionado.
5. Modificar EmpresaSolicitarRecojo.tsx para guardar selectedPickupLocation en estado.
6. Mostrar coordenadas seleccionadas con 7 decimales.
7. Agregar boton para limpiar el punto seleccionado.
8. Bloquear el envio de nuevas solicitudes desde la UI si no se selecciono punto en el mapa.
9. Enviar pickupLatitude y pickupLongitude en el payload de creacion.
10. Verificar que EmpresaSeguimiento y RecolectorMapaOperativo muestran pines reales cuando el backend devuelve coordenadas.
11. No calcular rutas ni distancias.
12. No usar geocodificacion.

Precondicion de BD:
Antes de probar envio real, confirmar que la base activa tiene pickup_latitude y pickup_longitude en pickup_requests. Si no existen, aplicar el script manual del Punto 2.

Validacion obligatoria:
Frontend:
- npm run lint
- npx tsc --noEmit
- npm run build

Backend:
- mvnw.cmd clean compile solo si se toca backend.

Entrega:
Reporta archivos modificados, comportamiento implementado, validaciones, pruebas manuales realizadas, resultados de comandos y confirma explicitamente que no se integro Geocoding, Places, Routes, Directions, Navigation SDK ni tracking GPS real.
```
