# PLAN QUIRÚRGICO — RETIRAR BUSCADOR PLACES EN “MI EMPRESA” SIN ROMPER MAPA MANUAL

## Objetivo

Eliminar completamente del modal **Editar ubicaciones** en `/empresa/mi-empresa` el buscador de Google Places y su botón `Buscar`, dejando únicamente la selección manual mediante Google Maps.

La regla final debe ser:

```text
Mi empresa → Editar ubicaciones
→ Seleccionar sede principal o sede adicional
→ Mover/colocar pin manualmente en el mapa
→ Guardar cambios
```

No debe quedar input de búsqueda, botón `Buscar`, lógica de búsqueda Places, estados asociados, ni dependencias activas en este módulo.

---

## Contexto actual

Ruta afectada:

```text
/empresa/mi-empresa
```

Modal afectado:

```text
Editar ubicaciones
```

Elementos que deben eliminarse de esta interfaz:

```text
Buscar nueva dirección (Opcional)
Input: Busca por nombre...
Botón: Buscar
Cualquier mensaje/error del buscador Places
```

Elementos que deben mantenerse:

```text
Selector de sede
Botón Nueva sede
Mapa Google Maps
Pin manual
Coordenadas actuales
Botón Cancelar
Botón Guardar cambios
Lista de sedes registradas
Mapa principal de ubicaciones registradas
```

---

## Decisión funcional

La búsqueda con Google Places queda retirada de este módulo.

La ubicación se editará manualmente:

```text
Click en el mapa → mueve/coloca pin → actualiza lat/lng → guardar cambios
```

Esto evita depender de Places API y mantiene la funcionalidad esencial de coordenadas.

---

## Rutas actuales de trabajo

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

- Tocar solo frontend.
- No tocar backend.
- No tocar base de datos.
- No tocar login.
- No tocar pagos.
- No tocar Culqi.
- No tocar ApiPeruDev.
- No tocar recolector.
- No tocar incidencias.
- No tocar PDF.
- No tocar estados de recojo.
- No tocar suscripciones.
- No tocar registro `/registro` en este plan.
- No eliminar `GoogleMapView`.
- No eliminar selección manual de pin.
- No eliminar `Nueva sede`.
- No eliminar edición de sede principal.
- No eliminar edición de sede adicional.
- No crear archivos `old`, `copy`, `backup`, `legacy`, `v1`, `v2`.
- No ocultar con CSS: eliminar JSX y lógica real.
- No dejar imports/estados/handlers muertos.

---

# 1. Ubicar el bloque exacto del buscador en Mi Empresa

Ejecutar en PowerShell:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "Buscar nueva dirección|Busca por nombre|Buscar en Maps|PlaceSearchInput|handleSearch|onPlaceSelected|Buscar" -Context 5,5
```

Archivo probable:

```text
src/pages/empresa/EmpresaMiEmpresa.tsx
```

También revisar si el buscador viene desde:

```text
src/components/maps/PlaceSearchInput.tsx
```

pero no modificar el componente global si no es necesario. En este plan solo se retira su uso dentro de `EmpresaMiEmpresa.tsx`.

---

# 2. Eliminar JSX del buscador en EmpresaMiEmpresa

En `EmpresaMiEmpresa.tsx`, dentro del modal `Editar ubicaciones`, eliminar completamente el bloque visual que contiene:

```text
Buscar nueva dirección (Opcional)
Input de búsqueda
Botón Buscar
Mensajes de error del buscador
```

No usar:

```tsx
hidden
display: none
{false && ...}
```

Eliminar el JSX real.

Debe quedar visualmente así:

```text
Selecciona la sede a editar    + Nueva sede

Coordenadas actuales
Lat: ...
Lng: ...

[Mapa Google Maps con pin manual]

Cancelar        Guardar cambios
```

---

# 3. Eliminar import de PlaceSearchInput si queda sin uso

Buscar en `EmpresaMiEmpresa.tsx`:

```tsx
import PlaceSearchInput from ...
```

o:

```tsx
import { PlaceSearchInput } from ...
```

Si solo se usaba para este buscador, eliminar el import.

No eliminar el archivo `PlaceSearchInput.tsx` todavía, porque puede seguir siendo usado en otros módulos o puede retirarse en otro plan global.

---

# 4. Eliminar estados exclusivos del buscador

Buscar estados relacionados solo con búsqueda Places en `EmpresaMiEmpresa.tsx`:

```text
searchText
searchQuery
placeSearch
searchError
isSearching
placeLoading
selectedPlace
handlePlaceSelected
handleSearch
```

Eliminar solo si son exclusivos del buscador del modal.

No eliminar estados necesarios para:

```text
editingLocationId
editingPosition
locations
branchName
branchReference
selectedPosition
map center
```

---

# 5. Eliminar handlers exclusivos de búsqueda

Eliminar funciones como:

```tsx
handlePlaceSelected(...)
handleSearch(...)
onPlaceSelected(...)
```

solo si se usan exclusivamente para el buscador eliminado.

No eliminar:

```tsx
setEditingPosition(...)
handleSaveLocation(...)
handleMapClick(...)
handleSelectPosition(...)
handleCreateBranch(...)
handleUpdateLocation(...)
```

La edición manual debe seguir dependiendo de:

```text
onSelectPosition / click en mapa
```

---

# 6. Mantener edición manual del pin

Confirmar que el mapa sigue renderizando algo equivalente a:

```tsx
<GoogleMapView
  selectable
  selectedPosition={editingPosition}
  onSelectPosition={setEditingPosition}
