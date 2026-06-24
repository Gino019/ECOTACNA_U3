# Plan de ejecucion exacto - Punto 3
## Integracion visual controlada de Google Maps en EcoTacna

**Proyecto:** EcoTacna  
**Etapa:** Punto 3 - Mapa real en frontend  
**Objetivo tecnico:** reemplazar el mapa simulado por Google Maps real usando marcadores, sin implementar todavia geocodificacion, rutas avanzadas ni tracking GPS real.  
**Estado previo obligatorio:** Punto 1 y Punto 2 cerrados.

---

## 1. Contexto confirmado

### Punto 1 cerrado
El repositorio ya fue limpiado antes de trabajar con Google Maps:

- Se eliminaron archivos `.env` reales.
- Se eliminaron secretos y credenciales hardcodeadas.
- Se eliminaron scripts temporales.
- Se eliminaron documentos internos duplicados.
- Se eliminaron PDFs/XLSX de prueba.
- Se eliminaron `node_modules`, `dist` y `target`.
- Se generaron `.env.example` para frontend y backend.
- Se reforzaron `.gitignore` raiz, frontend y backend.
- Backend compila correctamente.
- Frontend pasa lint, TypeScript y build.

### Punto 2 cerrado
El proyecto ya esta preparado para guardar coordenadas:

- `Company` tiene `latitude` y `longitude` opcionales.
- `PickupRequest` tiene `pickupLatitude` y `pickupLongitude` opcionales.
- `TransportUnit` tiene `lastLatitude` y `lastLongitude` opcionales.
- `PickupRequestService.create(...)` valida rangos y pares latitud/longitud.
- Los DTOs principales ya aceptan/devuelven coordenadas.
- `EmpresaSolicitarRecojo.tsx` envia `pickupLatitude: null` y `pickupLongitude: null` mientras no exista seleccion de mapa.
- `EmpresaSeguimiento.tsx` quedo preparado para recibir coordenadas futuras.

---

## 2. Objetivo del Punto 3

Integrar Google Maps visualmente en el frontend para que EcoTacna pueda mostrar un mapa real con marcadores.

Esta etapa debe lograr:

1. Cargar Google Maps en React/Vite.
2. Leer la API key desde variable de entorno.
3. Mostrar un mapa centrado por defecto en Tacna.
4. Mostrar marcadores solo cuando existan coordenadas validas.
5. Soportar fallback cuando no haya API key.
6. Soportar fallback cuando no haya coordenadas.
7. Reemplazar progresivamente `MapMock.tsx` en pantallas principales.
8. Mantener el sistema funcionando con datos antiguos sin coordenadas.

---

## 3. Alcance permitido

En este punto SI se permite:

- Instalar una libreria React para Google Maps.
- Crear componentes de mapa reales en frontend.
- Crear tipos TypeScript para marcadores.
- Usar coordenadas ya existentes en las respuestas del backend.
- Mostrar mapa real con marcadores.
- Mostrar mensajes de ubicacion referencial cuando falten coordenadas.
- Mantener `MapMock.tsx` solo si todavia hay pantallas que lo usan.
- Eliminar `MapMock.tsx` si deja de estar referenciado.
- Agregar placeholder de variable de entorno en `.env.example`.

---

## 4. Fuera de alcance estricto

En este punto NO se debe hacer:

- No implementar Geocoding API.
- No implementar Routes API.
- No implementar Navigation SDK.
- No implementar Places API.
- No implementar Autocomplete de direcciones.
- No implementar tracking GPS real.
- No actualizar ubicacion del recolector en tiempo real.
- No crear endpoints nuevos de tracking.
- No tocar pagos simulados.
- No tocar ApiPeruDev.
- No tocar captcha.
- No tocar login/autenticacion.
- No tocar `SecurityConfig`.
- No tocar suscripciones.
- No tocar documentacion academica.
- No hardcodear API keys.
- No subir `.env` reales.
- No crear carpetas `backup`, `old`, `legacy`, `v1`, `v2` ni copias duplicadas.

---

## 5. Decision tecnica recomendada

### Libreria recomendada
Usar:

```bash
npm install @vis.gl/react-google-maps
```

Motivo:

- Es una libreria React moderna para Maps JavaScript API.
- Tiene componentes declarativos como `APIProvider`, `Map` y `AdvancedMarker`.
- Encaja bien con React/Vite.
- Evita manipular directamente el script global de Google Maps.

---

## 6. Configuracion de Google Cloud requerida

Antes de probar el mapa real, se debe crear una API key en Google Cloud.

