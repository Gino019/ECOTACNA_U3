# PLAN ECO TACNA — PANEL ADMIN PARA REVISAR EMPRESAS RECHAZADAS Y READMITIR

## Objetivo

Implementar una interfaz administrativa para que el administrador pueda revisar empresas previamente rechazadas/canceladas durante el registro y, si corresponde, **admitirlas nuevamente**.

Caso funcional:

```text
Una empresa se registró.
El administrador la rechazó.
Luego la empresa envía correo o sustento externo.
El administrador revisa el caso.
Si considera que el rechazo fue un error o quedó justificado, puede admitirla.
```

La solución debe integrarse al módulo actual:

```text
/admin/empresas
```

Sin romper el flujo actual de aprobación de empresas pendientes.

---

## Situación actual observada

En el panel admin existe:

```text
Empresas registradas
Pendientes de aprobación
Botones Aprobar / Rechazar para empresas pendientes
Listado empresarial con estados como:
- Prueba activa
- Pendiente
- Pendiente de pago
- Cancelada
```

El problema es que las empresas rechazadas/canceladas quedan mezcladas en el listado o no tienen una interfaz clara para ser recuperadas.

Se necesita un acceso administrativo específico:

```text
Botón: Ver rechazadas
Ventana/modal: Empresas rechazadas
Acción: Admitir / Revertir rechazo / Aprobar nuevamente
```

---

## Regla funcional final

Una empresa rechazada debe poder ser readmitida por el administrador.

Estados sugeridos:

```text
PENDIENTE       → empresa esperando aprobación.
ACTIVA          → empresa aprobada con acceso normal o prueba activa.
PENDIENTE_PAGO  → empresa aprobada pero pendiente de pago/suscripción.
CANCELADA       → empresa rechazada/cancelada administrativamente.
```

Acción de readmisión:

```text
CANCELADA → PENDIENTE_PAGO o ACTIVA/PENDIENTE según el flujo real actual.
```

La decisión exacta depende del estado que usa el sistema después de aprobar una empresa pendiente.

Regla recomendada:

```text
Si el botón actual "Aprobar" deja a la empresa en PRUEBA_ACTIVA/ACTIVA, entonces "Admitir" debe reutilizar esa misma lógica.
Si el botón actual "Aprobar" deja a la empresa en PENDIENTE_PAGO, entonces "Admitir" debe reutilizar esa misma lógica.
No crear una ruta paralela distinta.
```

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

- No tocar login.
- No tocar JWT.
- No tocar pagos reales.
- No tocar Culqi.
- No tocar ApiPeruDev.
- No tocar Google Maps.
- No tocar recolector.
- No tocar solicitudes de recojo.
- No tocar incidencias.
- No tocar historial.
- No tocar PDF/Excel.
- No borrar empresas de BD.
- No borrar usuarios.
- No borrar suscripciones.
- No crear estados nuevos si ya existe `CANCELADA`.
- No duplicar lógica de aprobación.
- Reutilizar la lógica actual de `Aprobar` siempre que sea posible.
- No crear archivos `old`, `copy`, `backup`, `legacy`, `v1`, `v2`.
- No resolver solo visualmente: el cambio debe persistir en backend/BD.
- No mostrar empresas recolectoras en el panel de empresas generadoras si el módulo separa ambos tipos.
- No mezclar empresas pendientes con rechazadas en una sola tarjeta sin filtro claro.

---

# 1. Diagnóstico de estados actuales

Ejecutar en Supabase:

```sql
SELECT
    id,
    business_name,
    ruc,
    company_type,
    subscription_status,
    status,
    enabled,
    created_at,
    updated_at
FROM companies
ORDER BY updated_at DESC
LIMIT 50;
```

Si no existe columna `status`, revisar columnas reales:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;
```

Objetivo del diagnóstico:

```text
1. Confirmar cómo se guarda una empresa rechazada.
2. Confirmar qué columna cambia al aprobar.
3. Confirmar si "Cancelada" viene de subscription_status, status, enabled, o combinación.
4. Confirmar si el usuario asociado queda disabled/enabled.
```

---

# 2. Diagnosticar frontend actual del admin

Ejecutar en frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "Empresas registradas|Pendientes de aprobación|Aprobar|Rechazar|Cancelada|Nueva empresa|admin/empresas|AdminEmpresas|empresasApi|adminApi" -Context 6,6
```

Archivos probables:

```text
src/pages/admin/AdminEmpresas.tsx
src/services/adminApi.ts
src/types.ts
```

Identificar:

```text
1. Componente que renderiza /admin/empresas.
2. Función que carga empresas.
3. Función que carga pendientes de aprobación.
4. Función actual de aprobar.
5. Función actual de rechazar.
```

---

# 3. Diagnosticar backend actual del admin

