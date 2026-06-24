# MAPS_P6 — VISUALIZACIÓN COMPLETA Y EDICIÓN DE SEDES EN “MI EMPRESA”

## Proyecto

EcoTacna

## Módulo

Panel Empresa → Mi empresa

Ruta frontend principal:

```txt
/empresa/mi-empresa
```

## Contexto actual

Ya se completaron las fases anteriores del plan operativo de mapas:

- **MAPS_P1:** visualización de sedes registradas en “Mi empresa”.
- **MAPS_P2:** buscador Google Places en registro principal.
- **MAPS_P3:** buscador Google Places en sedes adicionales.
- **MAPS_P4:** selección de sede al solicitar recojo.
- **MAPS_P5:** distancia referencial del recolector más cercano con fórmula Haversine, sin autoasignación.

Estado actual observado:

- En “Mi empresa” ya existe la sección **Ubicaciones registradas**.
- La lista lateral muestra **2 sedes**:
  - Sede principal.
  - Sede adicional 1.
- Sin embargo, el mapa solo muestra **1 pin**.
- El pin visible parece corresponder a una sede, pero no se está mostrando la otra ubicación.
- Además, todavía no existe una opción clara para **editar ubicaciones ya registradas** desde el panel de empresa.

## Objetivo general

Implementar la fase **MAPS_P6** para resolver dos necesidades:

1. Corregir la visualización del mapa para que muestre **todas las sedes reales registradas**.
2. Agregar una opción de edición para que el dueño del restaurante pueda mover el pin de una sede y guardar la nueva ubicación.

## Resultado esperado

En la sección **Ubicaciones registradas** de “Mi empresa”:

- Debe verse un mapa con un marcador por cada sede registrada.
- Si la empresa tiene 2 sedes, deben aparecer 2 pines.
- La sede principal debe aparecer como marcador.
- La sede adicional debe aparecer como marcador.
- La lista lateral debe mantenerse.
- Debe existir un botón visible para editar ubicaciones.
- El usuario debe poder seleccionar una sede, mover el pin y guardar la nueva coordenada.
- Al recargar la pantalla, las coordenadas editadas deben persistir.

---

# PARTE A — CORREGIR VISUALIZACIÓN DE TODAS LAS SEDES

## Problema actual

La lista muestra 2 sedes, pero el mapa solo muestra 1 pin.

Esto indica que los datos existen en frontend o backend, pero el mapa no está recibiendo o renderizando correctamente todos los marcadores.

## Hipótesis probables

Revisar estas causas antes de modificar:

1. **Formato incorrecto del marcador**
   - El componente `GoogleMapView` podría esperar:
     - `latitude`
     - `longitude`
     - `label`
   - Pero algún mapeo podría estar usando:
     - `lat`
     - `lng`
     - `title`

2. **ID duplicado entre marcadores**
   - Si ambos marcadores usan el mismo `id`, React o el mapa podrían sobrescribir uno.

3. **Filtro de coordenadas demasiado restrictivo**
   - Una sede podría estar siendo descartada por validación.
   - Revisar si `latitude` y `longitude` llegan como string, número, null o undefined.

4. **Uso simultáneo de marcador único y múltiples marcadores**
   - Puede existir conflicto entre props como:
     - `selectedPosition`
     - `marker`
     - `markers`
   - Si se renderiza un marcador único, puede estar anulando la lista completa.

5. **Bounds/zoom incorrecto**
   - Podrían existir 2 marcadores, pero uno queda fuera del área visible.
   - Si hay múltiples marcadores, el mapa debe usar `fitBounds`.

## Archivos probables a revisar

Frontend:

```txt
EcoTacnaFrontend/src/pages/empresa/EmpresaMiEmpresa.tsx
EcoTacnaFrontend/src/components/maps/GoogleMapView.tsx
EcoTacnaFrontend/src/components/maps/mapTypes.ts
EcoTacnaFrontend/src/types.ts
```

Backend solo si se descubre que los datos llegan incompletos:

```txt
EcoTacnaSpringBootJPA/src/main/java/.../controller/...
EcoTacnaSpringBootJPA/src/main/java/.../service/...
EcoTacnaSpringBootJPA/src/main/java/.../dto/...
```

## Reglas de implementación

- No tocar login.
- No tocar pagos.
- No tocar ApiPeruDev.
- No tocar SecurityConfig.
- No tocar BCrypt.
- No cambiar flujo de suscripción.
- No inventar coordenadas.
- No hardcodear sedes.
- No eliminar sedes.
- No crear archivos `backup`, `old`, `copy`, `legacy`, `v1` ni `v2`.
- No romper MAPS_P1, MAPS_P2, MAPS_P3, MAPS_P4 ni MAPS_P5.

## Tarea A1 — Auditar datos reales en “Mi empresa”

