# FASE 3B - Interfaz recolector para registrar recojo y pago

## Dónde guardar este archivo

Guardar este archivo dentro del proyecto en:

`EcoTacnaFrontend/docs/prompts/FASE_3B_RECOLECTOR_REGISTRAR_RECOJO_PAGO.md`

Ruta aproximada en Windows:

`C:\Users\MSI\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend\docs\prompts\FASE_3B_RECOLECTOR_REGISTRAR_RECOJO_PAGO.md`

Si no existe la carpeta `prompts`, crearla dentro de:

`EcoTacnaFrontend/docs/`

---

## Objetivo

Crear o mejorar la interfaz del recolector para registrar el recojo de aceite y la información del pago después de que el recolector ya aceptó una solicitud.

Esta fase debe permitir que el recolector, desde la pantalla donde aparece el recojo aceptado/programado, pueda abrir una interfaz llamada:

`Registrar recojo de aceite`

La interfaz debe servir para registrar:

- litros reales recogidos,
- precio acordado,
- monto total calculado,
- método de pago,
- monto pagado,
- fecha y hora de pago,
- voucher opcional,
- certificado opcional,
- incidencia o rechazo del recojo si hubo problemas.

---

## Contexto actual

Actualmente, en la pantalla del recolector aparece una tarjeta similar a:

`Ya aceptaste este recojo`

con datos del restaurante/generador y un botón como:

`Ver en mapa operativo`

En esa misma tarjeta debe agregarse un botón claro para abrir la nueva interfaz:

`Registrar recojo y pago`

o

`Registrar recojo de aceite`

El objetivo es que el recolector pueda acceder desde ahí a la interfaz que se va a crear.

---

## Archivos permitidos

Modificar principalmente:

`EcoTacnaFrontend/src/pages/recolector/RecolectorRecojosDia.tsx`

Se puede revisar, pero no modificar salvo necesidad justificada:

- `EcoTacnaFrontend/src/pages/recolector/RecolectorMapaOperativo.tsx`
- `EcoTacnaFrontend/src/services/recolectorApi.ts`
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
- `mapTypes.ts`.

---

## Importante sobre backend y endpoints

No inventar endpoints nuevos.

No cambiar endpoints existentes.

No cambiar servicios API si no es necesario.

Si ya existe una función frontend o endpoint para confirmar recojo/pago, reutilizarlo.

Si no existe función disponible, dejar la interfaz preparada visualmente y no romper el flujo actual.

No tocar backend en esta fase.

---

## Botón de acceso

En la tarjeta del recojo aceptado/programado, donde actualmente se muestra el recojo activo, agregar un botón visible:

`Registrar recojo y pago`

Este botón debe abrir la nueva interfaz de registro.

Puede abrirse como:

- vista dentro de la misma página,
- panel expandido,
- modal grande,
- o cambio de estado interno de la pantalla.

No crear una ruta nueva si no es necesario.

---

## Pantalla / interfaz esperada

Título:

`Registrar recojo de aceite`

Debe mostrar una tarjeta superior con:

- nombre del restaurante/generador,
- dirección o ubicación referencial,
- estado actual,
- llegada estimada si existe,
- distancia estimada si existe.

No agregar sección de verificación del aceite con foto obligatoria.

No crear una sección llamada `Verificación del aceite`.

No pedir subir una foto nueva del aceite en esta pantalla.

La revisión visual del aceite puede quedar como observación dentro del recojo o como motivo de incidencia/rechazo si corresponde.

---

## Sección 1 - Detalles del recojo

Crear una sección llamada:

`1. Detalles del recojo`

Debe contener:

- `Litros reales recogidos *`
- `Precio acordado *`
- `Monto total`

Regla:

El monto total debe calcularse visualmente:

`litros reales recogidos × precio acordado`

Ejemplo:

- litros reales: 20
- precio acordado: S/ 2.50
- monto total: S/ 50.00

También debe incluir:

- `Observaciones (opcional)`

Placeholder sugerido:

`Ej. Se verificó la calidad del aceite, envases en buen estado...`

---

## Sección 2 - Información del pago

Crear una sección llamada:

`2. Información del pago`

Debe contener:

- `Método de pago *`
- `Monto pagado *`
- `Fecha y hora de pago *`
- `Voucher o evidencia de pago (opcional)`
- `Certificado del recolector (opcional)`

Opciones sugeridas de método de pago:

- `Yape`
- `Plin`
- `BCP`
- `Transferencia`
- `Efectivo`
- `Otro`