### API minima para este punto
Habilitar solamente:

- **Maps JavaScript API**

No habilitar todavia:

- Geocoding API
- Routes API
- Places API
- Directions API
- Navigation SDK

### Restricciones recomendadas de API key
La key de frontend debe tener:

#### Restriccion de aplicacion
Tipo:

```txt
HTTP referrers / sitios web
```

Para desarrollo local agregar:

```txt
http://localhost:5173/*
http://127.0.0.1:5173/*
```

Si el frontend usa otro puerto, agregar tambien ese puerto.

Para produccion agregar solo el dominio real cuando exista.

#### Restriccion de API
Permitir solo:

```txt
Maps JavaScript API
```

#### Cuotas
Configurar una cuota diaria baja para evitar consumo accidental.

Ejemplo academico sugerido:

```txt
50 a 200 cargas de mapa por dia
```

---

## 7. Variables de entorno

### Archivo frontend `.env.example`
Agregar o confirmar:

```env
VITE_GOOGLE_MAPS_API_KEY=
```

### Archivo frontend `.env.local`
Crear localmente, no versionar:

```env
VITE_GOOGLE_MAPS_API_KEY=TU_API_KEY_REAL_AQUI
```

Regla:

- `.env.local` no debe subirse al repositorio.
- La key nunca debe ir dentro de componentes React.
- La key nunca debe ir dentro de `src/types.ts`.
- La key nunca debe ir dentro de `application.properties`.

---

## 8. Estructura propuesta de archivos

Crear esta estructura:

```txt
EcoTacnaFrontend/
  src/
    components/
      maps/
        GoogleMapView.tsx
        MapFallback.tsx
        mapTypes.ts
        mapConstants.ts
```

Si el proyecto prefiere menos archivos, minimo crear:

```txt
src/components/maps/GoogleMapView.tsx
src/components/maps/mapTypes.ts
```

---

## 9. Tipos TypeScript propuestos

Archivo:

```txt
src/components/maps/mapTypes.ts
```

Contenido sugerido:

```ts
export type EcoMapMarkerType =
  | 'pickup'
  | 'company'
  | 'collector'
  | 'transport'
  | 'reference';

export interface EcoMapMarker {
  id: string;
  label: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  type: EcoMapMarkerType;
  description?: string;
}

export interface GoogleMapViewProps {
  title?: string;
  subtitle?: string;
  markers: EcoMapMarker[];
  height?: string | number;
  showMissingCoordinatesWarning?: boolean;
  fallbackCenter?: {
    latitude: number;
    longitude: number;
  };
}
```

---

## 10. Constantes de mapa

Archivo:

```txt
src/components/maps/mapConstants.ts
```

Contenido sugerido:

```ts
export const TACNA_DEFAULT_CENTER = {
  latitude: -18.0146,
  longitude: -70.2536,
};

export const DEFAULT_MAP_ZOOM = 13;
```

Uso:

- Centro referencial de Tacna.
- Solo debe usarse como fallback visual.
- No debe presentarse como ubicacion real de una empresa.

---

## 11. Componente `MapFallback.tsx`

Crear un fallback visual cuando falte la API key o no haya coordenadas utiles.

Debe cubrir estos casos:

1. No existe `VITE_GOOGLE_MAPS_API_KEY`.
2. La lista de marcadores esta vacia.
3. Todos los marcadores vienen con coordenadas null.
4. Existe error de carga del mapa.

Mensaje sugerido cuando falta API key:

```txt
Mapa no disponible. Configure VITE_GOOGLE_MAPS_API_KEY en el entorno local para habilitar Google Maps.
```

Mensaje sugerido cuando faltan coordenadas:

```txt
La solicitud aun no tiene coordenadas registradas. Se muestra informacion textual de ubicacion.
```

---

## 12. Componente `GoogleMapView.tsx`

Archivo:

```txt
src/components/maps/GoogleMapView.tsx
```

Responsabilidades:

1. Leer `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.
2. Validar si existe API key.
3. Filtrar marcadores invalidos.
4. Renderizar el mapa con `APIProvider`.
5. Renderizar `Map` centrado en:
   - Primer marcador valido, o
   - Centro referencial de Tacna.
6. Renderizar `AdvancedMarker` o `Marker` por cada marcador valido.
7. No romper si las coordenadas son null.
8. No mostrar promesas de GPS real.

Validacion de coordenadas:

```ts
const isValidCoordinate = (latitude?: number | null, longitude?: number | null) => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};
```

---

## 13. Pantallas a migrar

### 13.1 `EmpresaSeguimiento.tsx`

Objetivo:
Mostrar mapa real del seguimiento cuando existan coordenadas.

Marcadores esperados:

```txt
Punto de recojo: tracking.pickupLatitude / tracking.pickupLongitude
Recolector: tracking.collectorLatitude / tracking.collectorLongitude, solo si existe
Empresa: tracking.companyLatitude / tracking.companyLongitude, solo si existe
```

Reglas:

- Si no hay coordenadas, mostrar fallback textual.
- No mostrar el texto "GPS en vivo" si no hay tracking real.
- Cambiar textos a:

```txt
Mapa de seguimiento referencial
Ubicacion de recojo registrada
Ubicacion del recolector no disponible aun
```

### 13.2 `RecolectorMapaOperativo.tsx`

Objetivo:
Mostrar mapa operativo con solicitudes o recojos disponibles que tengan coordenadas.

Marcadores esperados:

```txt
Solicitudes de recojo con pickupLatitude / pickupLongitude
Recojo activo, si existe
Ubicacion de unidad, solo si existe lastLatitude / lastLongitude
```

Reglas:

- Si las solicitudes no tienen coordenadas, mostrar lista textual normal.
- No inventar marcadores fijos.
- No convertir direcciones a coordenadas todavia.
- No dibujar rutas.

### 13.3 `EmpresaSolicitarRecojo.tsx`

Objetivo en Punto 3:
Solo mostrar mapa referencial o dejarlo preparado.

Permitido:

- Mostrar un mapa centrado en Tacna como referencia.
- Mostrar mensaje de que la seleccion exacta del punto se habilitara en la siguiente etapa.

No permitido:

- Seleccionar punto con click.
- Geocodificar direccion.
- Guardar coordenadas reales desde el mapa.

Esto queda para el Punto 4.

---

## 14. Manejo de textos para evitar promesas falsas

Buscar y revisar textos como:

```txt
GPS en vivo
Tiempo real
Seguimiento en tiempo real
Ruta en vivo
Ubicacion exacta
Recolector en vivo
```

Reemplazar cuando corresponda por:

```txt
Mapa referencial
Seguimiento visual
Ubicacion registrada
Mapa operativo
Ubicacion del recojo
Ubicacion del recolector no disponible
```

Regla:

- Solo usar "tiempo real" si existe actualizacion periodica real desde backend o WebSocket/polling.
- En Punto 3 no existe eso, por lo tanto no debe decir "tiempo real".

---

## 15. Eliminacion de `MapMock.tsx`

Al final de la migracion revisar:

```bash
grep -R "MapMock" src
```

Si no hay referencias:

- Eliminar `src/components/MapMock.tsx`.

Si aun hay referencias:

- Mantenerlo temporalmente.
- No crear una copia.
- No renombrarlo como backup.

Regla del usuario:

```txt
No mantener versiones ni codigo muerto.
```

---

## 16. Comandos de ejecucion

Desde el frontend:

```bash
cd EcoTacnaFrontend
npm install @vis.gl/react-google-maps
npm run lint
npx tsc --noEmit
npm run build
```

Si se toco backend por alguna razon:

```bash
cd EcoTacnaSpringBootJPA
./mvnw clean compile
```

En Windows:

```bat
cd EcoTacnaSpringBootJPA
mvnw.cmd clean compile
```

---

## 17. Validaciones manuales en navegador

Probar con API key configurada:

1. Iniciar frontend.
2. Entrar como empresa generadora.
3. Ir a seguimiento.
4. Confirmar que el mapa carga.
5. Confirmar que si no hay coordenadas se ve fallback correcto.
6. Entrar como recolector.
7. Ir a mapa operativo.
8. Confirmar que no se rompe aunque las solicitudes no tengan coordenadas.
9. Confirmar que no aparece texto de "GPS en vivo" si no hay tracking real.

Probar sin API key:

1. Quitar `VITE_GOOGLE_MAPS_API_KEY` de `.env.local`.
2. Reiniciar Vite.
3. Entrar a pantallas de mapa.
4. Confirmar que aparece fallback claro y no pantalla rota.

---

## 18. Criterios de aceptacion

El Punto 3 se considera terminado solo si se cumple todo esto:

- Existe componente real de Google Maps.
- La API key se lee desde `VITE_GOOGLE_MAPS_API_KEY`.
- `.env.example` tiene placeholder, no key real.
- Se instalo `@vis.gl/react-google-maps`.
- `EmpresaSeguimiento.tsx` usa el nuevo componente o queda migrado parcialmente sin romper flujo.
- `RecolectorMapaOperativo.tsx` usa el nuevo componente o queda migrado parcialmente sin romper flujo.
- El sistema funciona aunque no haya coordenadas.
- El sistema funciona aunque no haya API key.
- No se implemento Geocoding API.
- No se implemento Routes API.
- No se implemento Navigation SDK.
- No se implemento tracking GPS real.
- No se modificaron pagos, login, captcha, ApiPeruDev, SecurityConfig ni suscripciones.
- `npm run lint` no tiene errores criticos.
- `npx tsc --noEmit` pasa.
- `npm run build` pasa.

---

## 19. Reporte final esperado de Antigravity

Al terminar, reportar obligatoriamente:

```txt
Punto 3 finalizado.

