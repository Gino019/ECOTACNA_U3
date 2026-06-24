# EcoTacna - Punto 2: Preparar modelo de datos para Google Maps

## 1. Objetivo del punto 2

Preparar EcoTacna para trabajar con ubicaciones reales mediante coordenadas geograficas, sin integrar todavia Google Maps API, sin crear claves de API, sin instalar librerias de mapas y sin modificar funcionalidades sensibles del sistema.

El resultado de este punto debe ser que el backend, la base de datos y el frontend puedan guardar, enviar, recibir y consumir latitud/longitud de forma opcional en los flujos de recoleccion.

Este punto no busca mostrar un mapa real todavia. Busca dejar los datos correctos para que el siguiente punto pueda reemplazar el mapa simulado por Google Maps sin inventar coordenadas.

---

## 2. Estado: COMPLETADO previo confirmado

El Punto 1 ya fue finalizado correctamente.

Estado actual reportado:

- Se eliminaron `.env` reales.
- Se eliminaron scripts temporales.
- Se eliminaron archivos con credenciales hardcodeadas.
- Se elimino la carpeta `docs` interna del proyecto.
- Se eliminaron archivos de prueba `.pdf` y `.xlsx`.
- Se eliminaron `node_modules`, `dist` y `target`.
- `application.properties` y `application-supabase.properties` quedaron basados en variables de entorno.
- Se generaron `.env.example` para frontend y backend.
- `AdminBootstrapConfig.java` fue ajustado para no crear administrador con credenciales hardcodeadas salvo configuracion explicita por variables de entorno.
- `.gitignore` raiz, frontend y backend quedaron robustos.
- Backend compila con `mvnw.cmd clean compile`.
- Frontend pasa `npm run lint` sin errores criticos, `npx tsc --noEmit` y `npm run build`.

Por lo tanto, no repetir limpieza general. Este punto debe concentrarse solo en modelo de datos de ubicacion.

---

## 3. Alcance exacto

### 3.1 Incluido

Este punto incluye:

1. Agregar coordenadas opcionales a empresas.
2. Agregar coordenadas opcionales al punto de recojo.
3. Preparar coordenadas opcionales para ubicacion actual del recolector o unidad vehicular si aplica.
4. Actualizar DTOs de request y response.
5. Actualizar servicios backend para guardar y devolver coordenadas.
6. Actualizar tipos TypeScript.
7. Preparar pantallas actuales para leer coordenadas reales sin reemplazar `MapMock`.
8. Validar que el sistema siga funcionando aunque las coordenadas sean `null`.
9. Generar, si corresponde, un script SQL manual de migracion.
10. Ejecutar compilacion y validaciones finales.

### 3.2 Excluido

Este punto no incluye:

- Integrar Google Maps API.
- Crear API keys.
- Agregar `VITE_GOOGLE_MAPS_API_KEY` real.
- Instalar `@react-google-maps/api`.
- Instalar `@vis.gl/react-google-maps`.
- Usar Geocoding API.
- Usar Routes API.
- Implementar tracking GPS real.
- Implementar navegacion tipo inDrive.
- Modificar pagos simulados.
- Modificar ApiPeruDev.
- Modificar captcha.
- Modificar login/autenticacion.
- Modificar `SecurityConfig`.
- Modificar suscripciones.
- Crear carpetas legacy, backups, versiones antiguas o copias de archivos.

---

## 4. Reglas obligatorias de ejecucion

1. No crear versiones duplicadas de archivos.
2. No crear carpetas `backup`, `old`, `legacy`, `v1`, `v2` ni similares.
3. No conservar codigo muerto si se detecta que no se usa.
4. No introducir datos simulados nuevos salvo que sean necesarios para mantener una pantalla existente.
5. No romper compatibilidad con datos antiguos sin coordenadas.
6. Todas las coordenadas deben ser opcionales inicialmente.
7. Si se agregan validaciones, deben aceptar `null`.
8. Si se rechaza una coordenada, el mensaje debe ser claro.
9. No llamar servicios externos.
10. No dejar claves, tokens ni secretos en codigo fuente.
11. No modificar documentacion academica dentro del repositorio.
12. Mantener el cambio pequeno, trazable y enfocado en ubicacion.

---

## 5. Modelo de datos propuesto

### 5.1 Entidad `Company`

Agregar campos:

```java
private BigDecimal latitude;
private BigDecimal longitude;
```

Nombres sugeridos en base de datos:

```sql
latitude NUMERIC(10, 7) NULL
longitude NUMERIC(10, 7) NULL
```

Uso:

- Ubicacion principal de la empresa.
- Puede representar direccion operativa o fiscal segun el flujo actual del sistema.
- No debe ser obligatoria por ahora.

### 5.2 Entidad `PickupRequest`

Agregar campos:

```java
private BigDecimal pickupLatitude;
private BigDecimal pickupLongitude;
```

Nombres sugeridos en base de datos:

```sql
pickup_latitude NUMERIC(10, 7) NULL
pickup_longitude NUMERIC(10, 7) NULL
```

Uso:

- Punto exacto donde se realizara el recojo.
- Puede diferir de la direccion principal de la empresa.
- Debe viajar junto con `direccion`.

### 5.3 Entidad `TransportUnit` o entidad equivalente de recolector

Evaluar si el mapa operativo usa directamente la unidad vehicular.

Si aplica, agregar:

```java
private BigDecimal lastLatitude;
private BigDecimal lastLongitude;
private LocalDateTime lastLocationAt;
```

Nombres sugeridos en base de datos:

```sql
last_latitude NUMERIC(10, 7) NULL
last_longitude NUMERIC(10, 7) NULL
last_location_at TIMESTAMP NULL
```

Uso:

- Preparar tracking futuro.
- No implementar actualizacion GPS todavia.
- No exponer como tracking real si no se actualiza desde GPS.

Si la entidad no participa en seguimiento ni mapa operativo actual, no agregar estos campos todavia.

---

## 6. Validaciones requeridas

Crear una validacion simple reutilizable en backend o aplicar validacion directa en el servicio.

Reglas:

```txt
latitude >= -90 && latitude <= 90
longitude >= -180 && longitude <= 180
```

Debe cumplirse:

- Si latitud y longitud son `null`, permitir.
- Si solo llega una coordenada y la otra no, rechazar o normalizar segun criterio tecnico. Recomendacion: rechazar con mensaje claro.
- Si una coordenada esta fuera de rango, rechazar con mensaje claro.

Mensajes sugeridos:

```txt
La latitud debe estar entre -90 y 90.
La longitud debe estar entre -180 y 180.
Debe enviar latitud y longitud juntas para definir un punto geografico.
```

---

## 7. Backend - tareas exactas

### 7.1 Revisar entidades

Localizar y revisar:

```txt
EcoTacnaSpringBootJPA/src/main/java/**/Company.java
EcoTacnaSpringBootJPA/src/main/java/**/PickupRequest.java
EcoTacnaSpringBootJPA/src/main/java/**/TransportUnit.java
```

Confirmar nombres reales de paquetes antes de modificar.

### 7.2 Modificar `Company.java`

Agregar campos opcionales:

```java
@Column(name = "latitude", precision = 10, scale = 7)
private BigDecimal latitude;

@Column(name = "longitude", precision = 10, scale = 7)
private BigDecimal longitude;
```

Agregar imports necesarios.

Si el proyecto usa Lombok, respetar el estilo actual.

### 7.3 Modificar `PickupRequest.java`

Agregar campos opcionales:

```java
@Column(name = "pickup_latitude", precision = 10, scale = 7)
private BigDecimal pickupLatitude;

@Column(name = "pickup_longitude", precision = 10, scale = 7)
private BigDecimal pickupLongitude;
```

### 7.4 Evaluar `TransportUnit.java`

Solo si corresponde al flujo actual de mapa operativo o seguimiento, agregar:

```java
@Column(name = "last_latitude", precision = 10, scale = 7)
private BigDecimal lastLatitude;

@Column(name = "last_longitude", precision = 10, scale = 7)
private BigDecimal lastLongitude;

@Column(name = "last_location_at")
private LocalDateTime lastLocationAt;
```

No crear endpoints de tracking en este punto salvo que ya exista uno y solo requiera devolver estos campos.

### 7.5 Actualizar DTOs de creacion de solicitud

Buscar DTO relacionado con creacion de solicitud de recojo, por ejemplo:

```txt
PickupRequestCreateRequest
CreatePickupRequestRequest
SolicitudRecojoRequest
```

Agregar:

```java
private BigDecimal pickupLatitude;
private BigDecimal pickupLongitude;
```

Si el DTO usa `Double`, se permite mantener `Double` por consistencia, pero se recomienda `BigDecimal` para persistencia.

### 7.6 Actualizar DTOs de response

