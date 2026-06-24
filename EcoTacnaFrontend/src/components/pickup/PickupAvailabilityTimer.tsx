import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

type PickupAvailabilityTimerProps = {
  availableUntil?: string;
  createdAt?: string;
};

export function PickupAvailabilityTimer({ availableUntil, createdAt }: PickupAvailabilityTimerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatearFechaRecojo = (fecha: Date | string) => {
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const meses = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
    const mes = meses[d.getMonth()];
    
    let horas = d.getHours();
    const minutos = d.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12;
    horas = horas ? horas : 12; 
    const horasStr = horas.toString().padStart(2, '0');
    
    return `${dia}-${mes}, ${horasStr}:${minutos} ${ampm}`;
  };

  const fechaTermino = availableUntil ? new Date(availableUntil) : (createdAt ? new Date(new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  
  const diferencia = fechaTermino.getTime() - now.getTime();
  const vencido = diferencia <= 0;

  const horasLeft = vencido ? 0 : Math.floor(diferencia / (1000 * 60 * 60));
  const minutosLeft = vencido ? 0 : Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800 flex flex-col gap-1.5 font-mono">
      <div className="flex items-center justify-between">
        <span className="font-sans text-muted-foreground">Fecha actual:</span>
        <strong className="text-foreground">{formatearFechaRecojo(now)}</strong>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-sans text-muted-foreground">Fecha de término:</span>
        <strong className="text-foreground">{formatearFechaRecojo(fechaTermino)}</strong>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-blue-100 mt-0.5">
        <span className="font-sans font-medium text-blue-900">Disponible por:</span>
        <strong className="text-sm text-blue-700 flex items-center gap-1">
          {!vencido && <Clock className="w-3.5 h-3.5 animate-pulse" />}
          {vencido ? "0 h 0 min" : `${horasLeft} h ${minutosLeft} min`}
        </strong>
      </div>
    </div>
  );
}
