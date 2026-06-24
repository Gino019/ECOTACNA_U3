# HOTFIX — ERROR `apiClient.post is not a function` AL AGREGAR SUCURSAL EN “MI EMPRESA”

## Objetivo

Corregir el error que aparece al intentar guardar una **nueva sede adicional/sucursal** desde:

```text
/empresa/mi-empresa
```

Modal:

```text
Editar ubicaciones → Nueva sede adicional → Guardar cambios
```

Error visual actual:

```text
apiClient.post is not a function
```

Este error indica que el frontend está intentando llamar:

```ts
apiClient.post(...)
```

pero el objeto `apiClient` real del proyecto no tiene método `.post`.

La corrección debe ser quirúrgica: ajustar el servicio que crea sedes adicionales para usar el patrón real del cliente HTTP existente.

---

## Diagnóstico inicial

El mapa y el pin manual ya funcionan.  
El problema aparece recién al guardar la nueva sede adicional.

Por tanto, el problema probable está en:

```text
src/services/empresaApi.ts
```

o en el archivo donde se agregó la función para crear sede adicional.

Causa probable:

```ts
apiClient.post('/empresa/ubicaciones', payload)
```

pero `apiClient` no es Axios, o no expone método `.post`.

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

- No tocar login.
- No tocar pagos.
- No tocar Culqi.
- No tocar ApiPeruDev.
- No tocar recolector.
- No tocar incidencias.
- No tocar PDF.
- No tocar estados de recojo.
- No tocar el mapa.
- No reactivar buscador Google Places.
- No modificar el flujo de edición manual del pin.
- No eliminar botón `Nueva sede`.
- No eliminar selector de sedes.
- No crear archivos `old`, `copy`, `backup`, `legacy`, `v1`, `v2`.
- No cambiar la arquitectura general del `apiClient`.
- Corregir usando el patrón HTTP real ya existente en el proyecto.

---

# 1. Ubicar dónde se usa `apiClient.post`

Ejecutar en frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Get-ChildItem .\src -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern "apiClient.post|createCompanyBranch|crear.*sede|ubicaciones|companyBranch|branch" -Context 5,5
```

Archivo probable:

```text
src/services/empresaApi.ts
```

También revisar:

```text
src/pages/empresa/EmpresaMiEmpresa.tsx
```

---

# 2. Revisar cómo está implementado `apiClient`

Buscar definición real:

```powershell
Get-ChildItem .\src -Recurse -Include *.ts |
  Select-String -Pattern "export.*apiClient|const apiClient|function apiClient|class ApiClient|fetch\(|axios" -Context 6,6
```

Archivo probable:

```text
src/services/apiClient.ts
```

Determinar cuál es el patrón correcto del proyecto.

Ejemplos posibles:

## Caso A — `apiClient` es una función

Algo como:

```ts
apiClient('/empresa/perfil', {
  method: 'GET'
})
```

Entonces NO se debe usar:

```ts
apiClient.post(...)
```

Debe usarse:

```ts
apiClient('/empresa/ubicaciones', {
  method: 'POST',
  body: JSON.stringify(payload)
})
```

o el formato real del wrapper.

## Caso B — `apiClient` expone métodos personalizados

Algo como:

```ts
apiClient.request(...)
apiClient.get(...)
apiClient.put(...)
```

Si no existe `.post`, usar el método disponible.

Ejemplo conceptual:

```ts
apiClient.request('/empresa/ubicaciones', {
  method: 'POST',
  body: payload
})
```

## Caso C — El proyecto usa `api` o `httpClient` para POST

Si otros servicios hacen POST con otro helper, copiar ese patrón exacto.

Buscar ejemplos:

```powershell
Get-ChildItem .\src\services -Recurse -Include *.ts |
  Select-String -Pattern "method: 'POST'|method: \"POST\"|\.post\(|fetch\(" -Context 4,4
