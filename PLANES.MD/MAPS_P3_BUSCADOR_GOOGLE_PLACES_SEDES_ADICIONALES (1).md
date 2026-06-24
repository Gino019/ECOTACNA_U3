# MAPS_P3 — BUSCADOR GOOGLE PLACES EN SEDES ADICIONALES

## Proyecto

EcoTacna

## Módulo

Registro de empresa → Modal **Agregar sede adicional**

Ruta principal de prueba:

`http://localhost:8080/registro`

## Estado previo confirmado

Ya se completó MAPS_P1:

- La pantalla **Mi empresa** muestra la sección **Ubicaciones registradas**.
- Las sedes se listan al costado.
- Los marcadores ya se renderizan correctamente en Google Maps.
- Se corrigió el contrato de marcadores para usar `latitude`, `longitude` y `label`.

Ya se completó MAPS_P2:

- Se creó `src/components/maps/PlaceSearchInput.tsx`.
- Se integró el buscador híbrido de Google Places en la sede principal del registro.
- Al seleccionar un resultado, el mapa se centra y coloca el pin sugerido.
- El usuario aún puede ajustar manualmente el pin.
- Guardar ubicación sigue siendo obligatorio.
- `npm run build` pasó correctamente.

## Objetivo de MAPS_P3

Extender la solución híbrida de Google Places al modal **Agregar sede adicional**, manteniendo la misma lógica funcional aplicada en la sede principal:

1. El usuario puede buscar una sede/local en Google Maps.
2. Al seleccionar un resultado, el mapa del modal se centra en esa ubicación.
3. Se coloca un pin sugerido.
4. El usuario puede ajustar manualmente el pin.
5. La sede adicional solo se guarda cuando el usuario presiona **Guardar Sede**.
6. La sede adicional debe aparecer luego en **Mi empresa** como tarjeta lateral y marcador en el mapa.

## Decisión funcional

Google Places solo es una ayuda de búsqueda.

La coordenada oficial de EcoTacna para la sede adicional será la ubicación final confirmada por el usuario dentro del modal.

Flujo correcto:

`Buscar sede en Google Maps → Seleccionar sugerencia → Centrar mapa → Ajustar pin manualmente si corresponde → Guardar Sede → Registrar sede en el arreglo de sedes adicionales`

---

# 1. Alcance permitido

## 1.1. Se debe implementar

- Buscador Google Places dentro del modal **Agregar sede adicional**.
- Reutilización del componente `PlaceSearchInput.tsx` creado en MAPS_P2.
- Centrado automático del mapa del modal al seleccionar una sugerencia.
- Colocación automática del pin sugerido.
- Ajuste manual posterior mediante clic en mapa.
- Indicador visual del origen de ubicación:
  - Manual.
  - Google Places.
  - Google Places ajustado manualmente.
- Guardado de la sede adicional con sus coordenadas finales.

## 1.2. No se debe implementar todavía

- Edición de sedes ya guardadas.
- Eliminación de sedes.
- Selección de sede al solicitar recojo.
- Cálculo de recolector más cercano.
- Rutas, Directions API o Navigation SDK.
- Geocoding automático obligatorio.
- Cambios en pagos.
- Cambios en login.
- Cambios en ApiPeruDev.
- Cambios en SecurityConfig.
- Cambios en backend, salvo que se detecte que el payload actual no guarda correctamente los datos ya existentes de sedes.

---

# 2. Reglas estrictas

- Modificar solo frontend en esta fase.
- No tocar backend salvo autorización posterior.
- No tocar login.
- No tocar pagos.
- No tocar ApiPeruDev.
- No tocar SecurityConfig.
- No tocar BCrypt.
- No tocar suscripciones.
- No modificar endpoints.
- No cambiar nombres de campos enviados al backend si ya funcionan.
- No exponer la API key de Google Maps.
- No hardcodear coordenadas.
- No inventar sedes.
- No crear archivos `backup`, `old`, `copy`, `legacy`, `v1` ni `v2`.
- No duplicar carpetas.
- Mantener compatibilidad responsive.

