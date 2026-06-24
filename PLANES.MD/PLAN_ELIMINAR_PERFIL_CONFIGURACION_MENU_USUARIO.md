# PLAN QUIRÚRGICO — ELIMINAR PERFIL Y CONFIGURACIÓN DEL MENÚ DE USUARIO

## Objetivo

Eliminar definitivamente el apartado redundante de **Perfil** y **Configuración** que aparece al abrir el menú del usuario en la parte superior derecha de los paneles internos.

Actualmente, al hacer clic en el usuario aparece:

```text
Mi cuenta
Perfil
Configuración
Cerrar sesión
```

Y al entrar a `/perfil` se muestra una pantalla de:

```text
Perfil y configuración
Datos de empresa recolectora
Guardar cambios
```

Ese módulo ya no debe existir porque la información real de empresa/contacto ya está en otros módulos como:

```text
/empresa/mi-empresa
/recolector/mi-empresa
```

Regla final:

```text
El menú del usuario solo debe mantener Cerrar sesión.
No debe mostrar Perfil.
No debe mostrar Configuración.
No debe permitir navegar a /perfil.
La ruta /perfil debe eliminarse o redirigirse de forma segura.
```

---

## Alcance

Aplicar a todos los perfiles internos:

```text
Empresa / Restaurante
Recolector
Administrador, si usa el mismo menú
```

No afectar:

```text
Módulo Mi empresa
Datos de contacto reales
Suscripción y facturación
Cerrar sesión
Nombre/correo mostrado en header
Avatar/iniciales del usuario
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

- Tocar solo frontend, salvo que se encuentre un endpoint backend exclusivo y muerto de `/perfil`.
- No tocar login.
- No tocar logout/cerrar sesión.
- No tocar autenticación JWT.
- No tocar roles.
- No tocar pagos.
- No tocar Culqi.
- No tocar ApiPeruDev.
- No tocar mapas.
- No tocar incidencias.
- No tocar solicitudes.
- No tocar historial.
- No tocar Mi empresa.
- No tocar datos reales de contacto.
- No tocar suscripción/facturación.
- No borrar tablas ni datos de BD.
- No crear archivos `old`, `copy`, `backup`, `legacy`, `v1`, `v2`.
- No ocultar con CSS: eliminar JSX, rutas e imports reales.
- No dejar enlaces muertos a `/perfil`.
- No dejar ruta `/perfil` mostrando pantalla antigua.
- No cerrar sin validar empresa y recolector.

---

# 1. Ubicar el menú de usuario

Ejecutar en frontend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"

Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "Mi cuenta|Perfil|Configuración|Cerrar sesión|/perfil|perfil|configuration|configuracion|logout|Cerrar sesion" -Context 6,6
```

Archivos probables:

```text
src/components/layout/DashboardShell.tsx
src/components/DashboardShell.tsx
src/layouts/...
src/components/UserMenu.tsx
src/pages/Perfil.tsx
src/pages/ProfilePage.tsx
src/App.tsx
```

Identificar exactamente:

```text
1. Componente que renderiza el dropdown del usuario.
2. Ruta que apunta a /perfil.
3. Página/componente que renderiza Perfil y configuración.
```

---

# 2. Eliminar opciones Perfil y Configuración del dropdown

En el menú superior derecho, eliminar completamente los items:

```text
Perfil
Configuración
```

No usar:

```tsx
hidden
display: none
{false && ...}
```

Debe eliminarse el JSX real.

El menú debe quedar así:

```text
Mi cuenta
Cerrar sesión
```

O, si se decide simplificar más:

```text
Cerrar sesión
```

Pero se recomienda mantener el título `Mi cuenta` como encabezado visual si no molesta.

---

# 3. Mantener Cerrar sesión intacto

No tocar la función de cierre de sesión.

Debe seguir:

```text
1. Limpiando auth/localStorage según flujo actual.
2. Redirigiendo al login o landing según el comportamiento actual.
3. Cerrando sesión sin errores.
```

No cambiar nombres de funciones como:

```text
logout
handleLogout
clearStoredAuth
signOut
```

salvo que haya imports muertos por limpiar.

---

# 4. Eliminar navegación hacia /perfil

Buscar todas las referencias:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "navigate\('/perfil'|navigate\(\"/perfil\"|to=\"/perfil\"|href=\"/perfil\"|path=\"/perfil\"|/perfil" -Context 5,5
```

Eliminar navegación desde:

```text
Dropdown usuario
Botones Perfil
Botones Configuración
Links internos redundantes
```

No debe quedar ningún link clickeable hacia `/perfil`.

---

# 5. Eliminar o neutralizar ruta /perfil

Revisar rutas en `App.tsx` o archivo equivalente:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "Route|Routes|path=|/perfil|PerfilPage|ProfilePage|Configuracion" -Context 6,6
```

Si existe:

```tsx
<Route path="/perfil" element={<PerfilPage />} />
```

Eliminarla si no la usa nada.

Para evitar pantalla rota si alguien entra manualmente a `/perfil`, agregar redirección segura según rol o fallback.

Opciones aceptables:

## Opción recomendada

Redirigir `/perfil` al panel correspondiente según sesión/rol si existe helper de rutas:

```text
EMPRESA → /empresa/mi-empresa
RECOLECTOR → /recolector/mi-empresa
ADMIN → /admin/resumen
```

## Opción simple

Eliminar la ruta y dejar que el wildcard general redirija a dashboard/login.

Si no existe wildcard, agregar uno controlado:

```tsx
<Route path="*" element={<Navigate to="/login" replace />} />
```

