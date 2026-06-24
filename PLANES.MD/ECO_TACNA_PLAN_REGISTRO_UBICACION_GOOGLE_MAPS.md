# ECO TACNA — PLAN DE EJECUCIÓN PARA UBICACIÓN MANUAL EN GOOGLE MAPS DURANTE REGISTRO

## 0. Imagen de referencia

Este plan debe implementarse tomando como referencia visual la imagen entregada por el usuario:

**Imagen:** Interfaz propuesta de registro EcoTacna con panel lateral derecho “Ubicación del restaurante”.

La interfaz de referencia muestra el formulario actual de registro de empresa conservando su estructura principal, pero agrega un bloque moderno de Google Maps al lado derecho del formulario. El objetivo es permitir que el usuario confirme manualmente la ubicación exacta del restaurante, usando la dirección fiscal obtenida desde ApiPeruDev/SUNAT como referencia inicial.

---

## 1. Objetivo funcional

Implementar en el registro de empresa una sección de ubicación con Google Maps que permita:

1. Mostrar la dirección fiscal obtenida por RUC.
2. Mostrar un mapa interactivo.
3. Permitir que el usuario marque manualmente la ubicación exacta de su restaurante.
4. Guardar latitud y longitud de la sede principal.
5. Permitir agregar una o más sedes adicionales si la empresa tiene más locales.
6. No modificar ni aumentar datos empresariales fuera de la ubicación.
7. Mantener el diseño fresco, moderno, limpio y alineado a la filosofía visual verde/blanca de EcoTacna.

---

## 2. Regla principal de diseño

La implementación debe respetar la imagen de referencia:

- Mantener el formulario actual de registro.
- No agregar nuevos campos de negocio innecesarios.
- No cambiar el flujo de pasos del registro.
- Integrar el mapa como una sección visual complementaria.
- Usar un card derecho o bloque lateral llamado “Ubicación del restaurante”.
- Mantener colores verdes, fondos blancos, bordes suaves, cards redondeadas y sombras ligeras.
- Incluir solo dos controles nuevos visibles:
  - **Guardar ubicación en el mapa**
  - **Agregar otra sede**

---

## 3. Flujo esperado para el usuario

1. El usuario ingresa RUC.
2. El sistema consulta ApiPeruDev y autocompleta:
   - razón social;
   - dirección fiscal;
   - distrito;
   - provincia;
   - departamento;
   - estado;
   - condición.
3. El bloque “Ubicación del restaurante” muestra la dirección fiscal como referencia.
4. El mapa centra inicialmente en Tacna o en coordenadas inferidas si ya existen.
5. El usuario hace clic en el mapa para marcar la ubicación exacta.
6. El sistema coloca un pin.
7. El usuario presiona **Guardar ubicación en el mapa**.
8. El sistema guarda temporalmente la sede principal en el estado del formulario.
9. Si la empresa tiene más locales, el usuario presiona **Agregar otra sede**.
10. El sistema permite marcar otro punto en el mapa y registrarlo como sede adicional.
11. Al presionar **Siguiente**, el backend recibe los datos de la empresa junto con las coordenadas de sede principal y sedes adicionales.

---

## 4. Lo que NO se debe hacer

No implementar todavía:

- geocoding automático;
- Places Autocomplete;
- Directions API;
- Distance Matrix;
- rutas;
- tiempo estimado;
- recolector más cercano;
- tracking GPS;
- asignación automática por distancia;
- cambios en Culqi;
- cambios en ApiPeruDev;
- cambios en precios;
- cambios en recolector;
- cambios en pagos;
- cambios en seguridad;
- cambios en login;
- cambios en constancia PDF.

---

## 5. Diagnóstico obligatorio antes de modificar

Antes de tocar código, Antigravity debe revisar y responder:

1. Qué archivo renderiza el registro de empresa.
2. Si el registro usa `RegisterCompanyPage.tsx` u otro componente.
3. Qué DTO recibe actualmente el backend para registrar empresa.
4. Qué entidad representa a la empresa.
5. Si `Company` ya tiene `latitude` y `longitude`.
6. Si ya existe script SQL de coordenadas.
7. Si la base real ya tiene columnas de coordenadas en `companies`.
8. Si existe tabla o entidad para sedes adicionales.
9. Si no existe entidad de sedes adicionales, proponer una implementación mínima.
10. Si GoogleMapView ya existe y se puede reutilizar.
11. Si el componente actual de mapa permite selección manual.
12. Qué archivos exactos se van a tocar.
13. Qué archivos no se tocarán.

