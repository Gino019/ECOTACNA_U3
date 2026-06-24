# MAPS_P4 — SELECCIONAR SEDE AL SOLICITAR RECOJO

## Proyecto

EcoTacna

## Objetivo de esta fase

Implementar en el panel de empresa generadora la selección de sede al momento de solicitar un recojo.

La empresa ya puede registrar sede principal y sedes adicionales, y ya puede verlas en “Mi empresa” con marcadores en Google Maps. Ahora esas sedes deben tener uso operativo: al crear una solicitud de recojo, el restaurante debe poder indicar desde qué sede se realizará el recojo de aceite usado.

## Ruta funcional afectada

Panel Empresa → Solicitar recojo

Ruta probable:

`/empresa/solicitar-recojo`

Archivo frontend probable:

`EcoTacnaFrontend/src/pages/empresa/EmpresaSolicitarRecojo.tsx`

---

# 1. Decisión funcional

La solicitud de recojo debe usar una ubicación real de recojo.

El usuario podrá:

1. Seleccionar una sede registrada.
2. Ver esa sede marcada en Google Maps.
3. Confirmar que esa será la ubicación del recojo.
4. Opcionalmente ajustar el punto manualmente si el sistema ya lo permite.
5. Enviar la solicitud con las coordenadas de esa sede.

## Regla principal

No inventar coordenadas.

La ubicación enviada en la solicitud debe salir de:

- Una sede registrada de la empresa, o
- Un punto manual confirmado en el mapa, si el flujo actual ya permite marcarlo.

## Recomendación para esta fase

Para cerrar MAPS_P4 sin romper flujos, implementar primero esta versión:

**Versión P4 mínima operativa:**

- Cargar sedes registradas.
- Mostrar selector de sede.
- Al seleccionar sede, usar sus coordenadas como `pickupLatitude` y `pickupLongitude`.
- Mostrar marcador en el mapa.
- Enviar solicitud con coordenadas de la sede seleccionada.

No implementar todavía:

- Recolector más cercano.
- Rutas.
- Directions API.
- Cálculo de distancia.
- Tracking GPS.
- Edición de sedes desde solicitar recojo.

---

# 2. Alcance permitido

## Frontend

Se puede modificar:

- `src/pages/empresa/EmpresaSolicitarRecojo.tsx`
- `src/components/maps/GoogleMapView.tsx` solo si falta soporte visual necesario.
- `src/types.ts` solo si se requiere tipar sedes o payload.
- API frontend de empresa si ya existe método para cargar sedes o perfil.

## Backend

Solo tocar backend si es necesario para:

- Devolver sedes de la empresa autenticada.
- Aceptar `companyLocationId` opcional en la solicitud de recojo.
- Guardar referencia de sede en `PickupRequest`.

Si el backend ya acepta `pickupLatitude` y `pickupLongitude`, no cambiar lógica crítica. Se puede completar MAPS_P4 usando coordenadas.

---

# 3. Reglas estrictas

- No tocar login.
- No tocar pagos.
- No tocar ApiPeruDev.
- No tocar SecurityConfig.
- No tocar BCrypt.
- No tocar suscripciones.
- No tocar captcha.
- No exponer Google Maps API Key.
- No hardcodear sedes.
- No hardcodear coordenadas.
- No crear archivos `backup`, `old`, `copy`, `legacy`, `v1`, `v2`.
- No duplicar carpetas.
- No permitir que una empresa use sedes de otra empresa.
- No romper la creación actual de solicitudes.

---

# 4. Diagnóstico obligatorio antes de modificar

## 4.1. Revisar frontend actual de solicitar recojo

Desde el frontend:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
Select-String -Path .\src\pages\empresa\EmpresaSolicitarRecojo.tsx -Pattern "pickupLatitude|pickupLongitude|GoogleMapView|selectedPickupLocation|solicitar|recojo|map|latitude|longitude" -Context 2,2
```

Confirmar:

- Cómo se selecciona actualmente el punto de recojo.
- Qué payload se envía al backend.
- Si ya existe estado `selectedPickupLocation`.
- Si ya hay mapa en esta pantalla.
- Si la solicitud bloquea envío cuando no hay coordenadas.

## 4.2. Revisar API frontend

Buscar métodos relacionados:

```powershell
Get-ChildItem .\src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "createPickup|solicitarRecojo|pickupLatitude|pickupLongitude|getProfile|getCompany|locations|companyLocations|sedes" | Select-Object Path,LineNumber,Line
```

Confirmar:

- Método que crea solicitud de recojo.
- Método que carga perfil empresa o sedes.
- Tipo de payload actual.

## 4.3. Revisar backend actual

Desde backend:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
Get-ChildItem .\src\main\java -Recurse -Include *.java | Select-String -Pattern "PickupRequestRequest|pickupLatitude|pickupLongitude|create|solicitud|CompanyLocation|locations|companyLocationId" | Select-Object Path,LineNumber,Line
```

Confirmar:

- Si `PickupRequestRequest` ya recibe `pickupLatitude` y `pickupLongitude`.
- Si `PickupRequest` ya guarda esas coordenadas.
- Si existe `companyLocationId`.
- Si no existe, decidir si se agrega ahora o se deja para MAPS_P4B.

---

# 5. Comportamiento esperado en UI

En la pantalla “Solicitar recojo”, agregar una sección clara:

## Ubicación del recojo

Texto auxiliar:

`Selecciona la sede desde donde se realizará el recojo de aceite usado.`

Debe incluir:

1. Selector de sede registrada.
2. Tarjeta resumen de sede seleccionada.
3. Mapa con marcador de la sede.
4. Coordenadas visibles de forma discreta.
5. Mensaje si no hay sedes registradas.

## Selector sugerido

Campo tipo select/card:

`Seleccionar sede`

Opciones:

- `Sede principal — AV. JORGE BASADRE GROHMANN...`
- `Sede adicional 1 — Sin referencia detallada`
- `Sede Pocollay — Frente a la plaza`

## Tarjeta de sede seleccionada

Mostrar:

- Nombre de sede.
- Badge: `Principal` o `Adicional`.
- Dirección o referencia.
- Latitud y longitud.

Ejemplo:

```text
Sede principal
AV. JORGE BASADRE GROHMANN NRO. 335 FND. PAGO AYMARA
Lat: -18.013589 | Lng: -70.266836
```

## Mapa

El mapa debe:

- Centrarse en la sede seleccionada.
- Mostrar marcador de la sede seleccionada.
- Mantener estilo visual EcoTacna.
- No mostrar mapa vacío si hay sede seleccionada.

---

# 6. Lógica frontend recomendada

## 6.1. Tipo recomendado

Si no existe, agregar o reutilizar:

```ts
export interface CompanyLocation {
  id?: number | null;
  name: string;
  reference?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  isPrimary?: boolean;
}
```

## 6.2. Estado recomendado

En `EmpresaSolicitarRecojo.tsx`:

```ts
const [companyLocations, setCompanyLocations] = useState<CompanyLocation[]>([]);
const [selectedLocationId, setSelectedLocationId] = useState<string>("");
const [selectedPickupLocation, setSelectedPickupLocation] = useState<{ latitude: number; longitude: number } | null>(null);
```

Si ya existe `selectedPickupLocation`, reutilizarlo.

## 6.3. Cargar sedes

Usar endpoint existente si ya está disponible en “Mi empresa”.

Opciones:

- Reutilizar `getCompanyProfile()` si devuelve `locations`.
- Crear método frontend `getCompanyLocations()` si ya existe endpoint separado.

No duplicar llamadas innecesarias si el perfil ya trae sedes.

## 6.4. Seleccionar sede

Al seleccionar una sede:

```ts
const handleSelectLocation = (locationId: string) => {
  setSelectedLocationId(locationId);
  const location = companyLocations.find(item => String(item.id ?? item.name) === locationId);

  if (!location) return;

  setSelectedPickupLocation({
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
  });
};
```

## 6.5. Enviar payload

El payload debe seguir enviando:

```ts
pickupLatitude: selectedPickupLocation.latitude,
pickupLongitude: selectedPickupLocation.longitude,
```

Si backend acepta `companyLocationId`, agregar:

```ts
companyLocationId: selectedLocation?.id ?? null,
```

Si backend no acepta `companyLocationId`, no enviarlo todavía.

---

# 7. Backend opcional — companyLocationId

## 7.1. Versión mínima sin backend

Si `PickupRequestRequest` ya acepta coordenadas, MAPS_P4 puede cerrarse sin tocar backend:

- El usuario selecciona sede.
- Frontend envía coordenadas de esa sede.
- Backend guarda `pickupLatitude` y `pickupLongitude` como ya lo hace.

Esta opción es válida y de menor riesgo.

## 7.2. Versión recomendada con trazabilidad interna

Agregar `companyLocationId` opcional para saber desde qué sede se creó la solicitud.

Archivos probables:

- `PickupRequestRequest.java`
- `PickupRequest.java`
- `PickupRequestResponse.java`
- `PickupRequestService.java`
- Script SQL manual para columna nueva.

Script recomendado si se implementa:

```sql
ALTER TABLE pickup_requests
ADD COLUMN IF NOT EXISTS company_location_id BIGINT;

ALTER TABLE pickup_requests
ADD CONSTRAINT fk_pickup_requests_company_location
FOREIGN KEY (company_location_id)
REFERENCES company_locations(id);

CREATE INDEX IF NOT EXISTS idx_pickup_requests_company_location_id
ON pickup_requests(company_location_id);
```

Ajustar nombre de tabla real si no es `pickup_requests`.

## 7.3. Validación de seguridad backend si se agrega companyLocationId

Si se agrega `companyLocationId`, el backend debe validar:

- La sede pertenece a la empresa autenticada.
- La sede está activa.
- Las coordenadas enviadas corresponden a esa sede o se acepta ajuste manual con regla clara.

