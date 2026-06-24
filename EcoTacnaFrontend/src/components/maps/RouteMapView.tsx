import React, { useState, useEffect } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { DEFAULT_MAP_ZOOM } from './mapConstants';
import { MapFallback } from './MapFallback';

type RouteMapViewProps = {
  destinationLat: number;
  destinationLng: number;
  destinationAddress?: string;
  restaurantName?: string;
  height?: string | number;
};

// Componente interno seguro para invocar a directions
function RouteLogic({
  destinationLat,
  destinationLng,
  collectorPosition,
  setRouteInfo,
  setRouteError
}: {
  destinationLat: number;
  destinationLng: number;
  collectorPosition: { latitude: number; longitude: number } | null;
  setRouteInfo: (info: { distance: string; duration: string } | null) => void;
  setRouteError: (error: string | null) => void;
}) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  const coreLib = useMapsLibrary('core');

  // Inicializar Service y Renderer solo si la librería de google maps está cargada
  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#16A34A', // Verde oficial EcoTacna
        strokeOpacity: 0.9,
        strokeWeight: 6
      }
    }));
  }, [routesLibrary, map]);

  // Ajustar bounds para ver ambos puntos
  useEffect(() => {
    if (!map || !collectorPosition || !coreLib) return;
    try {
      const bounds = new coreLib.LatLngBounds();
      bounds.extend({ lat: destinationLat, lng: destinationLng });
      bounds.extend({ lat: collectorPosition.latitude, lng: collectorPosition.longitude });
      map.fitBounds(bounds);
    } catch (e) {
      console.error("Error al ajustar bounds:", e);
    }
  }, [map, collectorPosition, destinationLat, destinationLng, coreLib]);

  // Ejecutar el cálculo de ruta si cambian las variables
  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (!collectorPosition) {
      directionsRenderer.setDirections(null);
      setRouteInfo(null);
      setRouteError(null);
      return;
    }

    directionsService.route(
      {
        origin: { lat: collectorPosition.latitude, lng: collectorPosition.longitude },
        destination: { lat: destinationLat, lng: destinationLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          directionsRenderer.setDirections(response);
          setRouteError(null);
          const route = response.routes[0];
          if (route && route.legs && route.legs[0]) {
            setRouteInfo({
              distance: route.legs[0].distance?.text || "Desconocida",
              duration: route.legs[0].duration?.text || "Desconocido"
            });
          }
        } else {
          setRouteError(`No se pudo calcular una ruta terrestre. Status API: ${status}. Puedes abrir Google Maps para navegación.`);
          directionsRenderer.setDirections(null);
          setRouteInfo(null);
        }
      }
    );
  }, [directionsService, directionsRenderer, collectorPosition, destinationLat, destinationLng, setRouteInfo, setRouteError]);

  return null;
}