En `EmpresaMiEmpresa.tsx`, revisar qué datos llegan para ubicaciones.

Buscar:

```powershell
Select-String -Path .\src\pages\empresa\EmpresaMiEmpresa.tsx -Pattern "locations|sedes|companyLocations|latitude|longitude|validMarkers|GoogleMapView|markers" -Context 2,2
```

Confirmar:

- Cuántas sedes llegan realmente.
- Si la sede principal trae coordenadas.
- Si la sede adicional trae coordenadas.
- Si ambas sedes tienen `latitude` y `longitude`.
- Si ambas sedes tienen identificador único.

Si se usa `console.log` para validar, debe ser temporal y eliminarse al final.

## Tarea A2 — Normalizar marcadores

El array enviado a `GoogleMapView` debe contener una entrada por cada sede.

Formato recomendado:

```ts
{
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
  type?: 'company' | 'selected' | 'branch';
  isPrimary?: boolean;
}
```

Ejemplo conceptual:

```ts
const sedeMarkers = locations
  .filter((location) => isValidCoordinate(location.latitude, location.longitude))
  .map((location, index) => ({
    id: String(location.id ?? `${location.isPrimary ? 'principal' : 'sede'}-${index}`),
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    label: location.isPrimary ? 'Sede principal' : location.name || `Sede adicional ${index}`,
    description: location.reference || location.address || 'Ubicación registrada',
    type: location.isPrimary ? 'company' : 'branch',
    isPrimary: Boolean(location.isPrimary),
  }));
```

Importante:

- No usar `lat` / `lng` si `GoogleMapView` exige `latitude` / `longitude`.
- No usar `title` si el contrato exige `label`.
- Asegurar `id` único para cada marcador.

## Tarea A3 — Revisar `GoogleMapView`

En `GoogleMapView.tsx`, confirmar:

- Que acepte prop `markers`.
- Que valide `latitude` y `longitude`.
- Que no ignore la sede principal.
- Que no reemplace `markers` por un único `selectedPosition`.
- Que renderice todos los marcadores válidos.

Buscar:

```powershell
Select-String -Path .\src\components\maps\GoogleMapView.tsx -Pattern "markers|validMarkers|selectedPosition|AdvancedMarker|Marker|latitude|longitude|label|fitBounds|bounds" -Context 2,2
```

## Tarea A4 — Aplicar `fitBounds` para múltiples sedes

Si hay 2 o más marcadores válidos, el mapa debe ajustar el encuadre.

Comportamiento esperado:

- Con 1 marcador: centrar en ese marcador.
- Con 2 o más marcadores: aplicar bounds para que todos entren en pantalla.

Ejemplo conceptual:

```ts
if (validMarkers.length > 1 && map) {
  const bounds = new google.maps.LatLngBounds();

  validMarkers.forEach((marker) => {
    bounds.extend({
      lat: marker.latitude,
      lng: marker.longitude,
    });
  });

  map.fitBounds(bounds);
}
```

## Tarea A5 — Diferenciar sede principal y sede adicional

Visualmente se recomienda:

- Sede principal: marcador verde o azul destacado.
- Sede adicional: marcador rojo o secundario.

No es obligatorio usar colores específicos si el componente actual ya tiene tipos, pero sí debe diferenciarse al menos por etiqueta o tooltip.

## Validación Parte A

Con la empresa de prueba que tiene 2 sedes:

1. Iniciar sesión como empresa.
2. Entrar a:

```txt
/empresa/mi-empresa
```

3. Ir a **Ubicaciones registradas**.
4. Confirmar:
   - La lista muestra 2 sedes.
   - El mapa muestra 2 pines.
   - La sede principal aparece como marcador.
   - La sede adicional aparece como marcador.
   - Ambos pines se ven sin mover manualmente el mapa.
   - No hay errores en consola.

---

# PARTE B — AGREGAR EDICIÓN DE UBICACIONES

## Objetivo

Permitir que el dueño de la empresa pueda editar la ubicación de una sede ya registrada desde “Mi empresa”.

Esto es necesario porque puede haber errores al registrar la ubicación o el dueño puede necesitar mover el pin después.

## Resultado funcional esperado

En la card **Ubicaciones registradas**, agregar un botón:

```txt
Editar ubicaciones
```

Al hacer clic:

- Se abre un modal amplio o panel de edición.
- El usuario selecciona qué sede editar.
- Se muestra el mapa centrado en esa sede.
- Se puede mover el pin manualmente.
- Se puede usar el buscador Google Places si ya está disponible.
- Se guarda la nueva ubicación.
- La vista se actualiza.
- Al recargar, la nueva ubicación permanece.

## Diseño recomendado

### Vista normal

Dentro de **Ubicaciones registradas**:

- Título.
- Subtítulo.
- Botón **Editar ubicaciones** arriba a la derecha.
- Mapa con todos los pines.
- Lista de sedes.

