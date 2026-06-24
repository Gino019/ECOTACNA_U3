# FASE 3C - Restaurante: seguimiento de recojo y confirmación de recepción del pago

## Dónde guardar este archivo

Guardar este archivo dentro del proyecto en:

`EcoTacnaFrontend/docs/prompts/FASE_3C_RESTAURANTE_SEGUIMIENTO_CONFIRMACION_PAGO.md`

Ruta aproximada en Windows:

`C:\Users\MSI\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend\docs\prompts\FASE_3C_RESTAURANTE_SEGUIMIENTO_CONFIRMACION_PAGO.md`

Si no existe la carpeta `prompts`, crearla dentro de:

`EcoTacnaFrontend/docs/`

---

## Objetivo

Implementar la vista del restaurante/generador para revisar el seguimiento de una solicitud de recojo, ver el estado del recolector, ver el registro del pago y confirmar la recepción del pago cuando corresponda.

Esta fase debe cerrar el flujo restaurante después de que el recolector acepte, registre el recojo y confirme el pago.

La interfaz debe funcionar con el flujo real existente. No debe ser solo una maqueta sin conexión al estado actual.

---

## Contexto funcional

Flujo esperado del proyecto:

1. El restaurante reporta una solicitud de recojo.
2. El recolector acepta la solicitud.
3. La solicitud queda asignada/programada.
4. El recolector ingresa a `Registrar recojo de aceite`.
5. El recolector registra:
   - litros reales recogidos,
   - precio acordado,
   - método de pago,
   - monto pagado,
   - fecha/hora de pago.
6. El recolector presiona `Confirmar recojo y pago`.
7. La solicitud debe quedar como completada/pagada según el flujo existente del backend o del frontend actual.
8. El restaurante debe poder ver ese cambio en `Mis solicitudes`.
9. Cuando el pago esté registrado, el restaurante podrá confirmar la recepción del pago o reportar incidencia.

---

## Importante sobre funcionalidad real

No crear una interfaz aislada sin conexión al flujo.

La pantalla del restaurante debe habilitar o bloquear acciones según el estado real de la solicitud.

Usar los estados o campos existentes que ya llegan desde el backend, por ejemplo:

- `estado`
- `estadoPago`
- `montoTotal`
- `precioPorLitro`
- `precioOfertadoPorLitro`
- `volumenAproximado`
- `litrosConfirmados`
- `collector`
- `recolector`
- `transportUnit`
- `constancia`
- o los nombres reales que existan en el proyecto.

No inventar nombres de propiedades globales si no existen.

No modificar DTOs.

No modificar backend.

---

## Archivo principal probable

Modificar principalmente:

`EcoTacnaFrontend/src/pages/empresa/EmpresaMisSolicitudes.tsx`

Si la pantalla real de detalle/seguimiento del restaurante está en otro archivo, primero identificarlo y explicarlo antes de modificar.

Archivos que se pueden revisar, pero no modificar salvo necesidad justificada:

- `EcoTacnaFrontend/src/pages/empresa/EmpresaSeguimiento.tsx`
- `EcoTacnaFrontend/src/services/empresaApi.ts`
- `EcoTacnaFrontend/src/types.ts`

Si necesitas tocar otro archivo, primero explica por qué antes de modificar.

---

## Archivos prohibidos

No modificar:

- backend,
- entidades Java,
- DTOs,
- controladores,
- servicios backend,
- repositorios,
- base de datos,
- scripts SQL,
- `.env`,
- `.env.local`,
- `.env.example`,
- `vite.config.ts`,
- `package.json`,
- `application.properties`,
- login,
- registro,
- JWT,
- pagos de suscripción,
- ApiPeruDev/SUNAT,
- roles,
- seguridad,
- Google Maps real,
- `GoogleMapView.tsx`,
- `MapFallback.tsx`,
- `mapTypes.ts`,
- vistas del recolector ya implementadas, salvo que sea estrictamente necesario y se justifique antes.

---

## Relación con el botón actual `Ver detalle`

No eliminar el botón actual `Ver detalle`.

No romper la constancia existente.

Si `Ver detalle` actualmente abre o descarga la constancia, conservar ese comportamiento.

Agregar una acción adicional para esta nueva vista, por ejemplo:

- `Ver seguimiento`
- `Validar pago`
- `Seguimiento`

Recomendación visual:

En la tabla de `Mis solicitudes`, para cada solicitud debe haber:

- `Ver detalle` para conservar el detalle/constancia existente.
- `Ver seguimiento` o `Validar pago` para abrir la nueva vista de seguimiento y confirmación.