---

# 3. Archivos permitidos

## 3.1. Archivo principal

`EcoTacnaFrontend/src/pages/RegisterCompanyPage.tsx`

## 3.2. Componente ya creado en MAPS_P2

`EcoTacnaFrontend/src/components/maps/PlaceSearchInput.tsx`

Solo editarlo si hace falta hacerlo reutilizable para el modal sin romper la sede principal.

## 3.3. Componentes de mapa

Solo si es estrictamente necesario:

- `EcoTacnaFrontend/src/components/maps/GoogleMapView.tsx`
- `EcoTacnaFrontend/src/components/maps/mapTypes.ts`
- `EcoTacnaFrontend/src/components/maps/mapConstants.ts`

No modificar otros servicios, storage, auth ni APIs.

---

# 4. Diagnóstico previo obligatorio

Antes de modificar, ubicar el bloque del modal de sede adicional.

Ejecutar desde el frontend:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
Select-String -Path .\src\pages\RegisterCompanyPage.tsx -Pattern "Agregar sede adicional|Guardar Sede|Nombre de la sede|Referencia|showAdditional|additional|branch|sede|modal|GoogleMapView|PlaceSearchInput" -Context 3,3
```

Confirmar:

- Nombre del estado que abre/cierra el modal.
- Estado actual de la sede adicional.
- Estado actual de coordenadas del modal.
- Cómo se guarda una sede adicional.
- Cómo se renderiza el mapa del modal.
- Si ya existe un estado para `selectedAdditionalLocation`, `additionalLocation`, `branchLocation` o similar.

---

# 5. Diseño funcional del modal

## 5.1. Campos actuales esperados

El modal debe conservar:

- Título: `Agregar sede adicional`.
- Campo: `Nombre de la sede *`.
- Campo: `Referencia (opcional)`.
- Mapa para marcar ubicación.
- Botón: `Cancelar`.
- Botón: `Guardar Sede`.
- Botón cerrar `X`.

## 5.2. Nuevo campo a agregar

Agregar debajo de los datos básicos o encima del mapa:

**Buscar esta sede en Google Maps**

Placeholder recomendado:

`Busca por nombre, dirección o referencia de la sede`

Texto auxiliar recomendado:

`Puedes buscar la sede en Google Maps o marcar manualmente el punto exacto en el mapa.`

## 5.3. Ubicación visual recomendada

En desktop, si el modal ya está en dos columnas:

Columna izquierda:

- Nombre de sede.
- Referencia.
- Buscador Google Places.
- Estado de ubicación seleccionada.
- Botones.

Columna derecha:

- Mapa grande.

Si el modal está en una sola columna:

Orden recomendado:

1. Nombre de sede.
2. Referencia.
3. Buscador Google Places.
4. Mapa.
5. Mensaje de estado.
6. Botones.

---

# 6. Reutilización de `PlaceSearchInput`

## 6.1. Comportamiento esperado

El componente `PlaceSearchInput` debe permitir:

- Recibir un `initialQuery` o `suggestedQuery`.
- Buscar con debounce.
- Restringir resultados a Perú.
- Retornar la selección con:
  - `placeId`.
  - `name`.
  - `formattedAddress`.
  - `latitude`.
  - `longitude`.

## 6.2. No duplicar componente

No crear otro buscador llamado:

- `PlaceSearchInputModal.tsx`
- `PlaceSearchBranch.tsx`
- `GooglePlacesSearch2.tsx`

Primero intentar reutilizar `PlaceSearchInput.tsx`.

Solo si el componente está muy acoplado a sede principal, refactorizarlo de forma mínima y compatible.

---

# 7. Estado recomendado en `RegisterCompanyPage.tsx`

Usar o adaptar estados existentes.

Estados conceptuales recomendados:

```ts
const [additionalPlaceMetadata, setAdditionalPlaceMetadata] = useState<{
  placeId?: string;
  placeName?: string;
  formattedAddress?: string;
  locationSource?: 'MANUAL' | 'GOOGLE_PLACE' | 'GOOGLE_PLACE_ADJUSTED';
} | null>(null);
```

La coordenada del modal debe mantenerse en el estado que ya exista.

Si no existe, usar uno equivalente a:

```ts
const [additionalLocation, setAdditionalLocation] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);
```

No crear estados redundantes si ya existen.

---

# 8. Flujo al seleccionar un resultado de Google Places

Cuando el usuario selecciona un resultado en el buscador del modal:

1. Tomar `latitude` y `longitude` del resultado.
2. Actualizar la ubicación del modal.
3. Centrar el mapa en esa coordenada.
4. Colocar el pin.
5. Guardar metadata temporal:
   - `placeId`.
   - `placeName`.
   - `formattedAddress`.
   - `locationSource = GOOGLE_PLACE`.
6. Mostrar texto visual:

`Ubicación sugerida desde Google Maps. Puedes ajustar el pin manualmente si es necesario.`

---

# 9. Flujo al hacer clic manual en el mapa del modal

Cuando el usuario hace clic en el mapa:

Si no había selección de Google:

- Actualizar coordenadas.
- `locationSource = MANUAL`.
- Mostrar:

`Ubicación marcada manualmente.`

Si venía de Google Places:

- Actualizar coordenadas.
- Mantener metadata del lugar si se desea.
- Cambiar `locationSource = GOOGLE_PLACE_ADJUSTED`.
- Mostrar:

`Ubicación ajustada manualmente después de seleccionar Google Maps.`

---

# 10. Flujo al guardar sede

Al presionar **Guardar Sede**:

Validar:

- Nombre de sede obligatorio.
- Coordenadas obligatorias.
- Latitud válida.
- Longitud válida.

La sede debe guardarse en el arreglo actual de sedes adicionales con:

- `name`.
- `reference`.
- `latitude`.
- `longitude`.
- `placeId`, si existe.
- `placeName`, si existe.
- `formattedAddress`, si existe.
- `locationSource`.
- `isPrimary = false`.

Si el contrato actual aún no contempla metadata de Places, no romper el guardado actual. Se puede mantener la metadata solo en frontend por ahora o agregarla si los tipos actuales ya lo permiten.

La prioridad de MAPS_P3 es que la sede adicional se guarde con coordenadas finales correctas.

---

# 11. UI esperada

## 11.1. Modal amplio

El modal ya debe verse amplio desde el ajuste anterior.

Mantener:

- Modal ancho en desktop.
- Mapa grande.
- Layout responsive.

## 11.2. Buscador

Debe verse integrado con el diseño actual:

- Label claro.
- Input redondeado.
- Lista de sugerencias limpia.
- Estados de carga si aplica.
- Estado deshabilitado si Google Maps API no está disponible.

## 11.3. Mensajes visuales sugeridos

Sin ubicación:

`Busca una sede en Google Maps o marca manualmente el punto exacto.`

Resultado seleccionado:

`Ubicación sugerida desde Google Maps. Puedes ajustar el pin si es necesario.`

Ajuste manual:

`Ubicación ajustada manualmente.`

Guardado exitoso:

`Sede adicional agregada correctamente.`

---

# 12. Validación técnica

## 12.1. Build frontend

Ejecutar:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Debe pasar sin errores TypeScript.

## 12.2. Levantar Vite

```powershell
npm run dev -- --host 0.0.0.0 --port 8080 --strictPort --force
```

Abrir:

`http://localhost:8080/registro?maps=p3-sedes-adicionales`