No modificar código hasta entregar este diagnóstico.

---

## 6. Frontend — archivos probables

Revisar principalmente:

```text
EcoTacnaFrontend/src/pages/RegisterCompanyPage.tsx
EcoTacnaFrontend/src/components/maps/GoogleMapView.tsx
EcoTacnaFrontend/src/components/maps/MapFallback.tsx
EcoTacnaFrontend/src/components/maps/mapTypes.ts
EcoTacnaFrontend/src/services/authApi.ts
EcoTacnaFrontend/src/services/empresaApi.ts
EcoTacnaFrontend/src/types.ts
```

Si el registro está separado en componentes internos, revisar también esos componentes.

---

## 7. Frontend — implementación esperada

### 7.1 Bloque visual

Agregar un bloque o card con el título:

```text
Ubicación del restaurante
```

Debe incluir:

- texto breve: “Confirma la ubicación exacta de tu restaurante en el mapa.”
- dirección según RUC/SUNAT en una caja de solo lectura;
- mapa interactivo;
- pin seleccionable;
- botón principal: **Guardar ubicación en el mapa**;
- botón secundario: **Agregar otra sede**.

### 7.2 Dirección de referencia

Usar la dirección fiscal ya autocompletada como referencia visual:

```text
Dirección según SUNAT
[Dirección fiscal autocompletada]
```

No debe editarse desde este bloque. Solo debe ayudar al usuario a ubicar su local.

### 7.3 Selección de sede principal

Crear estado local similar a:

```text
mainLocation = {
  latitude,
  longitude,
  referenceAddress
}
```

Reglas:

- La sede principal es obligatoria.
- El usuario debe poder mover o cambiar el pin.
- El botón **Guardar ubicación en el mapa** guarda la ubicación seleccionada.
- Si no hay ubicación seleccionada, no permitir continuar.

Mensaje recomendado:

```text
Selecciona y guarda la ubicación principal del restaurante en el mapa.
```

### 7.4 Sedes adicionales

El botón **Agregar otra sede** debe permitir registrar ubicaciones adicionales.

Sugerencia visual mínima:

- abrir un modal o panel pequeño;
- permitir marcar otro punto en el mapa;
- pedir únicamente un nombre simple de sede si es necesario, por ejemplo “Sede 2”;
- no pedir datos comerciales adicionales.

Si el usuario pidió “sin aumentar datos”, entonces por defecto se puede nombrar automáticamente:

```text
Sede adicional 1
Sede adicional 2
```

y evitar pedir más campos.

### 7.5 Lista de sedes

Mostrar una lista compacta solo si existen sedes adicionales:

```text
Sede principal — Guardada
Sede adicional 1 — Guardada
Sede adicional 2 — Guardada
```

Cada sede adicional puede tener botones mínimos:

- editar ubicación;
- eliminar.

No exagerar diseño ni crear pantallas nuevas.

---

## 8. Backend — archivos probables

Revisar:

```text
EcoTacnaSpringBootJPA/src/main/java/.../entity/Company.java
EcoTacnaSpringBootJPA/src/main/java/.../controller/AuthController.java
EcoTacnaSpringBootJPA/src/main/java/.../service/AuthService.java
EcoTacnaSpringBootJPA/src/main/java/.../dto/RegisterCompanyRequest.java
EcoTacnaSpringBootJPA/src/main/java/.../dto/RegisterCompanyResponse.java
EcoTacnaSpringBootJPA/src/main/java/.../repository/CompanyRepository.java
```

Si se agregan sedes adicionales:

```text
CompanyBranch.java
CompanyBranchRepository.java
CompanyBranchDto.java
```

Solo crearlos si no existe una entidad equivalente.

---

## 9. Backend — sede principal

Si `Company` ya tiene:

```text
latitude
longitude
```

usar esos campos para la sede principal.

El request de registro debe recibir:

```json
{
  "latitude": -18.0123456,
  "longitude": -70.1234567
}
```