### Modal de edición

Título:

```txt
Editar ubicaciones
```

Contenido recomendado:

- Selector/lista de sedes.
- Nombre de sede.
- Referencia.
- Buscador Google Places reutilizando `PlaceSearchInput.tsx`.
- Mapa grande.
- Botones:
  - Cancelar.
  - Guardar cambios.

## Reglas de edición

- No permitir guardar sin coordenadas válidas.
- No permitir guardar coordenadas fuera de rango.
- No inventar coordenadas.
- No eliminar sedes en esta fase.
- No cambiar tipo de empresa.
- No cambiar datos SUNAT.
- No cambiar pagos.
- No cambiar login.
- No cambiar suscripción.

## Backend necesario

Para que la edición persista, sí se necesita un endpoint de actualización.

No basta con cambiar estado local en React, porque al recargar se perdería.

## Endpoint recomendado

```txt
PUT /api/empresa/mi-empresa/ubicaciones/{id}
```

O, si el proyecto usa otra convención:

```txt
PUT /api/empresa/ubicaciones/{id}
```

Debe actualizar solamente ubicaciones de la empresa autenticada.

## Payload sugerido

```json
{
  "name": "Sede principal",
  "reference": "Dirección fiscal",
  "latitude": -18.0130000,
  "longitude": -70.2600000,
  "placeId": "opcional",
  "placeName": "opcional",
  "formattedAddress": "opcional",
  "locationSource": "MANUAL_ADJUSTED"
}
```

## Respuesta sugerida

```json
{
  "id": 1,
  "name": "Sede principal",
  "reference": "Dirección fiscal",
  "address": "AV. JORGE BASADRE GROHMANN NRO. 335 FND. PAGO AYMARA",
  "latitude": -18.0130000,
  "longitude": -70.2600000,
  "isPrimary": true
}
```

## Seguridad backend

El backend debe validar que:

- La sede pertenezca a la empresa autenticada.
- La empresa no pueda editar sedes de otra empresa.
- La latitud esté entre `-90` y `90`.
- La longitud esté entre `-180` y `180`.

## Archivos backend probables

Los nombres exactos pueden variar, pero revisar:

```txt
src/main/java/.../controller/CompanyController.java
src/main/java/.../controller/EmpresaController.java
src/main/java/.../service/CompanyService.java
src/main/java/.../service/CompanyProfileService.java
src/main/java/.../service/CompanyLocationService.java
src/main/java/.../repository/CompanyLocationRepository.java
src/main/java/.../dto/CompanyLocationRequest.java
src/main/java/.../dto/CompanyLocationResponse.java
```

Si no existe `CompanyLocationService`, puede crearse de forma controlada.

## Archivos frontend probables

```txt
src/pages/empresa/EmpresaMiEmpresa.tsx
src/components/maps/GoogleMapView.tsx
src/components/maps/PlaceSearchInput.tsx
src/types.ts
src/services/empresaApi.ts
```

## Tarea B1 — Agregar botón de edición

En `EmpresaMiEmpresa.tsx`, agregar botón:

```txt
Editar ubicaciones
```

Ubicación recomendada:

- encabezado de la card **Ubicaciones registradas**.
- alineado a la derecha.

## Tarea B2 — Crear estado de edición

Estados probables:

```ts
const [isLocationEditorOpen, setIsLocationEditorOpen] = useState(false);
const [editingLocation, setEditingLocation] = useState<CompanyLocation | null>(null);
const [editingPosition, setEditingPosition] = useState<MapLatLng | null>(null);
const [isSavingLocation, setIsSavingLocation] = useState(false);
```

## Tarea B3 — Modal de edición

El modal debe:

- ser amplio en desktop.
- usar mapa grande.
- ser responsive.
- tener `max-h-[90vh]`.
- usar `overflow-y-auto`.

Estructura visual sugerida:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
  <div className="max-h-[90vh] w-[95vw] max-w-[1180px] overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl md:p-8">
    {/* contenido */}
  </div>
</div>
```

## Tarea B4 — Selector de sede a editar

El usuario debe poder elegir:

- Sede principal.
- Sede adicional 1.
- Sede adicional 2.
- etc.

Al seleccionar una sede:

- cargar sus coordenadas actuales.
- centrar el mapa en esa sede.
- colocar el pin.

## Tarea B5 — Reutilizar buscador Google Places

Si ya existe:

```txt
src/components/maps/PlaceSearchInput.tsx
```

Reutilizarlo.

No crear otro buscador duplicado.

Comportamiento:

- Seleccionar resultado mueve el pin.
- El usuario aún puede ajustar manualmente.
- Guardar usa la coordenada final.

## Tarea B6 — Guardar ubicación editada

Agregar método en `empresaApi.ts` o servicio equivalente:

```ts
updateCompanyLocation(locationId, payload)
```

Debe llamar al endpoint backend.

Después de guardar:

- actualizar estado local.
- refrescar datos de empresa si ya existe método.
- cerrar modal o mantenerlo con mensaje de éxito.
- actualizar mapa principal.

## Tarea B7 — Persistencia

Validar obligatoriamente:

1. Editar sede principal.
2. Guardar.
3. Recargar navegador.
4. Confirmar que la coordenada nueva sigue ahí.
5. Editar sede adicional.
6. Guardar.
7. Recargar.
8. Confirmar persistencia.

---

# VALIDACIONES OBLIGATORIAS

## Backend

Ejecutar:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
.\mvnw.cmd clean compile
```

