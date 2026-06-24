# ECO TACNA - FLUJO DE PRECIO DEFINIDO POR RECOLECTOR

## 1. Objetivo

Definir y guiar la corrección del flujo de precio del aceite usado en EcoTacna.

Problema actual observado:

- El restaurante ya no tiene campo visible para precio.
- El recolector sí tiene campo `Precio por litro`.
- Aun así, varias solicitudes aparecen con `S/ 2.50` por defecto.
- No está claro si ese precio viene del restaurante, del recolector o de un valor fijo técnico.
- Antes de continuar con Google Maps, QR o reglas adicionales, debe quedar definido y funcionando quién coloca el precio y cómo se guarda.

Este documento debe leerse antes de modificar código.

## 2. Regla funcional final

El restaurante/generador NO debe definir el precio del aceite.

El precio por litro debe ser definido por el recolector antes de aceptar la solicitud.

### Justificación

El recolector es quien evalúa:

- calidad visible del aceite;
- cantidad reportada;
- distancia o zona;
- costo operativo;
- condición de envases;
- viabilidad del recojo;
- precio real que puede pagar.

Si el restaurante define el precio, se genera conflicto:

- puede poner un precio muy alto y ningún recolector aceptará;
- puede poner un precio muy bajo y luego habrá reclamos;
- se mezcla “precio solicitado” con “precio realmente acordado”;
- el historial y la constancia pueden quedar inconsistentes.

## 3. Flujo correcto

```text
Restaurante reporta aceite
→ Recolector revisa foto, litros, envases, ubicación y observaciones
→ Recolector define precio por litro
→ Recolector acepta recojo
→ Restaurante ve precio definido/propuesto por el recolector
→ Recolector registra litros reales y pago
→ Restaurante confirma recepción/pago
→ Solicitud queda COMPLETADO / PAGADO
```

## 4. Restaurante/generador

El restaurante debe reportar únicamente:

- foto del aceite;
- cantidad estimada en litros;
- cantidad de envases;
- ubicación referencial o Google Maps cuando se integre;
- observaciones;
- confirmación de que es aceite vegetal usado de cocina.

El restaurante NO debe ingresar:

- precio por litro;
- monto total;
- oferta económica.

Si por compatibilidad el backend todavía exige un campo de precio al crear solicitud, debe manejarse como valor técnico temporal, no como precio visible del restaurante.

## 5. Recolector

El recolector debe definir:

- precio por litro antes de aceptar;
- monto estimado calculado visualmente con `litros estimados * precio por litro`.

Al aceptar:

- el precio definido por recolector debe enviarse al backend;
- el backend debe guardarlo;
- el restaurante debe verlo en Mis solicitudes / Seguimiento;
- el mismo precio debe ser la base del pago operativo.

## 6. Textos recomendados

### Recolector

Título:

```text
Evaluar y responder solicitud
```

Campo:

```text
Precio por litro (S/)
```

Texto de ayuda:

```text
Define el precio por litro según la cantidad, condición del aceite y zona de recojo.
```

Monto:

```text
Monto estimado
```

Botón:

```text
Aceptar recojo
```

Nota:

```text
Al aceptar, se notificará al restaurante el precio propuesto para el recojo.
```

### Restaurante

Usar:

```text
Precio definido por el recolector
```

o:

```text
Precio propuesto por el recolector
```

Evitar:

```text
Oferta del restaurante
```

porque ya no corresponde.

## 7. Regla sobre S/ 2.50

`S/ 2.50` puede usarse solo como valor inicial sugerido en la interfaz del recolector.

No debe interpretarse como:

- precio del restaurante;
- precio obligatorio;
- precio final fijo;
- dato inventado sin guardar.

Comportamiento esperado:

```text
Precio por litro inicial sugerido: 2.50
Recolector puede editarlo
Al aceptar, se envía al backend
Backend guarda ese valor
Frontend muestra ese valor guardado
```

## 8. Diagnóstico obligatorio antes de modificar

Antigravity debe revisar y responder sin modificar código:

1. En `EmpresaSolicitarRecojo.tsx`:
   - ¿se está enviando `precioOfertadoPorLitro` al crear solicitud?
   - ¿se envía fijo `2.50`?
   - ¿el backend exige ese campo?
   - ¿se puede enviar `null` o backend no lo permite?

2. En `RecolectorRecojosDia.tsx`:
   - ¿el campo `Precio por litro` está conectado a un estado real?
   - ¿al aceptar recojo se envía el precio al backend?
   - ¿o solo se usa visualmente?

3. En `recolectorApi.ts`:
   - ¿`aceptarSolicitud(id)` acepta payload con precio?
   - ¿solo llama endpoint sin body?
   - ¿existe función para aceptar con precio?

4. En backend:
   - revisar `PickupRequestController.java`;
   - revisar `PickupRequestService.java`;
   - revisar DTO usado para aceptar solicitud;
   - revisar entidad `PickupRequest`;
   - revisar campos existentes relacionados con precio.

5. Confirmar:
   - dónde se guarda actualmente el precio;
   - si existe campo para precio definido por recolector;
   - si se necesita backend;
   - si se puede resolver sin migración;
   - si hay que ajustar un DTO de aceptación.

No modificar código hasta terminar el diagnóstico.

## 9. Implementación esperada

### Backend

Usar campos existentes si ya existen.

Prioridad recomendada:

```text
precioOfertadoPorLitro → legado/técnico
precioPorLitro → precio final/aplicado definido por recolector
montoTotal → total final cuando se confirman litros reales
```

Si solo existe `precioOfertadoPorLitro`, puede reutilizarse temporalmente como “precio definido por recolector”, pero los textos frontend no deben llamarlo oferta del restaurante.

No crear migraciones salvo necesidad real.

### Endpoint aceptar recojo

El recolector debe aceptar enviando precio.

Ejemplo conceptual:

```http
POST /api/recolector/solicitudes/{id}/aceptar
```

Body conceptual:

```json
{
  "precioPorLitro": 2.80
}
```

Si el endpoint actual no acepta body:

- aceptar body opcional de forma mínima;
- mantener compatibilidad con flujo antiguo;
- si llega sin body, usar fallback controlado solo si es necesario;
- validar precio mayor a 0 cuando llega desde nueva interfaz.

### Frontend recolector

En `RecolectorRecojosDia.tsx`:

- mantener campo `Precio por litro (S/)`;
- valor inicial sugerido `2.50`;
- editable;
- monto estimado = litros estimados * precio;
- al aceptar, enviar precio al backend;
- validar precio mayor a 0;
- mostrar error si falla.

### Frontend restaurante

En `EmpresaSolicitarRecojo.tsx`:

- no mostrar campo precio;
- no hablar de oferta del restaurante;
- si se envía precio técnico por compatibilidad, ocultarlo y documentarlo.

En `EmpresaMisSolicitudes.tsx`:

- si no hay recolector asignado: mostrar `Pendiente de precio`;
- si hay recolector y precio guardado: mostrar `Precio definido por recolector: S/ X.XX por litro`;
- monto estimado = litros aproximados * precio definido por recolector.

## 10. Estados esperados

### Antes de aceptación

```text
Estado: PENDIENTE
Recolector: No asignado
Precio: Pendiente de precio
Pago: PENDIENTE
```

### Después de aceptación

```text
Estado: PROGRAMADO
Recolector: asignado
Precio definido por recolector: S/ X.XX
Monto estimado: litros estimados * precio
Pago: PENDIENTE
```

### Después de recojo y pago

```text
Estado: RECOGIDO
Pago: registrado por recolector, pendiente de confirmación del restaurante
```

### Después de confirmación del restaurante

```text
Estado: COMPLETADO
Pago: PAGADO
```

## 11. Archivos a revisar

Frontend:

```text
EcoTacnaFrontend/src/pages/empresa/EmpresaSolicitarRecojo.tsx
EcoTacnaFrontend/src/pages/empresa/EmpresaMisSolicitudes.tsx
EcoTacnaFrontend/src/pages/recolector/RecolectorRecojosDia.tsx
EcoTacnaFrontend/src/services/empresaApi.ts
EcoTacnaFrontend/src/services/recolectorApi.ts
EcoTacnaFrontend/src/types.ts
```

