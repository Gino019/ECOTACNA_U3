import React, { useState, useEffect } from 'react';
import { subscriptionApi, ProfileSubscriptionStatusResponse } from '../../services/subscriptionApi';
import { CreditCard, AlertCircle, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const SubscriptionStatusCard: React.FC = () => {
  const [statusData, setStatusData] = useState<ProfileSubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await subscriptionApi.getProfileSubscriptionStatus();
      setStatusData(data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      toast.error('No se pudo cargar el estado de la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar tu suscripción? Perderás el acceso una vez finalizado el periodo actual.')) return;
    
    try {
      setProcessing(true);
      const res = await subscriptionApi.cancelProfileSubscription();
      toast.success(res.message || 'Suscripción cancelada exitosamente');
      await fetchStatus();
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast.error(error.message || 'Error al cancelar la suscripción');
    } finally {
      setProcessing(false);
    }
  };

  const handleRenew = async () => {
    try {
      setProcessing(true);
      const res = await subscriptionApi.renewProfileSubscription();
      toast.success(res.message || 'Redirigiendo a pasarela...');
    } catch (error: any) {
      console.error('Error renewing subscription:', error);
      toast.error(error.message || 'Error al renovar la suscripción');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse mt-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!statusData) {
    return null;
  }

  // Calculate progress bar percentage
  // Assuming a standard 30-day month or 7-day trial for the visual progress
  const totalDays = statusData.pruebaActiva ? 7 : 30;
  const daysLeft = statusData.diasRestantes || 0;
  const progressPercent = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));

  const getStatusBadge = () => {
    if (statusData.estadoSuscripcion === 'ACTIVA') {
      return <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Activa</span>;
    }
    if (statusData.estadoSuscripcion === 'PRUEBA_ACTIVA') {
      return <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"><Calendar className="w-3.5 h-3.5" /> Prueba Gratuita</span>;
    }
    if (statusData.estadoSuscripcion === 'CANCELADA') {
      return <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"><XCircle className="w-3.5 h-3.5" /> Cancelada</span>;
    }
    if (statusData.estadoSuscripcion === 'VENCIDA') {
      return <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"><AlertCircle className="w-3.5 h-3.5" /> Vencida</span>;
    }
    if (statusData.estadoSuscripcion === 'PENDIENTE_PAGO') {
      return <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200"><AlertCircle className="w-3.5 h-3.5" /> Pendiente de Pago</span>;
    }
    return <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{statusData.estadoSuscripcion}</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="border-b border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Suscripción y Facturación
            </h2>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-500">
            Gestiona el plan de tu empresa y métodos de pago.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">S/ {statusData.precioMensual.toFixed(2)}<span className="text-sm text-gray-500 font-normal">/mes</span></p>
          <p className="text-sm text-gray-500">{statusData.planNombre}</p>
        </div>
      </div>

      <div className="p-6">
        {/* Info Box */}
        <div className={`mb-6 p-4 rounded-lg border flex gap-3 ${
          statusData.cancelacionProgramada 
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : statusData.estadoSuscripcion === 'VENCIDA'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
            statusData.cancelacionProgramada ? 'text-amber-600' : statusData.estadoSuscripcion === 'VENCIDA' ? 'text-red-600' : 'text-emerald-600'
          }`} />
          <p className="text-sm">{statusData.mensajeEstado}</p>
        </div>

        {/* Progress Bar for Active/Trial */}
        {(statusData.estadoSuscripcion === 'ACTIVA' || statusData.estadoSuscripcion === 'PRUEBA_ACTIVA') && statusData.diasRestantes !== undefined && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Ciclo actual</span>
              <span className="text-emerald-600 font-bold">{statusData.diasRestantes} días restantes</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${statusData.diasRestantes <= 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{statusData.fechaInicio || 'Inicio'}</span>
              <span>{statusData.fechaFinPrueba || statusData.fechaVencimiento || 'Fin'}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
          {statusData.puedeCancelar && (
            <button 
              onClick={handleCancel}
              disabled={processing}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50"
            >
              {processing ? 'Procesando...' : 'Cancelar suscripción'}
            </button>
          )}

          {statusData.puedeRenovar && (
            <button 
              onClick={handleRenew}
              disabled={processing}
              className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 ml-auto"
            >
              {processing ? 'Procesando...' : 'Renovar suscripción'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