Reglas:

- `Monto pagado` puede autocompletarse con el monto total calculado.
- `Fecha y hora de pago` puede autocompletarse con la fecha/hora actual.
- Voucher y certificado son opcionales.
- No implementar almacenamiento real de archivos si el backend no lo soporta.
- No guardar archivos en localStorage.
- No crear backend de archivos.
- Los campos de voucher/certificado pueden quedar como UI preparada.

---

## Sección 3 - Incidencia del recojo

Crear una sección llamada:

`3. Incidencia del recojo`

Debe contener:

- `Motivo *`
- `Observaciones (opcional)`

Opciones sugeridas de motivo:

- `Aceite contaminado con agua`
- `Aceite contaminado con químicos o detergente`
- `No corresponde a aceite vegetal usado de cocina`
- `Cantidad no coincide con lo reportado`
- `Envase inadecuado o inseguro`
- `Generador no disponible`
- `No hubo acuerdo`
- `Ubicación no accesible`
- `Otro`

Agregar texto informativo:

`Si tienes algún problema en el sitio, puedes rechazar el recojo seleccionando un motivo.`

---

## Botones finales

Al final de la interfaz deben aparecer solo dos botones principales:

1. Botón rojo:

`Rechazar recojo`

2. Botón verde:

`Confirmar recojo y pago`

No agregar el botón:

`Guardar evidencias`

Ese botón NO debe existir en esta interfaz.

---

## Comportamiento esperado

### Confirmar recojo y pago

Al hacer clic en `Confirmar recojo y pago`:

- validar litros reales,
- validar precio acordado,
- validar método de pago,
- validar monto pagado,
- validar fecha/hora de pago.

Si ya existe lógica/API para confirmar recojo y pago, usarla sin cambiar la firma.

Si no existe lógica/API disponible, dejar el flujo visual preparado sin inventar endpoints ni romper el flujo.

### Rechazar recojo

Al hacer clic en `Rechazar recojo`:

- exigir motivo,
- permitir observación opcional,
- reutilizar la lógica existente de rechazo si ya existe.

No crear backend nuevo.

No inventar endpoints.

---

## Cosas que NO deben hacerse

No agregar:

- `Guardar evidencias`,
- pasarela de pago real,
- validación bancaria,
- pago real dentro del sistema,
- generación real de voucher,
- generación real de certificado,
- Google Maps real,
- reasignación automática,
- subida real de archivos al backend,
- datos mock,
- endpoints nuevos.

---

## Estilo visual

Mantener estilo EcoTacna:

- fondo claro,
- tarjetas blancas,
- bordes redondeados,
- botones verdes para confirmar,
- botones rojos para rechazo,
- diseño limpio y profesional,
- coherente con las pantallas ya mejoradas.

---

## Resultado esperado

Al terminar, entregar resumen con:

1. archivos modificados,
2. cómo se agregó el botón de acceso a la interfaz,
3. cómo se muestra la interfaz de registrar recojo y pago,
4. confirmación de que NO se agregó botón `Guardar evidencias`,
5. confirmación de que no se tocó backend,
6. confirmación de que no se tocaron servicios API salvo necesidad justificada,
7. confirmación de que no se tocó Google Maps real,
8. confirmación de que no se tocaron `.env`, configuración ni seguridad.

No continuar con la interfaz del restaurante después de esto.

No hacer refactor general.

No modificar pantallas no relacionadas.

---

## Prompt para pegar en Antigravity después de guardar este archivo

Lee el archivo:

`EcoTacnaFrontend/docs/prompts/FASE_3B_RECOLECTOR_REGISTRAR_RECOJO_PAGO.md`

Ejecuta exactamente lo indicado ahí.

Antes de modificar, confirma qué archivo vas a tocar y cómo vas a abrir la interfaz desde la tarjeta actual donde aparece el recojo aceptado/programado.

Recuerda:
- debe existir un botón para abrir la interfaz, por ejemplo `Registrar recojo y pago`;
- la interfaz NO debe tener botón `Guardar evidencias`;
- los botones finales deben ser solo `Rechazar recojo` y `Confirmar recojo y pago`;
- no modifiques backend;
- no modifiques endpoints;
- no modifiques servicios API salvo necesidad mínima justificada;
- no toques Google Maps real;
- no toques configuración, `.env`, login, pagos de suscripción, ApiPeruDev/SUNAT, roles ni seguridad.

Al terminar, entrega resumen de archivos modificados.
