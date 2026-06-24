import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { adminApi } from "@/services/adminApi";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCompanyAdmitted: () => void;
}

export function AdminEmpresasRechazadasModal({ isOpen, onClose, onCompanyAdmitted }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEmpresasRechazadas();
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        setData([]);
      }
    } catch (err) {
      toast.error("Error al cargar empresas rechazadas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleAdmit = async (id: number) => {
    if (!confirm("¿Admitir nuevamente a esta empresa?\nLa empresa recuperará acceso según el flujo de aprobación actual.")) return;
    
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await adminApi.admitCompany(id);
      toast.success("Empresa readmitida correctamente");
      setData(prev => prev.filter(c => c.id !== id));
      onCompanyAdmitted();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al readmitir la empresa");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Empresas rechazadas</DialogTitle>
          <DialogDescription>
            Empresas que fueron rechazadas o canceladas y pueden ser readmitidas por revisión administrativa.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No hay empresas rechazadas pendientes de revisión.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa / Razón social</TableHead>
                <TableHead>RUC</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-semibold text-sm truncate max-w-[200px]" title={c.razonSocial}>
                      {c.razonSocial || "Información no disponible"}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{c.ruc}</TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {c.correoContacto && <div className="truncate max-w-[150px]" title={c.correoContacto}>{c.correoContacto}</div>}
                      {c.numeroContacto && <div>{c.numeroContacto}</div>}
                      {!c.correoContacto && !c.numeroContacto && "Información no disponible"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.estado || "CANCELADA"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => handleAdmit(c.id)}
                      disabled={actionLoading[c.id]}
                    >
                      {actionLoading[c.id] ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                      Admitir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