Actualizar responses usados por:

- Solicitud creada.
- Listado de solicitudes.
- Seguimiento de empresa.
- Mapa operativo del recolector.
- Recojo activo del recolector.
- Historial si actualmente devuelve direccion.

Campos sugeridos:

```java
private BigDecimal pickupLatitude;
private BigDecimal pickupLongitude;
private BigDecimal companyLatitude;
private BigDecimal companyLongitude;
private BigDecimal collectorLatitude;
private BigDecimal collectorLongitude;
```

No agregar todos a todos los DTOs sin necesidad. Solo donde tenga sentido funcional.

### 7.7 Actualizar servicios

En el servicio que crea la solicitud de recojo:

1. Leer `pickupLatitude` y `pickupLongitude` del request.
2. Validar coordenadas si vienen.
3. Guardar campos en `PickupRequest`.
4. Mantener `direccion` como campo obligatorio o segun regla actual.
5. No geocodificar.
6. No inventar coordenadas.

En servicios de consulta:

1. Mapear coordenadas desde entidad a response.
2. Si son `null`, devolver `null`.
3. No reemplazar `null` por coordenadas falsas.

### 7.8 Script SQL opcional

Si el proyecto usa `spring.jpa.hibernate.ddl-auto=update`, documentar que Hibernate agregara columnas automaticamente en entorno local.

Si se requiere SQL manual, crear archivo en una carpeta tecnica existente, no en docs duplicadas. Nombre sugerido:

```txt
EcoTacnaSpringBootJPA/src/main/resources/db/migration/manual/20260616_add_location_coordinates.sql
```

Contenido sugerido para PostgreSQL:

```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS pickup_latitude NUMERIC(10,7);
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS pickup_longitude NUMERIC(10,7);

-- Solo si se modifico la tabla de unidades vehiculares:
-- ALTER TABLE transport_units ADD COLUMN IF NOT EXISTS last_latitude NUMERIC(10,7);
-- ALTER TABLE transport_units ADD COLUMN IF NOT EXISTS last_longitude NUMERIC(10,7);
-- ALTER TABLE transport_units ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMP;
```

Ajustar nombres reales de tablas si difieren.

---

## 8. Frontend - tareas exactas

### 8.1 Actualizar tipos TypeScript

Buscar archivos como:

```txt
EcoTacnaFrontend/src/types.ts
EcoTacnaFrontend/src/api/recolectorApi.ts
EcoTacnaFrontend/src/api/empresaApi.ts
```

Agregar campos opcionales donde corresponda:

```ts
pickupLatitude?: number | null;
pickupLongitude?: number | null;
companyLatitude?: number | null;
companyLongitude?: number | null;
collectorLatitude?: number | null;
collectorLongitude?: number | null;
```

### 8.2 Actualizar payload de solicitud de recojo

En:

```txt
EcoTacnaFrontend/src/pages/empresa/EmpresaSolicitarRecojo.tsx
```

Preparar el envio de:

```ts
direccion,
pickupLatitude: null,
pickupLongitude: null
```

Por ahora, si no existe selector de mapa, enviar `null` o no enviar los campos segun el contrato del API.

No inventar coordenadas fijas todavia salvo que sea indispensable para una demo controlada. Recomendacion: usar `null` en esta etapa.

### 8.3 Actualizar seguimiento de empresa

En:

```txt
EcoTacnaFrontend/src/pages/empresa/EmpresaSeguimiento.tsx
```

Preparar lectura de:

```ts
pickupLatitude
pickupLongitude
collectorLatitude
collectorLongitude
```

Mantener `MapMock` funcionando si no hay coordenadas.

### 8.4 Actualizar mapa operativo del recolector

En:

```txt
EcoTacnaFrontend/src/pages/recolector/RecolectorMapaOperativo.tsx
```

Preparar lectura de coordenadas reales devueltas por backend.

No cambiar todavia a mapa real.

### 8.5 Ajustar etiquetas visuales engañosas

Si existen textos como:

```txt
GPS en vivo
seguimiento en tiempo real
ubicacion real
ruta GPS activa
```

y todavia no hay GPS real, cambiarlos por textos mas honestos:

```txt
Mapa operativo referencial
Seguimiento referencial
Ubicacion estimada
Vista de coordinacion
```

No eliminar componentes utiles; solo evitar prometer funcionalidad que aun no existe.

---

## 9. Archivos probables a modificar

La lista exacta puede variar segun nombres reales, pero se espera tocar archivos similares a:

```txt
EcoTacnaSpringBootJPA/src/main/java/**/entity/Company.java
EcoTacnaSpringBootJPA/src/main/java/**/entity/PickupRequest.java
EcoTacnaSpringBootJPA/src/main/java/**/entity/TransportUnit.java
EcoTacnaSpringBootJPA/src/main/java/**/dto/**/*Pickup*.java
EcoTacnaSpringBootJPA/src/main/java/**/service/**/*Pickup*.java
EcoTacnaSpringBootJPA/src/main/java/**/service/**/*Collector*.java
EcoTacnaFrontend/src/types.ts
EcoTacnaFrontend/src/api/empresaApi.ts
EcoTacnaFrontend/src/api/recolectorApi.ts
EcoTacnaFrontend/src/pages/empresa/EmpresaSolicitarRecojo.tsx
EcoTacnaFrontend/src/pages/empresa/EmpresaSeguimiento.tsx
EcoTacnaFrontend/src/pages/recolector/RecolectorMapaOperativo.tsx
```

No modificar archivos fuera de este alcance salvo necesidad justificada.

---

## 10. Validacion obligatoria

### 10.1 Backend

Desde la carpeta del backend:

```bat
mvnw.cmd clean compile
```

Debe terminar en BUILD SUCCESS.

### 10.2 Frontend

Desde la carpeta del frontend:

```bat
npm run lint
npx tsc --noEmit
npm run build
```

Criterios:

- `lint`: sin errores criticos. Warnings existentes por `any` pueden quedar si ya eran heredados.
- `tsc`: debe pasar.
- `build`: debe pasar.

---

## 11. Pruebas manuales minimas

Despues de compilar, validar manualmente:

1. Login de empresa generadora.
2. Creacion de solicitud de recojo con direccion y coordenadas `null`.
3. Confirmar que la solicitud se guarda sin error.
4. Login de recolector.
5. Revisar mapa operativo/listado de solicitudes.
6. Confirmar que no se rompe si `pickupLatitude` y `pickupLongitude` son `null`.
7. Confirmar que las respuestas del backend ya incluyen campos de coordenadas cuando corresponda.
8. Probar manualmente un request con coordenadas validas de Tacna.
9. Probar manualmente un request con latitud fuera de rango y confirmar error controlado.
10. Probar manualmente un request con solo latitud sin longitud y confirmar error controlado.

Coordenada valida de referencia para prueba manual controlada:

```json
{
  "pickupLatitude": -18.0066,
  "pickupLongitude": -70.2463
}
```

No dejar esta coordenada hardcodeada en codigo.

---

## 12. Criterios de aceptacion

El Punto 2 se considera terminado solo si se cumple todo lo siguiente:

- `Company` soporta coordenadas opcionales o se justifica tecnicamente por que no aplica todavia.
- `PickupRequest` soporta coordenadas opcionales del punto de recojo.
- DTOs de creacion y consulta fueron actualizados.
- Backend guarda coordenadas si llegan.
- Backend devuelve coordenadas si existen.
- Backend acepta datos antiguos sin coordenadas.
- Frontend compila con los nuevos campos.
- `MapMock` sigue funcionando.
- No se integro Google Maps.
- No se agregaron API keys.
- No se agregaron dependencias de mapas.
- No se tocaron pagos, login, ApiPeruDev, captcha, SecurityConfig ni suscripciones.
- Backend compila correctamente.
- Frontend pasa lint/tsc/build.

---

## 13. Entrega esperada de Antigravity

Al finalizar, Antigravity debe reportar:

1. Resumen general del cambio.
2. Archivos modificados.
3. Campos agregados a entidades.
4. Campos agregados a base de datos.
5. DTOs actualizados.
6. Servicios modificados.
7. Endpoints que ahora aceptan coordenadas.
8. Endpoints que ahora devuelven coordenadas.
9. Resultado de `mvnw.cmd clean compile`.
10. Resultado de `npm run lint`.
11. Resultado de `npx tsc --noEmit`.
12. Resultado de `npm run build`.
13. Confirmacion explicita de que no se integro Google Maps.
14. Confirmacion explicita de que no se agregaron API keys.
15. Riesgos o pendientes para el Punto 3.

---

# Instruccion de ejecucion para Antigravity

Copia y ejecuta esta instruccion en Antigravity:

```md
Ejecuta el Punto 2 de EcoTacna: Preparar el modelo de datos para Google Maps.

Contexto:
El Punto 1 ya fue cerrado. El repositorio quedo limpio de secretos, archivos temporales, docs internas, datos de prueba y artefactos generados. Backend compila y frontend pasa lint/tsc/build.

Objetivo:
Preparar backend, base de datos y frontend para soportar coordenadas reales en empresas, solicitudes de recojo y, si aplica, ubicacion futura del recolector/unidad vehicular. No debes integrar Google Maps todavia.

Reglas estrictas:
- No integrar Google Maps API.
- No crear ni agregar API keys.
- No instalar librerias de mapas.
- No usar Geocoding API.
- No usar Routes API.
- No implementar tracking GPS real.
- No crear carpetas backup, old, legacy, v1, v2 ni copias de archivos.
- No mantener codigo muerto.
- No modificar pagos simulados.
- No modificar ApiPeruDev.
- No modificar captcha.
- No modificar login/autenticacion.
- No modificar SecurityConfig.
- No modificar suscripciones.
- No tocar documentacion academica.
- Las coordenadas deben ser opcionales para no romper datos antiguos.

Tareas backend:
1. Revisar entidades Company, PickupRequest y TransportUnit o sus equivalentes reales.
2. Agregar en Company coordenadas opcionales: latitude y longitude.
3. Agregar en PickupRequest coordenadas opcionales: pickupLatitude y pickupLongitude.
4. Evaluar TransportUnit. Solo si participa en seguimiento o mapa operativo, agregar lastLatitude, lastLongitude y lastLocationAt. Si no aplica, no lo fuerces.
5. Actualizar DTOs de request/response relacionados con creacion de solicitud, seguimiento, mapa operativo, recojo activo y datos de empresa si corresponde.
6. Validar coordenadas si llegan: latitud entre -90 y 90, longitud entre -180 y 180. Si son null, permitir. Si solo llega una de las dos, devolver error claro.
7. Actualizar servicios para guardar coordenadas cuando llegan y devolverlas cuando existen.
8. No geocodificar. No llamar servicios externos. No inventar coordenadas.
9. Si Hibernate ddl-auto update no es suficiente o el proyecto requiere SQL manual, crear un script PostgreSQL con ALTER TABLE ADD COLUMN IF NOT EXISTS para las columnas nuevas, ajustando nombres reales de tablas.

Tareas frontend:
1. Actualizar tipos TypeScript para aceptar pickupLatitude, pickupLongitude, companyLatitude, companyLongitude, collectorLatitude y collectorLongitude cuando corresponda.
2. Preparar EmpresaSolicitarRecojo.tsx para enviar direccion y coordenadas opcionales. Si todavia no hay selector de mapa, enviar null o no enviar los campos segun el contrato del API.
3. Preparar EmpresaSeguimiento.tsx para leer coordenadas reales si llegan desde backend, manteniendo MapMock funcionando.
4. Preparar RecolectorMapaOperativo.tsx para leer coordenadas reales si llegan desde backend, manteniendo MapMock funcionando.
5. Si la UI promete GPS real o tiempo real sin existir todavia, cambiar esos textos por etiquetas honestas como mapa operativo referencial, seguimiento referencial o ubicacion estimada.

Validacion obligatoria:
Backend:
- Ejecutar mvnw.cmd clean compile.

Frontend:
- Ejecutar npm run lint.
- Ejecutar npx tsc --noEmit.
- Ejecutar npm run build.

Entrega:
Reporta exactamente:
1. Archivos modificados.
2. Campos agregados.
3. DTOs actualizados.
4. Servicios modificados.
5. Endpoints que aceptan coordenadas.
6. Endpoints que devuelven coordenadas.
7. Resultado de compilacion backend.
8. Resultado de lint/tsc/build frontend.
9. Confirmacion de que no se integro Google Maps.
10. Confirmacion de que no se agregaron API keys.
11. Pendientes para el Punto 3.
```

---

## 14. Punto 3 previsto, no ejecutar aun

El siguiente punto sera integrar Google Maps visualmente en frontend de forma controlada:

- Crear variable `VITE_GOOGLE_MAPS_API_KEY` solo en `.env.example` y entorno local.
- Instalar libreria de mapas.
- Crear componente `GoogleMapView`.
- Reemplazar progresivamente `MapMock`.
- Mostrar marcadores reales si hay coordenadas.
- Mantener fallback si no hay coordenadas.

No ejecutar esto durante el Punto 2.