Backend:

```text
EcoTacnaSpringBootJPA/src/main/java/.../controller/PickupRequestController.java
EcoTacnaSpringBootJPA/src/main/java/.../service/PickupRequestService.java
EcoTacnaSpringBootJPA/src/main/java/.../dto/*
EcoTacnaSpringBootJPA/src/main/java/.../entity/PickupRequest.java
```

Solo revisar entidad. No modificar entidad ni base de datos salvo justificación previa.

## 12. No tocar

No tocar:

```text
SecurityConfig
Login
RegisterCompanyPage
PaymentCheckoutPage
SubscriptionStatusPage
ApiPeruDev / SUNAT
GoogleMapView
MapFallback
mapTypes
.env
.env.local
application.properties
migraciones SQL
configuración de puertos
Culqi
constancia PDF salvo que sea estrictamente necesario mostrar precio correcto
```

## 13. Reglas de arquitectura

Antes de programar, revisar los `.md` existentes del proyecto:

- planes de ejecución;
- documentos de arquitectura;
- refactors;
- prompts previos;
- reglas de no tocar configuración;
- decisiones previas de flujo.

La implementación debe:

- ser mínima;
- seguir la estructura existente;
- no hacer refactor general;
- no cambiar diseño global;
- no mezclar Google Maps;
- no mezclar Culqi;
- no tocar seguridad;
- no cambiar contratos existentes sin necesidad;
- mantener compatibilidad con datos anteriores si es posible.

## 14. Validaciones obligatorias

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

Si compila:

```powershell
.\mvnw.cmd spring-boot:run
```

## 15. Pruebas funcionales obligatorias

### Prueba 1: restaurante crea solicitud

- Crear solicitud con foto, litros, envases y observaciones.
- Confirmar que no se pide precio al restaurante.
- En Mis solicitudes debe verse:
  - `PENDIENTE`;
  - recolector `No asignado`;
  - precio `Pendiente de precio`.

### Prueba 2: recolector acepta con precio

- Recolector abre solicitud.
- Define precio, por ejemplo `2.80`.
- Monto estimado se actualiza.
- Acepta recojo.
- Backend guarda ese precio.

### Prueba 3: restaurante ve precio

- Restaurante entra a Mis solicitudes.
- Debe ver:
  - recolector asignado;
  - precio definido por recolector;
  - monto estimado correcto.

### Prueba 4: recolector registra recojo y pago

- Precio acordado debe venir como valor inicial desde el precio definido al aceptar.
- Monto total se calcula con litros reales.
- Confirmar recojo y pago.
- Solicitud pasa a `RECOGIDO`.

### Prueba 5: restaurante confirma recepción

- En seguimiento, botón confirmar se habilita si está `RECOGIDO`.
- Al confirmar, queda:
  - `COMPLETADO`;
  - `PAGADO`.

## 16. Resultado esperado final

Al terminar:

- restaurante no define precio;
- recolector define precio;
- precio se guarda;
- restaurante ve el precio definido por recolector;
- `S/ 2.50` solo es sugerencia editable;
- precio se usa en seguimiento, historial y pago;
- no se toca Google Maps;
- no se toca Culqi;
- no se rompe rechazo/cancelación;
- no se rompe constancia PDF.

## 17. Prompt corto para Antigravity

```text
Lee primero los documentos .md existentes del proyecto sobre arquitectura, refactor, planes de ejecución y reglas de no tocar configuración.

Necesito corregir el flujo de precio del aceite.

Decisión funcional:
El restaurante NO define precio.
El recolector define el precio por litro antes de aceptar la solicitud.

Primero diagnostica sin modificar:
- si el precio que ingresa el recolector se envía al backend;
- si se guarda;
- qué campo usa;
- por qué aparece S/ 2.50 por defecto;
- si Mis solicitudes y seguimiento muestran el precio correcto;
- si se necesita backend o solo frontend.

Luego propone cambios mínimos.

No tocar Google Maps, Culqi, seguridad, login, roles, .env, configuración, base de datos ni migraciones.
No hacer refactor general.
Respetar la arquitectura y los .md existentes del proyecto.
```
