import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPinned } from 'lucide-react';

interface MapFallbackProps {
  reason: 'NO_API_KEY' | 'NO_COORDINATES' | 'ERROR';
  height?: string | number;
}

export function MapFallback({ reason, height = "300px" }: MapFallbackProps) {
  let message = "";
  
  if (reason === 'NO_API_KEY') {
    message = "Mapa no disponible. Configure VITE_GOOGLE_MAPS_API_KEY en el entorno local para habilitar Google Maps.";
  } else if (reason === 'NO_COORDINATES') {
    message = "La solicitud aún no tiene coordenadas registradas. Se muestra información textual de ubicación.";
  } else {
    message = "Ocurrió un error al cargar el mapa.";
  }

  return (
    <Card 
      className="flex flex-col items-center justify-center p-6 text-center border-dashed bg-muted/50"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <MapPinned className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm font-medium text-muted-foreground max-w-md">
        {message}
      </p>
    </Card>
  );
}