Debe pasar sin errores.

## Frontend

Ejecutar:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Debe pasar sin errores.

## Prueba manual A — Ver 2 pines

1. Levantar frontend/backend.
2. Entrar como empresa con 2 sedes.
3. Ir a:

```txt
/empresa/mi-empresa
```

4. Confirmar:
   - lista muestra 2 sedes.
   - mapa muestra 2 pines.

## Prueba manual B — Editar sede principal

1. Clic en **Editar ubicaciones**.
2. Seleccionar **Sede principal**.
3. Mover pin.
4. Guardar cambios.
5. Recargar.
6. Confirmar que el pin de sede principal quedó en la nueva ubicación.

## Prueba manual C — Editar sede adicional

1. Clic en **Editar ubicaciones**.
2. Seleccionar **Sede adicional 1**.
3. Mover pin o usar buscador Google Places.
4. Guardar cambios.
5. Recargar.
6. Confirmar persistencia.

## Prueba manual D — No romper solicitudes

1. Entrar a:

```txt
/empresa/solicitar-recojo
```

2. Seleccionar sede.
3. Confirmar que el mapa se mueve.
4. Confirmar que el payload sigue enviando:

```txt
pickupLatitude
pickupLongitude
```

---

# CRITERIOS DE ACEPTACIÓN

La fase MAPS_P6 queda completa solo si:

- La lista muestra 2 sedes y el mapa muestra 2 pines.
- La sede principal aparece marcada.
- La sede adicional aparece marcada.
- El botón **Editar ubicaciones** existe.
- El usuario puede elegir qué sede editar.
- El usuario puede mover el pin.
- Se puede guardar la ubicación editada.
- La ubicación editada persiste al recargar.
- “Solicitar recojo” sigue usando las sedes.
- El recolector sigue viendo distancias.
- No se tocó login.
- No se tocó pagos.
- No se tocó ApiPeruDev.
- `npm run build` pasa.
- `mvnw clean compile` pasa.

---

# REPORTE FINAL REQUERIDO

Al terminar, entregar:

```text
REPORTE MAPS_P6 — VISUALIZACIÓN COMPLETA Y EDICIÓN DE SEDES

1. Archivos frontend modificados:
2. Archivos backend modificados:
3. ¿Se corrigió el mapa para mostrar todas las sedes? Sí/No
4. ¿La sede principal ya aparece como marcador? Sí/No
5. ¿La sede adicional aparece como marcador? Sí/No
6. ¿Se agregó botón “Editar ubicaciones”? Sí/No
7. ¿Se puede seleccionar qué sede editar? Sí/No
8. ¿Se puede mover el pin manualmente? Sí/No
9. ¿Se reutilizó PlaceSearchInput? Sí/No
10. ¿Los cambios persisten al recargar? Sí/No
11. ¿Solicitar recojo sigue tomando coordenadas de sede? Sí/No
12. ¿Recolector sigue viendo distancia? Sí/No
13. ¿npm run build pasa? Sí/No
14. ¿mvnw clean compile pasa? Sí/No
15. ¿Se tocó login? Sí/No
16. ¿Se tocó pagos? Sí/No
17. ¿Se tocó ApiPeruDev? Sí/No
18. Observaciones:
```

---

# ORDEN RECOMENDADO DE EJECUCIÓN

No hacerlo todo mezclado sin verificar.

## Fase 6A

Primero cerrar:

```txt
Mapa muestra todos los pines.
```

Validación mínima:

- 2 sedes en lista.
- 2 pines en mapa.

## Fase 6B

Después implementar:

```txt
Editar ubicaciones.
```

Validación mínima:

- abrir editor.
- seleccionar sede.
- mover pin.
- guardar.
- recargar.
- persistir.

---

# Nota final

La prioridad inmediata es corregir que la sede principal no aparece como pin.

La edición viene después, pero dentro de esta misma fase MAPS_P6 puede trabajarse en dos subpartes:

- **MAPS_P6A:** visualización completa.
- **MAPS_P6B:** edición persistente.

No avanzar a rutas, tracking GPS ni autoasignación hasta cerrar correctamente esta fase.
