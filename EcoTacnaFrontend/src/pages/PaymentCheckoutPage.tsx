import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../services/paymentApi';
import { subscriptionApi, Plan, PublicCheckoutResponse } from '../services/subscriptionApi';
import { Leaf, ArrowLeft, Users, CheckCircle, CreditCard, Info, Lock, Gift } from 'lucide-react';

const PaymentCheckoutPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [companyName, setCompanyName] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');
      
      const companyId = searchParams.get('companyId');
      
      if (companyId) {
        console.log('Cargando checkout público para companyId:', companyId);
        const data: PublicCheckoutResponse = await subscriptionApi.getPublicCheckout(Number(companyId));
        console.log('Respuesta checkout público:', data);
        
        setCompanyName(data.companyName);
        
        // Mapeamos a la estructura Plan que espera la UI
        const plan: Plan = {
          id: data.planId,
          code: data.planCode,
          name: data.planName,
          companyType: data.companyType,
          monthlyAmount: data.monthlyAmount,
          currency: data.currency,
          trialDays: data.trialDays
        };
        setSelectedPlan(plan);
        setPlans([plan]);
      } else {
        // Flujo autenticado anterior
        const subStatus = await subscriptionApi.getMySubscriptionStatus();
        const companyType = subStatus.companyType;
        
        const data = await subscriptionApi.getPublicPlans();
        const availablePlans = data.filter(p => p.companyType === companyType);
        
        setPlans(availablePlans);
        if (availablePlans.length > 0) {
          setSelectedPlan(availablePlans[0]);
        } else {
          setError('No se encontró plan activo para este tipo de empresa.');
        }
      }
    } catch (err: any) {
      console.error('Error cargando checkout:', err);
      const backendMessage = err.message || err.data?.message || err.response?.data?.message;
      setError(backendMessage || 'Error al cargar los planes o tu estado.');
    } finally {
      setLoading(false);
    }
  };

  const PAYMENTS_MODE = import.meta.env.VITE_PAYMENTS_MODE || 'simulated';

  useEffect(() => {
    console.log(`Modo de pagos EcoTacna: ${PAYMENTS_MODE}`);
  }, []);

  const handleSimulatedPayment = async () => {
    if (!selectedPlan) return;
    try {
      setProcessing(true);
      setError('');
      
      const companyId = searchParams.get('companyId');
      
      if (companyId) {
        // Flujo público de registro
        console.log('Procesando pago simulado público para companyId:', companyId);
        
        // Extraemos últimos 4 dígitos de la tarjeta
        const token = await paymentApi.createSimulatedToken({
          cardNumber,
          cvv,
          expiry,
          email: email || 'demo.generador.01@ecotacna.test',
          cardholderName: cardholderName || 'Rosa Mamani Flores'
        });
        
        // Clear card details immediately to avoid keeping sensitive data in state
        setCardNumber('');
        setCvv('');
        setExpiry('');

        const response = await paymentApi.confirmSimulatedPayment(Number(companyId), {
          paymentMethod: 'CARD',
          simulatedToken: token.id,
          email: email || 'demo.generador.01@ecotacna.test'
        });
        
        console.log('Respuesta de confirmación pública:', response);
        setCheckoutResult(response);
        setSuccess(true);
      } else {
        // Flujo autenticado legacy
        const initRes = await paymentApi.initPayment({ planId: selectedPlan.id });
        
        await paymentApi.confirmMockPayment({
          paymentId: initRes.paymentId,
          simulateApproval: true
        });

        setSuccess(true);
        setTimeout(() => {
          if (selectedPlan.companyType === 'GENERADORA') {
            navigate('/empresa');
          } else {
            navigate('/recolector');
          }
        }, 2000);
      }
    } catch (err: any) {
      // Clear card details immediately on error as well
      setCardNumber('');
      setCvv('');
      setExpiry('');

      console.error('Error al procesar el pago simulado:', err);
      const backendMessage = err.message || err.data?.message || err.response?.data?.message;
      setError(backendMessage || 'Error al procesar el pago.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSubmit = async () => {
    await handleSimulatedPayment();
  };

  if (loading) return <div className="text-center p-8 text-gray-500">Cargando planes...</div>;

  const isTrial = selectedPlan && selectedPlan.trialDays > 0;
  
  const getDisplayPlanName = () => {
    const name = checkoutResult?.planName || selectedPlan?.name || '';
    if (name.includes('Recolector')) return 'Plan Recolector';
    if (name.includes('Generador')) return 'Plan Generador';
    return name || 'Plan EcoTacna';
  };

  const getDisplayCompanyType = () => {
    const type = checkoutResult?.companyType || selectedPlan?.companyType || '';
    if (type === 'GENERADORA' || type === 'GENERADOR') return 'Restaurante / Generador';
    if (type === 'RECOLECTORA' || type === 'RECOLECTOR') return 'Empresa recolectora';
    return type === 'RECOLECTOR' ? 'Empresa recolectora' : 'Restaurante / Generador';
  };

  const companyTypeText = selectedPlan?.companyType === 'GENERADORA' ? 'Restaurante / Generador' : 'Empresa Recolectora';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800">
      {/* Top Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-green-600 p-2 rounded-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">EcoTacna</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Gestión Sostenible</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-sm font-medium text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al inicio
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Title and Stepper Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Users className="w-3 h-3" />
              <span>Registro y suscripción</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Activa tu plan</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tu empresa fue aprobada. Ahora selecciona y confirma el plan para continuar.
            </p>
          </div>

          {/* Stepper */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-medium">
            <div className="flex flex-col items-center text-gray-400">
              <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center mb-1">1</div>
              <span>Registro de empresa</span>
            </div>
            <div className="w-12 h-px bg-gray-300 -mt-4"></div>
            <div className="flex flex-col items-center text-gray-400">
              <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center mb-1">2</div>
              <span>Verificación</span>
            </div>
            <div className="w-12 h-px bg-green-600 -mt-4"></div>
            <div className="flex flex-col items-center text-green-600">
              <div className="w-8 h-8 rounded-full border-2 border-green-600 bg-white flex items-center justify-center mb-1 font-bold">3</div>
              <span>Plan y pago</span>
            </div>
            <div className="w-12 h-px bg-gray-300 -mt-4"></div>
            <div className="flex flex-col items-center text-gray-400">
              <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center mb-1">4</div>
              <span>Confirmación</span>
            </div>
            <div className="w-12 h-px bg-gray-300 -mt-4"></div>
            <div className="flex flex-col items-center text-gray-400">
              <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center mb-1">5</div>
              <span>Acceso al sistema</span>
            </div>
          </div>
        </div>



        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-xl text-center">
            <h3 className="text-xl font-bold text-red-800 mb-2">Error</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/login')} 
              className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Volver al Login
            </button>
          </div>
        ) : success ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-green-100 overflow-hidden animate-fade-in">
            <div className="bg-green-600 p-8 text-center text-white relative">
              <div className="absolute top-4 right-4 bg-green-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                Pago simulado
              </div>
              <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
              <h3 className="text-3xl font-extrabold mb-1">¡Transacción Aprobada!</h3>
              <p className="text-green-100 text-sm">
                {checkoutResult?.message || 'Tu suscripción ha sido validada y activada con éxito.'}
              </p>
            </div>
            
            <div className="p-8">
              <h4 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
                Resumen de tu Suscripción
              </h4>
              
              <div className="space-y-4 text-sm mb-8">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">Empresa:</span>
                  <span className="text-gray-900 font-bold">
                    {companyName || checkoutResult?.companyName || 'Cargando...'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">Tipo de Empresa:</span>
                  <span className="text-gray-900 font-semibold">
                    {getDisplayCompanyType()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">Plan Activado:</span>
                  <span className="text-gray-900 font-semibold">{getDisplayPlanName()}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">Estado:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    {checkoutResult?.subscriptionStatus || (isTrial ? 'PRUEBA_ACTIVA' : 'ACTIVA')}
                  </span>
                </div>

                {checkoutResult?.trialDays > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">Periodo de Prueba:</span>
                    <span className="text-green-700 font-semibold">{checkoutResult?.trialDays} días gratis</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-t border-dashed border-gray-200">
                  <span className="text-gray-900 font-bold text-base">Total Pagado Hoy:</span>
                  <span className="text-green-600 font-extrabold text-xl">
                    S/ {(checkoutResult?.todayAmount !== undefined ? checkoutResult.todayAmount : (isTrial ? 0 : selectedPlan?.monthlyAmount))?.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">Próxima Facturación:</span>
                  <span className="text-gray-700 font-medium">
                    S/ {(checkoutResult?.monthlyAmount || selectedPlan?.monthlyAmount)?.toFixed(2)} / mes
                  </span>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <span>Iniciar Sesión en el Panel</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Column: Plan Summary */}
            <div className="w-full md:w-[45%] p-8 lg:p-10 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col">
              <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold self-start mb-6 border border-green-100">
                <Leaf className="w-3 h-3" />
                <span>{companyTypeText}</span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedPlan?.name || 'Plan'}</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-gray-900">S/ {selectedPlan?.monthlyAmount.toFixed(2)}</span>
                <span className="text-gray-500 ml-1">/ mes</span>
              </div>

              {isTrial && (
                <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100">
                  <div className="flex items-center text-green-800 font-bold mb-1">
                    <Gift className="w-4 h-4 mr-2" />
                    7 días gratis
                  </div>
                  <p className="text-sm text-green-700 leading-snug">
                    Empieza hoy sin costo y accede a todas las funcionalidades durante el periodo de prueba.
                  </p>
                </div>
              )}

              <div className="flex-grow">
                <p className="text-sm font-semibold text-gray-700 mb-3">Incluye:</p>
                <ul className="space-y-2.5">
                  {[
                    'Solicitudes de recojo',
                    'Trazabilidad QR',
                    'Certificados ambientales',
                    'Historial y estado de pagos'
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Hoy pagas</span>
                  <span className="font-bold text-gray-900">
                    S/ {isTrial ? '0.00' : selectedPlan?.monthlyAmount.toFixed(2)}
                  </span>
                </div>
                {isTrial && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Desde el día 8:</span>
                    <span className="text-sm font-semibold text-gray-700">S/ {selectedPlan?.monthlyAmount.toFixed(2)} / mes</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => navigate(-1)} 
                className="mt-8 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex justify-center items-center w-32"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </button>
            </div>

            {/* Right Column: Payment Method / Welcome */}
            <div className="w-full md:w-[55%] p-8 lg:p-10 relative flex flex-col justify-between min-h-[500px]">
              {!showPaymentForm ? (
                // Step 1: Resumen/Welcome view
                <div className="flex flex-col justify-between h-full flex-grow">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {isTrial ? '¡Tu prueba gratuita está lista!' : 'Activa tu acceso de Recolector'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                      {isTrial 
                        ? 'Estás a solo un paso de comenzar a gestionar tus residuos de forma inteligente y ecológica. Para activar los 7 días de prueba sin costo, es necesario configurar un método de pago para renovación futura.'
                        : 'Para comenzar a registrar rutas, certificar generadores y utilizar la plataforma completa de recojo, activa tu suscripción mensual.'}
                    </p>

                    <div className="bg-green-50/50 border border-green-100 rounded-2xl p-6 mb-6">
                      <h4 className="font-semibold text-gray-900 text-sm mb-3">Resumen de Activación</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Plan seleccionado:</span>
                          <span className="font-medium text-gray-900">{selectedPlan?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Periodo de prueba:</span>
                          <span className="font-medium text-green-700">{isTrial ? '7 días gratis' : 'Sin prueba gratis'}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-100">
                          <span className="font-semibold text-gray-900">Total a pagar hoy:</span>
                          <span className="font-bold text-gray-900">S/ {isTrial ? '0.00' : selectedPlan?.monthlyAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 w-full md:w-auto"
                    >
                      <span>{isTrial ? 'Activar prueba gratis' : 'Pagar y activar acceso'}</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              ) : (
                // Step 2: Payment Form view
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                      {isTrial ? 'Método de pago para renovación' : 'Método de pago'}
                    </h3>
                    <button 
                      onClick={() => setShowPaymentForm(false)} 
                      className="text-xs text-gray-500 hover:text-green-600 flex items-center"
                    >
                      <ArrowLeft className="w-3 h-3 mr-1" />
                      Ver plan
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Tarjeta Option */}
                    <div className="border-2 border-green-500 bg-green-50/30 rounded-xl p-4 flex items-start cursor-pointer relative">
                      <CreditCard className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Tarjeta</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isTrial ? 'Recomendado para suscripción mensual' : 'Recomendado para suscripción'}
                        </p>
                      </div>
                      <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-4 border-green-500 bg-white"></div>
                    </div>

                    {/* Yape Option (Disabled/Visual) */}
                    <div className="border border-gray-200 rounded-xl p-4 flex items-start cursor-not-allowed opacity-60 relative">
                      <div className="w-5 h-5 bg-[#7B2CBF] rounded mr-3 mt-0.5 flex items-center justify-center text-white font-bold text-[10px] italic">Y</div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Yape</p>
                        <p className="text-xs text-gray-500 mt-0.5">Pago único / manual</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start text-xs text-gray-500 mb-8">
                    <Info className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" />
                    <p>La renovación automática mensual requiere tarjeta. Yape puede usarse como pago manual.</p>
                  </div>

                  {/* Simulated payment form */}
                  <div className="space-y-4 mb-8">
                    {/* Whitelist Card Selector */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-2">
                      <span className="text-xs font-semibold text-gray-700 block mb-2">Tarjetas de Prueba (Demostración):</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { number: "4111 1111 1111 1111", label: "Aprobada", scenario: "APPROVED", cvv: "123", expiry: "12/29" },
                          { number: "4111 2222 3333 4444", label: "Aprobada Alt", scenario: "APPROVED", cvv: "123", expiry: "12/29" },
                          { number: "4000 0000 0000 0002", label: "Rechazada", scenario: "REJECTED", cvv: "123", expiry: "12/29" },
                          { number: "4000 0000 0000 9995", label: "Insuficiente", scenario: "FUNDS_INSUFFICIENT", cvv: "123", expiry: "12/29" },
                          { number: "4000 0000 0000 0069", label: "Vencida", scenario: "EXPIRED", cvv: "123", expiry: "12/29" },
                          { number: "4000 0000 0000 0127", label: "CVV Inválido", scenario: "CVV_INVALID", cvv: "999", expiry: "12/29" }
                        ].map((tc) => (
                          <button
                            key={tc.number}
                            type="button"
                            onClick={() => {
                              setCardNumber(tc.number);
                              setCvv(tc.cvv);
                              setExpiry(tc.expiry);
                            }}
                            className="px-2 py-1.5 bg-white border border-gray-300 hover:border-green-500 rounded text-[11px] text-gray-700 font-medium transition-colors text-left truncate flex flex-col justify-between"
                          >
                            <span className="font-bold text-green-700 text-[10px]">{tc.label}</span>
                            <span className="text-[10px] text-gray-500">{tc.number}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre del titular</label>
                        <input 
                          type="text" 
                          placeholder="Ej. Juan Carlos Mamani Condori" 
                          value={cardholderName}
                          onChange={e => setCardholderName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none placeholder:text-gray-400" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
                        <input 
                          type="email" 
                          placeholder="empresa@correo.com" 
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none placeholder:text-gray-400" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Número de tarjeta</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="1234 5678 9012 3456" 
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none placeholder:text-gray-400" 
                        />
                        <CreditCard className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">MM / AA</label>
                        <input 
                          type="text" 
                          placeholder="MM / AA" 
                          value={expiry}
                          onChange={e => setExpiry(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none placeholder:text-gray-400 text-center" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">CVV</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="123" 
                            value={cvv}
                            onChange={e => setCvv(e.target.value)}
                            className="w-full pl-4 pr-8 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none placeholder:text-gray-400 text-center" 
                          />
                          <div className="absolute right-3 top-2.5 w-4 h-4 rounded-full border border-gray-400 text-gray-400 flex items-center justify-center text-[10px] font-bold">?</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de costos para Recolector */}
                  {!isTrial && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Pago inicial:</span>
                          <span className="font-semibold text-gray-900">S/ {selectedPlan?.monthlyAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Renovación mensual:</span>
                          <span className="font-semibold text-gray-900">S/ {selectedPlan?.monthlyAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start mb-6">
                    <Info className="w-4 h-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-800 text-xs">Modo demostración: usa únicamente tarjetas ficticias de prueba. No ingreses datos reales. No se realizará ningún cargo.</h4>
                      <p className="text-[10px] text-blue-700 mt-0.5">Esta API permite validar el flujo académico de activación de suscripciones de forma 100% local y simulada.</p>
                    </div>
                  </div>

                  <div className="flex items-start text-green-700 text-xs mb-8">
                    <Lock className="w-4 h-4 mr-2 shrink-0" />
                    <p>API de Pagos Simulada EcoTacna activa.<br/>No se guarda el número completo de tarjeta ni el CVV.</p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handlePaymentSubmit}
                      disabled={processing || !selectedPlan}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2 w-full md:w-auto justify-center"
                    >
                      <span>
                        {processing 
                          ? 'Procesando...' 
                          : (isTrial ? 'Validar método y activar prueba' : 'Confirmar pago y activar acceso')}
                      </span>
                      {!processing && <ArrowLeft className="w-4 h-4 rotate-180" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!success && (
          <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
            <Lock className="w-3 h-3 mr-1.5" />
            <p>El cobro se realizará después de la aprobación final del registro.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentCheckoutPage;
