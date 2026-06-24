# ECO TACNA - PLAN DE EJECUCION: SOLICITUD UNICA ACTIVA Y VISIBILIDAD 15 MINUTOS

## 1. Objetivo

Implementar un flujo tipo InDrive para las solicitudes de recojo de aceite:

```text
Restaurante crea una solicitud
-> la solicitud queda visible para recolectores durante 15 minutos
-> el restaurante no puede crear otra solicitud mientras tenga una solicitud activa
-> el restaurante solo puede ver el estado de su pedido actual
-> si un recolector acepta dentro de 15 minutos, el flujo continua
-> si nadie acepta dentro de 15 minutos, la solicitud deja de ser visible y el restaurante puede crear otra
```

Este flujo debe terminarse antes de continuar con Google Maps, algoritmo de recolector cercano u otras integraciones.

---

## 2. Problema actual

Actualmente el restaurante puede entrar a:

```text
Panel Empresa -> Solicitar recojo
```

y crear varios pedidos seguidos.

Eso genera:

- multiples solicitudes pendientes para la misma empresa;
- confusion en el panel del recolector;
- datos duplicados;
- flujo poco realista;
- historial desordenado;
- posibilidad de que varios recolectores gestionen pedidos repetidos.

---

## 3. Regla funcional principal

Una empresa/restaurante solo puede tener UNA solicitud activa a la vez.

Mientras exista una solicitud activa, la pantalla **Solicitar recojo** debe bloquear el formulario y mostrar solamente el estado del pedido actual.

---

## 4. Que se considera solicitud activa

Considerar activa una solicitud en estos casos:

```text
PENDIENTE dentro de los primeros 15 minutos
PROGRAMADO
EN_RUTA
RECOGIDO
```

No se considera activa:

```text
COMPLETADO
CANCELADO
EXPIRADO si se implementa ese estado
PENDIENTE vencida con mas de 15 minutos sin recolector
```

---

## 5. Regla de visibilidad para recolectores

Una solicitud nueva debe estar disponible para recolectores solo durante 15 minutos.

Regla:

```text
visibleParaRecolectores = estado == PENDIENTE && fechaCreacion + 15 minutos > ahora
```

Despues de 15 minutos:

- ya no debe aparecer en Recojos disponibles;
- ya no debe poder aceptarse;
- el restaurante debe poder crear una nueva solicitud;
- el sistema debe mostrar que la solicitud anterior vencio o expiro.

---

## 6. Decision recomendada sobre estado EXPIRADO

Antes de programar, diagnosticar si conviene agregar estado `EXPIRADO`.

### Opcion A - Recomendada si el enum y la BD lo permiten

Agregar estado:

```text
EXPIRADO
```

Uso:

```text
PENDIENTE -> EXPIRADO si pasan 15 minutos sin recolector
```

Ventajas:

- mas claro para historial;
- mejor para mostrar al restaurante;
- mas facil de auditar.

### Opcion B - Si no conviene tocar estados

No agregar estado nuevo. Manejarlo como estado calculado:

```text
estado real BD: PENDIENTE
estado visual/calculado: EXPIRADO si createdAt + 15 min < ahora
```

Ventajas:

- menos cambios;
- no requiere migracion;
- evita romper enum/BD.

### Recomendacion practica

Primero diagnosticar:

- si `PickupRequestStatus` es enum Java;
- si la base guarda status como string sin constraint;
- si hay constraints en BD;
- si agregar `EXPIRADO` exige migracion.

Si agregar `EXPIRADO` puede romper BD o exigir migracion, usar expiracion calculada.

---

## 7. Diagnostico obligatorio antes de modificar

Antigravity debe revisar y responder sin modificar codigo:

1. Donde se crea una solicitud desde empresa:
   - `EmpresaSolicitarRecojo.tsx`;
   - `empresaApi.ts`;
   - `PickupRequestController.java`;
   - `PickupRequestService.java`.

2. Que campo de fecha existe:
   - `createdAt`;
   - `fechaSolicitud`;
   - `createdDate`;
   - otro.

3. Si el backend ya tiene endpoint para solicitud activa:
   - empresa seguimiento activo;
   - empresa solicitudes;
   - recolector recojo activo;
   - otro.

4. Donde se listan solicitudes disponibles para recolectores:
   - repository;
   - service;
   - controller;
   - frontend.

5. Que estados existen en `PickupRequestStatus`.

6. Si se puede agregar `EXPIRADO` sin migracion.

7. Si hay endpoint que permita aceptar solicitudes vencidas.

8. Donde debe bloquearse la creacion de multiples solicitudes:
   - frontend;
   - backend;
   - ambos.

9. Que archivos exactos propone tocar.

No modificar codigo antes de entregar este diagnostico.

---

## 8. Regla backend obligatoria

El backend debe ser la fuente de verdad.

Aunque el frontend bloquee la pantalla, el backend debe impedir que una empresa cree otra solicitud si ya tiene una activa.