Solo si no rompe rutas internas.

---

# 6. Eliminar página/componente de perfil si queda huérfano

Buscar archivos:

```powershell
Get-ChildItem .\src -Recurse -Include *Perfil*.tsx,*Profile*.tsx,*Configuracion*.tsx,*Configuration*.tsx |
  Select-Object FullName
```

Si el componente de `/perfil` ya no tiene uso, eliminarlo del proyecto.

Antes de borrar, confirmar que no se usa en otro lado:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "PerfilPage|ProfilePage|PerfilConfiguracion|ProfileConfig|ConfiguracionPage" -Context 4,4
```

Si no hay referencias, borrar archivo.

No borrar componentes usados por `Mi empresa`.

---

# 7. Limpiar imports muertos

Después de eliminar menú/ruta/página, revisar:

```text
useNavigate
Link
NavLink
User
Settings
Cog
Profile
PerfilPage
ProfilePage
ConfiguracionPage
```

Eliminar imports que queden sin uso.

No eliminar `useNavigate` si se sigue usando para logout u otros botones.

---

# 8. Auditar backend solo si hay endpoints exclusivos

Buscar en backend:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaSpringBootJPA"

Get-ChildItem .\src\main\java -Recurse -Include *.java |
  Select-String -Pattern "perfil|profile|configuracion|configuration|/perfil|/profile" -Context 5,5
```

Regla:

```text
Si el endpoint también lo usa Mi empresa, NO tocar.
Si era exclusivo de la página /perfil eliminada y no se usa, solo reportarlo.
No borrar backend en este plan salvo confirmación clara de que está muerto.
```

La prioridad es cerrar frontend.

---

# 9. Validación empresa

Entrar como empresa/restaurante.

Rutas a probar:

```text
/empresa/resumen
/empresa/solicitar-recojo
/empresa/mis-solicitudes
/empresa/seguimiento
/empresa/mi-empresa
```

Abrir menú superior derecho.

Debe verse:

```text
Mi cuenta
Cerrar sesión
```

No debe verse:

```text
Perfil
Configuración
```

Click en `Cerrar sesión` debe seguir funcionando.

Intentar entrar manualmente a:

```text
/perfil
```

Debe redirigir de forma segura o no mostrar la pantalla antigua.

---

# 10. Validación recolector

Entrar como recolector.

Rutas a probar:

```text
/recolector/resumen
/recolector/mapa-operativo
/recolector/recojos-dia
/recolector/historial-recojos
/recolector/unidades
/recolector/mi-empresa
```

Abrir menú superior derecho.

Debe verse:

```text
Mi cuenta
Cerrar sesión
```

No debe verse:

```text
Perfil
Configuración
```

Click en `Cerrar sesión` debe seguir funcionando.

Intentar entrar manualmente a:

```text
/perfil
```

Debe redirigir de forma segura o no mostrar la pantalla antigua.

---

# 11. Validación administrador

Si existe panel admin, repetir validación:

```text
No Perfil
No Configuración
Sí Cerrar sesión
```

No romper navegación admin.

---

# 12. Validar que Mi empresa sigue funcionando

Muy importante: el módulo real que reemplaza ese perfil redundante debe seguir funcionando.

Validar:

```text
/empresa/mi-empresa
/recolector/mi-empresa
```

Debe seguir mostrando:

```text
Datos de empresa
Datos de contacto
Ubicaciones, si aplica
Suscripción y facturación
```

---

# 13. Limpieza de residuos

Buscar al final:

```powershell
Get-ChildItem .\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "Perfil y configuración|Datos de empresa recolectora|Los cambios están diferidos|/perfil|Configuración|Mi cuenta" -Context 4,4
```

Resultado esperado:

```text
No debe quedar Perfil y configuración.
No debe quedar Datos de empresa recolectora de la página /perfil.
No debe quedar navegación a /perfil.
Configuración no debe aparecer en dropdown interno.
Mi cuenta puede quedar solo como título del menú.
```

---

# 14. Build

Ejecutar:

```powershell
cd "C:\Users\oscar\Downloads\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\ECOTACNA\EcoTacnaFrontend"
npm run build
```

Backend no aplica salvo que se haya tocado algo, lo cual no debería pasar.

---

# Reporte final obligatorio

```text
CIERRE ELIMINACION PERFIL CONFIGURACION MENU USUARIO

1. Ruta frontend actual:
2. Archivos frontend modificados:
3. Archivo/componente del dropdown:
4. ¿Se eliminó item Perfil? Sí/No
5. ¿Se eliminó item Configuración? Sí/No
6. ¿Cerrar sesión sigue visible? Sí/No
7. ¿Cerrar sesión sigue funcionando? Sí/No
8. ¿Se eliminó navegación a /perfil? Sí/No
9. ¿La ruta /perfil fue eliminada o redirigida? Indicar:
10. ¿Se eliminó página/componente redundante de Perfil y configuración? Sí/No
11. ¿Mi empresa de empresa sigue funcionando? Sí/No
12. ¿Mi empresa de recolector sigue funcionando? Sí/No
13. ¿Empresa validada? Sí/No
14. ¿Recolector validado? Sí/No
15. ¿Admin validado? Sí/No/No aplica
16. ¿Se tocó backend? Sí/No
17. ¿Se tocó BD? No
18. ¿npm run build pasa? Sí/No
19. Observaciones:
```

No cerrar hasta confirmar que el dropdown ya no muestra Perfil ni Configuración y que `/perfil` ya no muestra la pantalla antigua.
