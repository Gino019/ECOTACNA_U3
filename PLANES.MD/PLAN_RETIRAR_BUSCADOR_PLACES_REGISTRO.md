# PLAN QUIRURGICO — RETIRAR BUSCADOR GOOGLE PLACES SOLO DEL REGISTRO

## Objetivo

Eliminar del modulo de registro `/registro` el buscador de Google Places y su boton `Buscar`, porque no esta funcionando de forma confiable y ya no sera parte del flujo de registro.

La ubicacion del restaurante se mantendra mediante seleccion manual en el mapa, que actualmente si funciona:

```text
Usuario abre /registro
-> consulta RUC
-> ubica el mapa
-> hace clic manualmente en el punto exacto
-> guarda ubicacion en el mapa
-> continua registro
```

Esta limpieza debe hacerse primero solo en el registro. No debe romper el mapa, el pin manual, el guardado de coordenadas ni los modulos donde aun se esta evaluando si se mantiene o no `PlaceSearchInput`.

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

## Decision funcional

En el registro inicial ya no se usara Google Places.

Se elimina del formulario:

```text
Buscar local en Google Maps
Input de busqueda
Boton Buscar
Sugerencias / resultados de Places
Mensajes de error de Places
Texto que diga que se puede usar Google Maps como ayuda de busqueda
```

Se conserva:

```text
Direccion segun SUNAT
Mapa de Google Maps
Pin manual
Click en mapa para seleccionar punto
Coordenadas seleccionadas
Boton Guardar ubicacion en el mapa
Validacion obligatoria de ubicacion antes de registrar
Payload con latitude y longitude
```

---

## Reglas estrictas

- Tocar primero solo el modulo `/registro`.
- No tocar backend si no existe endpoint real de Places.
- No tocar base de datos.
- No tocar login.
- No tocar pagos.
- No tocar Culqi.
- No tocar ApiPeruDev.
- No tocar recolector.
- No tocar incidencias.
- No tocar estados de recojo.
- No eliminar Google Maps del registro.
- No eliminar `GoogleMapView`.
- No eliminar seleccion manual del pin.
- No eliminar `VITE_GOOGLE_MAPS_API_KEY`, porque el mapa aun la necesita.
- No desinstalar `@vis.gl/react-google-maps`, porque el mapa lo usa.
- No borrar `PlaceSearchInput.tsx` todavia si otros modulos lo usan.
- No crear archivos `old`, `copy`, `backup`, `legacy`, `v1`, `v2`.
- No ocultar el buscador con CSS. El JSX debe eliminarse del registro.
- No cerrar hasta que `/registro` cargue sin pantalla blanca.

---

## 1. Diagnostico de usos de PlaceSearchInput

Ejecutar en frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "PlaceSearchInput|Buscar local en Google Maps|Busca por nombre comercial|Buscar en Maps|onPlaceSelected|GOOGLE_PLACES|placeSearch|places" -Context 5,5
```

Identificar si `PlaceSearchInput` se usa en:

```text
src/pages/RegisterCompanyPage.tsx
src/pages/empresa/EmpresaMiEmpresa.tsx
otros modulos
```

Para esta fase solo se modifica `RegisterCompanyPage.tsx` o el archivo real de `/registro`.

---

## 2. Retirar import del buscador en registro

Archivo probable:

```text
src/pages/RegisterCompanyPage.tsx
```

Eliminar import como:

```tsx
import PlaceSearchInput from '@/components/maps/PlaceSearchInput';
```

o equivalente real.

No eliminar imports de:

```tsx
GoogleMapView
MapLatLng
mapConstants
```

si siguen siendo usados por el mapa manual.

---

## 3. Eliminar JSX del buscador en `/registro`

Buscar el bloque visual:

```text
Buscar local en Google Maps
[input]
Buscar
Puedes usar Google Maps como ayuda y luego ajustar manualmente el pin exacto de recojo.
```

Eliminar completamente ese JSX.

No dejar:

```tsx
hidden
className="hidden"
style={{ display: 'none' }}
{false && <PlaceSearchInput />}
```

Debe eliminarse del render.

---

## 4. Reemplazar texto de ayuda por flujo manual

Donde antes decia algo similar a:

```text
Puedes usar Google Maps como ayuda y luego ajustar manualmente el pin exacto de recojo.
```

reemplazar por:

```text
Haz clic en el mapa para marcar la ubicacion exacta del restaurante.
```

Tambien se puede usar:

```text
Selecciona manualmente el punto exacto de recojo en el mapa.
```

No mencionar busqueda, Google Places ni boton Buscar.

---

## 5. Preservar mapa manual

Confirmar que el mapa se siga renderizando siempre.

Debe quedar algo conceptualmente equivalente a:

```tsx
<GoogleMapView
  markers={...}
  selectedPosition={selectedCoords}
  selectable={true}
  onSelectPosition={(position) => {
    setSelectedCoords(position);
    setIsLocationSaved(false);
  }}