Para esta fase, si se quiere evitar complejidad, no agregar `companyLocationId` todavía.

---

# 8. Validaciones de negocio

## 8.1. Si empresa tiene sedes

- Mostrar selector.
- Preseleccionar sede principal si existe.
- Mostrar mapa con marcador.
- Permitir enviar solicitud.

## 8.2. Si empresa no tiene sedes

Mostrar mensaje:

`No tienes sedes registradas. Registra una ubicación en Mi empresa o marca manualmente el punto de recojo.`

Si el flujo manual actual existe, mantenerlo disponible.

## 8.3. Si hay sede sin coordenadas

No debe aparecer como seleccionable para recojo.

Mostrar estado:

`Sede sin coordenadas registradas`

## 8.4. Si hay coordenadas inválidas

No enviarlas.

Bloquear solicitud con mensaje claro:

`Selecciona una sede con ubicación válida para continuar.`

---

# 9. Diseño recomendado

## 9.1. Card nueva o bloque dentro del formulario

Título:

`Ubicación del recojo`

Subtítulo:

`Selecciona la sede desde donde se realizará el recojo de aceite usado.`

Layout desktop:

```text
[Formulario de solicitud] [Ubicación del recojo + mapa]
```

O dentro del mismo formulario:

```text
Datos del recojo
Ubicación del recojo
Mapa
Confirmar solicitud
```

## 9.2. Mapa

Altura recomendada:

- Desktop: `380px` a `460px`.
- Móvil: `300px` a `340px`.

## 9.3. Badges

Usar:

- `Principal`
- `Adicional`
- `Ubicación válida`

No usar:

- Certificado.
- QR.
- Tracking real.
- Ruta optimizada.

---

# 10. Prueba manual obligatoria

## 10.1. Levantar servicios

Desde raíz oficial:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA"
.\kill-ecotacna-ports.ps1
.\start-ecotacna-clean.ps1
```

## 10.2. Probar como empresa

1. Abrir:

```text
http://localhost:8080/
```

2. Iniciar sesión como empresa generadora con sedes registradas.

3. Ir a:

```text
/empresa/solicitar-recojo
```

4. Verificar que aparece:

```text
Ubicación del recojo
```

5. Seleccionar `Sede principal`.

6. Confirmar que el mapa se centra en la sede principal.

7. Seleccionar `Sede adicional`.

8. Confirmar que el mapa cambia al marcador de sede adicional.

9. Completar datos de recojo.

10. Enviar solicitud.

11. Confirmar en backend o respuesta que se enviaron coordenadas correctas.

---

# 11. Validación técnica

## Frontend

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Debe pasar sin errores.

## Backend

Solo si se modificó backend:

```powershell
cd "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
.\mvnw.cmd clean compile
```

Debe pasar sin errores.

---

# 12. Criterios de aceptación

MAPS_P4 se considera cerrado cuando:

- La pantalla “Solicitar recojo” carga sedes reales de la empresa.
- La empresa puede seleccionar sede principal.
- La empresa puede seleccionar sede adicional.
- El mapa muestra marcador de la sede seleccionada.
- El payload de solicitud usa las coordenadas de la sede seleccionada.
- No se muestran sedes de otras empresas.
- No se inventan coordenadas.
- El flujo manual existente no se rompe.
- `npm run build` pasa.
- Backend compila si fue tocado.

---

# 13. Reporte final obligatorio

Entregar al terminar:

```text
REPORTE MAPS_P4 — SELECCIONAR SEDE AL SOLICITAR RECOJO

1. Archivos frontend modificados:
2. Archivos backend modificados:
3. ¿Se tocó backend? Sí/No
4. ¿Se agregó companyLocationId? Sí/No
5. ¿Se cargan sedes reales de la empresa? Sí/No
6. ¿Se filtran sedes por empresa autenticada? Sí/No
7. ¿Se puede seleccionar sede principal? Sí/No
8. ¿Se puede seleccionar sede adicional? Sí/No
9. ¿El mapa cambia al seleccionar sede? Sí/No
10. ¿El marcador aparece en el mapa? Sí/No
11. ¿El payload envía pickupLatitude y pickupLongitude? Sí/No
12. ¿El flujo manual anterior sigue funcionando? Sí/No
13. ¿npm run build pasa? Sí/No
14. ¿mvnw clean compile pasa? Sí/No/No aplica
15. ¿Se tocó login? Sí/No
16. ¿Se tocó pagos? Sí/No
17. ¿Se tocó ApiPeruDev? Sí/No
18. Observaciones:
```

---

# 14. Recomendación final

Implementar MAPS_P4 en dos niveles:

1. **Primero:** frontend operativo usando coordenadas de sedes existentes.
2. **Después:** agregar `companyLocationId` al backend si se quiere trazabilidad interna exacta de qué sede originó la solicitud.

Para este sprint, priorizar que el restaurante pueda elegir sede y que la solicitud salga con las coordenadas correctas.