### Validacion al crear solicitud

En `PickupRequestService.create(...)` o metodo equivalente:

```text
Antes de crear una nueva solicitud:
1. Identificar empresa autenticada.
2. Buscar solicitudes activas de esa empresa.
3. Si existe una activa, rechazar creacion.
4. Si no existe, crear solicitud.
```

Mensaje sugerido:

```text
Ya tienes una solicitud activa. Finaliza, cancela o espera su vencimiento antes de registrar una nueva.
```

### Solicitud activa backend

Activa:

```text
PENDIENTE no vencida
PROGRAMADO
EN_RUTA
RECOGIDO
```

No activa:

```text
PENDIENTE vencida
CANCELADO
COMPLETADO
EXPIRADO si existe
```

---

## 9. Regla para recolectores

En el backend que lista solicitudes disponibles, filtrar por:

```text
estado == PENDIENTE
fechaCreacion >= ahora - 15 minutos
no rechazada por este recolector
```

Si la solicitud esta vencida:

- no debe aparecer en recolector;
- no debe poder aceptarse aunque alguien intente por API.

### Validacion al aceptar

En el servicio de aceptar solicitud:

```text
Si estado PENDIENTE pero fechaCreacion + 15 minutos < ahora:
    rechazar aceptacion
```

Mensaje sugerido:

```text
La solicitud ya vencio y no puede ser aceptada.
```

---

## 10. Pantalla Restaurante - Solicitar recojo

Archivo principal probable:

```text
EcoTacnaFrontend/src/pages/empresa/EmpresaSolicitarRecojo.tsx
```

### Comportamiento esperado

Al cargar la pantalla:

1. Consultar si existe solicitud activa.
2. Si NO existe:
   - mostrar formulario normal.
3. Si SI existe:
   - bloquear u ocultar formulario;
   - mostrar card de solicitud actual;
   - mostrar estado;
   - mostrar fecha/hora de creacion;
   - si esta PENDIENTE, mostrar contador de tiempo restante;
   - mostrar boton para ir a seguimiento o Mis solicitudes.

### Card sugerida

```text
Tienes una solicitud activa

Estado: PENDIENTE / PROGRAMADO / EN_RUTA / RECOGIDO
Litros reportados: X L
Fecha de solicitud: dd/mm/yyyy hh:mm
Tiempo visible para recolectores: mm:ss restante
Recolector asignado: si existe

Mientras esta solicitud este activa, no puedes registrar otra solicitud.
```

Botones:

```text
Ver seguimiento
Ir a Mis solicitudes
Cancelar solicitud    solo si estado PENDIENTE y backend lo permite
```

### Si PENDIENTE vence

Si el contador llega a 0:

```text
La solicitud vencio porque ningun recolector la acepto en 15 minutos.
Puedes registrar una nueva solicitud.
```

Luego habilitar formulario nuevamente o mostrar boton:

```text
Crear nueva solicitud
```

---

## 11. Pantalla Mis solicitudes

Archivo probable:

```text
EcoTacnaFrontend/src/pages/empresa/EmpresaMisSolicitudes.tsx
```

Mostrar estados de forma clara:

- `PENDIENTE` dentro de 15 min: pendiente visible.
- `PENDIENTE` vencida: mostrar como `EXPIRADO` visual si no existe estado real.
- `PROGRAMADO`: aceptado por recolector.
- `CANCELADO`: cancelado/rechazado.
- `COMPLETADO/PAGADO`: finalizado.

Si se implementa estado real `EXPIRADO`, usar badge `EXPIRADO`.

---

## 12. Panel recolector - Recojos disponibles

Archivo probable:

```text
EcoTacnaFrontend/src/pages/recolector/RecolectorRecojosDia.tsx
```

Cada solicitud pendiente visible debe mostrar:

```text
Disponible por: mm:ss
```

Si quedan menos de 2 minutos, opcionalmente mostrar aviso visual.

Cuando el tiempo llega a 0:

- retirar la solicitud de la lista;
- no permitir aceptar;
- refrescar lista.

No aceptar solicitudes vencidas aunque sigan en frontend por retraso.

---

## 13. Endpoint recomendado

Crear o reutilizar endpoint:

```http
GET /api/empresa/solicitudes/activa
```

Respuesta sugerida si hay activa:

```json
{
  "tieneActiva": true,
  "solicitud": {
    "id": 123,
    "estado": "PENDIENTE",
    "fechaSolicitud": "...",
    "volumenAproximado": 39,
    "recolector": null,
    "expiresAt": "...",
    "segundosRestantes": 530,
    "expirada": false
  }
}
```

Respuesta si no hay activa:

```json
{
  "tieneActiva": false,
  "solicitud": null
}
```

Alternativa: usar `getSolicitudes()` y calcular activa en frontend. No recomendado como unica solucion porque backend tambien debe bloquear creacion.

---

