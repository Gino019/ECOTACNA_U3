# EcoTacna - Instrucciones para Antigravity

## Tarea
Corregir y ajustar la vista del Panel Recolector en la sección de recojos disponibles, manteniendo el diseño actual y modificando solo la lógica necesaria.

Ruta principal observada:

`/recolector/recojos-dia`

Pantalla actual:

- Sidebar: Panel Recolector.
- Menú activo: `Recojos disponibles`.
- Título de página: `Recojos disponibles`.
- Tarjeta de solicitud con restaurante/generador, dirección, litros aproximados, fecha, precio y botón `Evaluar recojo`.

## Objetivo general

La vista debe comportarse correctamente después de terminar un recojo y debe mostrar un contador de disponibilidad basado en 7 días por anuncio.

Se deben corregir dos puntos:

1. Después de confirmar el pago de un recojo, el sistema no debe regresar a una vista de recojo activo/en ruta ni quedar en una pantalla vacía confusa. Debe volver directamente a `Recojos disponibles`.
2. En cada tarjeta de recojo disponible, el contador debe considerar 7 días desde la publicación del anuncio y mostrar fecha actual, fecha de término y tiempo restante.

---

# 1. Bug de flujo después de confirmar pago

## Problema actual

Después de confirmar el pago de un recojo, el sistema vuelve a `/recolector/recojos-dia` y puede quedar mostrando una pantalla vacía o una vista incoherente como si todavía estuviera evaluando/revisando el recojo activo.

Ese comportamiento es incorrecto porque, cuando el pago se confirma, el backend marca la solicitud como:

- `COMPLETADO`
- `PAGADO`

Por lo tanto, el recolector queda libre y debe regresar directamente a la lista de recojos disponibles para poder tomar otra solicitud.

## Comportamiento correcto

Flujo esperado:

`Registrar recojo` -> `Confirmar litros/pago` -> `Backend marca COMPLETADO/PAGADO` -> `Se libera el recolector` -> `Frontend redirige a Recojos disponibles` -> `Se recargan solicitudes pendientes`

## Cambio requerido

En el archivo donde se confirma el pago/recojo, buscar el bloque de éxito posterior a la confirmación.

Archivos probables a revisar:

- `RecolectorRecojosDia.tsx`
- `RecolectorRegistrarRecojo.tsx`
- `RecolectorRecoleccionActiva.tsx`
- `RecolectorPago.tsx`
- `RecolectorMapaOperativo.tsx`
- `recolectorApi.ts`

Evitar dejar una navegación genérica como:

```ts
navigate('/recolector/recojos-dia');
```

Reemplazarla por una navegación explícita hacia la vista de disponibles:

```ts
navigate('/recolector/recojos-dia?view=disponibles', { replace: true });
```

## Ajuste en `RecolectorRecojosDia.tsx`

La vista debe leer el query param `view=disponibles`.

```ts
const [searchParams] = useSearchParams();
const view = searchParams.get('view');
const forceDisponibles = view === 'disponibles';
```

Si `forceDisponibles` es `true`, la pantalla debe:

- Limpiar cualquier estado de recojo activo.
- No renderizar tarjeta de `Recojo en ruta`.
- Cargar directamente las solicitudes disponibles.
- Mostrar el vacío solo si realmente no existen solicitudes pendientes.

Ejemplo de lógica:

```ts
if (forceDisponibles) {
  setRecojoActivo(null);
  await cargarRecojosDisponibles();
  return;
}
```

## Validación del bug

Después de confirmar el pago:

- No debe aparecer otra vez la tarjeta `Recojo en ruta`.
- No debe quedarse en una pantalla vacía por error de flujo.
- Debe entrar directamente a `Recojos disponibles`.
- Debe recargar `/api/recolector/solicitudes` o el endpoint actual equivalente.
- Si no hay solicitudes pendientes, recién ahí mostrar el mensaje vacío dentro de la vista de disponibles.
- Sidebar y título deben ser coherentes: `Recojos disponibles`.

---

