import React, { useRef, useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RucSearchPanelProps {
  onSearch: (ruc: string) => void;
  onIncomplete?: () => void;
  isLoading: boolean;
  error: string | null;
}

export const RucSearchPanel: React.FC<RucSearchPanelProps> = ({
  onSearch,
  onIncomplete,
  isLoading,
  error,
}) => {
  const [ruc, setRuc] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const lastQueriedRef = useRef("");

  const runSearch = (value: string) => {
    const cleanRuc = value.trim();

    if (!cleanRuc) {
      setLocalError("El numero de RUC es requerido.");
      return;
    }

    if (!/^\d+$/.test(cleanRuc)) {
      setLocalError("El RUC debe contener solo numeros.");
      return;
    }

    if (cleanRuc.length !== 11) {
      setLocalError("El RUC debe tener exactamente 11 digitos.");
      return;
    }

    setLocalError(null);
    lastQueriedRef.current = cleanRuc;
    onSearch(cleanRuc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(ruc);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\D/g, "").slice(0, 11);
    setRuc(cleanValue);

    if (cleanValue.length < 11) {
      lastQueriedRef.current = "";
      setLocalError(null);
      onIncomplete?.();
      return;
    }

    if (cleanValue !== lastQueriedRef.current) {
      runSearch(cleanValue);
    }
  };

  const activeError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ruc-input" className="text-sm font-semibold text-gray-700">
          Numero de RUC *
        </Label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Input
              id="ruc-input"
              type="text"
              inputMode="numeric"
              placeholder="Ingrese los 11 digitos de su RUC (Ej: 20100055237)"
              value={ruc}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`h-11 rounded-xl bg-white border-gray-250 shadow-sm focus-visible:ring-green-500 pr-10 transition-all ${
                activeError ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200"
              }`}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading || ruc.length !== 11}
            className="h-11 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 rounded-xl shrink-0 transition-colors shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar datos
          </Button>
        </div>
      </div>

      {activeError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50/50 border border-red-100 p-3 rounded-xl animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </form>
  );
};