/>
```

Ajustar al contrato real.

Regla:

```text
Click en mapa → actualiza editingPosition → actualiza coordenadas actuales → permite guardar cambios
```

El mapa debe cargar aunque no haya coordenadas previas.

Si no hay `editingPosition`, centrar en Tacna o sede principal existente.

---

# 7. Mantener Nueva sede

No eliminar el botón:

```text
+ Nueva sede
```

Debe seguir funcionando así:

```text
Nueva sede → modo creación → usuario coloca pin manualmente → guardar → sede adicional se registra
```

Si actualmente la nueva sede dependía del buscador para tener coordenadas, corregir para que dependa solo del pin manual.

Validación obligatoria:

```text
No permitir guardar nueva sede si no hay pin seleccionado.
```

Mensaje sugerido:

```text
Selecciona una ubicación en el mapa antes de guardar.
```

---

# 8. Mantener selector de sede

El selector:

```text
Selecciona la sede a editar
```

debe quedar habilitado.

Debe listar:

```text
Sede principal
Sedes adicionales existentes
```

Aunque se retire el buscador, el selector no debe desaparecer ni quedar vacío.

---

# 9. Mantener guardado de sede principal y sedes adicionales

No tocar contratos API.

Debe seguir funcionando:

```text
Editar sede principal → PUT /empresa/ubicaciones/0
Editar sede adicional → PUT /empresa/ubicaciones/{branchId}
Nueva sede adicional → POST /empresa/ubicaciones
```

Ajustar a rutas reales ya existentes.

Payload debe seguir enviando:

```json
{
  "latitude": -18.x,
  "longitude": -70.x,
  "address": "...",
  "reference": "..."
}
```

Si ya no hay Places, `address/reference` puede mantenerse con la dirección ya registrada o con texto ingresado manualmente si existe campo. No inventar direcciones.

---

# 10. Eliminar mensajes falsos o residuos del buscador

Buscar en `EmpresaMiEmpresa.tsx`:

```powershell
Get-ChildItem .\src\pages\empresa -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "Google Maps no está disponible|Places|API Key|buscador|Buscar nueva dirección|Busca por nombre|Buscar" -Context 4,4
```

En `EmpresaMiEmpresa.tsx` no debe quedar nada del buscador.

No eliminar textos similares en otros módulos durante este plan.

---

# 11. Validación visual

Abrir:

```text
http://localhost:8080/empresa/mi-empresa
```

Pasos:

1. Clic en `Editar ubicaciones`.
2. Confirmar que ya no aparece:
   - `Buscar nueva dirección (Opcional)`
   - input de búsqueda
   - botón `Buscar`
   - mensajes de Google Places.
3. Confirmar que sí aparece:
   - selector de sede;
   - botón `Nueva sede`;
   - mapa;
   - pin;
   - coordenadas;
   - botón `Guardar cambios`.

---

# 12. Validación sede principal

1. Seleccionar sede principal.
2. Mover pin manualmente en el mapa.
3. Confirmar que cambian las coordenadas.
4. Guardar cambios.
5. Confirmar toast de éxito.
6. Confirmar que mapa principal se actualiza.
7. Confirmar en Supabase:

```sql
SELECT
    id,
    business_name,
    latitude,
    longitude
FROM companies
WHERE business_name ILIKE '%MENDOZA%'
   OR business_name ILIKE '%ALIMENTOS TACNA%';
```

---

# 13. Validación sede adicional

1. Clic en `Nueva sede`.
2. Ingresar nombre si el formulario lo pide.
3. Colocar pin manualmente.
4. Guardar.
5. Confirmar que aparece en selector.
6. Confirmar que aparece en lista lateral.
7. Confirmar que aparece en mapa principal.

Supabase:

```sql
SELECT
    id,
    company_id,
    name,
    reference,
    latitude,
    longitude,
    active
FROM company_branches
WHERE company_id = [COMPANY_ID]
ORDER BY id;
```

---

# 14. Validación solicitar recojo

Después de editar/agregar sedes:

1. Ir a:

```text
/empresa/solicitar-recojo
```

2. Confirmar que las sedes registradas aparecen para seleccionar.
3. Confirmar que se puede crear solicitud usando ubicación manual guardada.

---

# 15. Validación de imports y lint visual

Revisar que no queden errores por imports no usados.

Ejecutar:

```powershell
npm run build
```

Si el build falla por import/variable no usada, eliminar residuos.

---

# 16. Build

Ejecutar:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Backend no debería tocarse.

---

# Reporte final obligatorio

```text
CIERRE RETIRO BUSCADOR PLACES MI EMPRESA

1. Ruta frontend actual:
2. Archivo modificado:
3. ¿Se eliminó JSX real del buscador? Sí/No
4. ¿Se eliminó input de búsqueda? Sí/No
5. ¿Se eliminó botón Buscar? Sí/No
6. ¿Se eliminaron imports/estados/handlers muertos? Sí/No
7. ¿Se mantuvo mapa Google Maps? Sí/No
8. ¿Se mantuvo pin manual? Sí/No
9. ¿Se mantuvo selector de sede? Sí/No
10. ¿Se mantuvo botón Nueva sede? Sí/No
11. ¿Editar sede principal funciona? Sí/No
12. ¿Crear sede adicional funciona? Sí/No
13. ¿Editar sede adicional funciona? Sí/No/No aplica
14. ¿Solicitar recojo usa sedes guardadas? Sí/No
15. ¿npm run build pasa? Sí/No
16. Observaciones:
```

No cerrar hasta confirmar que el modal ya no tiene buscador ni botón Buscar, pero el mapa manual y guardado de ubicaciones siguen funcionando.