/>
```

Ajustar a nombres reales.

Regla:

```text
Click en mapa -> actualiza coordenadas -> mueve pin -> permite guardar ubicacion.
```

---

## 6. Limpiar estados y handlers del buscador usados solo en registro

En `RegisterCompanyPage.tsx`, eliminar estados/handlers que queden sin uso, por ejemplo:

```text
searchText
placeSearch
selectedPlace
placeOrigin
locationSource = GOOGLE_PLACES
handlePlaceSelected
handleSearchPlace
handlePlaceSearch
```

Solo eliminar si eran exclusivos del buscador de Places en registro.

No eliminar estados usados por el mapa manual:

```text
selectedCoords
selectedPickupLocation
isLocationSaved
latitude
longitude
```

---

## 7. Mantener origen manual de ubicacion

Si el codigo usaba un campo como:

```text
locationSource
pickupLocationSource
GOOGLE_PLACES
MANUAL
```

Dejar el registro trabajando solo con:

```text
MANUAL
```

Pero no agregar campos nuevos al backend.

Si ese campo no viaja al backend o no es necesario, eliminarlo del frontend si queda sin uso.

---

## 8. Mantener validaciones de ubicacion

Antes de registrar empresa, debe seguir siendo obligatorio guardar una ubicacion valida.

Validaciones que deben mantenerse:

```text
latitud y longitud no nulas
latitud entre -90 y 90
longitud entre -180 y 180
ubicacion guardada antes de enviar registro
```

Mensaje sugerido:

```text
Debes seleccionar y guardar la ubicacion del restaurante en el mapa.
```

---

## 9. Confirmar payload de registro

El registro debe seguir enviando coordenadas al backend.

Revisar payload en `RegisterCompanyPage.tsx`:

```tsx
latitude: selectedCoords.latitude
longitude: selectedCoords.longitude
```

O nombres reales equivalentes.

No eliminar:

```text
latitude
longitude
branches
```

si ya forman parte del contrato del backend.

---

## 10. Auditar dependencias frontend

Por esta fase NO se debe borrar:

```text
src/components/maps/PlaceSearchInput.tsx
@vis.gl/react-google-maps
VITE_GOOGLE_MAPS_API_KEY
```

Motivo:

```text
1. GoogleMapView todavia usa Google Maps.
2. Otros modulos pueden seguir usando PlaceSearchInput temporalmente.
3. La API key sigue siendo necesaria para el mapa.
```

Solo si despues de auditar se confirma que `PlaceSearchInput` ya no se usa en ningun modulo, se podra plantear una fase 2 para eliminar el componente y limpiar imports globales.

---

## 11. Confirmar que backend no tiene nada de Places

Ejecutar en backend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"

Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "Google Places|Places|placeId|place_id|maps.googleapis|geocode|geocoding|autocomplete" -Context 5,5
```

Resultado esperado:

```text
No hay backend real de Places para el registro.
```

Si no existe backend de Places, no tocar backend.

