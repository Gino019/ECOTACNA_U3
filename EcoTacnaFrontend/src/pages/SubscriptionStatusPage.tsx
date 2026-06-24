import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionApi, SubscriptionStatusResponse } from '../services/subscriptionApi';

const SubscriptionStatusPage: React.FC = () => {
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await subscriptionApi.getMySubscriptionStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar estado de suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    if (!status) return;
    
    if (status.companyType === 'GENERADORA') {
      if (status.status !== 'ACTIVA' && status.status !== 'PRUEBA_ACTIVA') {
        navigate('/pagos/checkout');
      } else {
        navigate('/empresa');
      }
    } else if (status.companyType === 'RECOLECTORA') {
      if (status.status !== 'ACTIVA') {
        navigate('/pagos/checkout');
      } else {
        navigate('/recolector');
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!status) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Estado de Suscripción</h1>
        
        <div className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Información Actual</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Empresa</p>
                <p className="font-medium text-gray-900">{status.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-medium text-gray-900">{status.companyType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado de Suscripción</p>
                <p className="font-medium text-gray-900">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    status.status === 'ACTIVA' || status.status === 'PRUEBA_ACTIVA' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {status.status}
                  </span>
                </p>
              </div>
              {status.planName && (
                <div>
                  <p className="text-sm text-gray-500">Plan Actual</p>
                  <p className="font-medium text-gray-900">{status.planName}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleAction}
              className={`px-8 py-3 rounded-lg font-semibold text-white shadow-md transition-all ${
                status.canOperate 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {status.canOperate ? 'Ir al Panel Principal' : 'Activar Suscripción'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusPage;
