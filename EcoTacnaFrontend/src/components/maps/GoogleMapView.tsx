import React, { useMemo, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, MapMouseEvent, useMap } from '@vis.gl/react-google-maps';
import { TACNA_DEFAULT_CENTER, DEFAULT_MAP_ZOOM } from './mapConstants';
import { GoogleMapViewProps } from './mapTypes';
import { MapFallback } from './MapFallback';

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

const getPinColor = (type: string) => {
  switch (type) {
    case 'company': return '#3b82f6'; // blue
    case 'collector': return '#10b981'; // emerald
    case 'pickup': return '#f59e0b'; // amber
    case 'transport': return '#6366f1'; // indigo
    case 'selected': return '#ef4444'; // red for selected point
    case 'branch': return '#f43f5e'; // rose for branch locations
    default: return '#ef4444';
  }
};

function MapBoundsUpdater({ validMarkers }: { validMarkers: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || validMarkers.length < 2) return;
    // @ts-ignore - google is loaded globally by APIProvider
    const bounds = new google.maps.LatLngBounds();
    validMarkers.forEach(m => bounds.extend({ lat: m.latitude!, lng: m.longitude! }));
    map.fitBounds(bounds);
  }, [map, validMarkers]);
  return null;
}

export function GoogleMapView({ 
  markers = [], 
  height = "300px", 
  fallbackCenter, 
  showMissingCoordinatesWarning,
  selectable = false,
  selectedPosition,
  onSelectPosition,
  selectionLabel = "Punto seleccionado"
}: GoogleMapViewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  const validMarkers = useMemo(() => {
    return markers.filter(m => isValidCoordinate(m.latitude, m.longitude));
  }, [markers]);

  const handleMapClick = (ev: MapMouseEvent) => {
    if (!selectable || !onSelectPosition) return;
    if (ev.detail.latLng) {
      onSelectPosition({
        latitude: ev.detail.latLng.lat,
        longitude: ev.detail.latLng.lng,
      });
    }
  };

  if (!apiKey) {
    return <MapFallback reason="NO_API_KEY" height={height} />;
  }

  if (validMarkers.length === 0 && markers.length > 0 && !selectable) {
    if (showMissingCoordinatesWarning) {
        return <MapFallback reason="NO_COORDINATES" height={height} />;
    }
  }

  const center = selectedPosition 
    ? { lat: selectedPosition.latitude, lng: selectedPosition.longitude }
    : validMarkers.length > 0 
      ? { lat: validMarkers[0].latitude!, lng: validMarkers[0].longitude! }
      : fallbackCenter 
        ? { lat: fallbackCenter.latitude, lng: fallbackCenter.longitude }
        : { lat: TACNA_DEFAULT_CENTER.latitude, lng: TACNA_DEFAULT_CENTER.longitude };

  return (
    <div style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultZoom={DEFAULT_MAP_ZOOM}
          defaultCenter={center}
          mapId={mapId}
          onClick={handleMapClick}
          gestureHandling={selectable ? "greedy" : "auto"}
        >
          <MapBoundsUpdater validMarkers={validMarkers} />
          {validMarkers.map((marker) => (
            <AdvancedMarker 
              key={marker.id} 
              position={{ lat: marker.latitude!, lng: marker.longitude! }}
              title={marker.label}
            >
              <Pin background={getPinColor(marker.type)} borderColor="#ffffff" glyphColor="#ffffff" />
            </AdvancedMarker>
          ))}
          {selectable && selectedPosition && (
            <AdvancedMarker 
              position={{ lat: selectedPosition.latitude, lng: selectedPosition.longitude }}
              title={selectionLabel}
            >
              <Pin background={getPinColor('selected')} borderColor="#ffffff" glyphColor="#ffffff" />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
