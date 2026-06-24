import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, MapPinned } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de repuesto
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MapErrorBoundary atrapó un error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20 border-dashed rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Error al cargar el mapa</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Ocurrió un problema inesperado al inicializar el componente del mapa. 
            El resto de la aplicación sigue funcionando con normalidad.
          </p>
          <div className="mt-4 text-xs text-left bg-muted p-3 rounded overflow-auto max-w-full text-red-500/80 font-mono">
            {this.state.error?.message || "Error desconocido en RouteMapView"}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
