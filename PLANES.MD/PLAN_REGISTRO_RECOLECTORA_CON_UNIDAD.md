# PLAN ECO TACNA — REGISTRO DE EMPRESA RECOLECTORA CON UNIDAD VEHICULAR ANTES DE ENVIAR SOLICITUD AL ADMIN

## Objetivo

Modificar el flujo de registro de una **empresa recolectora** para que, antes de enviar la solicitud al administrador, el sistema obligue a registrar los datos de su unidad vehicular usando la misma interfaz/diseño que ya existe en el panel recolector para registrar o editar vehículos.

El flujo final debe quedar así:

```text
1. Empresa recolectora ingresa RUC.
2. Backend consulta ApiPeruDev/SUNAT y muestra datos reales.
3. Usuario completa correo, contraseña, contacto y ubicación física de la empresa.
4. Si el tipo de empresa es RECOLECTORA, aparece un paso obligatorio: Registrar unidad vehicular.
5. Se registra placa, vehículo, capacidad, tipo de unidad y los mismos datos usados en “Mis unidades”.
6. Recién después se envía la solicitud al administrador.
7. Administrador aprueba o rechaza.
8. Si aprueba, la empresa recolectora continúa al pago de suscripción mensual.
9. Tras pagar, entra al panel recolector con su empresa y unidad ya registradas.
```

La finalidad es evitar que un recolector aprobado ingrese al sistema sin unidad y luego tenga que completar manualmente esa información.

---

## Decisión funcional

```text
Empresa GENERADORA / RESTAURANTE:
Mantiene el registro normal actual.

Empresa RECOLECTORA:
Registro actual + paso obligatorio de unidad vehicular antes de enviar solicitud al admin.
```

No se debe romper el flujo actual de empresas generadoras/restaurantes.

---

## Rutas actuales

Frontend:

```text
C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend
```

Backend:

```text
C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA
```

---

## Reglas estrictas

- No tocar login salvo que sea estrictamente necesario por respuesta de registro.
- No tocar JWT.
- No tocar pagos existentes salvo navegación posterior a aprobación.
- No tocar Culqi.
- No tocar ApiPeruDev salvo mantener el flujo actual de RUC.
- No tocar Google Maps salvo reutilizar ubicación ya existente del registro.
- No tocar solicitudes de recojo.
- No tocar incidencias.
- No tocar historial.
- No tocar PDF/Excel.
- No crear diseño nuevo si ya existe formulario de unidad.
- Reutilizar la interfaz/diseño del módulo de vehículos/unidades del recolector.
- No duplicar lógica de validación de unidad si ya existe.
- No dejar unidad vehicular opcional para recolectora.
- No crear mocks.
- No dejar registros parciales inconsistentes.
- No registrar la empresa como activa antes de aprobación admin.
- No permitir pago antes de aprobación admin.
- No crear archivos `old`, `copy`, `backup`, `legacy`, `v1`, `v2`.

---

# 1. Diagnosticar flujo actual de registro

Ejecutar en frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "RegisterCompanyPage|registro|Registrar empresa|tipo de empresa|RECOLECTORA|GENERADORA|ApiPeruDev|SUNAT|branches|latitude|longitude|password|confirmPassword" -Context 6,6
```

Archivo probable:

```text
src/pages/RegisterCompanyPage.tsx
```

Identificar:

```text
1. Dónde se elige tipo de empresa.
2. Cómo se arma el payload final.
3. Dónde se envían datos al backend.
4. Cómo se manejan sedes/ubicación principal.
5. Qué ocurre después del registro.
```

---

# 2. Diagnosticar formulario existente de unidad vehicular

Ejecutar en frontend:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "Mis unidades|Transportes|Unidad vehicular|Registrar unidad|Editar unidad|placa|capacidad|tipoUnidad|vehicle|transport|RecolectorTransportes|unidades" -Context 6,6
```

Archivos probables:

```text
src/pages/recolector/RecolectorTransportes.tsx
src/services/recolectorApi.ts
src/types.ts
```

Identificar:

```text
1. Campos exactos del formulario.
2. Validaciones actuales.
3. Labels actuales.
4. DTO/payload actual.
5. Endpoint actual usado para registrar unidad.
6. Diseño visual que se debe reutilizar.
```

---

# 3. Diagnosticar backend de unidades vehiculares