---

# 13. Prueba manual obligatoria

## Caso 1 — Sede adicional con Google Places

1. Abrir `/registro`.
2. Consultar un RUC válido.
3. Esperar que aparezca la tarjeta de ubicación principal.
4. Clic en **Agregar otra sede**.
5. Escribir nombre de sede.
6. Buscar la sede en Google Maps desde el nuevo buscador.
7. Seleccionar un resultado.
8. Confirmar que el mapa del modal se centra.
9. Confirmar que aparece el pin.
10. Presionar **Guardar Sede**.
11. Confirmar que la sede aparece en el listado o estado del registro.

## Caso 2 — Sede adicional con Google Places y ajuste manual

1. Repetir flujo anterior.
2. Seleccionar resultado de Google Places.
3. Hacer clic en otro punto del mapa.
4. Confirmar mensaje de ajuste manual.
5. Guardar sede.
6. Confirmar que se guardan las coordenadas ajustadas, no las originales de Google.

## Caso 3 — Sede adicional sin buscador

1. Abrir modal.
2. Escribir nombre de sede.
3. No usar buscador.
4. Clic manual en el mapa.
5. Guardar sede.
6. Confirmar que el flujo manual sigue funcionando.

## Caso 4 — Validación requerida

1. Abrir modal.
2. Escribir nombre de sede.
3. No marcar ubicación.
4. Presionar **Guardar Sede**.
5. Confirmar que se muestra validación y no se guarda sede inválida.

