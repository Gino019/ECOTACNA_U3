# ECO TACNA — PLAN DE EJECUCIÓN FINAL PARA CERRAR MÓDULO RECOLECTOR

## 0. Propósito

Este documento sirve para que Antigravity o el desarrollador cierre correctamente el módulo del recolector relacionado con:

1. Precio por litro.
2. Registro del recojo.
3. Eliminación del bloque visual de información de pago.
4. Validación frontend/backend del rango permitido.
5. Conservación del flujo existente sin romper Google Maps, Culqi, seguridad ni constancias.

Debe leerse antes de modificar código.

También debe respetar los `.md` ya existentes dentro del proyecto, porque el proyecto ya tiene documentos de arquitectura, reglas de implementación, planes de ejecución, refactors y contexto previo.

---

## 1. Problema actual

En la pantalla del recolector:

```text
Recolector → Recojos del día → Registrar recojo de aceite
```

todavía se puede ingresar un precio fuera del rango permitido, por ejemplo:

```text
S/ 5.00
S/ 8.00
```

El sistema calcula el monto total con ese valor inválido y permite avanzar o deja la posibilidad de hacerlo.

Además, sigue apareciendo el bloque:

```text
2. Información del pago
```

con campos que ya no deben estar en esta pantalla:

```text
Método de pago
Monto pagado
Fecha y hora de pago
Voucher o evidencia de pago
Certificado del recolector
Subir imagen o captura
Subir imagen o PDF
```

Ese bloque debe eliminarse visualmente y también debe revisarse si existe lógica asociada en frontend/backend para no dejar código muerto ni flujos inconsistentes.

---

## 2. Decisión funcional final

El módulo debe quedar así:

```text
Restaurante reporta aceite
→ Recolector acepta la solicitud definiendo precio por litro válido
→ Recolector registra litros reales recogidos
→ Recolector confirma recojo
→ Restaurante confirma recepción/pago desde su seguimiento
→ Solicitud queda COMPLETADO / PAGADO
```

La pantalla del recolector NO debe pedir:

```text
Método de pago
Voucher
Certificado
Fecha/hora de pago
Monto pagado manual
```

El pago final lo confirma el restaurante desde su vista de seguimiento.

---

## 3. Regla obligatoria del precio

El precio por litro definido por el recolector debe estar dentro del rango:

```text
Mínimo: S/ 2.00
Máximo: S/ 3.00
```

Regla formal:

```text
2.00 <= precioPorLitro <= 3.00
```

Debe validarse en dos capas:

1. Frontend.
2. Backend.

No basta con bloquear el input en pantalla. Si alguien envía `S/ 8.00` por Postman, consola o Swagger, el backend debe rechazarlo.

Mensaje único recomendado:

```text
El precio por litro debe estar entre S/ 2.00 y S/ 3.00.
```

---

## 4. Archivos que Antigravity debe leer antes de tocar código

Primero debe revisar los `.md` existentes del proyecto:

```text
README.md
CONTEXTOS.md
planes de ejecución
refactors
documentos de arquitectura
documentos de reglas internas
prompts previos
```

Debe respetar la arquitectura y estilo existentes.

No hacer refactor general.

---

## 5. Archivos probables a revisar

### Frontend

```text
EcoTacnaFrontend/src/pages/recolector/RecolectorRecojosDia.tsx
EcoTacnaFrontend/src/services/recolectorApi.ts
EcoTacnaFrontend/src/types.ts
```

Solo si es necesario:

```text
EcoTacnaFrontend/src/pages/empresa/EmpresaMisSolicitudes.tsx
EcoTacnaFrontend/src/services/empresaApi.ts
```

### Backend

```text
EcoTacnaSpringBootJPA/src/main/java/.../controller/PickupRequestController.java
EcoTacnaSpringBootJPA/src/main/java/.../service/PickupRequestService.java
EcoTacnaSpringBootJPA/src/main/java/.../dto/*
EcoTacnaSpringBootJPA/src/main/java/.../entity/PickupRequest.java
```

La entidad `PickupRequest` solo debe revisarse. No modificar entidad ni base de datos salvo justificación previa y confirmación del usuario.

---

## 6. Fase 0 — Diagnóstico obligatorio SIN modificar

Antes de editar código, Antigravity debe responder:

1. ¿Dónde se define actualmente el precio cuando el recolector acepta la solicitud?
2. ¿Dónde se define actualmente el precio en `Registrar recojo de aceite`?
3. ¿El campo `Precio acordado` se envía al backend?
4. ¿Qué endpoint se llama al presionar el botón actual de confirmación?
5. ¿Ese endpoint recibe precio?
6. ¿Ese endpoint recibe datos de pago como:
   - método de pago;
   - monto pagado;
   - fecha de pago;
   - voucher;
   - certificado?
