El plan va bien encaminado, pero no lo apruebo tal cual. Ajusta estos puntos antes de implementar para no volver a romper el flujo desplegado.

## Correcciones obligatorias al plan

### 1. No usar solo `collectorUserId != null`

La validación de “solicitud con recolector asignado” no debe depender únicamente de `collectorUserId`.

Debes crear o calcular un campo claro:

```text
hasAssignedCollector
```

Debe ser `true` si existe cualquiera de estos datos reales, según el modelo del proyecto:

```text
collectorUserId
collectorCompanyId
collectorId
transportUnitId
acceptedAt
assignedAt
recolectorAsignado
unidad asignada
```

Usa los campos reales del proyecto. No inventes nombres.

Regla correcta:

```text
Si hasAssignedCollector = true, el restaurante debe poder reportar incidencia aunque el estado visual sea PENDIENTE.
```

---

### 2. Agregar `hasAssignedCollector` al DTO

No quiero que el frontend dependa solo de:

```ts
Boolean(s.recolectorAsignado)
```

Eso puede fallar si el campo viene vacío, cambia de nombre o solo es un texto visual.

El backend debe enviar explícitamente:

```java
private Boolean hasAssignedCollector;
```

Y el frontend debe usarlo como fuente principal:

```ts
const hasCollector =
  solicitud.hasAssignedCollector === true ||
  Boolean(solicitud.collectorUserId) ||
  Boolean(solicitud.collectorCompanyId) ||
  Boolean(solicitud.transportUnitId) ||
  Boolean(solicitud.recolectorAsignado);
```

---

### 3. Cuidado con quitar `@RequestMapping`

No elimines `@RequestMapping` a nivel de clase si eso puede romper rutas existentes.

Antes de quitarlo, revisa si otros métodos dependen de ese prefijo.

Opción más segura:

```text
- Mantener rutas existentes.
- Agregar aliases nuevos controlados.
- O crear métodos/endpoint adicional para recolector solo si hace falta.
```

No quiero una refactorización global del controller si solo necesitamos corregir incidencias.

---

### 4. Restaurar formulario de incidencia del restaurante

No debe quedar solo un botón simple de “Cancelar solicitud” cuando ya hay recolector asignado.

Cuando `hasAssignedCollector = true`, debe aparecer el flujo completo:

```text
Motivo
Observación
Botón guardar incidencia / cancelar pedido
```

Debe ser análogo al flujo del recolector, pero con motivos propios del restaurante.

Motivos sugeridos:

```text
RECOLECTOR_NO_LLEGO → El recolector no llegó
RECOLECTOR_LLEGO_TARDE → El recolector llegó tarde
RECOLECTOR_NO_ACEPTO_CONDICIONES → El recolector no aceptó las condiciones acordadas
RECOLECTOR_NO_TENIA_CAPACIDAD → El recolector no tenía capacidad suficiente
RECOLECTOR_NO_TRAJO_UNIDAD_ADECUADA → El recolector no trajo una unidad adecuada
NO_SE_CONCRETO_RECOJO → No se concretó el recojo
ERROR_EN_DATOS_SOLICITUD → Error en los datos de la solicitud
OTRO → Otro motivo
```

Si el motivo es `OTRO`, la observación debe ser obligatoria.

---

### 5. Mantener cancelación simple solo antes de asignación

Debe haber dos flujos:

#### Solicitud sin recolector asignado

```text
hasAssignedCollector = false
estado = PENDIENTE
```

Mostrar:

```text
Cancelar solicitud
```

Esto es cancelación simple antes de que un recolector tome el pedido.

#### Solicitud con recolector asignado

```text
hasAssignedCollector = true
```

Mostrar:

```text
Reportar incidencia
```

con motivo + observación.

---

### 6. Corregir el desfase del motivo

Este es el punto principal.

Cuando el restaurante selecciona un motivo, ese mismo motivo debe verse en:

```text
- Restaurante
- Recolector
- Historial del restaurante
- Historial del recolector
- Base de datos
```

No debe volver a pasar que:

```text
Restaurante selecciona: El recolector llegó tarde
Recolector ve: Aceite vegetal
```

Revisa específicamente si hay hardcode, default o mapper incorrecto con:

```text
ACEITE_VEGETAL
ACEITE
NO_ES_ACEITE
reason default
motivo fijo
```

El backend debe guardar exactamente lo recibido:

```java
incident.setReason(request.getReason());
incident.setDescription(request.getDescription());
incident.setReportedBy(GENERATOR);
```

Ajustando al enum/clases reales del proyecto.

---

### 7. Permisos de consulta de incidencias

Está bien permitir que `getIncidentsByRequestId` sea consultado por:

```text
- generador dueño de la solicitud
- recolector asignado
- admin
```

Pero la validación debe estar basada en la relación real con la solicitud, no solo en rol.

---

### 8. Rutas

Acepto agregar:

```text
GET /api/recolector/solicitudes/{requestId}/incidencias
```

para que el recolector vea la misma incidencia.

Pero no rompas las rutas existentes:

```text
/api/empresa/solicitudes/{requestId}/incidencias
/api/empresas/solicitudes/{requestId}/incidencias
```

Si vas a modificar el controller, reporta exactamente qué rutas quedan activas.

---

### 9. Proyecto desplegado

No hagas pruebas locales ni tomes control de mi computadora.

No ejecutes:

```text
npm run build
mvnw clean compile
mvn spring-boot:run
comandos PowerShell locales
```

La validación debe ser por:

```text
- revisión de código
- diff de archivos
- logs del despliegue si se comparten
- capturas
- Network/Console si el usuario las comparte
- despliegue controlado solo con aprobación
```

---

### 10. Reporte obligatorio antes de cerrar

Entrega este cierre:

```text
CIERRE CORRECCIÓN INCIDENCIA RESTAURANTE CONTRA RECOLECTOR

1. ¿Se confirmó que PENDIENTE puede tener recolector asignado? Sí/No
2. Campo usado para calcular hasAssignedCollector:
3. DTO donde se agregó hasAssignedCollector:
4. Condición frontend anterior:
5. Condición frontend corregida:
6. ¿Se restauró formulario motivo + observación? Sí/No
7. Motivos disponibles para restaurante:
8. ¿OTRO exige observación? Sí/No
9. Endpoint usado para reportar incidencia desde restaurante:
10. Endpoint usado para consultar incidencia desde recolector:
11. ¿Se eliminó motivo fijo incorrecto tipo aceite vegetal? Sí/No
12. ¿El motivo guardado viene del request real? Sí/No
13. ¿Restaurante ve el mismo motivo que recolector? Sí/No
14. ¿Recolector ve la incidencia en historial/detalle? Sí/No
15. ¿Solicitud pasa a CANCELADO? Sí/No
16. ¿Recolector queda libre? Sí/No
17. ¿Cancelación simple solo queda para solicitudes sin recolector? Sí/No
18. ¿No se tocó pagos/Culqi/ApiPeruDev/Maps/IA/login/registro? Sí/No
19. Archivos modificados:
20. Riesgos y reversión:
```

No cierres hasta demostrar que el bug del motivo desfasado quedó corregido.
