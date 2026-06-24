import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PuzzleCaptcha from "@/components/PuzzleCaptcha";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, CheckCircle2, FileText, 
  ShieldCheck, ArrowRight, Star, CreditCard, 
  Lock, Info, AlertCircle, Gift, Sparkles, Building2, MapPin, Building, ChevronRight
} from "lucide-react";
import { rucApi, RucLookupData } from "@/services/rucApi";
import { authApi } from "@/services/authApi";
import { saveAuth, clearStoredAuth, getStoredAuth } from "@/services/authStorage";
import { RucSearchPanel } from "@/components/RucSearchPanel";
import { AuxiliaryCompanyDataForm, AuxiliaryFormData } from "@/components/AuxiliaryCompanyDataForm";
import { paymentApi, SimulatedPaymentResponse } from "@/services/paymentApi";
import { toast } from "sonner";
import { GoogleMapView } from "@/components/maps/GoogleMapView";
import { TransportUnitForm, TransportUnitFormData } from "@/components/transport/TransportUnitForm";

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [rucError, setRucError] = useState<string | null>(null);
  const [registrationNextStep, setRegistrationNextStep] = useState<string | null>(null);

  // Form State
  const [ruc, setRuc] = useState("");
  const [companyData, setCompanyData] = useState<RucLookupData | null>(null);
  const [registeredCompanyId, setRegisteredCompanyId] = useState<number | null>(null);
  const [auxiliaryData, setAuxiliaryData] = useState<AuxiliaryFormData | null>(null);

  const [transportUnitData, setTransportUnitData] = useState<TransportUnitFormData>({
    placa: "",
    marca: "",
    modelo: "",
    capacidadLitros: "",
    tipoUnidad: "Cisterna"
  });

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  // Google Maps and Location States
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [savedMainLocation, setSavedMainLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocationSaved, setIsLocationSaved] = useState(false);
  const [branches, setBranches] = useState<Array<{ name: string; latitude: number; longitude: number; referenceAddress?: string }>>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchCoords, setBranchCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [branchReference, setBranchReference] = useState("");


  // Payment states
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<{
    id: number;
    name: string;
    monthlyAmount: number;
    trialDays: number;
    code: string;
  } | null>(null);
  const [paymentFormActive, setPaymentFormActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Card details
  const [cardName, setCardName] = useState("");
  const [cardEmail, setCardEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paymentResult, setPaymentResult] = useState<SimulatedPaymentResponse | null>(null);

  // Limpiar cualquier sesión existente para evitar contaminación de estado
  useEffect(() => {
    clearStoredAuth();
  }, []);

  const handleRucSearch = async (searchedRuc: string) => {
    setIsLoading(true);
    setRucError(null);
    setRuc(searchedRuc);
    try {
      // 1. Consultar estado del registro en backend
      const statusRes = await authApi.checkRegistrationStatus(searchedRuc);
      const statusData = statusRes.data;

      if (!statusData || statusData.nextStep === "NEW_REGISTRATION") {
        // RUC nuevo, continuar con consulta a ApiPeruDev
        const data = await rucApi.consultarRuc(searchedRuc);
        setCompanyData(data);
        setSelectedCoords({ latitude: -18.0146, longitude: -70.2536 });
        setIsLocationSaved(false);
        setSavedMainLocation(null);
        setBranches([]);
        toast.success("Datos de empresa autocompletados correctamente");
      } else {
        // Empresa existente, manejar ruteo según estado
        switch (statusData.nextStep) {
          case "REVIEW_PENDING":
            toast.info(statusData.message || "Tu empresa está en revisión.");
            setRegistrationNextStep("REVIEW_PENDING");
            setCompanyData({
              ruc: statusData.ruc,
              razonSocial: statusData.razonSocial,
              success: true
            });
            if (statusData.tipoEmpresa) {
              setAuxiliaryData({
                tipoEmpresa: statusData.tipoEmpresa === "GENERADORA" ? "GENERADOR" : "RECOLECTOR",
                correo: statusData.correoContacto || "",
                nombre: "",
                telefono: "",
                password: "",
                confirmPassword: ""
              });
            }
            if (statusData.companyId) setRegisteredCompanyId(statusData.companyId);
            setStep(2);
            window.scrollTo(0, 0);
            break;
            
          case "PAYMENT_PENDING":
            toast.success(statusData.message || "Tu empresa fue aprobada. Continúa con el pago.");
            setRegistrationNextStep("PAYMENT_PENDING");
            setCompanyData({
              ruc: statusData.ruc,
              razonSocial: statusData.razonSocial,
              success: true
            });
            if (statusData.tipoEmpresa) {
              setAuxiliaryData({
                tipoEmpresa: statusData.tipoEmpresa === "GENERADORA" ? "GENERADOR" : "RECOLECTOR",
                correo: statusData.correoContacto || "",
                nombre: "",
                telefono: "",
                password: "",
                confirmPassword: ""
              });
            }
            if (statusData.companyId) setRegisteredCompanyId(statusData.companyId);
            setStep(2);
            window.scrollTo(0, 0);
            break;

          case "ACTIVE_LOGIN":
            toast.error(statusData.message || "Esta empresa ya está registrada y activa. Inicia sesión.");
            setCompanyData(null);
            break;
            
          case "REJECTED":
            toast.error(statusData.message || "El registro de la empresa fue rechazado.");
            setRegistrationNextStep("REJECTED");
            setCompanyData({
              ruc: statusData.ruc,
              razonSocial: statusData.razonSocial,
              success: true
            });
            setStep(5); // Pantalla de rechazo
            window.scrollTo(0, 0);
            break;

          default:
            toast.error(statusData.message || "Estado de registro desconocido.");
            setCompanyData(null);
            break;
        }
      }
    } catch (err: any) {
      console.error("Error al buscar RUC o estado:", err);
      const msg = err.response?.data?.message || err.message || "Servicio de consulta RUC no disponible o backend apagado";
      setRucError(msg);
      setCompanyData(null);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuxiliarySubmit = async (formData: AuxiliaryFormData) => {
    if (!companyData) {
      toast.error("Por favor, busque e ingrese un RUC primero.");
      return;
    }

    if (!isLocationSaved || !savedMainLocation) {
      toast.error("Guarda la ubicación principal de la empresa antes de continuar.");
      return;
    }

    if (!captchaToken) {
      toast.error("Completa el captcha para continuar.");
      return;
    }

    setAuxiliaryData(formData);

    if (formData.tipoEmpresa === "RECOLECTOR") {
      setStep(15); // Step 1.5: Registrar unidad vehicular
      window.scrollTo(0, 0);
      return;
    }

    // Si es GENERADOR, enviar directamente
    await submitFinalRegistration(formData, null);
  };

  const submitFinalRegistration = async (formData: AuxiliaryFormData, transportUnit: TransportUnitFormData | null) => {
    setIsLoading(true);
    const finalPassword = formData.password;

    try {
      const payload: any = {
        ruc: companyData!.ruc,
        email: formData.correo,
        password: finalPassword,
        confirmPassword: formData.confirmPassword,
        firstName: formData.nombre,
        lastName: "-",
        phone: formData.telefono,
        role: formData.tipoEmpresa === "GENERADOR" ? "GENERADOR" : "RECOLECTOR",
        companyType: formData.tipoEmpresa === "GENERADOR" ? "GENERADORA" : "RECOLECTORA",
        latitude: savedMainLocation!.latitude,
        longitude: savedMainLocation!.longitude,
        branches: branches.map(b => ({
          name: b.name,
          latitude: b.latitude,
          longitude: b.longitude,
          referenceAddress: b.referenceAddress
        }))
      };

      if (transportUnit) {
        payload.transportUnit = {
          plate: transportUnit.placa,
          brand: transportUnit.marca,
          model: transportUnit.modelo,
          unitType: transportUnit.tipoUnidad,
          capacityLiters: Number(transportUnit.capacidadLitros)
        };
      }

      // 1. Register Company & Administrator user on Backend
      const regRes = await authApi.register(payload);

      if (regRes.data && regRes.data.companyId) {
        setRegisteredCompanyId(regRes.data.companyId);
      }

      // 2. Perform Auto-login to obtain JWT token for subsequent flows
      try {
        const authRes = await authApi.login(formData.correo, finalPassword, captchaToken);
        if (authRes.data) {
          saveAuth(authRes.data);
        }
      } catch (loginErr) {
        console.warn("Auto-login falló tras el registro. Se continuará con companyId.", loginErr);
      }

      setRegistrationNextStep("REVIEW_PENDING");
      setStep(2);
      window.scrollTo(0, 0);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Error en el registro";
      toast.error(errorMsg);
      if (step === 1) {
        setCaptchaKey(prev => prev + 1);
        setCaptchaToken("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransportUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auxiliaryData) return;

    if (transportUnitData.modelo.trim().length > 20) {
      toast.error("El modelo no puede superar 20 caracteres.");
      return;
    }

    const capacity = Number(transportUnitData.capacidadLitros);
    if (capacity <= 0) {
      toast.error("La capacidad debe ser mayor a 0 litros.");
      return;
    }
    if (capacity > 5000) {
      toast.error("La capacidad máxima permitida es 5000 litros.");
      return;
    }
    if (!Number.isInteger(capacity)) {
      toast.error("La capacidad debe ser un número entero de litros.");
      return;
    }

    await submitFinalRegistration(auxiliaryData, transportUnitData);
  };

  const handleContinueToPayment = () => {
    if (registrationNextStep === "PAYMENT_PENDING") {
      setStep(3);
      window.scrollTo(0, 0);
    }
  };

  const handleSelectPlan = (planType: 'GENERADOR' | 'RECOLECTOR') => {
    const name = planType === 'GENERADOR' ? 'Plan Restaurante / Generador' : 'Plan Empresa Recolectora';
    const amount = planType === 'GENERADOR' ? 29.90 : 299.90;
    const trialDays = planType === 'GENERADOR' ? 7 : 0;
    const code = planType === 'GENERADOR' ? 'GEN_BASIC' : 'REC_BASIC';

    setSelectedPlanDetails({
      id: planType === 'GENERADOR' ? 1 : 2,
      name,
      monthlyAmount: amount,
      trialDays,
      code
    });

    setCardEmail(auxiliaryData?.correo || "");
    setCardName(auxiliaryData?.nombre || "");
    setPaymentFormActive(true);
    setPaymentError(null);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredCompanyId) {
      setPaymentError("ID de la empresa no disponible. Por favor, reinicie el registro.");
      return;
    }
    if (!selectedPlanDetails) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const token = await paymentApi.createSimulatedToken({
        cardNumber,
        cvv: cardCvv,
        expiry: cardExpiry,
        email: cardEmail,
        cardholderName: cardName
      });

      // Clear card details immediately to avoid keeping sensitive data in state
      setCardNumber("");
      setCardCvv("");
      setCardExpiry("");

      const result = await paymentApi.confirmSimulatedPayment(registeredCompanyId, {
        paymentMethod: "CARD",
        simulatedToken: token.id,
        email: cardEmail
      });

      setPaymentResult(result);
      const currentAuth = getStoredAuth();
      if (currentAuth?.companyId === result.companyId) {
        saveAuth({
          ...currentAuth,
          companyName: result.companyName,
          companyType: result.companyType,
          subscriptionStatus: result.subscriptionStatus
        });
      }
      toast.success(result.message || "¡Pago y suscripción activados con éxito!");
      setStep(4);
      window.scrollTo(0, 0);
    } catch (err: any) {
      // Clear card details immediately on error as well
      setCardNumber("");
      setCardCvv("");
      setCardExpiry("");

      console.error("Error al procesar pago:", err);
      const errorMsg = err.response?.data?.message || err.message || "Error al procesar el pago.";
      setPaymentError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishAndNavigate = () => {
    if (!paymentResult || !["ACTIVA", "PRUEBA_ACTIVA"].includes(paymentResult.subscriptionStatus)) {
      toast.error("El backend aun no confirma una suscripcion activa. Completa el pago antes de ingresar al panel.");
      return;
    }

    const currentAuth = getStoredAuth();
    if (!currentAuth || !currentAuth.token) {
      toast.info("Por favor, inicia sesión para acceder a tu panel.");
      navigate("/login");
      return;
    }

    // Redirige al panel correspondiente
    if (paymentResult.companyType === "GENERADORA" || auxiliaryData?.tipoEmpresa === "GENERADOR") {
      navigate("/empresa");
    } else {
      navigate("/recolector");
    }
  };

  const AutocompleteField = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1.5 animate-fadeIn min-w-0">
      <div className="flex justify-between items-center gap-2">
        <Label className="text-xs font-semibold text-gray-600 truncate">{label}</Label>
        <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium border border-green-100 flex items-center gap-0.5 shrink-0">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span className="hidden sm:inline">Autocompletado</span>
          <span className="sm:hidden">Auto</span>
        </span>
      </div>
      <div className="relative">
        <Input 
          disabled 
          value={value || "No especificado"} 
          className="bg-green-50/10 border-green-200/50 text-gray-800 disabled:opacity-100 pr-10 rounded-xl h-10 text-sm min-w-0 truncate" 
        />
        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-green-600 pointer-events-none" />
      </div>
    </div>
  );

  const handleSelectPosition = (coords: { latitude: number; longitude: number }) => {
    setSelectedCoords(coords);
    setIsLocationSaved(false);
  };

  const handleSaveMainLocation = () => {
    if (!selectedCoords) {
      toast.error("Por favor, selecciona un punto en el mapa primero.");
      return;
    }
    setSavedMainLocation(selectedCoords);
    setIsLocationSaved(true);
    toast.success("Ubicación principal guardada correctamente.");
  };

  const handleOpenBranchModal = () => {
    if (!isLocationSaved) {
      toast.error("Guarda la ubicación principal del restaurante antes de agregar otras sedes.");
      return;
    }
    setBranchName(`Sede adicional ${branches.length + 1}`);
    setBranchCoords(null);
    setBranchReference("");
    setIsBranchModalOpen(true);
  };

  const handleBranchSelectPosition = (coords: { latitude: number; longitude: number }) => {
    setBranchCoords(coords);
  };

  const handleSaveBranch = () => {
    if (!branchCoords) {
      toast.error("Selecciona la ubicación de la sede en el mapa del modal.");
      return;
    }
    if (!branchName.trim()) {
      toast.error("El nombre de la sede es obligatorio.");
      return;
    }
    
    const newCoordStr = branchCoords.latitude.toFixed(7) + "," + branchCoords.longitude.toFixed(7);
    const mainCoordStr = savedMainLocation!.latitude.toFixed(7) + "," + savedMainLocation!.longitude.toFixed(7);
    if (newCoordStr === mainCoordStr) {
      toast.error("La ubicación de la sede adicional no puede ser idéntica a la sede principal.");
      return;
    }
    
    const duplicateCoord = branches.some(b => b.latitude.toFixed(7) + "," + b.longitude.toFixed(7) === newCoordStr);
    if (duplicateCoord) {
      toast.error("Esta ubicación ya está registrada para otra sede.");
      return;
    }

    const duplicateName = branches.some(b => b.name.toLowerCase() === branchName.trim().toLowerCase());
    if (duplicateName) {
      toast.error("Ya existe una sede con este nombre.");
      return;
    }

    setBranches(prev => [...prev, {
      name: branchName.trim(),
      latitude: branchCoords.latitude,
      longitude: branchCoords.longitude,
      referenceAddress: branchReference.trim()
    }]);
    setIsBranchModalOpen(false);
    toast.success("Sede adicional agregada.");
  };


  const renderStep1 = () => {
    if (!companyData) {
      return (
        <Card className="p-8 border border-gray-100 shadow-xl max-w-5xl mx-auto rounded-2xl bg-white space-y-8 animate-fadeIn">
          <div className="flex items-start gap-4 pb-4 border-b border-gray-50">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Datos principales con RUC</h2>
              <p className="text-sm text-gray-500">Ingresa el RUC de tu empresa para autocompletar la información.</p>
            </div>
          </div>
          
          {/* RUC search box */}
          <RucSearchPanel
            onSearch={handleRucSearch}
            onIncomplete={() => {
              setRucError(null);
              setCompanyData(null);
              setSelectedCoords(null);
              setSavedMainLocation(null);
              setIsLocationSaved(false);
              setBranches([]);
            }}
            isLoading={isLoading}
            error={rucError}
          />
          
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            Consulta RUC desde el backend EcoTacna.
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            Los datos se consultan mediante ApiPeruDev desde el backend. El token del proveedor no se expone al navegador.
          </p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-[minmax(650px,0.95fr)_minmax(760px,1.05fr)] 2xl:grid-cols-[minmax(700px,0.95fr)_minmax(820px,1.05fr)] items-start w-full animate-fadeIn">
        {/* Columna Izquierda: Formulario ampliado */}
        <div className="w-full space-y-6">
          <Card className="w-full p-8 lg:p-10 border border-gray-100 shadow-xl rounded-[28px] bg-white space-y-6">
            <div className="flex items-start gap-4 pb-4 border-b border-gray-50">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Datos principales con RUC</h2>
                <p className="text-sm text-gray-500">Ingresa el RUC de tu empresa para autocompletar la información.</p>
              </div>
            </div>
            
            {/* RUC search box */}
            <RucSearchPanel
              onSearch={handleRucSearch}
              onIncomplete={() => {
                setRucError(null);
                setCompanyData(null);
                setSelectedCoords(null);
                setSavedMainLocation(null);
                setIsLocationSaved(false);
                setBranches([]);
              }}
              isLoading={isLoading}
              error={rucError}
            />
            
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Consulta RUC desde el backend EcoTacna.
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Los datos se consultan mediante ApiPeruDev desde el backend. El token del proveedor no se expone al navegador.
            </p>

            <div className="bg-green-50/10 rounded-2xl p-6 border border-green-100/60 space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-gray-900 text-sm">Datos de la empresa</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-0 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  RUC REAL
                </Badge>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-0 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Fuente: ApiPeruDev
                </Badge>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-5">
                <AutocompleteField label="Razón social" value={companyData.razonSocial} />
                <AutocompleteField label="Nombre comercial" value={companyData.nombreComercial || "No especificado"} />
                <AutocompleteField label="Dirección fiscal" value={companyData.direccionFiscal || "No registrada"} />
                <AutocompleteField label="Distrito" value={companyData.distrito || "TACNA"} />
                <AutocompleteField label="Provincia" value={companyData.provincia || "TACNA"} />
                <AutocompleteField label="Departamento" value={companyData.departamento || "TACNA"} />
                <AutocompleteField label="Estado del contribuyente" value={companyData.estadoContribuyente || "ACTIVO"} />
                <AutocompleteField label="Condición de domicilio" value={companyData.condicionDomicilio || "HABIDO"} />
              </div>
            </div>

            {/* Auxiliary form */}
            <AuxiliaryCompanyDataForm onSubmit={handleAuxiliarySubmit} isLoading={isLoading} />

            <div className="flex justify-center py-4">
              <PuzzleCaptcha
                key={captchaKey}
                onVerify={setCaptchaToken}
              />
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Ubicación del restaurante ampliada */}
        <div className="w-full space-y-6">
          <Card className="w-full p-8 lg:p-10 border border-gray-100 shadow-xl rounded-[28px] bg-white space-y-6">
            <div className="flex items-start gap-4 pb-4 border-b border-gray-50">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ubicación del restaurante</h2>
                <p className="text-xs text-gray-500">Confirma la ubicación exacta de tu restaurante en el mapa. Puedes ajustar el marcador manualmente si es necesario.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">Dirección (según SUNAT)</Label>
              <textarea
                readOnly
                value={companyData.direccionFiscal || "No registrada"}
                className="w-full bg-gray-50/50 border border-gray-200 text-gray-800 disabled:opacity-100 rounded-xl p-3 text-xs leading-relaxed outline-none min-h-[50px] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-500 italic mt-1 leading-relaxed">
                Haz clic en el mapa para marcar la ubicación exacta del restaurante.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm relative h-[320px] md:h-[380px] xl:h-[500px] 2xl:h-[540px] w-full">
              <GoogleMapView
                height="100%"
                selectable={true}
                selectedPosition={selectedCoords}
                onSelectPosition={handleSelectPosition}
                selectionLabel="Sede principal"
              />
            </div>

            <p className="text-[10px] text-gray-500 italic flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-green-600 shrink-0" />
              Puedes hacer clic en el mapa para marcar la ubicación exacta.
            </p>

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={handleSaveMainLocation}
                className={`w-full h-11 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
                  isLocationSaved
                    ? "bg-green-700 hover:bg-green-800 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLocationSaved ? "✓ Ubicación principal guardada" : "Guardar ubicación en el mapa"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleOpenBranchModal}
                className="w-full h-11 font-bold rounded-xl transition-all border-green-200 text-green-700 hover:bg-green-50/50 flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Agregar otra sede
              </Button>
            </div>

            {/* List of registered branches */}
            {branches.length > 0 && (
              <div className="space-y-3 border-t border-gray-50 pt-4">
                <span className="text-xs font-bold text-gray-700 block">Sedes adicionales ({branches.length}):</span>
                <div className="space-y-2">
                  {branches.map((b, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-150 rounded-xl p-3 text-xs animate-fadeIn">
                      <div className="space-y-0.5 max-w-[80%]">
                        <span className="font-bold text-gray-800 block">{b.name}</span>
                        <span className="text-[10px] text-gray-500 block truncate">
                          Lat: {b.latitude.toFixed(5)}, Lng: {b.longitude.toFixed(5)}
                        </span>
                        {b.referenceAddress && (
                          <span className="text-[10px] text-gray-400 block italic truncate">Ref: {b.referenceAddress}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setBranches(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  };

  const renderStep15 = () => {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Registro de Unidad Vehicular</h2>
          <p className="text-sm text-gray-500">
            Como empresa recolectora, debes registrar al menos una unidad de transporte inicial.
          </p>
        </div>

        <Card className="p-6 md:p-8 border-gray-150 shadow-sm rounded-3xl">
          <TransportUnitForm 
            value={transportUnitData}
            onChange={setTransportUnitData}
            onSubmit={handleTransportUnitSubmit}
            submitting={isLoading}
            editing={false}
            hideStatusAndObservations={true}
          />
        </Card>

        <div className="flex justify-start">
          <Button 
            variant="ghost" 
            onClick={() => {
              setStep(1);
              window.scrollTo(0, 0);
            }} 
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a datos de la empresa
          </Button>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <Card className="p-10 border border-gray-100 shadow-xl max-w-2xl mx-auto text-center rounded-2xl bg-white space-y-6">
      <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm animate-pulse">
        <ShieldCheck className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Tu empresa está en revisión</h2>
      <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
        Hemos registrado tu solicitud para <span className="font-semibold text-gray-800">{companyData?.razonSocial}</span>. 
        Nuestro equipo de administración verificará tu información comercial para habilitar tu cuenta en un plazo de 24 horas.
      </p>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-left space-y-3 text-sm">
        <h4 className="font-bold text-gray-800">Resumen de Registro</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <span className="font-semibold">RUC:</span>
          <span>{companyData?.ruc}</span>
          <span className="font-semibold">Razón Social:</span>
          <span>{companyData?.razonSocial}</span>
          <span className="font-semibold">Tipo de Cuenta:</span>
          <span>{auxiliaryData?.tipoEmpresa === "GENERADOR" ? "Generador (Restaurante)" : "Empresa Recolectora"}</span>
          <span className="font-semibold">Correo de contacto:</span>
          <span>{auxiliaryData?.correo}</span>
        </div>
      </div>
      
      <div className="space-y-3 pt-2">
        <Button 
          onClick={handleContinueToPayment}
          disabled={registrationNextStep !== "PAYMENT_PENDING"}
          className={`w-full h-12 font-bold rounded-xl transition-all ${
            registrationNextStep === "PAYMENT_PENDING" 
              ? "bg-green-600 hover:bg-green-700 text-white shadow-md" 
              : "bg-green-600/50 text-white cursor-not-allowed"
          }`}
        >
          {registrationNextStep === "PAYMENT_PENDING" ? "Continuar al Plan y Pago" : "Continuar"}
        </Button>

        <Link to="/" className="block">
          <Button variant="outline" className="w-full h-11 rounded-xl">Volver al inicio</Button>
        </Link>
      </div>
    </Card>
  );

  const renderStep3 = () => {
    if (paymentFormActive && selectedPlanDetails) {
      const isTrial = selectedPlanDetails.trialDays > 0;

      return (
        <Card className="p-8 border border-gray-100 shadow-xl max-w-2xl mx-auto rounded-3xl bg-white space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <button 
              onClick={() => setPaymentFormActive(false)} 
              disabled={isProcessing}
              className="text-xs font-semibold text-gray-500 hover:text-green-600 flex items-center transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a planes
            </button>
            <Badge className="bg-green-50 text-green-700 border border-green-200 font-semibold px-2 py-0.5 rounded-full text-[10px]">
              Pago Seguro
            </Badge>
          </div>

          <div className="bg-green-50/40 border border-green-100/60 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-sm">Resumen del Plan</h4>
              <Badge className="bg-green-600 text-white hover:bg-green-600 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                {selectedPlanDetails.trialDays > 0 ? "Prueba Gratis" : "Suscripción"}
              </Badge>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="flex justify-between"><span className="text-gray-500">Plan Seleccionado:</span> <span className="font-semibold text-gray-900">{selectedPlanDetails.name}</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Monto de Renovación:</span> <span className="font-semibold text-gray-900">S/ {selectedPlanDetails.monthlyAmount.toFixed(2)} / mes</span></p>
              {isTrial && <p className="flex justify-between text-green-700 font-medium"><span className="text-green-600">Periodo de Prueba:</span> <span>{selectedPlanDetails.trialDays} días gratis</span></p>}
              <div className="border-t border-dashed border-green-200/65 my-2 pt-2 flex justify-between font-bold text-gray-900">
                <span>Hoy pagas:</span>
                <span className="text-green-600 text-sm">S/ {isTrial ? "0.00" : selectedPlanDetails.monthlyAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {paymentError && (
            <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 text-red-800 animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="font-bold text-xs">Error de Transacción</AlertTitle>
              <AlertDescription className="text-[11px] leading-snug">{paymentError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePayment} className="space-y-4">
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
                      setCardCvv(tc.cvv);
                      setCardExpiry(tc.expiry);
                    }}
                    className="px-2 py-1.5 bg-white border border-gray-300 hover:border-green-500 rounded text-[11px] text-gray-700 font-medium transition-colors text-left truncate flex flex-col justify-between"
                  >
                    <span className="font-bold text-green-700 text-[10px]">{tc.label}</span>
                    <span className="text-[10px] text-gray-500">{tc.number}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">Titular de Tarjeta</Label>
                <Input 
                  type="text" 
                  required
                  disabled={isProcessing}
                  placeholder="Ej. Juan Pérez Ramos" 
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="rounded-xl h-10 border-gray-300/80 text-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">Correo de Confirmación</Label>
                <Input 
                  type="email" 
                  required
                  disabled={isProcessing}
                  placeholder="ejemplo@correo.com" 
                  value={cardEmail}
                  onChange={(e) => setCardEmail(e.target.value)}
                  className="rounded-xl h-10 border-gray-300/80 text-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1 block">Número de Tarjeta</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  required
                  disabled={isProcessing}
                  placeholder="4111 2222 3333 4444" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="rounded-xl h-10 border-gray-300/80 text-sm pl-10 focus:ring-green-500 focus:border-green-500"
                />
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">MM / AA</Label>
                <Input 
                  type="text" 
                  required
                  disabled={isProcessing}
                  placeholder="MM/AA" 
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="rounded-xl h-10 border-gray-300/80 text-sm text-center focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">CVV</Label>
                <Input 
                  type="password" 
                  required
                  maxLength={4}
                  disabled={isProcessing}
                  placeholder="123" 
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="rounded-xl h-10 border-gray-300/80 text-sm text-center focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-[11px] text-blue-700 flex items-start gap-2 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800 mb-0.5">Modo demostración: usa únicamente tarjetas ficticias de prueba. No ingreses datos reales. No se realizará ningún cargo.</p>
                <p>Esta API permite validar el flujo académico de activación de suscripciones de forma 100% local y simulada.</p>
              </div>
            </div>

            <div className="flex items-center text-[10px] text-green-700 font-medium">
              <Lock className="w-3.5 h-3.5 mr-1" />
              Verificación segura de acceso para ambiente de pruebas.
            </div>

            <Button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Procesando pago seguro...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  Confirmar y activar acceso <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </Card>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Selecciona tu Plan</h2>
          <p className="text-sm text-gray-500">Tu cuenta ha sido aprobada. Activa tu acceso seleccionando el tipo de cuenta contratada.</p>
        </div>
        
        <div className={`grid ${auxiliaryData?.tipoEmpresa ? 'md:grid-cols-1 max-w-md' : 'md:grid-cols-2 max-w-3xl'} gap-6 mx-auto`}>
          {/* Card 1: Restaurante / Generador */}
          {(!auxiliaryData?.tipoEmpresa || auxiliaryData?.tipoEmpresa === "GENERADOR") && (
          <Card className={`p-8 border-2 bg-white flex flex-col justify-between rounded-3xl transition-all shadow-md ${
            auxiliaryData?.tipoEmpresa === "GENERADOR" ? "border-green-500 ring-2 ring-green-500/10 scale-105" : "border-gray-150"
          }`}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none font-semibold px-3 py-1 rounded-full text-xs">
                  7 días gratis
                </Badge>
                <span className="text-xs font-semibold text-gray-400">GENERADOR</span>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">Restaurante / Generador</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">S/ 29.90</span>
                  <span className="text-gray-400 text-sm font-semibold">/ mes</span>
                </div>
              </div>

              <p className="text-gray-500 text-xs leading-relaxed">
                Para restaurantes, pollerías y negocios que generan aceite usado y desean solicitar recojos de forma ordenada desde EcoTacna.
              </p>

              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  Solicitudes de recojo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  Seguimiento de solicitudes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  Registro de recojos realizados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  Historial y estado de pagos
                </li>
              </ul>
            </div>

            <div className="mt-8 space-y-3">
              <div className="text-left text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Hoy pagas:</span>
                  <span className="font-bold text-green-600">S/ 0.00</span>
                </div>
                <div className="flex justify-between text-gray-400 mt-0.5">
                  <span>Luego:</span>
                  <span>S/ 29.90 al mes</span>
                </div>
              </div>
              <Button 
                onClick={() => handleSelectPlan('GENERADOR')}
                disabled={auxiliaryData?.tipoEmpresa !== "GENERADOR"}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl transition-colors shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
              >
                Solicitar prueba gratis
              </Button>
            </div>
          </Card>
          )}

          {/* Card 2: Empresa recolectora */}
          {(!auxiliaryData?.tipoEmpresa || auxiliaryData?.tipoEmpresa === "RECOLECTOR") && (
          <Card className={`p-8 border-2 bg-white flex flex-col justify-between rounded-3xl transition-all shadow-md ${
            auxiliaryData?.tipoEmpresa === "RECOLECTOR" ? "border-green-500 ring-2 ring-green-500/10 scale-105" : "border-gray-150"
          }`}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-semibold px-3 py-1 rounded-full text-xs">
                  Suscripción Mensual
                </Badge>
                <span className="text-xs font-semibold text-gray-400">RECOLECTOR</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">Empresa recolectora</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">S/ 299.90</span>
                  <span className="text-gray-400 text-sm font-semibold">/ mes</span>
                </div>
              </div>

              <p className="text-gray-500 text-xs leading-relaxed">
                Para empresas recolectoras autorizadas que atenderán recojos y operarán desde el panel del sistema.
              </p>

              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  Panel operativo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  Gestión de recojos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  Rutas y cobertura
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  Liquidaciones y reportes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  Control de suscripción
                </li>
              </ul>
            </div>

            <div className="mt-8 space-y-3">
              <div className="text-left text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Pago inicial:</span>
                  <span className="font-bold font-semibold text-gray-900">S/ 299.90</span>
                </div>
                <div className="flex justify-between text-gray-400 mt-0.5">
                  <span>Renovación:</span>
                  <span>mensual</span>
                </div>
              </div>
              <Button 
                onClick={() => handleSelectPlan('RECOLECTOR')}
                disabled={auxiliaryData?.tipoEmpresa !== "RECOLECTOR"}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl transition-colors shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
              >
                Pagar para ingresar
              </Button>
            </div>
          </Card>
          )}
        </div>

        {/* Franja de métodos de pago */}
        <div className="max-w-md mx-auto text-center bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs text-gray-500">
          <p className="font-semibold text-gray-600 mb-1.5">Métodos de pago disponibles:</p>
          <div className="flex justify-center items-center gap-3">
            <span>Tarjeta de Crédito/Débito (pago simulado)</span>
            <span>•</span>
            <span>Yape (demostración)</span>
            <span>•</span>
            <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-150">Simulador EcoTacna</span>
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    return (
      <Card className="p-8 border border-gray-100 shadow-xl max-w-2xl mx-auto text-center rounded-3xl bg-white space-y-6">
        <div className="relative w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-sm border border-green-100 animate-bounce">
          <Sparkles className="absolute top-1 right-1 w-5 h-5 text-green-500 fill-green-500" />
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">¡Activación Exitosa!</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {paymentResult?.message || "Tu suscripción ha sido validada y activada con éxito. Ya puedes acceder al sistema."}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-left space-y-3.5 text-xs text-gray-600">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <Building2 className="w-4 h-4 text-green-600" />
            <span className="font-bold text-gray-800 text-sm">Resumen de tu Suscripción</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2.5">
            <span className="font-semibold text-gray-500">Empresa:</span>
            <span className="text-gray-900 font-bold text-right">{paymentResult?.companyName || companyData?.razonSocial}</span>

            <span className="font-semibold text-gray-500">Tipo de Empresa:</span>
            <span className="text-gray-900 font-semibold text-right">
              {paymentResult?.companyType === "GENERADORA" ? "Generadora (Restaurante)" : "Recolectora"}
            </span>

            <span className="font-semibold text-gray-500">Plan Contratado:</span>
            <span className="text-gray-900 font-semibold text-right">{paymentResult?.planName || selectedPlanDetails?.name}</span>

            <span className="font-semibold text-gray-500">Estado de Cuenta:</span>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-800 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                {paymentResult?.subscriptionStatus || "ACTIVA"}
              </Badge>
            </div>

            {paymentResult?.trialDays > 0 && (
              <>
                <span className="font-semibold text-gray-500">Días Gratis:</span>
                <span className="text-green-700 font-bold text-right">{paymentResult.trialDays} días gratis</span>
              </>
            )}

            <div className="col-span-2 border-t border-dashed border-gray-200 my-2 pt-2 flex justify-between items-center text-sm">
              <span className="font-bold text-gray-800">Total cobrado hoy:</span>
              <span className="text-green-600 font-extrabold text-base">S/ {paymentResult?.todayAmount?.toFixed(2) || "0.00"}</span>
            </div>

            <div className="col-span-2 flex justify-between items-center">
              <span className="font-medium text-gray-500">Próxima renovación mensual:</span>
              <span className="text-gray-700 font-bold">S/ {paymentResult?.monthlyAmount?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleFinishAndNavigate}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
        >
          Ir al Panel de Control <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>
    );
  };

  const renderStep5 = () => {
    return (
      <Card className="p-10 border border-red-100 shadow-xl max-w-2xl mx-auto text-center rounded-2xl bg-white space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Tu solicitud fue denegada</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          La solicitud de registro para la empresa <span className="font-semibold text-gray-800">{companyData?.razonSocial}</span> fue denegada por el equipo administrativo.
        </p>
        <div className="bg-red-50/50 rounded-xl p-5 border border-red-100 text-sm text-red-800">
          <p>Para más información sobre el estado de tu cuenta, comunícate con:</p>
          <a href="mailto:admin@ecotacna.com" className="font-bold hover:underline block mt-2 text-red-700">admin@ecotacna.com</a>
        </div>
        <Link to="/" className="block pt-4">
          <Button variant="outline" className="w-full h-11 rounded-xl">Volver al inicio</Button>
        </Link>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/60 to-white flex flex-col justify-between font-sans">
      <div>
        <header className="container py-4 flex items-center justify-between">
          <Logo />
          <Link to="/" className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
        </header>

        <div className="mx-auto w-full max-w-[1680px] px-6 lg:px-8 2xl:px-10 pb-10 pt-8">
          {/* Header text layout */}
          <div className="text-center mb-10 space-y-2">
            <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-200/50 mb-3 px-3 py-1 font-semibold rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 inline-block text-green-600" /> Registro y suscripción
            </Badge>
            <h1 className="text-3xl font-extrabold mb-2 text-gray-900 tracking-tight">Registra tu empresa</h1>
            <p className="text-gray-500 text-sm max-w-md mx-auto">Ingresa tu RUC para autocompletar los datos principales de tu empresa y luego completa la información auxiliar.</p>
          </div>

          {/* Stepper matching guidelines */}
          <div className="max-w-4xl mx-auto mb-10 hidden md:block">
            <div className="flex justify-between items-center relative px-8">
              <div className="absolute left-10 right-10 top-4 h-[2px] bg-gray-100 -z-10"></div>
              <div className="absolute left-10 top-4 h-[2px] bg-green-600 -z-10 transition-all duration-500" style={{ width: `${(step - 1) * 25}%` }}></div>
              
              {[
                { num: 1, label: "Registro de empresa" },
                { num: 2, label: "Verificación" },
                { num: 3, label: "Plan y pago" },
                { num: 4, label: "Confirmación" },
                { num: 5, label: "Acceso al sistema" },
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white transition-colors duration-300 ${
                    step >= s.num ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {s.num}
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${step >= s.num ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {step === 1 && renderStep1()}
          {step === 15 && renderStep15()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>
      </div>

      {/* Modal de Sedes Adicionales */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6 animate-fadeIn">
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-2xl max-h-[90vh] w-[95vw] max-w-[1200px] overflow-y-auto p-6 md:p-8 space-y-6 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Agregar sede adicional</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsBranchModalOpen(false)} 
                className="text-gray-400 hover:text-gray-800 text-2xl font-semibold transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)] items-start">
              {/* Columna Izquierda: Inputs y acciones */}
              <div className="space-y-6 flex flex-col h-full">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Nombre de la sede *</Label>
                    <Input 
                      value={branchName}
                      onChange={e => setBranchName(e.target.value)}
                      placeholder="Ej: Sede adicional 1"
                      className="rounded-xl border-gray-250 h-11"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Referencia (opcional)</Label>
                    <Input 
                      value={branchReference}
                      onChange={e => setBranchReference(e.target.value)}
                      placeholder="Ej: Frente a la plaza"
                      className="rounded-xl border-gray-250 h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 italic mt-1 leading-relaxed">
                      Haz clic en el mapa para marcar la ubicación exacta de esta sede.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-gray-50">
                  <Button 
                    type="button" 
                    onClick={handleSaveBranch} 
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 font-bold w-full"
                  >
                    Guardar Sede
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsBranchModalOpen(false)} 
                    className="rounded-xl h-11 w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>

              {/* Columna Derecha: Mapa grande */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 block mb-1">Ubicación en el mapa (Haz clic para marcar) *</Label>
                <div className="border border-gray-200 rounded-[20px] overflow-hidden shadow-sm relative h-[360px] md:h-[430px] xl:h-[500px] w-full">
                  <GoogleMapView
                    height="100%"
                    selectable={true}
                    selectedPosition={branchCoords}
                    onSelectPosition={handleBranchSelectPosition}
                    selectionLabel="Sede adicional"
                  />
                </div>
                {branchCoords && (
                  <p className="text-[11px] text-green-700 font-bold bg-green-50 px-3 py-2 rounded-lg inline-block mt-2">
                    ✓ Marcado: {branchCoords.latitude.toFixed(6)}, {branchCoords.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="py-5 border-t border-gray-100 text-center text-xs text-gray-450 bg-white">
        <div className="container">
          EcoTacna © 2026 · Plataforma de Gestión Sostenible de Aceite Vegetal Usado
        </div>
      </footer>
    </div>
  );
}
