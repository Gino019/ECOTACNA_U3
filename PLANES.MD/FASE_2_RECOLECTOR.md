# FASE 2 - Mejora visual controlada de interfaz del recolector

## Dónde guardar este archivo

Guardar este archivo dentro del proyecto en:

`EcoTacnaFrontend/docs/prompts/FASE_2_RECOLECTOR.md`

En tu estructura actual de Antigravity se ve así:

`ECOTACNA/EcoTacnaFrontend/docs/prompts/FASE_2_RECOLECTOR.md`

Ruta completa aproximada en Windows:

`C:\Users\MSI\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend\docs\prompts\FASE_2_RECOLECTOR.md`

Si no existe la carpeta `prompts`, crearla dentro de `EcoTacnaFrontend/docs/`.

---

## Objetivo

Mejorar únicamente la interfaz frontend del recolector donde revisa una solicitud de recojo de aceite usado.

La mejora debe ser visual y funcional a nivel de interfaz, sin alterar backend, base de datos, endpoints, seguridad, pagos, SUNAT/ApiPeruDev, Google Maps real ni lógica de asignación automática.

---

## Contexto del flujo

El restaurante/generador reporta una solicitud de recojo de aceite vegetal usado de fritura.

La solicitud debe incluir visualmente:

- foto del aceite,
- cantidad estimada en litros,
- ubicación referencial,
- cantidad de envases si existe,
- observaciones si existen,
- estado de la solicitud.

El recolector revisa esa información antes de ir.

En esta pantalla, el recolector puede:

1. revisar el detalle de la solicitud,
2. ingresar precio por litro,
3. ver monto estimado,
4. aceptar el recojo,
5. rechazar la solicitud con motivo.

Más adelante se implementará Google Maps real, algoritmo de recolector más cercano y reasignación automática si el recolector rechaza.

Eso NO se implementa en esta fase.

---

## Archivo principal permitido

Modificar únicamente si corresponde:

`EcoTacnaFrontend/src/pages/recolector/RecolectorRecojosDia.tsx`

Si el detalle profundo de la solicitud está realmente en otro archivo, primero informar cuál es antes de modificar.

Archivos que se pueden revisar, pero no modificar salvo necesidad mínima justificada:

- `EcoTacnaFrontend/src/pages/recolector/RecolectorSolicitudes.tsx`
- `EcoTacnaFrontend/src/services/recolectorApi.ts`
- `EcoTacnaFrontend/src/types.ts`

---

## Archivos prohibidos

No modificar:

- backend,
- entidades Java,
- DTOs,
- controladores,
- servicios backend,
- repositorios,
- scripts SQL,
- `.env`,
- `.env.local`,
- `.env.example`,
- `vite.config.ts`,
- `package.json`,
- `application.properties`,
- `GoogleMapView.tsx`,
- `MapFallback.tsx`,
- `mapTypes.ts`,
- login,
- registro,
- JWT,
- pagos,
- ApiPeruDev/SUNAT,
- suscripciones,
- roles,
- seguridad,
- lógica de asignación automática,
- lógica real de Google Maps.

---

## Diseño esperado

La pantalla debe tener un estilo limpio, moderno y coherente con EcoTacna:

- fondo claro,
- tarjetas blancas,
- bordes redondeados,
- colores verdes para acciones positivas,
- rojo para rechazo,
- badges para estados,
- diseño ordenado y profesional.

Debe parecerse al mockup aprobado, pero adaptado al código real existente.

---

## Contenido visual requerido

La pantalla debe mostrar:

- título: `Detalle de solicitud de recojo`,
- enlace o botón: `Volver a solicitudes`,
- nombre del restaurante/generador,
- estado actual, por ejemplo `Pendiente de revisión`,
- fecha de solicitud si ya existe en los datos,
- cantidad estimada en litros,
- cantidad de envases si existe,
- observaciones del generador si existen,
- nota estática: `Residuo reportado: aceite vegetal usado de fritura.`,
- evidencia del aceite con imagen si existe o placeholder honesto si no existe,
- ubicación seleccionada en una tarjeta visual tipo mapa o bloque referencial,
- distancia estimada y tiempo estimado como datos visuales/referenciales si no existe cálculo real.

---

## Mapa / ubicación

No implementar Google Maps real.

No tocar `GoogleMapView.tsx`.