Ejecutar en backend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"

Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "Admin|empresa|empresas|approve|aprobar|reject|rechazar|cancel|Company|subscriptionStatus|PENDIENTE|CANCELADA|ACTIVA" -Context 6,6
```

Archivos probables:

```text
AdminController.java
AdminCompanyController.java
AdminPortalService.java
CompanyPortalService.java
CompanyRepository.java
Company.java
SubscriptionStatus.java
```

Identificar:

```text
1. Endpoint actual de aprobar empresa.
2. Endpoint actual de rechazar empresa.
3. Servicio que cambia estado.
4. Estados exactos usados.
```

---

# 4. Definir la recuperación correcta

La acción `Admitir` debe reutilizar la lógica de aprobación existente.

Ejemplo conceptual:

```text
Si existe:
POST /api/admin/empresas/{id}/aprobar

Entonces crear:
POST /api/admin/empresas/{id}/admitir

Pero internamente llamar al mismo método de aprobación o extraer método común.
```

No duplicar reglas.

Servicio recomendado:

```text
approveCompany(companyId)
readmitCompany(companyId) → valida que esté CANCELADA y luego llama a lógica común de aprobación.
```

---

# 5. Backend: endpoint para listar rechazadas

Crear o reutilizar endpoint:

```text
GET /api/admin/empresas/rechazadas
```

Debe devolver solo empresas generadoras/restaurantes rechazadas/canceladas, según el módulo actual de empresas.

Si el sistema usa `company_type = GENERADORA`:

```text
company_type = GENERADORA
AND estado cancelado/rechazado
```

No mezclar recolectoras si existe módulo separado `/admin/recolectores`.

Respuesta esperada:

```json
[
  {
    "id": 123,
    "businessName": "EMPRESA EJEMPLO S.A.C.",
    "ruc": "20...",
    "email": "correo@empresa.com",
    "phone": "999999999",
    "status": "CANCELADA",
    "subscriptionStatus": "CANCELADA",
    "createdAt": "...",
    "updatedAt": "...",
    "rejectionReason": "..."
  }
]
```

Usar nombres reales del DTO.

---

# 6. Backend: endpoint para admitir empresa rechazada

Crear o reutilizar endpoint:

```text
POST /api/admin/empresas/{companyId}/admitir
```

Validaciones:

```text
1. Solo ADMIN.
2. Empresa existe.
3. Empresa corresponde al módulo correcto.
4. Empresa está CANCELADA/rechazada.
5. No está ya ACTIVA.
6. Usuario asociado existe.
```

Acciones:

```text
1. Restaurar estado usando la misma lógica de aprobar.
2. Habilitar usuario si fue deshabilitado.
3. Actualizar subscription_status según flujo real.
4. Guardar updated_at.
5. Devolver empresa actualizada.
```

No crear datos inventados.

---

# 7. Backend: razón de rechazo

Si actualmente el rechazo guarda motivo, mostrarlo en la ventana.

Buscar si existe:

```text
rejectionReason
motivoRechazo
observacionRechazo
adminObservation
```

Si no existe columna, no inventar ni crear una nueva en este plan salvo que el usuario lo solicite.

Para esta etapa basta con:

```text
Mostrar estado, fecha de registro, correo, RUC, contacto.
```

Opcional:

```text
Mostrar “Motivo no registrado” si no existe motivo.
```

---

# 8. Frontend: botón para abrir ventana de rechazadas

En `/admin/empresas`, agregar botón visible y consistente con diseño actual.

Ubicación recomendada:

```text
Parte superior derecha junto a Filtrar / Exportar
```

Texto sugerido:

```text
Ver rechazadas
```

Alternativas:

```text
Empresas rechazadas
Revisar rechazadas
```

Debe abrir un modal/ventana interna.

No debe navegar a otra página salvo que sea estrictamente necesario.

---

# 9. Frontend: modal de empresas rechazadas

Crear modal con título:

```text
Empresas rechazadas
```

Subtítulo:

```text
Empresas que fueron rechazadas o canceladas y pueden ser readmitidas por revisión administrativa.
```

Contenido:

```text
Lista de empresas rechazadas
RUC
Correo
Teléfono/contacto
Fecha de registro
Estado actual
Motivo de rechazo si existe
Botón Admitir
```

Estado vacío:

```text
No hay empresas rechazadas pendientes de revisión.
```

---

# 10. Frontend: acción Admitir

Cada empresa rechazada debe tener botón:

```text
Admitir
```

Al hacer clic:

```text
1. Mostrar confirmación.
2. Confirmar que se desea readmitir.
3. Llamar endpoint POST /admin/empresas/{id}/admitir.
4. Mostrar toast de éxito.
5. Retirar empresa del modal de rechazadas.
6. Refrescar listado empresarial.
7. Refrescar pendientes de aprobación si aplica.
```

Texto de confirmación sugerido:

```text
¿Admitir nuevamente a esta empresa?
La empresa recuperará acceso según el flujo de aprobación actual.
```

---

# 11. No duplicar lógica de aprobar

Si ya existe función frontend:

```text
aprobarEmpresa(id)
```

crear función:

```text
admitirEmpresa(id)
```

pero si ambas llaman al mismo endpoint o al mismo patrón, reutilizar helper.

No copiar un bloque completo con diferencias mínimas.

Servicio frontend recomendado:

```ts
adminApi.listarEmpresasRechazadas()
adminApi.admitirEmpresa(id)
```

---

# 12. Estados visuales

En la lista principal, si una empresa sigue cancelada:

```text
Badge rojo o gris: Cancelada
```

En el modal:

```text
Badge: Rechazada / Cancelada
```

Después de admitir:

```text
Debe pasar al estado que corresponda:
Prueba activa / Pendiente de pago / Activa / Pendiente
```

No debe seguir apareciendo como `Cancelada`.

---

# 13. Permisos y seguridad

Backend debe exigir rol admin.

No permitir que empresa/recolector llamen:

```text
GET /api/admin/empresas/rechazadas
POST /api/admin/empresas/{id}/admitir
```

Si SecurityConfig ya protege `/api/admin/**`, no tocar.

Si no, verificar.

---

# 14. SQL diagnóstico posterior

Después de readmitir una empresa:

```sql
SELECT
    id,
    business_name,
    ruc,
    company_type,
    subscription_status,
    status,
    enabled,
    updated_at
FROM companies
WHERE id = [COMPANY_ID];
```

Y usuario asociado:

```sql
SELECT
    id,
    email,
    role,
    enabled,
    company_id
FROM users
WHERE company_id = [COMPANY_ID];
```

Ajustar nombre real de tabla si es `app_users` o equivalente.

---

# 15. Validación manual principal

Flujo:

```text
1. Entrar como admin.
2. Ir a /admin/empresas.
3. Ver botón "Ver rechazadas".
4. Abrir modal.
5. Ver empresas canceladas/rechazadas.
6. Elegir una.
7. Click en Admitir.
8. Confirmar.
9. Ver toast de éxito.
10. Confirmar que desaparece del modal.
11. Confirmar que aparece en listado principal con nuevo estado correcto.
12. Confirmar que ya no está como Cancelada.
```

---

# 16. Validación de acceso de empresa readmitida

Después de admitir:

```text
1. Intentar iniciar sesión con esa empresa.
2. Confirmar que ya no queda bloqueada por rechazo/cancelación.
3. Confirmar que cae al flujo correcto:
   - panel si activa/prueba activa;
   - pago si pendiente de pago;
   - pendiente si aún requiere aprobación, según regla real.
```

No inventar comportamiento. Usar flujo actual de aprobación.

---

# 17. Validación de que rechazo normal sigue funcionando

Probar una empresa pendiente:

```text
1. Rechazar empresa pendiente.
2. Confirmar que pasa a Cancelada/Rechazada.
3. Confirmar que aparece en modal "Empresas rechazadas".
4. Confirmar que ya no aparece en "Pendientes de aprobación".
```

---

# 18. Limpieza de residuos

Buscar al final:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "rechazadas|Rechazadas|admitir|Admitir|canceladas|Canceladas" -Context 5,5
```

Verificar que no existan componentes duplicados innecesarios.

Backend:

```powershell
Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "admitir|readmit|rechazadas|rejected|canceladas" -Context 5,5
```

---

# 19. Builds

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
CIERRE PANEL ADMIN EMPRESAS RECHAZADAS

1. Ruta frontend actual:
2. Ruta backend actual:
3. Archivos frontend modificados:
4. Archivos backend modificados:
5. Estado real usado para empresas rechazadas:
6. Endpoint creado/listado rechazadas:
7. Endpoint creado/admitir:
8. ¿Se agregó botón Ver rechazadas? Sí/No
9. ¿Se creó modal/ventana de empresas rechazadas? Sí/No
10. ¿Se listan empresas rechazadas/canceladas? Sí/No
11. ¿Cada empresa tiene botón Admitir? Sí/No
12. ¿Admitir reutiliza la lógica real de aprobación? Sí/No
13. ¿Admitir persiste en BD? Sí/No
14. ¿Empresa readmitida desaparece del modal? Sí/No
15. ¿Empresa readmitida aparece con estado correcto en listado principal? Sí/No
16. ¿Empresa readmitida puede continuar su flujo normal? Sí/No
17. ¿Rechazo normal sigue funcionando? Sí/No
18. ¿mvnw clean compile pasa? Sí/No
19. ¿npm run build pasa? Sí/No
20. Observaciones:
```

No cerrar hasta validar una empresa rechazada real y readmitirla desde el nuevo modal.