o nombres equivalentes:

```json
{
  "companyLatitude": -18.0123456,
  "companyLongitude": -70.1234567
}
```

Elegir una convención y mantenerla consistente.

### Validaciones backend

Validar:

- latitud no nula;
- longitud no nula;
- latitud entre -90 y 90;
- longitud entre -180 y 180;
- latitud y longitud vienen juntas;
- sede principal obligatoria.

Mensajes recomendados:

```text
La ubicación principal de la empresa es obligatoria.
Las coordenadas de la empresa no son válidas.
```

---

## 10. Backend — sedes adicionales

Si se permite más de una sede, implementar una tabla nueva solo si no existe una estructura equivalente.

Nombre sugerido:

```text
company_branches
```

Campos sugeridos:

```text
id
company_id
name
latitude
longitude
reference_address
active
created_at
updated_at
```

Entidad sugerida:

```text
CompanyBranch
```

Relación:

```text
Company 1 —— N CompanyBranch
```

### Regla

Las sedes adicionales son opcionales.

El registro debe funcionar si:

- solo hay sede principal;
- hay sede principal + una o más sedes adicionales.

### Validaciones

- No aceptar sedes sin latitud/longitud.
- No aceptar coordenadas fuera de rango.
- No aceptar duplicados exactos de latitud/longitud.
- No aceptar más de una sede con el mismo nombre si se maneja nombre.
- Si no se usa nombre manual, generar “Sede adicional 1”, “Sede adicional 2”, etc.

---

## 11. Base de datos

Primero verificar si ya existe el script:

```text
20260616_add_location_coordinates.sql
```

Si ya agrega:

```text
companies.latitude
companies.longitude
```

no crear otra migración para sede principal.

Para sedes adicionales, si no existe tabla, crear script manual o migración controlada según el estándar del proyecto.

Script conceptual:

```sql
CREATE TABLE company_branches (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    reference_address VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_company_branch_company
        FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

Ajustar tipos según la base real usada por el proyecto.

No ejecutar migraciones sin confirmar ambiente.

---

## 12. API esperada

### Registro de empresa

El endpoint actual de registro debe aceptar ubicación.

Ejemplo de payload extendido:

```json
{
  "ruc": "20532631433",
  "email": "contacto@empresa.com",
  "phone": "+51...",
  "contactPerson": "Carlos Mamani",
  "password": "...",
  "companyType": "GENERADORA",
  "latitude": -18.0123456,
  "longitude": -70.1234567,
  "branches": [
    {
      "name": "Sede adicional 1",
      "latitude": -18.0123000,
      "longitude": -70.1234000,
      "referenceAddress": "Referencia opcional"
    }
  ]
}
```

No agregar campos de negocio nuevos que no estén justificados.

---

## 13. Integración con flujo actual de registro

La ubicación debe validarse antes de pasar al siguiente paso.

Regla:

```text
No se puede presionar “Siguiente” si no se guardó la ubicación principal en el mapa.
```

Mensaje:

```text
Guarda la ubicación principal del restaurante antes de continuar.
```

El captcha/control de seguridad debe mantenerse igual.

No mover ni eliminar el captcha salvo que ya esté temporalmente deshabilitado por pruebas y el proyecto lo tenga así.

---

## 14. Diseño según imagen

Implementar visualmente como en la imagen:

- card derecho;
- título “Ubicación del restaurante”;
- caja de dirección según SUNAT;
- mapa con pin;
- nota inferior;
- botón verde grande **Guardar ubicación en el mapa**;
- botón secundario outline **Agregar otra sede**.

No hacer diseño oscuro.

No cambiar color principal.

No saturar la pantalla.

No agregar tabla grande de sedes.

No agregar campos innecesarios.

---

## 15. Validaciones funcionales

### Frontend

- No permitir continuar sin sede principal.
- No permitir guardar ubicación sin seleccionar pin.
- No permitir sede adicional sin coordenadas.
- No permitir coordenadas inválidas.
- Mostrar feedback visual cuando la ubicación está guardada.
- Permitir actualizar el pin antes de guardar.
- Permitir limpiar selección si se equivoca.

### Backend

- Rechazar registro sin sede principal.
- Rechazar coordenadas inválidas.
- Guardar sede principal en `Company`.
- Guardar sedes adicionales en tabla relacionada si existen.
- No romper registros sin sedes adicionales.
- No exponer API key de Google Maps en backend.

---

## 16. Pruebas obligatorias

### Prueba 1 — Registro con sede principal

1. Buscar RUC.
2. Autocompletar datos.
3. Marcar ubicación en mapa.
4. Guardar ubicación.
5. Completar datos auxiliares.
6. Continuar registro.

Resultado esperado:

```text
La empresa se registra con latitude y longitude.
```

### Prueba 2 — Registro sin ubicación

1. Buscar RUC.
2. Completar datos.
3. No marcar mapa.
4. Presionar Siguiente.

Resultado esperado:

```text
Bloquea avance y pide guardar ubicación principal.
```

### Prueba 3 — Agregar otra sede

1. Guardar sede principal.
2. Presionar Agregar otra sede.
3. Marcar otra ubicación.
4. Guardar.

Resultado esperado:

```text
Se agrega sede adicional sin alterar la sede principal.
```

### Prueba 4 — Coordenadas inválidas por API

Enviar request con:

```text
latitude = 999
longitude = 999
```

Resultado esperado:

```text
Backend rechaza.
```

### Prueba 5 — Login posterior

Después del registro:

```text
La empresa puede iniciar sesión normalmente.
```

### Prueba 6 — No romper flujo actual

Confirmar que siguen funcionando:

- consulta RUC;
- autocompletado;
- selección de tipo de empresa;
- captcha;
- plan/pago;
- confirmación;
- login posterior.

---

## 17. Restricciones estrictas

No tocar:

```text
Culqi
pagos de suscripción
precio del aceite
flujo recolector
rechazo/cancelación
solicitud única activa
seguimiento operativo
constancia PDF
login
roles
seguridad
ApiPeruDev
token de ApiPeruDev
backend .env
frontend .env.local salvo Google Maps si ya está definido
```

No cambiar proveedor de RUC.

No hacer mock de ubicación.

No inventar coordenadas.

No hacer refactor general.

---

## 18. Entregable esperado de Antigravity

Al terminar debe entregar:

1. Archivos modificados.
2. Confirmación de que siguió la imagen de referencia.
3. Confirmación de que no agregó campos de negocio innecesarios.
4. Cómo se guarda la sede principal.
5. Cómo se guardan sedes adicionales.
6. Qué validaciones frontend agregó.
7. Qué validaciones backend agregó.
8. Si creó tabla nueva, explicar por qué.
9. Resultado de compilación frontend.
10. Resultado de compilación backend.
11. Confirmación de que no tocó Culqi, pagos, precios, recolector, seguridad ni ApiPeruDev.

---

## 19. Prompt corto para Antigravity

```text
Lee primero los .md existentes del proyecto sobre arquitectura, reglas de programación y restricciones.

Voy a adjuntar una imagen de referencia. Implementa el registro de ubicación manual en Google Maps siguiendo esa imagen.

Objetivo:
Durante el registro de empresa, además de usar la dirección fiscal autocompletada por RUC, el usuario debe poder marcar manualmente la ubicación exacta del restaurante en Google Maps.

Debe agregarse un bloque visual tipo card llamado “Ubicación del restaurante”, como en la imagen:
- dirección según SUNAT;
- mapa interactivo;
- pin seleccionable;
- botón “Guardar ubicación en el mapa”;
- botón “Agregar otra sede”.

No agregues datos de negocio innecesarios.
No cambies el flujo general del registro.
No modifiques Culqi, pagos, precios, recolector, rechazo/cancelación, login, roles, seguridad ni ApiPeruDev.
No implementes todavía rutas, geocoding, Distance Matrix, tracking ni recolector cercano.

Backend:
Guardar latitud y longitud de la sede principal en Company.
Si se agregan sedes adicionales, crear estructura mínima para guardarlas relacionadas a la empresa.
Validar coordenadas en backend.

Frontend:
Reutilizar GoogleMapView.
Permitir seleccionar pin.
Guardar ubicación principal.
Permitir sedes adicionales opcionales.
Bloquear avance si no se guardó ubicación principal.

Primero diagnostica sin modificar.
Luego aplica cambios mínimos.
Respeta la imagen de referencia.
```
