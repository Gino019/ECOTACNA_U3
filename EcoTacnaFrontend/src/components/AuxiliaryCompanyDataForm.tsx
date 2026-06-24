import React, { useState } from "react";
import { Users, Save, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export interface AuxiliaryFormData {
  tipoEmpresa: "GENERADOR" | "RECOLECTOR";
  correo: string;
  telefono: string;
  nombre: string;
  cargo: string;
  referencia: string;
  password: string;
  confirmPassword: string;
}

interface AuxiliaryCompanyDataFormProps {
  onSubmit: (data: AuxiliaryFormData) => void;
  isLoading: boolean;
}

export const AuxiliaryCompanyDataForm: React.FC<AuxiliaryCompanyDataFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [tipoEmpresa, setTipoEmpresa] = useState<"GENERADOR" | "RECOLECTOR">("GENERADOR");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.startsWith("51") && value.length > 9) {
      value = value.substring(2);
    }
    if (value.length > 0 && value[0] !== "9") {
      value = "";
    }
    if (value.length > 9) {
      value = value.substring(0, 9);
    }
    setTelefono(value);
  };

  const formatPhoneVisually = (phone: string) => {
    if (!phone) return "";
    let formatted = phone;
    if (phone.length > 6) {
      formatted = `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    } else if (phone.length > 3) {
      formatted = `${phone.slice(0, 3)} ${phone.slice(3)}`;
    }
    return formatted;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]/g, "");
    setNombre(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!correo.trim()) {
      toast.error("El correo electrónico es obligatorio.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      toast.error("Ingrese un correo electrónico válido.");
      return;
    }
    if (!telefono.trim()) {
      toast.error("El teléfono es obligatorio.");
      return;
    }
    if (telefono.trim().length !== 9 || !telefono.startsWith("9")) {
      toast.error("Ingrese un celular peruano válido de 9 dígitos que empiece con 9.");
      return;
    }
    if (!nombre.trim()) {
      toast.error("La persona de contacto es obligatoria.");
      return;
    }
    const contactNameRegex = /^(?!.*\s{2,})(?!.*\.{2,})(?![.\-'\s])(?!.*[.\-'\s]$)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ .'-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
    if (!contactNameRegex.test(nombre.trim()) || nombre.trim().length < 3 || nombre.trim().length > 80) {
      toast.error("Ingrese un nombre de contacto válido. Use solo letras, espacios, punto, guion o apóstrofo.");
      return;
    }
    if (!password) {
      toast.error("La contraseña es obligatoria.");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      toast.error("La contraseña debe contener al menos una letra y un número.");
      return;
    }
    if (!confirmPassword) {
      toast.error("Debe confirmar su contraseña.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    onSubmit({
      tipoEmpresa,
      correo: correo.trim(),
      telefono: telefono.trim(),
      nombre: nombre.trim(),
      cargo: cargo.trim(),
      referencia: referencia.trim(),
      password,
      confirmPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 text-gray-900 border-b border-gray-100 pb-3">
        <Users className="w-5 h-5 text-green-600" />
        <h3 className="font-bold text-base text-gray-800">Completa los datos auxiliares</h3>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="tipo-empresa" className="text-xs font-semibold text-gray-700">
            Tipo de empresa *
          </Label>
          <Select
            value={tipoEmpresa}
            onValueChange={(v: "GENERADOR" | "RECOLECTOR") => setTipoEmpresa(v)}
          >
            <SelectTrigger id="tipo-empresa" className="rounded-xl border-gray-200 h-11 focus:ring-green-500">
              <SelectValue placeholder="Seleccione tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GENERADOR">Restaurante / Generador</SelectItem>
              <SelectItem value="RECOLECTOR">Empresa Recolectora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="correo" className="text-xs font-semibold text-gray-700">
            Correo electrónico *
          </Label>
          <Input
            id="correo"
            type="email"
            placeholder="contacto@empresa.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={isLoading}
            className="rounded-xl border-gray-200 h-11 focus-visible:ring-green-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telefono" className="text-xs font-semibold text-gray-700">
            Teléfono *
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              +51
            </span>
            <Input
              id="telefono"
              type="text"
              inputMode="numeric"
              value={formatPhoneVisually(telefono)}
              onChange={handlePhoneChange}
              disabled={isLoading}
              className="rounded-xl border-gray-200 h-11 pl-11 focus-visible:ring-green-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contacto" className="text-xs font-semibold text-gray-700">
            Persona de contacto *
          </Label>
          <Input
            id="contacto"
            type="text"
            placeholder="Ej: Carlos Mamani"
            value={nombre}
            onChange={handleNameChange}
            disabled={isLoading}
            className="rounded-xl border-gray-200 h-11 focus-visible:ring-green-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cargo" className="text-xs font-semibold text-gray-700">
            Cargo (opcional)
          </Label>
          <Input
            id="cargo"
            type="text"
            placeholder="Ej: Gerente"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            disabled={isLoading}
            className="rounded-xl border-gray-200 h-11 focus-visible:ring-green-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="referencia" className="text-xs font-semibold text-gray-700">
            Referencia (opcional)
          </Label>
          <Input
            id="referencia"
            type="text"
            placeholder="Ej: Frente al Mercado Central"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            disabled={isLoading}
            className="rounded-xl border-gray-200 h-11 focus-visible:ring-green-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-gray-700">
            Contraseña *
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres, letra y número"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="rounded-xl border-gray-200 h-11 focus-visible:ring-green-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-xs font-semibold text-gray-700">
            Confirmar contraseña *
          </Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Repita la contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="rounded-xl border-gray-200 h-11 focus-visible:ring-green-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-8 font-semibold h-11 rounded-xl shadow-sm transition-colors"
        >
          {isLoading ? "Registrando..." : "Siguiente"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};