Ejecutar en backend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"

Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "TransportUnit|Unidad|vehicle|placa|capacidad|tipoUnidad|Recolector|unidades|TransportUnitRepository|TransportUnitController|registerCompany|RegisterRequest" -Context 6,6
```

Archivos probables:

```text
TransportUnit.java
TransportUnitRepository.java
RecolectorController.java
CollectorPortalService.java
AuthService.java
RegisterRequest.java
```

Identificar:

```text
1. Entidad de unidad vehicular.
2. Campos obligatorios.
3. Relación con Company.
4. Endpoint actual para crear unidad desde panel recolector.
5. Validaciones de placa/capacidad.
6. Si ya existe restricción de una unidad por recolector o varias.
```

---

# 4. Definir campos obligatorios de unidad en registro

El formulario debe pedir los mismos datos que el módulo actual de unidades.

Campos mínimos esperados, ajustar a nombres reales:

```text
Placa
Vehículo / modelo
Tipo de unidad
Capacidad en litros
Estado activo
```

Campos probables del sistema actual:

```text
plate
vehicle
unitType
capacityLiters
status
```

Validaciones mínimas:

```text
Placa obligatoria.
Placa sin duplicados.
Vehículo/modelo obligatorio.
Tipo de unidad obligatorio.
Capacidad obligatoria y mayor a 0.
Capacidad numérica.
```

No crear nuevos campos si no existen en la entidad real.

---

# 5. Frontend: extraer formulario reusable de unidad

Si `RecolectorTransportes.tsx` tiene formulario embebido, extraerlo a un componente reutilizable.

Ubicación sugerida:

```text
src/components/recolector/TransportUnitForm.tsx
```

o:

```text
src/components/transport/TransportUnitForm.tsx
```

Debe recibir props similares a:

```ts
type TransportUnitFormProps = {
  value: TransportUnitFormData;
  onChange: (value: TransportUnitFormData) => void;
  mode: 'create' | 'edit' | 'registration';
  disabled?: boolean;
  errors?: Record<string, string>;
};
```

Regla:

```text
El panel recolector y el registro deben usar el mismo formulario visual.
```

No copiar JSX dos veces.

---

# 6. Frontend: mantener RecolectorTransportes funcionando

Después de extraer el formulario, validar:

```text
/recolector/unidades
```

Debe seguir funcionando igual:

```text
Crear unidad desde panel.
Editar unidad desde panel.
Validaciones actuales.
Estilos actuales.
```

No romper ese módulo.

---

# 7. Frontend: agregar paso de unidad vehicular en registro

En el registro de empresa, si `tipoEmpresa === RECOLECTORA`, mostrar un paso adicional.

Flujo visual sugerido:

```text
Paso 1: Datos principales con RUC
Paso 2: Ubicación de empresa
Paso 3: Unidad vehicular
Paso 4: Confirmación / Enviar solicitud
```

Si el stepper actual ya tiene 5 pasos, adaptar sin romper:

```text
Registro de empresa
Verificación
Unidad vehicular
Plan y pago / Pendiente según flujo real
Confirmación
Acceso al sistema
```

Pero funcionalmente, para recolectora:

```text
Antes de enviar solicitud al admin, unidad obligatoria.
```

Para generadora:

```text
No mostrar paso de unidad.
```

---

# 8. Frontend: validación obligatoria antes de enviar

Antes de llamar al backend:

```ts
if (companyType === 'RECOLECTORA' && !isTransportUnitValid(unitForm)) {
  showToast('Registra los datos de la unidad vehicular para continuar.');
  return;
}
```

No permitir enviar solicitud recolectora sin unidad.

---

# 9. Frontend: payload de registro

Extender el payload de registro solo para recolectoras:

```json
{
  "ruc": "...",
  "businessName": "...",
  "companyType": "RECOLECTORA",
  "email": "...",
  "password": "...",
  "latitude": -18.0,
  "longitude": -70.0,
  "transportUnit": {
    "plate": "ABC-123",
    "vehicle": "Volvo FMY",
    "unitType": "Furgón",
    "capacityLiters": 250
  }
}
```

Para generadoras:

```json
{
  "transportUnit": null
}
```

o no enviar el campo.

Usar nombres reales del DTO.

---

# 10. Backend: extender RegisterRequest

En backend, extender DTO de registro:

```java
private TransportUnitRegistrationRequest transportUnit;
```

o clase interna:

```java
public static class TransportUnitRequest {
    private String plate;
    private String vehicle;
    private String unitType;
    private BigDecimal capacityLiters;
}
```

Ajustar tipos reales.

Validación:

```text
Si companyType == RECOLECTORA:
transportUnit obligatorio.