# 2. Modificación del contador de disponibilidad por anuncio

## Problema actual

En la tarjeta de recojos disponibles aparece un contador tipo:

`Disponible por: 14:02`

Ese contador no refleja la regla requerida.

## Nueva regla funcional

Cada anuncio/recojo disponible debe durar 7 días desde su fecha de creación o publicación.

La regla debe ser:

```txt
fechaTermino = fechaCreacionAnuncio + 7 días

tiempoRestante = fechaTermino - fechaActual
```

La tarjeta debe mostrar:

- Fecha actual.
- Fecha de término.
- Tiempo restante en horas y minutos.

## Ejemplo visual esperado

Mantener el diseño actual del bloque azul/contador, pero cambiar su contenido a algo como:

```txt
Fecha actual: 22 jun., 09:01 p. m.
Fecha de término: 29 jun., 09:01 p. m.
Disponible por: 167 h 59 min
```

## Importante sobre la fecha base

Usar como fecha base la fecha real de creación/publicación de la solicitud.

Revisar si el DTO de solicitudes disponibles ya trae algún campo como:

- `createdAt`
- `created_at`
- `fechaCreacion`
- `fechaSolicitud`
- `fechaPublicacion`
- `fechaRegistro`

Si el backend ya lo envía, usar ese campo.

Si el backend no lo envía, agregarlo al response de solicitudes disponibles. No calcular el vencimiento usando la fecha de recojo programada si esa fecha no representa la publicación del anuncio.

## Lógica sugerida en frontend

```ts
const DIAS_PUBLICACION = 7;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const obtenerFechaTermino = (fechaCreacion: string | Date) => {
  const inicio = new Date(fechaCreacion);
  return new Date(inicio.getTime() + DIAS_PUBLICACION * MS_POR_DIA);
};

const obtenerTiempoRestante = (fechaCreacion: string | Date) => {
  const ahora = new Date();
  const termino = obtenerFechaTermino(fechaCreacion);
  const diferencia = termino.getTime() - ahora.getTime();

  if (diferencia <= 0) {
    return {
      vencido: true,
      horas: 0,
      minutos: 0,
      fechaActual: ahora,
      fechaTermino: termino,
    };
  }

  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

  return {
    vencido: false,
    horas,
    minutos,
    fechaActual: ahora,
    fechaTermino: termino,
  };
};
```

## Formato de fecha recomendado

Usar formato en español de Perú, respetando el estilo visual actual.

```ts
const formatearFechaRecojo = (fecha: Date) => {
  return fecha.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
```

Ejemplo de salida:

```txt
22 jun., 09:01 p. m.
```

## Render sugerido

Mantener el mismo bloque visual actual. Solo reemplazar el contenido interno.

```tsx
<div className="available-time-box">
  <div className="date-row">
    <span>Fecha actual:</span>
    <strong>{formatearFechaRecojo(fechaActual)}</strong>
  </div>

  <div className="date-row">
    <span>Fecha de término:</span>
    <strong>{formatearFechaRecojo(fechaTermino)}</strong>
  </div>

  <div className="date-row highlight">
    <span>Disponible por:</span>
    <strong>{horas} h {minutos} min</strong>
  </div>
</div>
```

## Manejo de anuncio vencido

Si el tiempo restante es menor o igual a cero:

- El anuncio debe considerarse vencido.
- No debe permitir evaluar el recojo.
- El botón `Evaluar recojo` debe ocultarse o quedar deshabilitado.
- Mostrar texto claro como:

```txt
Anuncio vencido
```

O:

```txt
Disponibilidad finalizada
```

Ejemplo:

```tsx
<Button disabled={vencido}>
  {vencido ? 'Anuncio vencido' : 'Evaluar recojo'}
</Button>
```

## Actualización del contador en tiempo real

El contador debe actualizarse automáticamente para no quedar congelado.

Implementar un intervalo cada 60 segundos dentro del componente o subcomponente de tarjeta.