Si por limitación de espacio no se pueden mostrar dos botones grandes, usar un botón secundario o un menú de acciones, pero sin eliminar `Ver detalle`.

---

## Vista esperada: Detalle de solicitud con seguimiento

Crear o mejorar una vista/panel/modal dentro del frontend con título:

`Detalle de solicitud`

Debe mostrar:

- estado actual de la solicitud,
- fecha de creación,
- nombre de la empresa/restaurante,
- dirección o ubicación referencial,
- cantidad reportada,
- tipo de aceite,
- observación,
- fecha programada si existe,
- hora programada si existe,
- recolector asignado si existe,
- unidad/placa si existe.

Debe conservar el estilo EcoTacna:

- tarjetas blancas,
- bordes redondeados,
- verde para estados positivos,
- azul o verde suave para estado en camino/programado,
- rojo para incidencias.

---

## Seguimiento del recojo

Agregar un bloque llamado:

`Seguimiento del recojo`

Debe mostrar una línea de progreso o lista de pasos.

Pasos sugeridos:

1. `Solicitud reportada`
2. `Recolector asignado`
3. `Recolector en camino`
4. `Recojo confirmado por el recolector`
5. `Confirmación de pago del restaurante`

Comportamiento visual:

- Si la solicitud está `PENDIENTE`, solo el primer paso debe verse activo.
- Si está `PROGRAMADO` o similar, los pasos de solicitud y recolector asignado deben verse activos.
- Si está `EN_CAMINO`, marcar hasta `Recolector en camino`.
- Si está `COMPLETADO` o el pago está registrado, marcar `Recojo confirmado por el recolector`.
- Si el restaurante confirma recepción del pago, marcar `Confirmación de pago del restaurante`, solo si existe forma real de persistir esta confirmación.

Si no existe campo real para confirmar recepción del pago por el restaurante, no inventar persistencia; mostrar la confirmación visual solo durante la sesión o dejarla como acción preparada, pero no alterar backend.

---

## Confirmar pago / recepción del pago

Agregar un bloque de acción para el restaurante.

### Cuando el recolector todavía NO confirma recojo y pago

El botón debe estar deshabilitado:

`Confirmar pago`

Mostrar mensaje:

`Podrás confirmar el pago cuando el recolector registre el recojo y el pago.`

Texto auxiliar:

`Aún no disponible: el recolector todavía no confirma el recojo y el pago.`

### Cuando el recolector YA confirmó recojo y pago

El botón debe habilitarse en verde:

`Confirmar recepción del pago`

Mostrar información de pago si existe:

- método de pago,
- monto pagado,
- fecha y hora de pago,
- voucher o evidencia si existe,
- constancia si ya existe.

Si no llegan algunos datos desde backend, mostrar texto honesto:

- `No registrado`
- `Sin información disponible`
- `Pendiente de integración`

No inventar datos reales.

---

## Reportar incidencia

Agregar botón:

`Reportar incidencia`

Debe permitir al restaurante registrar o preparar una incidencia si no reconoce el pago o detecta algún problema.

Puede abrir un modal o panel con:

- `Motivo de incidencia`
- `Descripción`
- botón `Cancelar`
- botón `Enviar incidencia`

Opciones sugeridas de motivo:

- `No recibí el pago`
- `Monto diferente al acordado`
- `El recojo no se realizó`
- `El aceite no fue recogido completo`
- `Problema con el recolector`
- `Otro`

Si no existe endpoint real para guardar incidencias, no inventar endpoint.

En ese caso, mostrar solo una interfaz preparada y un toast informativo como:

`Incidencia registrada visualmente. La integración con backend quedará pendiente.`

Pero si ya existe endpoint o función en `empresaApi`, reutilizarla.

No tocar backend.

---

## Cancelar solicitud

Agregar o conservar una acción discreta:

`Cancelar solicitud`

Regla recomendada:

- Solo permitir cancelación cuando la solicitud esté `PENDIENTE`.
- Si la solicitud ya fue aceptada por un recolector, no permitir cancelación directa.

Mensaje sugerido cuando ya fue aceptada:

`Esta solicitud ya fue aceptada por un recolector. Si tienes un problema, usa la opción Reportar incidencia.`

Si no existe endpoint para cancelar, no inventarlo.

Si ya existe función en `empresaApi`, reutilizarla.

No tocar backend.

---

## Constancia

No eliminar la constancia existente.

No romper el botón `Ver detalle` si actualmente muestra o descarga constancia.

Si existe constancia real, mostrar opción:

`Ver constancia`

Regla recomendada:

- Mostrar constancia cuando el recojo esté `COMPLETADO` y el pago esté `PAGADO` o registrado.
- Si se implementa confirmación de recepción del pago solo en frontend, no bloquear la constancia real que ya exista en backend.
- Si no hay constancia disponible, mostrar `Constancia pendiente`.

---

## Comportamiento esperado por estado

### Estado PENDIENTE

Debe mostrar:

- seguimiento con solo solicitud reportada activa,
- botón de confirmar pago deshabilitado,
- posibilidad de cancelar solicitud si existe flujo real,
- incidencia opcional.

### Estado PROGRAMADO / ACEPTADO

Debe mostrar:

- recolector asignado,
- botón confirmar pago deshabilitado,
- mensaje de espera,
- no permitir cancelación directa,
- permitir reportar incidencia.

### Estado EN_CAMINO

Debe mostrar:

- seguimiento hasta recolector en camino,
- botón confirmar pago deshabilitado,
- mensaje de espera,
- permitir reportar incidencia.

### Estado COMPLETADO / PAGADO

Debe mostrar:

- pago registrado,
- información del pago,
- botón verde `Confirmar recepción del pago`,
- opción de ver constancia si existe,
- opción de reportar incidencia.

---

## Diseño esperado

La pantalla debe parecerse al mockup aprobado que el usuario adjuntará como imagen.

Mantener:

- layout de dashboard,
- sidebar existente,
- tarjetas limpias,
- línea de seguimiento,
- botón gris bloqueado cuando no se puede confirmar,
- botón verde cuando sí se puede confirmar,
- botón rojo/outline para incidencia,
- texto claro de por qué una acción está bloqueada.

No usar alert nativo del navegador.

No hacer cambios visuales globales.

---

## Validaciones

Antes de modificar, revisar:

1. Qué archivo renderiza `Mis solicitudes`.
2. Qué hace actualmente el botón `Ver detalle`.
3. Qué datos llegan en la respuesta de solicitudes.
4. Qué estados existen realmente en el frontend/backend.
5. Si existe o no función API para cancelar solicitud.
6. Si existe o no función API para confirmar recepción del pago.
7. Si existe o no función API para reportar incidencia.
8. Si existe constancia real y cómo se accede.

No modificar hasta tener claro el archivo principal.

---

## Restricciones estrictas

No hacer:

- backend nuevo,
- endpoints nuevos,
- DTOs nuevos,
- migraciones,
- cambios en seguridad,
- cambios en login,
- cambios en pagos de suscripción,
- cambios en Google Maps,
- refactor general,
- datos mock como si fueran reales,
- eliminación del flujo de constancia actual,
- eliminación del botón `Ver detalle` actual.

---

## Resultado esperado

Al terminar, entregar resumen con:

1. archivos modificados,
2. archivo donde se implementó la vista,
3. cómo se accede desde `Mis solicitudes`,
4. cómo se conserva `Ver detalle`/constancia,
5. cómo se habilita o bloquea `Confirmar pago`,
6. qué estados se usan para habilitar el botón,
7. cómo se maneja `Reportar incidencia`,
8. confirmación de que no se tocó backend,
9. confirmación de que no se tocaron endpoints ni servicios API salvo reutilización existente,
10. confirmación de que no se tocó Google Maps real,
11. confirmación de que no se tocaron `.env`, configuración ni seguridad.

No continuar con otras pantallas después de esto.

No modificar recolector en esta fase.

---

## Prompt para pegar en Antigravity después de guardar este archivo

Lee el archivo:

`EcoTacnaFrontend/docs/prompts/FASE_3C_RESTAURANTE_SEGUIMIENTO_CONFIRMACION_PAGO.md`

Ejecuta exactamente lo indicado ahí.

Antes de modificar, confirma:

1. qué archivo renderiza `Mis solicitudes`;
2. qué hace actualmente el botón `Ver detalle`;
3. qué archivo vas a tocar;
4. cómo vas a conservar la constancia existente;
5. cómo vas a abrir la nueva vista de seguimiento/confirmación;
6. qué estados usarás para bloquear o habilitar `Confirmar pago`.

Recuerda:
- no elimines `Ver detalle`;
- no rompas la constancia;
- agrega una acción adicional como `Ver seguimiento` o `Validar pago`;
- el botón `Confirmar pago` debe estar bloqueado hasta que el recolector confirme el recojo y pago;
- cuando el recolector ya confirmó el recojo y pago, debe habilitarse `Confirmar recepción del pago`;
- no modifiques backend;
- no inventes endpoints;
- no toques Google Maps real;
- no toques configuración, `.env`, login, pagos de suscripción, ApiPeruDev/SUNAT, roles ni seguridad.

Al terminar, entrega resumen de archivos modificados.
