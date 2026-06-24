import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { publicApi } from "@/services/publicApi";
import { toast } from "sonner";

interface PuzzleCaptchaProps {
  onVerify: (token: string) => void;
}

export default function PuzzleCaptcha({ onVerify }: PuzzleCaptchaProps) {
  const [backgroundImage, setBackgroundImage] = useState("");
  const [puzzlePieceImage, setPuzzlePieceImage] = useState("");
  const [token, setToken] = useState("");
  const [y, setY] = useState(0);
  const [sliderVal, setSliderVal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const fetchChallenge = async () => {
    setIsLoading(true);
    setIsVerified(false);
    try {
      const res = await publicApi.getCaptchaChallenge();
      setBackgroundImage(res.backgroundImage);
      setPuzzlePieceImage(res.puzzlePieceImage);
      setToken(res.captchaToken);
      setY(res.y);
      setSliderVal(0);
      onVerify(""); // Reiniciar el token en el formulario principal
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar el captcha de rompecabezas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isVerified) return;
    const val = parseInt(e.target.value, 10);
    setSliderVal(val);
  };

  const handleVerify = async () => {
    if (!token || isVerified) return;
    setIsLoading(true);
    try {
      const success = await publicApi.verifyCaptchaChallenge(token, sliderVal);
      if (success) {
        setIsVerified(true);
        toast.success("Captcha completado");
        onVerify(token); // Solo pasamos el token, ya no la coordenada
      } else {
        toast.error("Captcha incorrecto. Intenta de nuevo.");
        fetchChallenge(); // reiniciar
      }
    } catch (err) {
      toast.error("Error al verificar captcha.");
      fetchChallenge(); // reiniciar
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-[332px] mx-auto">
      <div className="relative w-[300px] h-[150px] bg-zinc-100 rounded-xl overflow-hidden shadow-inner group">
        {backgroundImage ? (
          <>
            <img
              src={backgroundImage}
              alt="Fondo"
              className="w-full h-full object-cover pointer-events-none select-none"
            />
            <img
              src={puzzlePieceImage}
              alt="Pieza"
              className="absolute w-[40px] h-[40px] pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              style={{
                left: `${sliderVal}px`,
                top: `${y}px`,
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
            {isLoading && !isVerified ? "Cargando desafío..." : "Error al cargar"}
          </div>
        )}

        {/* Botón de recarga */}
        {!isVerified && (
          <button
            type="button"
            onClick={fetchChallenge}
            disabled={isLoading}
            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Actualizar captcha"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        )}
        
        {isVerified && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-bold text-green-700">Verificado</span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 font-medium px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className={`w-3.5 h-3.5 ${isVerified ? "text-green-600" : "text-zinc-400"}`} />
            Control de seguridad
          </span>
          <span className="text-[10px] text-zinc-400">{isVerified ? "Completado" : "Desliza la pieza"}</span>
        </div>

        <div className="relative flex items-center w-full h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-2">
          {/* Texto de fondo */}
          {!isVerified && (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-zinc-400 font-medium pointer-events-none select-none">
              Arrastra el deslizador
            </div>
          )}

          <input
            type="range"
            min="0"
            max="260"
            value={sliderVal}
            onChange={handleSliderChange}
            onMouseUp={handleVerify}
            onTouchEnd={handleVerify}
            disabled={!token || isVerified || isLoading}
            className="w-full h-8 appearance-none bg-transparent cursor-pointer relative z-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${isVerified ? '#16a34a' : '#22c55e'}; /* Verde brillante o verde oscuro */
          cursor: ${isVerified ? 'default' : 'grab'};
          box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 0 0 2px #fff;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:active {
          cursor: ${isVerified ? 'default' : 'grabbing'};
          background: #16a34a; /* Verde más oscuro al arrastrar */
          transform: ${isVerified ? 'none' : 'scale(1.1)'};
        }
        input[type="range"]::-moz-range-thumb {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${isVerified ? '#16a34a' : '#22c55e'};
          cursor: ${isVerified ? 'default' : 'grab'};
          box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 0 0 2px #fff;
          border: none;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        input[type="range"]::-moz-range-thumb:active {
          cursor: ${isVerified ? 'default' : 'grabbing'};
          background: #16a34a;
          transform: ${isVerified ? 'none' : 'scale(1.1)'};
        }
      `}</style>
    </div>
  );
}

