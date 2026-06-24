# MAPS_P2 — Buscador Google Maps/Places en registro principal

## Proyecto

EcoTacna

## Fase

MAPS_P2

## Estado previo obligatorio

Antes de iniciar esta fase, debe estar cerrado MAPS_P1:

- En `Mi empresa` ya existe la sección `Ubicaciones registradas`.
- La lista lateral muestra sede principal y sedes adicionales.
- El mapa ya renderiza los pines correctamente.
- `npm run build` pasa sin errores.
- No hay errores TypeScript relacionados con `latitude`, `longitude` y `label`.

## Objetivo de esta fase

Agregar en el registro de empresa un buscador de Google Maps/Places como ayuda para ubicar el restaurante, manteniendo siempre la confirmación manual del pin.

La ubicación oficial de EcoTacna NO debe ser la ubicación tomada automáticamente de Google. La ubicación oficial debe ser la coordenada final confirmada por el usuario en el mapa.

## Decisión funcional

EcoTacna usará un flujo híbrido:

`RUC/SUNAT -> dirección legal o fiscal`

`Google Maps/Places -> sugerencia del local real`

`Pin manual -> confirmación exacta de punto de recojo`

`BD EcoTacna -> guarda la coordenada final validada`

Google Maps ayuda a encontrar el local, pero el usuario puede ajustar el marcador antes de guardar.

---

# 1. Alcance exacto de MAPS_P2

## Incluido

Implementar solo en el registro principal de empresa:

- Campo visual `Buscar local en Google Maps`.
- Búsqueda por nombre comercial, razón social o dirección.
- Sugerencias de Google Places.
- Al seleccionar un resultado:
  - centrar el mapa en esa ubicación;
  - colocar el pin sugerido;
  - mostrar texto de confirmación;
  - permitir ajuste manual del pin.
- Mantener botón `Guardar ubicación en el mapa`.
- Mantener confirmación manual obligatoria.
- Usar la coordenada final guardada por el flujo actual.

## No incluido todavía

No implementar en esta fase:

- Buscador en el modal de sede adicional.
- Edición de sedes existentes.
- Eliminación de sedes.
- Selección de sede al solicitar recojo.
- Recolector más cercano.
- Rutas o Directions API.
- Tracking GPS.
- Cambios de pagos.
- Cambios de login.
- Cambios de ApiPeruDev.
- Cambios de SecurityConfig.
- Certificados ambientales.
- Trazabilidad QR.

---

# 2. Reglas estrictas

- Modificar solo frontend, salvo que se confirme que el frontend no puede cargar Places sin un ajuste mínimo de configuración.
- No tocar backend.
- No tocar endpoints.
- No tocar login.
- No tocar pagos.
- No tocar ApiPeruDev.
- No tocar SecurityConfig.
- No tocar BCrypt.
- No cambiar payload de registro en esta fase, salvo que ya exista soporte actual y solo se reutilice.
- No guardar automáticamente ubicación de Google sin confirmación.
- No hardcodear coordenadas.
- No exponer la API Key de Google Maps.
- No crear archivos `backup`, `old`, `copy`, `legacy`, `v1` ni `v2`.
- No duplicar componentes si puede hacerse reutilizable y limpio.
- No romper el mapa manual existente.

---

# 3. Archivos permitidos

## Frontend principal

`EcoTacnaFrontend/src/pages/RegisterCompanyPage.tsx`

## Componentes de mapa permitidos

`EcoTacnaFrontend/src/components/maps/GoogleMapView.tsx`

`EcoTacnaFrontend/src/components/maps/mapTypes.ts`

`EcoTacnaFrontend/src/components/maps/mapConstants.ts`

## Nuevo componente permitido si ayuda a mantener limpio el código

`EcoTacnaFrontend/src/components/maps/PlaceSearchInput.tsx`

o nombre equivalente, siempre que sea claro y no duplique lógica innecesaria.

## No tocar

- Servicios de autenticación.
- Servicios de pagos.
- `authStorage`.
- APIs de RUC.
- Backend Java.
- `.env.local`.
- `.env`.
- `SecurityConfig`.

---

# 4. Diagnóstico inicial obligatorio

Antes de modificar, revisar cómo está implementado el mapa en registro.

Ejecutar en frontend:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Select-String -Path .\src\pages\RegisterCompanyPage.tsx -Pattern "Ubicación del restaurante|GoogleMapView|selectedPickupLocation|pickupLatitude|pickupLongitude|Guardar ubicación en el mapa|Agregar otra sede|onClick|onLocation" -Context 2,2

Select-String -Path .\src\components\maps\GoogleMapView.tsx -Pattern "APIProvider|useMap|AdvancedMarker|Marker|onClick|selectable|selected|latitude|longitude|libraries|places|apiKey" -Context 2,2