export function RouteMapView({
  destinationLat,
  destinationLng,
  destinationAddress,
  restaurantName,
  height = "360px"
}: RouteMapViewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  const [collectorPosition, setCollectorPosition] = useState<{ latitude: number; longitude: number; accuracy?: number; source?: string } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'error'>('idle');
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Fallbacks de seguridad si falta API key
  if (!apiKey) {
    return <MapFallback reason="NO_API_KEY" height={height} />;
  }

  const requestCollectorLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCollectorPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'BROWSER_GPS'
        });
        setGeoStatus('granted');
      },
      () => {
        setGeoStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleOpenGoogleMaps = () => {
    let url = "";
    if (collectorPosition) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${collectorPosition.latitude},${collectorPosition.longitude}&destination=${destinationLat},${destinationLng}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${destinationLat},${destinationLng}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const center = { lat: destinationLat, lng: destinationLng };

  return (
    <div className={`flex flex-col gap-4 ${height === '100%' ? 'h-full w-full' : ''}`}>
      {/* Contenedor del Mapa Real */}
      <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm flex-1" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        {/* Usar APIProvider que es el escudo contra crasheos por librería no encontrada */}
        <APIProvider apiKey={apiKey}>
          <Map
            defaultZoom={DEFAULT_MAP_ZOOM}
            defaultCenter={center}
            mapId={mapId}
            gestureHandling="greedy"
          >
            {/* Pin estático del restaurante, siempre visible */}
            {Number.isFinite(center.lat) && Number.isFinite(center.lng) && (
              <AdvancedMarker position={center} title={restaurantName || destinationAddress || "Punto de recojo"}>
                <Pin background="#16A34A" borderColor="#ffffff" glyphColor="#ffffff" />
              </AdvancedMarker>
            )}

            {/* Pin del recolector, visible cuando tengamos ubicación */}
            {collectorPosition && Number.isFinite(collectorPosition.latitude) && Number.isFinite(collectorPosition.longitude) && (
              <AdvancedMarker 
                position={{ lat: collectorPosition.latitude, lng: collectorPosition.longitude }} 
                title="Mi ubicación actual"
              >
                <Pin background="#1e40af" borderColor="#ffffff" glyphColor="#ffffff" />
              </AdvancedMarker>
            )}

            {/* La lógica de rutas está abstraída en su propio componente que sí consume el hook useMap */}
            <RouteLogic
              destinationLat={destinationLat}
              destinationLng={destinationLng}
              collectorPosition={collectorPosition}
              setRouteInfo={setRouteInfo}
              setRouteError={setRouteError}
            />
          </Map>
        </APIProvider>
        
        {/* Overlay para boton de navegacion sobre el mapa */}
        {!collectorPosition && geoStatus !== 'loading' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm">
            <div className="bg-white/90 backdrop-blur shadow-lg rounded-xl p-3 flex flex-col items-center gap-2 border border-border text-center">
              <span className="text-sm font-medium text-foreground">¿Quieres ver la ruta?</span>
              <Button onClick={requestCollectorLocation} size="sm" className="w-full gap-2">
                <Navigation className="h-4 w-4" />
                Usar mi ubicación actual
              </Button>
            </div>
          </div>
        )}

        {/* Loader de GPS */}
        {geoStatus === 'loading' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm">
            <div className="bg-white/90 backdrop-blur shadow-lg rounded-xl p-3 flex items-center justify-center gap-2 border border-border">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-foreground">Obteniendo ubicación...</span>
            </div>
          </div>
        )}
      </div>

      {/* Tarjeta Inferior de Datos de Ruta y Estado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border">
        <div className="flex-1">
          {restaurantName && <h4 className="font-bold text-sm text-foreground">{restaurantName}</h4>}
          <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
            {destinationAddress || "Dirección no disponible"}
          </p>

          {/* Información Exclusiva de Rutas */}
          {routeInfo && !routeError && (
            <div className="flex items-center gap-3 mt-3 text-sm">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                Distancia: {routeInfo.distance}
              </span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                Tiempo: {routeInfo.duration}
              </span>
            </div>
          )}

          {/* Estado de Error o Fallo GPS */}
          {geoStatus === 'denied' && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              No se pudo acceder a tu ubicación actual. Puedes abrir el punto en Google Maps.
            </div>
          )}
          {routeError && (
            <div className="flex flex-col mt-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{routeError}</span>
              </div>
            </div>
          )}

          {/* Estado de Precisión Satelital (Exigido en Plan) */}
          {geoStatus === 'granted' && collectorPosition?.accuracy && (
            <div className="mt-2 text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <span>Precisión GPS:</span>
              <span className="bg-white/60 px-1.5 rounded border border-border/30">
                {collectorPosition.accuracy <= 50 ? "Precisa" : collectorPosition.accuracy <= 300 ? "Aceptable" : "Referencial"} 
                ({Math.round(collectorPosition.accuracy)}m)
              </span>
            </div>
          )}
        </div>
        
        <Button variant="outline" className="w-full sm:w-auto gap-2 bg-background shrink-0" onClick={handleOpenGoogleMaps}>
          <ExternalLink className="h-4 w-4" />
          Abrir en Maps
        </Button>
      </div>
    </div>
  );
}
