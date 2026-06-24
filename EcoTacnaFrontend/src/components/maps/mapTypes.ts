export type EcoMapMarkerType =
  | 'pickup'
  | 'company'
  | 'collector'
  | 'transport'
  | 'reference'
  | 'selected';

export interface MapLatLng {
  latitude: number;
  longitude: number;
}

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
  markers?: EcoMapMarker[];
  height?: string | number;
  showMissingCoordinatesWarning?: boolean;
  fallbackCenter?: MapLatLng;
  selectable?: boolean;
  selectedPosition?: MapLatLng | null;
  onSelectPosition?: (position: MapLatLng) => void;
  selectionLabel?: string;
}
