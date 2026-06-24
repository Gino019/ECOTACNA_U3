# CONTEXTO ACTUAL ECOTACNA - FLUJOS RESTAURANTE / RECOLECTOR

## Objetivo de este archivo

Este archivo sirve para continuar el trabajo en otra cuenta o en otro chat de Antigravity sin perder el contexto.

Debe leerse antes de seguir modificando el proyecto EcoTacna.

---

## Estado general del proyecto

Se está trabajando en el proyecto EcoTacna, específicamente en los flujos de:

- Restaurante/generador que reporta aceite usado.
- Recolector que acepta, registra recojo y registra información del pago.
- Restaurante que revisa seguimiento y confirma recepción del pago.

La prioridad actual es que los flujos funcionen correctamente sin romper:

- backend existente,
- login,
- roles,
- seguridad,
- ApiPeruDev/SUNAT,
- Culqi,
- suscripciones,
- Google Maps real,
- configuración local,
- variables `.env`.

---

## Importante sobre Google Maps

Google Maps real queda pendiente para otra fase.

No se debe tocar ahora:

- `GoogleMapView.tsx`
- `MapFallback.tsx`
- `mapTypes.ts`
- API key de Google Maps
- geocoding
- rutas
- cálculo real de distancia
- selección real de punto de recojo
- recolector más cercano

Cualquier dato de distancia, llegada estimada o ubicación debe quedar como referencial si todavía no depende de Google Maps real.

---

## Importante sobre Culqi

Culqi no tiene relación con el flujo operativo de recojo/pago del aceite.

Culqi solo corresponde a pagos de suscripción de empresas o recolectores.

No tocar:

- Culqi
- pagos de suscripción
- checkout
- subscription
- lógica de activación de suscripción

---

# Cambios ya realizados

## 1. Restaurante - Reportar solicitud

Archivo trabajado:

`EcoTacnaFrontend/src/pages/empresa/EmpresaSolicitarRecojo.tsx`

Cambios realizados:

- Se rediseñó la interfaz para reportar solicitud de recojo.
- Se cambió el enfoque a `aceite vegetal usado de cocina`.
- Se agregó campo visual de foto del aceite.
- Se agregó campo de cantidad estimada en litros.
- Se agregó cantidad de envases.
- Se agregó observaciones.
- Se agregó checkbox obligatorio:
  `Confirmo que el residuo corresponde a aceite vegetal usado de cocina.`
- Se agregó texto de ayuda:
  `No se aceptan aceites de motor, minerales, químicos u otros residuos peligrosos.`
- Se dejó ubicación como referencial por ahora.
- No se exige Google Maps real ni coordenadas exactas para reportar.
- Si no hay coordenadas, se envían valores compatibles con el backend.
- Se agregó modal de confirmación antes de reportar:
  - `¿Confirmar reporte de solicitud?`
  - botones: `Cancelar` y `Sí, reportar solicitud`.

Restricciones respetadas:

- No se tocó backend.
- No se tocó Google Maps real.
- No se tocó ApiPeruDev/SUNAT.
- No se tocó Culqi.
- No se tocó login, roles ni seguridad.

---

## 2. Recolector - Recojos del día / Registrar recojo y pago

Archivo trabajado:

`EcoTacnaFrontend/src/pages/recolector/RecolectorRecojosDia.tsx`

Cambios realizados:

- Se mejoró la vista del recolector para solicitudes/recojos.
- Cuando el recolector ya aceptó una solicitud, aparece tarjeta:
  `Ya aceptaste este recojo`.
- Se agregó botón:
  `Registrar recojo y pago`.
- Ese botón abre una interfaz dentro de la misma pantalla:
  `Registrar recojo de aceite`.

La interfaz contiene:

### Sección 1 - Detalles del recojo

- Litros reales recogidos.
- Precio acordado.
- Monto total calculado visualmente.
- Observaciones opcionales.

### Sección 2 - Información del pago

- Método de pago.
- Monto pagado.
- Fecha y hora de pago.
- Voucher o evidencia de pago opcional.
- Certificado del recolector opcional.

### Sección 3 - Incidencia del recojo

