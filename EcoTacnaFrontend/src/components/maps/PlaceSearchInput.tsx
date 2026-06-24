import React, { useState, useEffect } from 'react';
import { useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { Search, Loader2, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type PlaceResult = {
  placeId?: string;
  name?: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
};

type PlaceSearchInputProps = {
  initialQuery?: string;
  placeholder?: string;
  disabled?: boolean;
  onPlaceSelected: (place: PlaceResult) => void;
};

export function PlaceSearchInput({ initialQuery = "", placeholder = "Busca por nombre comercial, razón social o dirección", disabled, onPlaceSelected }: PlaceSearchInputProps) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const placesLibrary = useMapsLibrary('places');
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const map = useMap();
  
  useEffect(() => {
    if (!placesLibrary) return;
    
    setAutocompleteService(new placesLibrary.AutocompleteService());
    
    if (map) {
      setPlacesService(new placesLibrary.PlacesService(map));
    } else {
      const dummyDiv = document.createElement('div');
      setPlacesService(new placesLibrary.PlacesService(dummyDiv));
    }
  }, [placesLibrary, map]);

  useEffect(() => {
    if (initialQuery) {
        setInputValue(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (!autocompleteService || !inputValue.trim() || inputValue === initialQuery) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchPredictions = () => {
      setIsLoading(true);
      autocompleteService.getPlacePredictions({
        input: inputValue,
        componentRestrictions: { country: 'pe' } // Sesgo geográfico a Perú
      }, (predictions, status) => {
        setIsLoading(false);
        if (status === 'OK' && predictions) {
          setSuggestions(predictions);
          setIsOpen(true);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      });
    };

    const debounceTimeout = setTimeout(fetchPredictions, 450);
    return () => clearTimeout(debounceTimeout);
  }, [inputValue, autocompleteService, initialQuery]);

  const handleSelectSuggestion = (prediction: google.maps.places.AutocompletePrediction) => {
    setInputValue(prediction.description);
    setIsOpen(false);
    
    if (!placesService) return;

    setIsLoading(true);
    placesService.getDetails({
      placeId: prediction.place_id,
      fields: ['geometry', 'name', 'formatted_address']
    }, (place, status) => {
      setIsLoading(false);
      if (status === 'OK' && place?.geometry?.location) {
        onPlaceSelected({
          placeId: prediction.place_id,
          name: place.name || prediction.structured_formatting.main_text,
          formattedAddress: place.formatted_address || prediction.description,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        });
      }
    });
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setError(null);
  };

  const handleSearch = () => {
    const query = inputValue.trim();
    if (!query) {
      setError('Escribe una dirección o nombre de local para buscar.');
      return;
    }
    if (!placesService) {
      setError('Google Places aún no está listo. Intenta nuevamente.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsOpen(false);

    placesService.findPlaceFromQuery(
      {
        query,
        fields: ['name', 'formatted_address', 'geometry', 'place_id'],
        locationBias: { radius: 30000, center: { lat: -18.013, lng: -70.25 } }
      },
      (results, status) => {
        setIsLoading(false);
        if (
          status === 'ZERO_RESULTS' ||
          !results ||
          !results.length ||
          !results[0].geometry?.location
        ) {
          setError('No se encontró una ubicación para esa búsqueda.');
          return;
        }
        if (status === 'OVER_QUERY_LIMIT') {
          setError('Se alcanzó el límite de consultas de Google Places.');
          return;
        }
        if (status === 'REQUEST_DENIED') {
          setError('Google Places no está habilitado para esta API key.');
          return;
        }
        if (status === 'INVALID_REQUEST') {
          setError('La búsqueda no es válida. Escribe una dirección más precisa.');
          return;
        }
        if (status !== 'OK') {
          setError('Error al buscar la ubicación.');
          return;
        }

        const place = results[0];
        const location = place.geometry!.location!;

        onPlaceSelected({
          placeId: place.place_id,
          name: place.name || query,
          formattedAddress: place.formatted_address || '',
          latitude: location.lat(),
          longitude: location.lng()
        });
      }
    );
  };

  const hasApiKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  if (!hasApiKey) {
    return (
      <div className="relative w-full">
        <Input
          placeholder="El buscador de Google Maps no está disponible porque no se configuró la API key."
          disabled={true}
          className="pl-10 h-11 bg-gray-50/50 text-xs border-gray-200"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>
    );
  }

  if (!placesLibrary) {
    return (
      <div className="relative w-full">
        <Input
          placeholder="Cargando buscador de Google Maps..."
          disabled={true}
          className="pl-10 h-11 bg-gray-50/50 text-xs border-gray-200"
        />
        <Loader2 className="w-4 h-4 text-green-600 animate-spin absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>
    );
  }

  return (
    <div className="relative w-full space-y-2">
      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="pl-10 pr-10 h-11 bg-white border-gray-200 focus-visible:ring-green-500 shadow-sm text-sm w-full"
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          
          {!isLoading && inputValue && (
            <button 
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button 
          type="button" 
          onClick={handleSearch} 
          disabled={disabled || isLoading || !inputValue.trim()}
          className="h-11 px-6 bg-green-600 hover:bg-green-700 text-white font-medium shrink-0 shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Buscar"
          )}
        </Button>
      </div>

      {error && (
        <div className="text-xs text-red-600 px-1 animate-fadeIn">
          {error}
        </div>
      )}

      {isOpen && suggestions.length > 0 && !error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50">
          <ul className="max-h-[280px] overflow-auto custom-scrollbar">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.place_id}
                onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(suggestion)
                }}
                className="px-4 py-3 hover:bg-green-50/70 cursor-pointer flex gap-3 items-start border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="mt-0.5 bg-gray-100 p-1.5 rounded-lg shrink-0">
                  <MapPin className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {suggestion.structured_formatting.main_text}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