Si existiera un endpoint proxy usado solo por `/registro`, reportarlo antes de eliminar.

---

## 12. Validacion visual en `/registro`

Abrir:

```text
http://localhost:8080/registro
```

Validar:

```text
1. La pantalla ya no queda en blanco.
2. Ya no aparece Buscar local en Google Maps.
3. Ya no aparece input de busqueda.
4. Ya no aparece boton Buscar.
5. El mapa sigue cargando.
6. El pin manual sigue funcionando.
7. Al hacer clic en el mapa cambian las coordenadas.
8. El boton Guardar ubicacion en el mapa sigue funcionando.
9. El registro sigue exigiendo ubicacion antes de enviar.
10. El registro sigue enviando latitude y longitude.
```

---

## 13. Validacion de consola y Network

En DevTools:

```text
Console
Network
```

Confirmar:

```text
No hay pantalla blanca.
No hay error de PlaceSearchInput.
No hay llamada a Places Autocomplete.
No hay llamada a Places findPlaceFromQuery.
No hay error google is not defined.
No hay error useMapsLibrary fuera de provider.
```

El mapa puede seguir cargando scripts de Google Maps. Eso esta bien.

---

## 14. Limpieza de codigo residual en registro

Ejecutar:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Get-ChildItem .\src\pages -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "PlaceSearchInput|Buscar local en Google Maps|Busca por nombre comercial|Buscar en Maps|GOOGLE_PLACES|handlePlace" -Context 3,3
```

Confirmar que en el archivo del registro ya no hay referencias al buscador.

Puede seguir habiendo referencias en `EmpresaMiEmpresa.tsx` si aun no se ha hecho la fase 2.

---

## 15. Build frontend

Ejecutar:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Debe pasar sin errores.

---

## 16. Reinicio limpio de Vite si persiste pantalla blanca

Si despues del cambio sigue pantalla blanca:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
Remove-Item -Recurse -Force .\node_modules\.vite -ErrorAction SilentlyContinue
npm run dev -- --host 0.0.0.0 --port 8080 --strictPort --force
```

Luego recargar con Ctrl + F5.

---

# FASE 2 OPCIONAL — Retirar PlaceSearchInput del resto del sistema

No ejecutar todavia salvo orden expresa.

Cuando se decida retirar el buscador de todos los modulos:

```text
1. Eliminar uso en /empresa/mi-empresa.
2. Confirmar que ningun archivo importe PlaceSearchInput.
3. Borrar src/components/maps/PlaceSearchInput.tsx.
4. Quitar dependencias de Places si existieran.
5. Mantener Google Maps para mapas y pines manuales.
```

No desinstalar librerias de mapas si `GoogleMapView` y `RouteMapView` siguen usandolas.

---

## Reporte final obligatorio

```text
CIERRE RETIRO BUSCADOR PLACES SOLO REGISTRO

1. Ruta frontend actual:
2. Archivo modificado del registro:
3. ¿Se elimino import de PlaceSearchInput en registro? Sí/No
4. ¿Se elimino JSX del buscador en registro? Sí/No
5. ¿Se elimino boton Buscar en registro? Sí/No
6. ¿Se eliminaron handlers/estados no usados del buscador? Sí/No
7. ¿El mapa sigue cargando? Sí/No
8. ¿El pin manual sigue funcionando? Sí/No
9. ¿Guardar ubicacion en el mapa sigue funcionando? Sí/No
10. ¿El payload sigue enviando latitude/longitude? Sí/No
11. ¿Se toco backend? Sí/No
12. Si se toco backend, explicar por que:
13. ¿Quedaron referencias a PlaceSearchInput dentro del archivo de registro? Sí/No
14. ¿/registro carga sin pantalla blanca? Sí/No
15. ¿npm run build pasa? Sí/No
16. Observaciones:
```

No cerrar hasta que `/registro` quede sin buscador, sin boton Buscar, sin pantalla blanca, y con seleccion manual del mapa funcionando.