Si companyType == GENERADORA:
transportUnit debe ignorarse o validarse null.
```

---

# 11. Backend: reutilizar lógica de creación de unidad

No duplicar la lógica del endpoint actual de unidades.

Si existe servicio:

```text
CollectorPortalService.createTransportUnit(...)
TransportUnitService.create(...)
```

reutilizarlo o extraer lógica común.

Regla:

```text
El registro inicial de recolectora y el panel “Mis unidades” deben usar la misma validación de placa/capacidad.
```

Si ahora la lógica está dentro del controller, moverla a servicio.

---

# 12. Backend: transacción atómica

El registro de empresa recolectora debe ser transaccional.

Si falla guardar unidad:

```text
No debe quedar empresa creada a medias.
No debe quedar usuario creado a medias.
No debe quedar registro pendiente sin unidad.
```

En `AuthService.registerCompany`, usar `@Transactional` o confirmar que ya existe.

Flujo backend:

```text
1. Validar RUC/datos.
2. Validar email no duplicado.
3. Validar tipo de empresa.
4. Si RECOLECTORA, validar unidad.
5. Crear Company.
6. Crear User.
7. Guardar ubicación/sedes si aplica.
8. Guardar TransportUnit asociada a Company.
9. Dejar estado pendiente de aprobación admin.
10. Retornar respuesta controlada.
```

---

# 13. Backend: estado posterior al registro

Después de registrar recolectora con unidad:

```text
Company debe quedar pendiente de aprobación administrativa.
User debe quedar en estado apropiado para no entrar aún si no está aprobado.
TransportUnit debe quedar asociada a Company.
TransportUnit puede quedar ACTIVA o PENDIENTE según modelo actual, pero no debe habilitar operación hasta aprobación/pago.
```

No permitir acceso operacional antes de aprobación + pago.

---

# 14. Admin: visualizar unidad en solicitud pendiente

En `/admin/recolectores` o módulo donde se aprueban recolectoras, el administrador debe poder ver la unidad registrada.

Si actualmente admin solo ve empresa pendiente, agregar resumen de unidad:

```text
Placa
Vehículo
Tipo
Capacidad
```

No cambiar flujo de aprobación, solo dar visibilidad.

---

# 15. Admin: aprobación de recolectora

Al aprobar una recolectora:

```text
Debe mantener la unidad asociada.
No debe crear unidad duplicada.
Debe pasar al flujo actual de pago de suscripción mensual.
```

Si el sistema actual después de aprobar marca `PENDIENTE_PAGO`, mantenerlo.

---

# 16. Pago de suscripción

El nuevo flujo no debe modificar la pasarela.

Secuencia esperada:

```text
Recolectora se registra con unidad.
Admin aprueba.
Recolectora paga suscripción mensual.
Recolectora entra al panel.
La unidad ya aparece en “Mis unidades”.
```

No pedir nuevamente datos de unidad después de pagar.

---

# 17. Evitar unidad duplicada

Cuando el recolector ya entra al panel:

```text
/recolector/unidades
```

debe mostrar la unidad creada durante el registro.

No crear otra automáticamente.

Si el módulo permite agregar más unidades, mantener la regla actual del sistema. Si solo permite una unidad, bloquear como ya se hace.

---

# 18. Validaciones de placa duplicada

Antes de guardar:

```text
La placa no debe existir en otra empresa.
```

Si el endpoint actual ya valida placa única, reutilizar esa validación.

SQL diagnóstico:

```sql
SELECT plate, COUNT(*)
FROM transport_units
GROUP BY plate
HAVING COUNT(*) > 1;
```

Ajustar nombre real de tabla/columna.

---

# 19. Manejo de recolectoras antiguas sin unidad

Algunas recolectoras existentes podrían no tener unidad.

No hacer migración masiva en este plan.

Solo mantener:

```text
Recolectoras nuevas deben registrar unidad en el flujo.
Recolectoras antiguas pueden seguir usando el panel Mis unidades para completar si aplica.
```

Si se desea forzar a antiguas, hacerlo en otro plan.

---

# 20. Frontend: mensajes esperados

En paso unidad:

```text
Registra tu unidad vehicular
Estos datos serán revisados junto con tu solicitud de recolector.
```

Botones:

```text
Volver
Continuar
Enviar solicitud
```

Validación:

```text
Completa los datos de la unidad vehicular para continuar.
```

Confirmación final:

```text
Tu solicitud de recolector fue enviada al administrador con los datos de tu unidad vehicular.
```

---

# 21. Seguridad

No permitir que frontend mande unidad para empresa generadora y el backend la cree.

Regla backend:

```text
Solo companyType RECOLECTORA puede crear transportUnit en registro.
```

---

# 22. Prueba manual completa — recolectora nueva

1. Ir a `/registro`.
2. Ingresar RUC de empresa recolectora.
3. Ver datos ApiPeruDev/SUNAT.
4. Seleccionar tipo `Recolectora`.
5. Completar correo, contraseña, contacto.
6. Seleccionar ubicación en mapa.
7. Continuar.
8. Ver paso `Unidad vehicular`.
9. Completar placa, vehículo, tipo, capacidad.
10. Enviar solicitud.
11. Confirmar que queda pendiente para admin.
12. Entrar como admin.
13. Ver recolectora pendiente con datos de unidad.
14. Aprobar.
15. Ingresar/pagar suscripción según flujo actual.
16. Entrar como recolector.
17. Ir a `Mis unidades`.
18. Confirmar que la unidad ya aparece.

---

# 23. Prueba manual — generadora/restaurante

1. Ir a `/registro`.
2. Seleccionar tipo generadora/restaurante.
3. Completar flujo normal.
4. Confirmar que NO aparece paso de unidad vehicular.
5. Confirmar que registro generadora no se rompe.

---

# 24. Validación de error — recolectora sin unidad

Intentar enviar recolectora sin llenar unidad.

Resultado esperado:

```text
No permite enviar.
Muestra validación clara.
No crea empresa ni usuario en BD.
```

---

# 25. Validación de error — placa duplicada

Intentar registrar recolectora con placa existente.

Resultado esperado:

```text
Backend rechaza.
Frontend muestra error.
No crea empresa incompleta.
```

---

# 26. SQL de verificación

Después de registrar recolectora nueva:

```sql
SELECT
    c.id,
    c.business_name,
    c.ruc,
    c.company_type,
    c.subscription_status,
    c.enabled