```

---

# 3. Corregir `empresaApi.ts`

Ubicar la función agregada para crear sede adicional.

Probable función actual incorrecta:

```ts
createCompanyBranch: (payload) =>
  apiClient.post('/empresa/ubicaciones', payload)
```

Reemplazar por el patrón real del cliente.

## Ejemplo si `apiClient` es función basada en fetch

```ts
createCompanyBranch: (payload: CompanyBranchPayload) =>
  apiClient('/empresa/ubicaciones', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
```

## Ejemplo si `apiClient` serializa body automáticamente

```ts
createCompanyBranch: (payload: CompanyBranchPayload) =>
  apiClient('/empresa/ubicaciones', {
    method: 'POST',
    body: payload,
  })
```

## Ejemplo si hay método `request`

```ts
createCompanyBranch: (payload: CompanyBranchPayload) =>
  apiClient.request('/empresa/ubicaciones', {
    method: 'POST',
    body: payload,
  })
```

Usar el patrón real del proyecto. No inventar un cliente nuevo.

---

# 4. Verificar `updateCompanyLocation`

Comparar con la función que ya funciona para guardar sede principal:

```ts
updateCompanyLocation(...)
```

Esa función probablemente ya usa correctamente el cliente.

La nueva función de crear sede debe imitar ese mismo estilo.

Ejemplo:

```ts
updateCompanyLocation: (locationId, payload) => ...
createCompanyBranch: (payload) => ...
```

Ambas deben usar el mismo cliente y mismo manejo de respuesta.

---

# 5. Revisar endpoint esperado

Después de corregir el error de frontend, validar en Network qué endpoint llama.

Debe ser uno de estos, según contrato real:

```text
POST /ecotacna/api/empresa/ubicaciones
```

o:

```text
POST /ecotacna/api/empresa/ubicaciones/sedes
```

o el endpoint real ya definido.

No duplicar `/ecotacna/api` si `apiClient` ya agrega base URL.

Incorrecto:

```text
/ecotacna/api/ecotacna/api/empresa/ubicaciones
```

Incorrecto:

```text
/api/empresa/ubicaciones
```

si en este frontend el cliente ya espera ruta relativa sin `/api`.

---

# 6. Si después aparece 404 o 405

Si al corregir `apiClient.post` aparece:

```text
404 Not Found
```

o:

```text
405 Method Not Allowed
```

entonces el frontend ya está bien, pero el backend no tiene endpoint POST para crear sede adicional.

En ese caso, revisar backend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"

Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "updateCompanyLocation|ubicaciones|CompanyBranch|BranchRequest|company_branches|PostMapping|PutMapping" -Context 5,5
```

Si no existe endpoint de creación, agregarlo en el controller actual de empresa.

Endpoint recomendado:

```java
@PostMapping("/empresa/ubicaciones")
```

o según prefijo real del controller.

Debe crear un `CompanyBranch` para la empresa autenticada.

---

# 7. Contrato de creación de sede adicional

Payload esperado desde frontend:

```json
{
  "name": "Sede Gregorio",
  "reference": "Cerca del colegio Jorge Chavez",
  "latitude": -18.039427,
  "longitude": -70.256134
}
```

Si el backend usa `address`, enviar también:

```json
{
  "name": "Sede Gregorio",
  "address": "Cerca del colegio Jorge Chavez",
  "reference": "Cerca del colegio Jorge Chavez",
  "latitude": -18.039427,
  "longitude": -70.256134
}
```

Ajustar a DTO real.

No enviar campos `undefined`.

---

# 8. Validaciones frontend antes de guardar nueva sede

En `EmpresaMiEmpresa.tsx`, antes de llamar a crear sede:

```text
Nombre de sede obligatorio.
Pin obligatorio.
Latitud válida.
Longitud válida.
```

Mensaje sugerido si falta pin:

```text
Selecciona una ubicación en el mapa antes de guardar la sede.
```

Mensaje sugerido si falta nombre:

```text
Ingresa un nombre para la sede.
```

---

# 9. Validaciones backend si se toca backend

Si se agrega o corrige endpoint backend:

Validar:

```text
Empresa autenticada.
Nombre no vacío.
Latitud y longitud no nulas.
Latitud entre -90 y 90.
Longitud entre -180 y 180.
No duplicar sede activa con mismo nombre para la misma empresa.
Guardar active = true.
```

No modificar registro inicial.

---

# 10. Después de guardar sede adicional

Al guardar correctamente:

Frontend debe:

```text
1. Mostrar toast de éxito.
2. Refrescar perfil de empresa.
3. Actualizar lista de sedes.
4. Actualizar selector.
5. Mostrar nueva sede en mapa principal.
6. Salir del modo Nueva sede o seleccionar la sede creada.
```

No debe requerir F5.

---

# 11. Validación visual

En:

```text
http://localhost:8080/empresa/mi-empresa
```

Pasos:

1. Abrir `Editar ubicaciones`.
2. Click en `Nueva sede`.
3. Completar:
   - Nombre de sede.
   - Referencia/dirección.
4. Colocar pin manual en el mapa.
5. Click en `Guardar cambios`.

Resultado esperado:

```text
No aparece apiClient.post is not a function.
Aparece toast de éxito.
La sede nueva aparece en la lista de sedes.
La sede nueva aparece en el selector.
La sede nueva aparece en el mapa principal.
```

---

# 12. Validación Network

En DevTools → Network:

Al presionar `Guardar cambios`, revisar:

```text
Request Method: POST
Status: 200 o 201
URL: endpoint correcto de empresa/ubicaciones
Payload: name, reference/address, latitude, longitude
```

No debe aparecer error JS:

```text
apiClient.post is not a function
```

---

# 13. Validación Supabase

Identificar empresa:

```sql
SELECT
    id,
    business_name
FROM companies
WHERE business_name ILIKE '%MENDOZA%'
   OR business_name ILIKE '%ALIMENTOS TACNA%';
```

Luego validar sedes:

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
ORDER BY id DESC;
```

Debe existir la nueva sede adicional con coordenadas.

Si la tabla no tiene `reference`, ajustar consulta a columnas reales.

---

# 14. Validación que edición existente no se rompió

Probar:

```text
Editar sede principal → mover pin → guardar
Editar sede adicional existente → mover pin → guardar
Nueva sede → crear → guardar
```

Las tres operaciones deben funcionar.

---

# 15. Limpieza de residuos

Buscar después de corregir:

```powershell
Get-ChildItem .\src -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern "apiClient.post|apiClient.put|apiClient.delete" -Context 3,3
```

Si `apiClient` no soporta esos métodos, no debe quedar ninguna llamada así.

Pero no cambiar llamadas que ya funcionan si el cliente sí soporta algunos métodos. Confirmar por implementación real.

---

# 16. Build

Frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Backend solo si se tocó:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
.\mvnw.cmd clean compile
```

---

# Reporte final obligatorio

```text
HOTFIX CREACION SEDE ADICIONAL API CLIENT

1. Ruta frontend actual:
2. Ruta backend actual:
3. Archivo frontend modificado:
4. Archivo backend modificado, si aplica:
5. Causa exacta de apiClient.post is not a function:
6. Patrón real de apiClient:
7. ¿Se corrigió createCompanyBranch con el patrón correcto? Sí/No
8. Endpoint llamado al crear sede:
9. Status HTTP al crear sede:
10. ¿Se guarda en company_branches? Sí/No
11. ¿La sede aparece en selector? Sí/No
12. ¿La sede aparece en lista lateral? Sí/No
13. ¿La sede aparece en mapa principal? Sí/No
14. ¿Editar sede principal sigue funcionando? Sí/No
15. ¿Editar sede adicional sigue funcionando? Sí/No/No aplica
16. ¿npm run build pasa? Sí/No
17. ¿mvnw clean compile pasa? Sí/No/No aplica
18. Observaciones:
```

No cerrar hasta que crear una nueva sede adicional funcione sin error y quede registrada en BD.