1. Dependencia instalada:
   - @vis.gl/react-google-maps

2. Archivos creados:
   - ...

3. Archivos modificados:
   - ...

4. Pantallas migradas:
   - EmpresaSeguimiento.tsx
   - RecolectorMapaOperativo.tsx
   - ...

5. Comportamiento sin API key:
   - ...

6. Comportamiento sin coordenadas:
   - ...

7. Validacion:
   - npm run lint: ...
   - npx tsc --noEmit: ...
   - npm run build: ...
   - backend compile, si aplica: ...

8. Confirmacion de alcance:
   - No se integro Geocoding API.
   - No se integro Routes API.
   - No se integro Navigation SDK.
   - No se implemento tracking GPS real.
   - No se agregaron API keys reales al repositorio.
```

---

# Instruccion de ejecucion para Antigravity

Ejecuta el Punto 3 de EcoTacna: Integracion visual controlada de Google Maps en frontend.

Contexto:
El Punto 1 ya limpio el repositorio de secretos, `.env` reales, documentos internos, archivos temporales y artefactos generados. El Punto 2 ya preparo el modelo de datos con coordenadas opcionales en backend y frontend. Ahora corresponde integrar Google Maps solo como visualizacion de mapa real con marcadores.

Objetivo:
Crear una integracion frontend con Google Maps usando `@vis.gl/react-google-maps`, con API key leida desde `VITE_GOOGLE_MAPS_API_KEY`, mapa centrado en Tacna, marcadores basados en coordenadas existentes y fallback si faltan coordenadas o API key.

Reglas estrictas:
- No implementar Geocoding API.
- No implementar Routes API.
- No implementar Navigation SDK.
- No implementar Places API.
- No implementar Autocomplete.
- No implementar tracking GPS real.
- No tocar pagos simulados.
- No tocar ApiPeruDev.
- No tocar captcha.
- No tocar login/autenticacion.
- No tocar SecurityConfig.
- No tocar suscripciones.
- No hardcodear API keys.
- No subir `.env` reales.
- No crear backups, copias, carpetas old, legacy, v1 o v2.
- No mantener codigo muerto si deja de usarse.

Tareas:
1. Instalar `@vis.gl/react-google-maps` en el frontend.
2. Agregar `VITE_GOOGLE_MAPS_API_KEY=` al `.env.example` del frontend.
3. Crear `src/components/maps/mapTypes.ts`.
4. Crear `src/components/maps/mapConstants.ts`.
5. Crear `src/components/maps/MapFallback.tsx`.
6. Crear `src/components/maps/GoogleMapView.tsx`.
7. Migrar `EmpresaSeguimiento.tsx` para usar el nuevo mapa real cuando existan coordenadas.
8. Migrar `RecolectorMapaOperativo.tsx` para usar el nuevo mapa real cuando existan coordenadas.
9. Evaluar `EmpresaSolicitarRecojo.tsx` solo como mapa referencial, sin seleccion interactiva todavia.
10. Revisar y reemplazar textos falsos de GPS en vivo o tiempo real si no existe tracking real.
11. Revisar si `MapMock.tsx` sigue siendo usado. Si ya no se usa, eliminarlo.
12. Ejecutar validaciones.

Validacion obligatoria:

Frontend:
```bash
npm run lint
npx tsc --noEmit
npm run build
```

Backend:
Solo si se toca backend:
```bash
mvnw.cmd clean compile
```

Entrega:
Reporta dependencia instalada, archivos creados, archivos modificados, pantallas migradas, comportamiento sin API key, comportamiento sin coordenadas, resultados de validacion y confirmacion explicita de que no se implemento geocoding, rutas, navigation ni tracking real.