FROM companies c
WHERE c.ruc = '[RUC_RECOLECTORA]';
```

Unidad:

```sql
SELECT
    tu.*
FROM transport_units tu
JOIN companies c ON c.id = tu.company_id
WHERE c.ruc = '[RUC_RECOLECTORA]';
```

Usuario:

```sql
SELECT
    u.id,
    u.email,
    u.role,
    u.enabled,
    u.company_id
FROM users u
JOIN companies c ON c.id = u.company_id
WHERE c.ruc = '[RUC_RECOLECTORA]';
```

Ajustar nombre real de tabla `users` si el proyecto usa otro.

---

# 27. Limpieza de residuos

Buscar al final:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "TransportUnitForm|Registrar unidad vehicular|placa|capacidad|RecolectorTransportes|registerCompany|transportUnit" -Context 4,4
```

Backend:

```powershell
Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "TransportUnit|transportUnit|RegisterRequest|registerCompany|placa|capacity|plate" -Context 4,4
```

Confirmar:

```text
No hay formularios duplicados innecesarios.
No hay lógica duplicada de unidad.
No hay payloads incompatibles.
```

---

# 28. Builds obligatorios

Backend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"
.\mvnw.cmd clean compile
```

Frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

---

# Reporte final obligatorio

```text
CIERRE FLUJO REGISTRO RECOLECTORA CON UNIDAD

1. Ruta frontend actual:
2. Ruta backend actual:
3. Archivos frontend modificados:
4. Archivos backend modificados:
5. Componente de unidad reutilizado/creado:
6. ¿RecolectorTransportes sigue usando el mismo formulario? Sí/No
7. ¿Registro de recolectora exige unidad vehicular? Sí/No
8. ¿Registro de generadora no muestra unidad? Sí/No
9. Campos de unidad registrados:
10. ¿Backend valida unidad obligatoria para RECOLECTORA? Sí/No
11. ¿Backend ignora/rechaza unidad para GENERADORA? Sí/No
12. ¿Registro es transaccional? Sí/No
13. ¿Unidad queda asociada a la empresa recolectora? Sí/No
14. ¿Admin puede ver la unidad antes de aprobar? Sí/No
15. ¿Aprobación admin sigue funcionando? Sí/No
16. ¿Pago de suscripción sigue funcionando? Sí/No
17. ¿Al entrar al panel recolector la unidad ya aparece en Mis unidades? Sí/No
18. ¿No se duplicó lógica de formulario ni validación? Sí/No
19. ¿mvnw clean compile pasa? Sí/No
20. ¿npm run build pasa? Sí/No
21. Observaciones:
```

No cerrar hasta probar una recolectora nueva de inicio a fin.