Select-String -Path .\src\components\maps\mapTypes.ts -Pattern "latitude|longitude|label|marker|selectable|selected|type" -Context 2,2
```

Confirmar:

1. Nombre exacto del estado que guarda la ubicación principal.
2. Nombre exacto de la función que recibe clic manual en el mapa.
3. Si `GoogleMapView` ya permite selección manual.
4. Si `GoogleMapView` ya carga `APIProvider`.
5. Si existe soporte para librería `places`.

No modificar nada hasta entender ese flujo.

---

# 5. Diseño UX requerido

En la tarjeta derecha del registro:

## Título actual

`Ubicación del restaurante`

## Debe agregarse debajo de la dirección SUNAT o antes del mapa

Label:

`Buscar local en Google Maps`

Placeholder:

`Busca por nombre comercial, razón social o dirección`

Texto auxiliar:

`Puedes usar Google Maps como ayuda y luego ajustar manualmente el pin exacto de recojo.`

## Comportamiento visual

- Input con estilo consistente al sistema.
- Icono de búsqueda opcional.
- Lista de sugerencias limpia.
- Al seleccionar una sugerencia, mostrar un chip o mensaje:

`Ubicación sugerida por Google. Confirma o ajusta el pin antes de guardar.`

- Si el usuario mueve el pin o hace clic en el mapa después de seleccionar una sugerencia, mostrar:

`Ubicación ajustada manualmente.`

- El botón `Guardar ubicación en el mapa` sigue siendo obligatorio.

---

# 6. Flujo funcional requerido

## 6.1. Después de consultar RUC

Cuando ya existen datos RUC, preparar una búsqueda sugerida usando, en orden de prioridad:

1. Nombre comercial si existe y no es `No especificado`.
2. Razón social.
3. Dirección fiscal.
4. Distrito/provincia/departamento.
5. Tacna, Perú.

Ejemplo de texto sugerido:

`GLORIETA TACNEÑA S.A.C. Tacna Perú`

o:

`AV. JORGE BASADRE GROHMANN NRO. 335 FND. PAGO AYMARA Tacna Perú`

No ejecutar una selección automática. Solo precargar o sugerir búsqueda.

## 6.2. Al escribir en el buscador

- Buscar sugerencias de Google Places.
- Restringir o sesgar la búsqueda a Perú/Tacna si el API lo permite.
- Usar debounce para no consultar en cada tecla.
- No mostrar resultados vacíos como error crítico.
- Manejar carga y errores de forma visual.

## 6.3. Al seleccionar un resultado

Obtener coordenadas del lugar seleccionado.

Luego:

- centrar el mapa en esa coordenada;
- colocar el pin en esa coordenada;
- actualizar el mismo estado que se usa actualmente para ubicación manual;
- marcar origen temporal como `GOOGLE_PLACE`;
- mostrar confirmación visual;
- NO registrar todavía como definitivo hasta que el usuario presione `Guardar ubicación en el mapa`.

## 6.4. Si el usuario hace clic manualmente en el mapa

- Actualizar coordenadas como ya funciona actualmente.
- Si venía de Google Places, cambiar origen temporal a `GOOGLE_PLACE_ADJUSTED`.
- Si nunca eligió resultado de Google, origen temporal `MANUAL`.
- Mantener la coordenada final como la seleccionada manualmente.

## 6.5. Al presionar `Guardar ubicación en el mapa`

- Guardar la coordenada final actual.
- Mantener la lógica existente.
- Mostrar mensaje de éxito actual o equivalente.
- No guardar coordenadas nulas.
- No permitir continuar si no hay ubicación final confirmada.

---

# 7. Implementación técnica sugerida

## 7.1. Usar componente reusable

Crear un componente frontend simple:

`src/components/maps/PlaceSearchInput.tsx`

Responsabilidades:

- Recibir `initialQuery`.
- Recibir callback `onPlaceSelected`.
- Renderizar input.
- Renderizar sugerencias.
- Manejar carga/error.
- No guardar datos globales.
- No tocar backend.

Props sugeridas:

```ts
type PlaceSearchInputProps = {
  initialQuery?: string;
  placeholder?: string;
  disabled?: boolean;
  onPlaceSelected: (place: {
    placeId?: string;
    name?: string;
    formattedAddress?: string;
    latitude: number;
    longitude: number;
  }) => void;
};
```

## 7.2. Evitar acoplamiento fuerte

`PlaceSearchInput` no debe saber nada de RUC, empresa, pagos o registro.

Solo devuelve una ubicación sugerida.

`RegisterCompanyPage.tsx` decide cómo usarla.

## 7.3. Integración con `GoogleMapView`

Si el mapa ya acepta una ubicación seleccionada, reutilizar esa prop.

Si no existe forma de centrar el mapa desde una nueva coordenada, extender `GoogleMapView` con una prop opcional, sin romper usos actuales:

```ts
selectedLocation?: {
  latitude: number;
  longitude: number;
  label?: string;
}
```

o reutilizar el tipo ya existente en `mapTypes.ts`.

## 7.4. No cambiar contrato actual de marcadores

Recordatorio de MAPS_P1:

El contrato correcto usa:

- `latitude`
- `longitude`
- `label`

No volver a usar `lat` y `lng` si `mapTypes.ts` exige `latitude` y `longitude`.

---

# 8. Manejo de errores

## Sin API key

Si falta `VITE_GOOGLE_MAPS_API_KEY`:

- El mapa debe seguir mostrando fallback actual.
- El buscador debe deshabilitarse con mensaje:

`El buscador de Google Maps no está disponible porque falta configuración de mapas.`

No romper el registro.

## Sin resultados

Mostrar:

`No se encontraron locales con ese texto. Puedes marcar el punto manualmente en el mapa.`

## Error de Google Places

Mostrar:

`No se pudo consultar Google Maps. Puedes continuar marcando el punto manualmente.`

## Resultado sin coordenadas

Ignorar el resultado y mostrar:

`El resultado seleccionado no tiene coordenadas disponibles. Intenta otro resultado o marca el punto manualmente.`

---

# 9. Validaciones de calidad

## Build

Ejecutar:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Debe pasar sin errores TypeScript.

## Levantar frontend

```powershell
npm run dev -- --host 0.0.0.0 --port 8080 --strictPort --force
```

Abrir:

```text
http://localhost:8080/registro?maps-p2=places-principal
```

---

# 10. Prueba manual obligatoria

## Caso 1 — Flujo manual sigue funcionando

1. Abrir `/registro`.
2. Consultar RUC.
3. No usar buscador.
4. Hacer clic manualmente en el mapa.
5. Guardar ubicación.
6. Continuar registro.
7. Confirmar que no se rompió el flujo anterior.

Resultado esperado:

El flujo manual sigue funcionando como antes.

## Caso 2 — Buscar local en Google Maps

1. Abrir `/registro`.
2. Consultar RUC.
3. Usar `Buscar local en Google Maps`.
4. Escribir nombre o dirección.
5. Seleccionar resultado.
6. Confirmar que el mapa se centra.
7. Confirmar que aparece el pin.
8. Presionar `Guardar ubicación en el mapa`.
9. Continuar registro.

Resultado esperado:

La ubicación sugerida por Google se usa como punto inicial, pero queda confirmada solo al guardar.

## Caso 3 — Buscar y ajustar manualmente

1. Seleccionar resultado de Google.
2. Luego hacer clic en otro punto del mapa.
3. Confirmar que el pin cambia.
4. Guardar ubicación.

Resultado esperado:

La coordenada final es la ajustada manualmente, no la sugerencia original de Google.

## Caso 4 — Sin resultados

1. Escribir texto que no exista.
2. Confirmar que aparece mensaje amigable.
3. Marcar manualmente en el mapa.

Resultado esperado:

El usuario puede continuar sin depender de Google Places.

---

# 11. Criterios de aceptación

MAPS_P2 queda cerrado cuando:

- Existe buscador `Buscar local en Google Maps` en registro principal.
- Se pueden obtener sugerencias de Google Places.
- Al seleccionar un resultado se centra el mapa.
- Al seleccionar un resultado aparece pin.
- El usuario puede ajustar el pin manualmente.
- El botón `Guardar ubicación en el mapa` sigue siendo la confirmación final.
- El registro manual sin buscador sigue funcionando.
- No se cambió backend.
- No se rompió captcha.
- No se rompió RUC.
- No se rompió login.
- No se rompieron pagos.
- `npm run build` pasa.

---

# 12. Reporte final obligatorio

Al terminar, entregar:

```text
REPORTE MAPS_P2 — BUSCADOR GOOGLE MAPS EN REGISTRO PRINCIPAL

1. Archivos frontend modificados:
2. ¿Se creó componente nuevo? Sí/No. Nombre:
3. ¿Se tocó backend? Sí/No
4. ¿Se tocó login? Sí/No
5. ¿Se tocó pagos? Sí/No
6. ¿Se tocó ApiPeruDev? Sí/No
7. ¿Se tocó SecurityConfig? Sí/No
8. ¿El buscador aparece en registro principal? Sí/No
9. ¿Seleccionar resultado centra el mapa? Sí/No
10. ¿Seleccionar resultado coloca pin? Sí/No
11. ¿El usuario puede ajustar manualmente el pin después? Sí/No
12. ¿Guardar ubicación sigue siendo obligatorio? Sí/No
13. ¿El flujo manual sin buscador sigue funcionando? Sí/No
14. ¿npm run build pasa? Sí/No
15. Observaciones:
```

---

# 13. Nota para Antigravity

No avanzar todavía al modal de sedes adicionales.

Este archivo corresponde solo a MAPS_P2:

**Buscador Google Maps/Places en la sede principal del registro de empresa.**

Cuando MAPS_P2 esté confirmado visualmente y con build correcto, recién se debe pasar a MAPS_P3 para sedes adicionales.