---

# 14. Validación posterior en “Mi empresa”

Después de registrar una empresa con sede adicional:

1. Iniciar sesión con la empresa.
2. Ir a `/empresa/mi-empresa`.
3. Confirmar que aparece la sede adicional.
4. Confirmar que el mapa muestra su marcador.
5. Confirmar que no aparecen sedes de otra empresa.

---

# 15. Criterios de aceptación

MAPS_P3 se considera terminado cuando:

- El modal **Agregar sede adicional** tiene buscador Google Places.
- El buscador no rompe el flujo manual.
- Seleccionar resultado centra el mapa.
- Seleccionar resultado coloca pin.
- El usuario puede ajustar el pin manualmente.
- Guardar sede usa la coordenada final.
- La sede adicional aparece luego en “Mi empresa”.
- La sede adicional aparece como marcador en el mapa de “Mi empresa”.
- `npm run build` pasa.
- No se tocó backend.
- No se tocó login.
- No se tocó pagos.
- No se tocó ApiPeruDev.
- No se tocó SecurityConfig.

---

# 16. Reporte final obligatorio

Al terminar, entregar:

```text
REPORTE MAPS_P3 — BUSCADOR GOOGLE PLACES EN SEDES ADICIONALES

1. Archivos frontend modificados:
2. ¿Se reutilizó PlaceSearchInput.tsx? Sí/No
3. ¿Se creó componente nuevo? Sí/No
4. ¿Se tocó backend? Sí/No
5. ¿Se tocó login? Sí/No
6. ¿Se tocó pagos? Sí/No
7. ¿Se tocó ApiPeruDev? Sí/No
8. ¿Se tocó SecurityConfig? Sí/No
9. ¿El buscador aparece en el modal de sede adicional? Sí/No
10. ¿Seleccionar resultado centra el mapa del modal? Sí/No
11. ¿Seleccionar resultado coloca pin en el modal? Sí/No
12. ¿El usuario puede ajustar manualmente el pin después? Sí/No
13. ¿Guardar sede usa la coordenada final? Sí/No
14. ¿El flujo manual sin buscador sigue funcionando? Sí/No
15. ¿La sede adicional aparece en Mi empresa? Sí/No
16. ¿La sede adicional aparece como marcador en el mapa de Mi empresa? Sí/No
17. ¿npm run build pasa? Sí/No
18. Observaciones:
```

---

# 17. Observación final

No avanzar todavía a selección de sede al solicitar recojo.

Primero cerrar MAPS_P3 con el modal de sedes adicionales funcionando correctamente.

El siguiente paso después de esto será:

**MAPS_P4 — Seleccionar sede al solicitar recojo.**
