import React from "react";
import { normalizePlate } from "@/pages/recolector/RecolectorTransportes";

export interface TransportUnitFormData {
  placa: string;
  marca: string;
  modelo: string;
  capacidadLitros: string;
  tipoUnidad: string;
  estado?: string;
  observaciones?: string;
}

export interface TransportUnitFormProps {
  value: TransportUnitFormData;
  onChange: (value: TransportUnitFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  editing?: boolean;
  hideStatusAndObservations?: boolean;
}

export function TransportUnitForm({
  value,
  onChange,
  onSubmit,
  submitting = false,
  editing = false,
  hideStatusAndObservations = false,
}: TransportUnitFormProps) {

  const handlePlacaChange = (val: string) => {
    let temp = val.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
    let raw = temp.replace(/-/g, "");
    
    // Limit to exactly 6 alphanumeric characters
    if (raw.length > 6) {
      raw = raw.slice(0, 6);
    }
    
    // Format: add hyphen after first 3 alphanumeric characters
    if (raw.length > 3) {
      temp = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else {
      temp = raw;
    }
    onChange({ ...value, placa: temp });
  };

  const handleCapacityChange = (val: string) => {
    if (val === '') {
      onChange({ ...value, capacidadLitros: '' });
      return;
    }
    const numeric = Number(val);
    if (Number.isNaN(numeric)) return;
    if (numeric > 5000) {
      onChange({ ...value, capacidadLitros: '5000' });
      return;
    }
    if (numeric < 0) return;
    onChange({ ...value, capacidadLitros: val });
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Placa *</label>
        <input 
          required 
          maxLength={7} 
          value={value.placa} 
          onChange={e => handlePlacaChange(e.target.value)} 
          className="w-full border rounded-md p-2 uppercase font-mono tracking-wider" 
          placeholder="ABC-123" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Capacidad en Litros *</label>
        <input 
          required 
          type="number" 
          min="1" 
          max="5000" 
          step="1" 
          value={value.capacidadLitros} 
          onChange={e => handleCapacityChange(e.target.value)} 
          className="w-full border rounded-md p-2" 
          placeholder="Ej. 5000" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Marca *</label>
        <input 
          required 
          value={value.marca} 
          onChange={e => onChange({...value, marca: e.target.value})} 
          className="w-full border rounded-md p-2" 
          placeholder="Ej. Volvo" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Modelo *</label>
        <input 
          required 
          maxLength={20}
          value={value.modelo} 
          onChange={e => onChange({...value, modelo: e.target.value.slice(0, 20)})} 
          className="w-full border rounded-md p-2" 
          placeholder="Ej. FMX" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tipo de Unidad</label>
        <select 
          value={value.tipoUnidad} 
          onChange={e => onChange({...value, tipoUnidad: e.target.value})} 
          className="w-full border rounded-md p-2 bg-background"
        >
          <option value="Cisterna">Cisterna</option>
          <option value="Furgón">Furgón</option>
          <option value="Camioneta">Camioneta</option>
        </select>
      </div>

      {!hideStatusAndObservations && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select 
              value={value.estado} 
              onChange={e => onChange({...value, estado: e.target.value})} 
              className="w-full border rounded-md p-2 bg-background"
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="EN_MANTENIMIENTO">EN MANTENIMIENTO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea 
              value={value.observaciones} 
              onChange={e => onChange({...value, observaciones: e.target.value})} 
              className="w-full border rounded-md p-2" 
              rows={2} 
              placeholder="Opcional..." 
            />
          </div>
        </>
      )}

      <div className="md:col-span-2 flex justify-end mt-2">
        <button 
          disabled={submitting} 
          type="submit" 
          className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium"
        >
          {submitting ? "Guardando..." : (editing ? "Actualizar Unidad" : "Guardar Unidad")}
        </button>
      </div>
    </form>
  );
}