Si ya existe un componente de mapa usado en la pantalla, mantenerlo sin cambiar su lógica.

Si no hay mapa real o coordenadas, usar un bloque visual referencial tipo mapa, con texto honesto como:

- `Ubicación referencial del recojo`
- `La ubicación exacta se mostrará cuando se integre Google Maps.`
- `Distancia estimada: referencial`
- `Tiempo estimado: referencial`

No inventar geocoding real.

No agregar API keys.

No implementar rutas reales.

---

## Panel derecho: aceptar recojo

Agregar o mejorar un panel llamado:

`Evaluar y responder solicitud`

Debe incluir:

- campo `Precio por litro (S/)`,
- caja calculada `Monto estimado`,
- botón verde con texto exacto: `Aceptar recojo`,
- nota verde: `Al aceptar, se notificará al restaurante que irás a realizar el recojo.`

Importante:

El botón verde NO debe decir:

- `Aceptar y enviar precio`,
- `Enviar precio`,
- `Guardar`,
- `Publicar`.

Debe decir exactamente:

`Aceptar recojo`

---

## Sección de rechazo

Agregar o mejorar una sección llamada:

`Rechazar solicitud`

Debe incluir:

- selector obligatorio: `Motivo del rechazo`,
- campo opcional: `Observación adicional`,
- botón rojo con texto exacto: `Rechazar solicitud`.

El botón rojo NO debe decir:

- `Guardar rechazo`,
- `Guardar`,
- `Cancelar`,
- `Eliminar`.

Debe decir exactamente:

`Rechazar solicitud`

---

## Opciones sugeridas para motivo de rechazo

Usar estas opciones si la pantalla no tiene motivos definidos:

- `Aceite contaminado con agua`
- `Aceite contaminado con químicos o detergente`
- `No es aceite vegetal usado`
- `Exceso de residuos sólidos`
- `Cantidad no coincide con lo reportado`
- `Envase inadecuado o inseguro`
- `Generador no disponible`
- `No hubo acuerdo`
- `Ubicación no accesible`
- `Otro`

---

## Evidencia en rechazo

No agregar subida de foto en el rechazo.

La evidencia fotográfica en rechazo no forma parte de esta fase.

---

## Botones posteriores

Puede mostrarse un bloque informativo inferior con texto como:

`Al aceptar el recojo, el restaurante será notificado y sabrá que irás a recoger el aceite en la ubicación seleccionada.`

También puede mostrar botones informativos o deshabilitados:

- `Confirmar recojo`
- `Rechazar en sitio`

Pero esos botones no deben implementar lógica nueva en esta fase.

---

## Compatibilidad con datos reales

No romper datos existentes.

Si un dato viene vacío o no existe, mostrar texto honesto:

- `No registrado`
- `Sin información disponible`
- `Pendiente`
- `Ubicación referencial`

No inventar datos como si fueran reales.

---

## Restricciones funcionales

No cambiar endpoints.

No cambiar nombres de propiedades.

No cambiar servicios API salvo que sea estrictamente necesario para conectar con funciones ya existentes.

No modificar `recolectorApi.ts` si los métodos actuales `aceptarSolicitud(id)` y `rechazarSolicitud(id)` ya funcionan.

No cambiar la lógica real de aceptación o rechazo.

Solo adaptar la interfaz para que el flujo sea más claro.

---

## Validación final esperada

Al terminar, entregar resumen con:

1. archivos modificados,
2. qué se cambió visualmente,
3. confirmación de que no se tocó backend,
4. confirmación de que no se tocaron `.env`, puertos ni configuración,
5. confirmación de que no se tocó Google Maps real,
6. cualquier error detectado.

No continuar con otras interfaces.

No hacer mejoras extra.

No refactorizar archivos no relacionados.

---

## Prompt para pegar en Antigravity después de guardar este archivo

Lee el archivo:

`EcoTacnaFrontend/docs/prompts/FASE_2_RECOLECTOR.md`

Ejecuta exactamente lo indicado ahí.

Antes de modificar, confirma qué archivo vas a tocar para la pantalla del recolector.

No modifiques backend, configuración, Google Maps real, endpoints, DTOs, pagos, SUNAT/ApiPeruDev, login, registro, roles ni seguridad.

No hagas refactor general.

Solo mejora la interfaz del recolector según el archivo `.md`.

Al terminar, entrega resumen de archivos modificados.