```ts
useEffect(() => {
  const timer = setInterval(() => {
    setNow(new Date());
  }, 60000);

  return () => clearInterval(timer);
}, []);
```

También puede inicializarse con:

```ts
const [now, setNow] = useState(new Date());
```

---

# 3. Consideraciones de backend si falta la fecha de creación

Solo tocar backend si el frontend no recibe la fecha real de publicación/creación.

## Endpoint probable

Revisar el endpoint usado por la vista:

```txt
GET /api/recolector/solicitudes
```

O el alias equivalente que carga solicitudes pendientes para el recolector.

## Cambio mínimo requerido

Agregar al DTO de respuesta un campo de fecha de creación/publicación.

Nombre sugerido:

```ts
createdAt
```

O mantener el naming usado por el proyecto si ya existe otro estándar.

## Regla

El campo debe venir desde la entidad real de solicitud, no inventado en frontend.

Ejemplo conceptual:

```java
response.setCreatedAt(pickupRequest.getCreatedAt());
```

Si la entidad no tiene `createdAt`, revisar si existe un campo equivalente como fecha de solicitud, fecha de registro o fecha de creación.

No agregar datos mock ni fechas simuladas.

---

# 4. Diseño que debe mantenerse

No rediseñar la pantalla completa.

Mantener:

- Sidebar actual.
- Colores verdes institucionales.
- Tarjeta blanca con bordes redondeados.
- Etiqueta de estado `Pendiente`.
- Bloque azul claro del contador.
- Bloque verde claro de precio de recolección.
- Botón verde `Evaluar recojo`.
- Jerarquía visual actual.

Solo cambiar el contenido del bloque de contador y la lógica de disponibilidad.

---

# 5. No tocar

No modificar estos módulos salvo que sea estrictamente necesario por compilación:

- Login.
- Registro de empresa.
- SUNAT/ApiPeruDev.
- Pagos de suscripción.
- BCrypt.
- Seguridad/JWT global.
- Google Maps.
- Mapa operativo.
- Confirmación de pago, salvo la navegación post-éxito.
- Estados backend de pago ya validados.
- Historial de recojos.
- Mis unidades.
- Mi empresa.

No introducir:

- Mocks.
- Datos inventados.
- `permitAll` innecesario.
- Bypass de JWT.
- Fechas quemadas.
- Contadores falsos.

---

# 6. Criterios de aceptación

La corrección se considera lista cuando se cumpla todo lo siguiente:

## Flujo post pago

- Al confirmar pago correctamente, el usuario queda en `Recojos disponibles`.
- No aparece una tarjeta de recojo activo/en ruta después de completar el pago.
- La vista recarga las solicitudes pendientes reales.
- Si no hay solicitudes pendientes, muestra vacío solo como estado normal de la lista de disponibles.

## Contador de 7 días

- Cada anuncio calcula su disponibilidad desde su fecha real de creación/publicación.
- La fecha de término es exactamente creación/publicación + 7 días.
- Se muestra fecha actual.
- Se muestra fecha de término.
- Se muestra tiempo restante en horas y minutos.
- El contador se actualiza al menos cada minuto.
- Si el anuncio vence, no se puede evaluar el recojo.

## Diseño

- El diseño general se mantiene igual.
- Solo cambia el bloque de contador.
- La pantalla conserva el estilo actual de EcoTacna.

## Validación técnica

Ejecutar como mínimo:

Frontend:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Backend, solo si se modifica DTO o endpoint:

```bash
./mvnw clean compile
./mvnw test
```

En Windows, si aplica:

```bash
mvnw.cmd clean compile
mvnw.cmd test
```

---

# 7. Resultado esperado final

La tarjeta debe verse igual a la actual, pero el bloque del contador debe mostrar información más completa:

```txt
Fecha actual: 22 jun., 09:01 p. m.
Fecha de término: 29 jun., 09:01 p. m.
Disponible por: 167 h 59 min
```

Y después de completar un recojo con pago confirmado, el recolector debe volver automáticamente a la lista de recojos disponibles para continuar trabajando.