7. ¿El backend guarda alguno de esos datos?
8. ¿Hay DTOs o campos relacionados a voucher/certificado/método de pago?
9. ¿Eliminar el bloque visual de pago rompe algún payload actual?
10. ¿Qué estados/useState/handlers solo alimentan ese bloque visual de pago?
11. ¿Dónde debe aplicarse la validación backend del rango S/ 2.00 a S/ 3.00?
12. ¿Existe ya una validación de precio en backend?
13. ¿Qué archivos exactos propone tocar?

No modificar código hasta entregar ese diagnóstico.

---

## 7. Fase 1 — Validación frontend de precio

En todo input donde el recolector ingrese precio por litro:

```text
Precio por litro
Precio acordado
```

aplicar:

```text
min = 2
max = 3
step = 0.10 o 0.01 según el estilo actual
```

### Requisitos

- Si el precio es menor a 2.00, bloquear.
- Si el precio es mayor a 3.00, bloquear.
- No calcular monto total como válido si el precio está fuera de rango.
- No permitir aceptar recojo con precio inválido.
- No permitir confirmar recojo con precio inválido.
- Mostrar mensaje claro.

Mensaje:

```text
El precio por litro debe estar entre S/ 2.00 y S/ 3.00.
```

### Valores de prueba

```text
1.50 → bloquear
2.00 → permitir
2.50 → permitir
3.00 → permitir
3.10 → bloquear
5.00 → bloquear
8.00 → bloquear
```

---

## 8. Fase 2 — Validación backend de precio

El backend debe validar el precio en cualquier endpoint donde el recolector envíe o actualice precio.

Revisar especialmente:

```text
aceptarSolicitud
confirmarRecojo
confirmPickup
registrarRecojo
confirmarPago operativo
```

o los nombres reales existentes.

### Regla backend

```java
precio.compareTo(new BigDecimal("2.00")) >= 0
&&
precio.compareTo(new BigDecimal("3.00")) <= 0
```

Si falla:

```text
El precio por litro debe estar entre S/ 2.00 y S/ 3.00.
```

No guardar precios inválidos.

No permitir que un request con `8.00` avance.

No crear migraciones.

No tocar base de datos.

---

## 9. Fase 3 — Eliminar bloque visual “Información del pago”

En `RecolectorRecojosDia.tsx`, eliminar visualmente el bloque completo:

```text
2. Información del pago
Método de pago
Monto pagado
Fecha y hora de pago
Voucher o evidencia de pago
Certificado del recolector
Subir imagen o captura
Subir imagen o PDF
```

### Nueva estructura visual esperada

La pantalla debe quedar con:

```text
Cabecera de solicitud
Detalles del recojo
Incidencia del recojo
Acciones finales
```

### Detalles del recojo

Debe conservar:

```text
Litros reales recogidos
Precio acordado
Monto total calculado
Observaciones opcionales
```

### Incidencia del recojo

Debe conservar:

```text
Motivo
Observaciones
Rechazar recojo
```

### Botones finales

Debe quedar:

```text
Rechazar recojo
Confirmar recojo
```

No:

```text
Confirmar recojo y pago
```

Salvo que exista una razón técnica temporal; si existe, Antigravity debe explicarla antes.

---

## 10. Fase 4 — Limpieza de lógica de pago en frontend

Buscar y eliminar solo si ya no se usa:

```text
metodoPago
montoPagado
fechaPago
voucher
certificado
paymentMethod
paymentAmount
paymentDate
voucherFile
certificateFile
```

No eliminar lógica necesaria para:

```text
litros reales
precio acordado
monto total
confirmar recojo
rechazar recojo
incidencia
compatibilidad mínima con backend
```

---

## 11. Fase 5 — Revisión backend del flujo de pago

No eliminar columnas.

No modificar entidades.

No crear migraciones.

Solo revisar si el backend exige datos de pago desde el recolector.

### Si los datos de pago son opcionales

No enviarlos desde frontend.

### Si el backend los exige

Ajustar mínimamente el endpoint para permitir confirmar recojo sin voucher, certificado, método ni fecha de pago.

### Si existe endpoint correcto solo de recojo

Usarlo.

---

## 12. Fase 6 — Restaurante y confirmación final

No romper:

```text
EmpresaMisSolicitudes.tsx
Ver seguimiento
Ver detalle
Constancia PDF
Historial
```

Reglas:

- Si estado está `RECOGIDO`, restaurante puede confirmar recepción/pago.
- Si estado está `COMPLETADO/PAGADO`, constancia queda disponible.
- Si estado está `CANCELADO`, no confirmar pago.

---

## 13. Restricciones estrictas

No tocar:

```text
Google Maps
Culqi
pagos de suscripción
login
roles
seguridad
.env
.env.local
application.properties
configuración de puertos
ApiPeruDev/SUNAT
migraciones
base de datos
entidades salvo justificación previa
constancia PDF salvo ajuste mínimo inevitable
```

No hacer refactor general.

No cambiar diseño global.

No cambiar arquitectura sin revisar los `.md`.

---

## 14. Archivos permitidos

Permitidos principalmente:

```text
EcoTacnaFrontend/src/pages/recolector/RecolectorRecojosDia.tsx
EcoTacnaFrontend/src/services/recolectorApi.ts
EcoTacnaFrontend/src/types.ts
PickupRequestController.java
PickupRequestService.java
DTOs relacionados con aceptar/confirmar recojo
```

Solo si es necesario:

```text
EcoTacnaFrontend/src/pages/empresa/EmpresaMisSolicitudes.tsx
EcoTacnaFrontend/src/services/empresaApi.ts
```

---

## 15. Validaciones técnicas

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

---

## 16. Pruebas funcionales finales

### Prueba 1 — Precio inválido al aceptar

1. Entrar como recolector.
2. Abrir solicitud pendiente.
3. Ingresar precio `5.00`.
4. Debe bloquear y mostrar error.

### Prueba 2 — Precio válido al aceptar

1. Ingresar `2.50`.
2. Aceptar recojo.
3. Debe permitir.
4. Restaurante debe ver precio definido por recolector.

### Prueba 3 — Precio inválido en Registrar recojo

1. Entrar a `Registrar recojo de aceite`.
2. En precio acordado ingresar `8.00`.
3. Debe bloquear.
4. No debe confirmar.
5. Backend no debe guardar.

### Prueba 4 — Bloque de pago eliminado

Verificar que ya no aparezca:

```text
Método de pago
Monto pagado
Fecha y hora de pago
Voucher
Certificado
Subir imagen o captura
Subir imagen o PDF
```

### Prueba 5 — Confirmar recojo

1. Usar precio válido.
2. Ingresar litros reales.
3. Confirmar recojo.
4. Debe pasar al flujo esperado sin pedir pago visual.

### Prueba 6 — Confirmación restaurante

1. Restaurante entra a Ver seguimiento.
2. Confirma recepción/pago si corresponde.
3. Debe quedar `COMPLETADO / PAGADO`.
4. Constancia no debe romperse.

### Prueba 7 — API directa

Enviar precio `8.00` por API.

Resultado esperado:

```text
Backend rechaza con error controlado.
No guarda.
```

---

## 17. Resultado esperado final

Al terminar:

- no se puede ingresar precio menor a `S/ 2.00`;
- no se puede ingresar precio mayor a `S/ 3.00`;
- `S/ 5.00` y `S/ 8.00` quedan bloqueados;
- backend también rechaza precios inválidos;
- se elimina el bloque visual de pago;
- ya no aparecen voucher ni certificado;
- la pantalla del recolector queda más limpia;
- no se rompe rechazo/cancelación;
- no se rompe confirmación del restaurante;
- no se rompe constancia PDF;
- no se toca Google Maps;
- no se toca Culqi;
- no se toca seguridad;
- no se toca base de datos.

---

## 18. Prompt corto para Antigravity

```text
Lee primero los .md existentes del proyecto sobre arquitectura, refactor, reglas de programación y restricciones.

Necesito cerrar el módulo del recolector.

Problemas:
1. En Registrar recojo de aceite puedo ingresar precios fuera de rango como S/ 8.00.
2. El precio debe estar entre S/ 2.00 y S/ 3.00.
3. Debe validarse en frontend y backend.
4. El bloque Información del pago debe eliminarse visualmente y limpiarse su lógica si solo alimenta esa vista.
5. Ya no deben aparecer método de pago, monto pagado, fecha/hora de pago, voucher ni certificado.
6. El botón debe quedar como Confirmar recojo, no Confirmar recojo y pago, salvo razón técnica temporal.

Primero diagnostica sin modificar.
Luego aplica cambios mínimos.

No tocar Google Maps, Culqi, pagos de suscripción, login, roles, seguridad, .env, configuración, base de datos, migraciones ni constancia PDF.
No hacer refactor general.
Respeta los .md existentes del proyecto.
```