## 14. Expiracion: scheduler vs calculo perezoso

### Opcion recomendada: lazy expiration

No usar scheduler inicialmente.

Cada vez que se consulta, acepta o crea:

- calcular si PENDIENTE esta vencida;
- tratarla como expirada;
- no listarla;
- permitir crear nueva.

Ventajas:

- menos complejidad;
- menos riesgo;
- no requiere tareas programadas.

### Opcion no recomendada inicialmente: scheduler

Crear una tarea programada que cada minuto pase solicitudes PENDIENTE vencidas a EXPIRADO.

Solo usar si el proyecto ya tiene scheduling y el equipo lo acepta.

---

## 15. Archivos permitidos

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
PickupRequestController.java
PickupRequestService.java
PickupRequestRepository.java
DTO nuevo solo si es necesario
PickupRequestStatus.java solo si se decide usar EXPIRADO
```

No modificar entidades ni base de datos sin justificar antes.

---

## 16. Restricciones estrictas

No tocar:

```text
Google Maps
Culqi
pagos de suscripcion
login
roles
seguridad
.env
.env.local
application.properties
configuracion de puertos
ApiPeruDev/SUNAT
migraciones
base de datos
constancia PDF
```

No hacer refactor general.

No cambiar diseño global.

No tocar rutas no relacionadas.

---

## 17. Validaciones tecnicas

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

## 18. Pruebas funcionales obligatorias

### Prueba 1 - Bloqueo de multiples solicitudes

1. Restaurante crea una solicitud.
2. Vuelve a `Solicitar recojo`.
3. Resultado esperado:
   - no ve formulario vacio;
   - ve card de solicitud activa;
   - no puede crear otra.

### Prueba 2 - Backend bloquea duplicados

Intentar crear otra solicitud por API.

Resultado esperado:

```text
Backend rechaza con mensaje: Ya tienes una solicitud activa...
```

### Prueba 3 - Visibilidad 15 minutos

1. Crear solicitud.
2. Entrar como recolector.
3. Debe aparecer si esta dentro de 15 minutos.
4. Pasados 15 minutos, no debe aparecer.

### Prueba 4 - Aceptacion dentro del plazo

1. Crear solicitud.
2. Recolector acepta antes de 15 minutos.
3. Estado pasa a `PROGRAMADO`.
4. Restaurante sigue bloqueado porque tiene solicitud activa.

### Prueba 5 - Aceptacion fuera del plazo

Intentar aceptar una solicitud vencida por API.

Resultado esperado:

```text
La solicitud ya vencio y no puede ser aceptada.
```

### Prueba 6 - Expiracion libera al restaurante

1. Crear solicitud.
2. Esperar 15 minutos sin aceptacion.
3. Restaurante vuelve a `Solicitar recojo`.
4. Debe poder crear una nueva solicitud.

### Prueba 7 - Estados que bloquean

Bloquean:

```text
PENDIENTE dentro de 15 min
PROGRAMADO
EN_RUTA
RECOGIDO
```

No bloquean:

```text
CANCELADO
COMPLETADO
PENDIENTE vencida
EXPIRADO si existe
```

---

## 19. Resultado esperado final

Al terminar:

- el restaurante no puede crear multiples solicitudes simultaneas;
- la pantalla se bloquea si hay solicitud activa;
- solo se muestra el estado del pedido actual;
- la solicitud pendiente solo aparece 15 minutos para recolectores;
- vencida la solicitud, deja de aparecer a recolectores;
- vencida la solicitud, el restaurante puede crear otra;
- no se toca Google Maps;
- no se toca Culqi;
- no se toca seguridad;
- no se rompe rechazo/cancelacion;
- no se rompe precio;
- no se rompe constancia PDF.

---

## 20. Prompt corto para Antigravity

```text
Lee primero los .md existentes del proyecto sobre arquitectura, refactor, reglas de programacion y restricciones.

Necesito implementar el flujo tipo InDrive para solicitudes de recojo:

1. Una empresa/restaurante solo puede tener una solicitud activa.
2. Si tiene solicitud activa, la pantalla Solicitar recojo debe bloquear el formulario y mostrar solo el pedido actual.
3. Una solicitud PENDIENTE solo debe ser visible para recolectores durante 15 minutos.
4. Pasados 15 minutos sin aceptacion, deja de ser visible para recolectores y el restaurante puede crear otra.
5. Si el recolector acepta antes de 15 minutos, el flujo continua y la empresa sigue bloqueada hasta que se complete/cancele.
6. Backend debe bloquear duplicados aunque el frontend falle.
7. Backend debe impedir aceptar solicitudes vencidas.

Primero diagnostica sin modificar.
Luego propone cambios minimos.

No tocar Google Maps, Culqi, pagos de suscripcion, login, roles, seguridad, .env, configuracion, base de datos, migraciones ni constancia PDF.
No hacer refactor general.
Respeta los .md existentes del proyecto.
```