- Motivo de incidencia/rechazo.
- Observaciones opcionales.
- Texto informativo para rechazar si hay problemas en sitio.

Botones finales:

- `Rechazar recojo`
- `Confirmar recojo y pago`

Importante:

- No debe existir botón `Guardar evidencias`.
- No se implementó subida real de archivos.
- Voucher/certificado son campos visuales preparados.
- No se tocó backend.
- No se tocaron endpoints.
- No se tocó Google Maps real.

---

## 3. Restaurante - Mis solicitudes / Ver seguimiento

Archivo trabajado:

`EcoTacnaFrontend/src/pages/empresa/EmpresaMisSolicitudes.tsx`

Cambios realizados:

- Se conservó el botón original:
  `Ver detalle`.
- Se conservó el modal original de detalle.
- Se conservó la lógica de constancia PDF.
- Se agregó un segundo botón:
  `Ver seguimiento`.

El modal `Ver seguimiento` muestra:

- Datos principales de la solicitud.
- Estado actual.
- Recolector asignado si existe.
- Línea de seguimiento.
- Botón de confirmar pago bloqueado o habilitado según estado.
- Reportar incidencia como panel visual/frontend.
- Cancelar solicitud solo si estado es `PENDIENTE`.

Regla actual para confirmar pago:

- Si `estado !== "COMPLETADO"` o `estadoPago !== "PAGADO"`:
  - botón bloqueado: `Confirmar pago`.
- Si `estado === "COMPLETADO"` y `estadoPago === "PAGADO"`:
  - botón verde: `Confirmar recepción del pago`.

Importante:

- No se reutilizó `empresaApi.confirmarPago` porque puede pertenecer al flujo operativo del recolector.
- Confirmación de recepción del pago del restaurante quedó visual/frontend con toast.
- No se tocó backend.
- No se tocaron endpoints ni servicios API.
- No se tocó Google Maps real.
- No se tocó recolector en esta fase.

---

# Problema actual

El flujo visual ya existe, pero el botón del recolector:

`Confirmar recojo y pago`

aparentemente solo muestra un toast, pero no actualiza realmente la solicitud en backend.

## Comportamiento observado

Como recolector:

1. Entra a `Recojos del día`.
2. Aparece un recojo aceptado/programado.
3. Entra a `Registrar recojo y pago`.
4. Presiona `Confirmar recojo y pago`.
5. Aparece toast:
   `Recojo y pago confirmados exitosamente`.

Pero después:

- La solicitud sigue apareciendo como `PROGRAMADO`.
- El pago sigue como `PENDIENTE`.
- Sigue apareciendo en recojos activos / recojos del día.
- En historial del recolector no pasa correctamente a `COMPLETADO/PAGADO`.
- En restaurante, `Ver seguimiento` sigue bloqueando `Confirmar pago` porque no detecta `COMPLETADO/PAGADO`.

---

# Objetivo siguiente

Diagnosticar y corregir el flujo real de confirmación del recojo y pago.

El objetivo funcional correcto es:

`Recolector confirma recojo y pago`
→ backend actualiza solicitud
→ estado pasa a `COMPLETADO`
→ estadoPago pasa a `PAGADO`
→ desaparece de recojo activo / recojos del día
→ aparece en historial
→ restaurante ve `COMPLETADO/PAGADO`
→ restaurante puede confirmar recepción del pago
→ constancia queda disponible si backend ya la genera

---

# Restricciones para la siguiente tarea

No tocar:

- Google Maps real.
- Culqi.
- pagos de suscripción.
- login.
- roles.
- seguridad.
- ApiPeruDev/SUNAT.
- `.env`.
- configuración.
- DTOs.
- entidades.
- base de datos.
- migraciones.
- scripts SQL.
- endpoints nuevos sin diagnóstico previo.

No inventar endpoints nuevos.

No hacer refactor general.

No modificar pantallas que no estén relacionadas.

---

# Diagnóstico que se debe pedir primero

Antes de modificar código, pedir a Antigravity este diagnóstico:

```text
Necesito diagnosticar por qué el botón “Confirmar recojo y pago” del recolector solo muestra toast, pero no actualiza realmente la solicitud.

Problema observado:
- Como recolector, entro a “Registrar recojo y pago”.
- Presiono “Confirmar recojo y pago”.
- Sale toast: “Recojo y pago confirmados exitosamente”.
- Pero la solicitud sigue apareciendo como PROGRAMADO y pago PENDIENTE.
- En historial del recolector no pasa correctamente a COMPLETADO/PAGADO.
- En restaurante, “Ver seguimiento” todavía mantiene bloqueado “Confirmar pago” porque no detecta estado COMPLETADO/PAGADO.

Por ahora NO modifiques archivos.

Revisa:
- EcoTacnaFrontend/src/pages/recolector/RecolectorRecojosDia.tsx
- EcoTacnaFrontend/src/services/recolectorApi.ts
- EcoTacnaFrontend/src/types.ts
- controladores backend relacionados con recolector, pickup, recojo o pago
- servicios backend relacionados con confirmar recojo/pago

Necesito que informes:

1. Si ya existe un endpoint backend para confirmar recojo y pago.
2. Qué ruta exacta usa ese endpoint.
3. Qué payload espera.
4. Si recolectorApi.ts ya tiene una función para ese endpoint.
5. Si RecolectorRecojosDia.tsx está llamando realmente a esa función o solo muestra toast.
6. Qué campos actualiza backend cuando se confirma.
7. Si después de confirmar debería quedar:
   - estado = COMPLETADO
   - estadoPago = PAGADO
8. Qué archivo exacto habría que modificar para conectar el botón con el endpoint real.
9. Si se necesita tocar backend o solo frontend.

Restricciones:
- No modifiques código todavía.
- No toques Google Maps.
- No toques Culqi ni pagos de suscripción.
- No toques restaurante todavía.
- No toques .env, configuración, login, roles ni seguridad.
- No inventes endpoints nuevos.
- No cambies DTOs ni entidades.
```

---

# Qué hacer después del diagnóstico

## Si ya existe endpoint backend funcional

Hacer solo conexión frontend:

- Modificar `RecolectorRecojosDia.tsx`.
- Si hace falta, modificar `recolectorApi.ts` solo si la función ya no existe.
- Al presionar `Confirmar recojo y pago`, llamar al endpoint real.
- Enviar el payload exacto que espera backend.
- Refrescar la lista después de confirmar.
- El recojo ya no debe seguir activo.
- Debe pasar a historial como `COMPLETADO/PAGADO`.

## Si ya existe función en `recolectorApi.ts`

Usarla directamente.

No crear función duplicada.

## Si no existe endpoint backend

No crear nada de inmediato.

Primero informar:

- qué falta,
- qué endpoint mínimo sería necesario,
- qué controlador/servicio sería afectado,
- qué DTO existente podría reutilizarse,
- si se puede resolver sin migración ni cambios de base de datos.

---

# Resultado esperado al terminar la corrección

Después de la corrección:

## En recolector

Al hacer clic en `Confirmar recojo y pago`:

- debe llamar al backend real,
- debe actualizar estado,
- debe mostrar toast real de éxito,
- debe refrescar datos,
- debe desaparecer de recojo activo,
- debe aparecer en historial como:
  - `COMPLETADO`
  - `PAGADO`.

## En restaurante

En `Mis solicitudes`:

- la solicitud debe cambiar a:
  - `COMPLETADO`
  - `PAGADO`.

En `Ver seguimiento`:

- debe habilitarse:
  `Confirmar recepción del pago`.

En `Ver detalle`:

- debe mantenerse la lógica de constancia PDF existente.

---

# Recordatorio final

Trabajar por pasos:

1. Diagnóstico sin modificar.
2. Revisar respuesta.
3. Modificación mínima.
4. Validar frontend.
5. Validar backend si se toca.
6. Probar flujo completo:
   - restaurante reporta,
   - recolector acepta,
   - recolector confirma recojo y pago,
   - restaurante ve pago registrado,
   - restaurante confirma recepción.

No avanzar a Google Maps hasta que este flujo quede funcional.
