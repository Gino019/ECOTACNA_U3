import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ContactUpdateRequest } from "@/types";

interface ContactoFormProps {
  initialData: {
    personaContacto?: string;
    correo?: string;
    telefono?: string;
  };
  onSave: (data: ContactUpdateRequest) => Promise<{ success: boolean; message?: string }>;
  onSuccess: (updatedProfile: Record<string, any>) => void;
}

const contactNameRegex = /^(?!.*\s{2,})(?!.*\.{2,})(?![.\-'\s])(?!.*[.\-'\s]$)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ .'-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const phoneRegex = /^9\d{8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactoForm({ initialData, onSave, onSuccess }: ContactoFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    contactPerson: initialData.personaContacto || "",
    email: initialData.correo || "",
    phone: initialData.telefono || "",
  });

  const [errors, setErrors] = useState({
    contactPerson: "",
    email: "",
    phone: "",
  });

  const validate = () => {
    let isValid = true;
    const newErrors = { contactPerson: "", email: "", phone: "" };

    if (!contactNameRegex.test(formData.contactPerson)) {
      newErrors.contactPerson = "Ingrese un nombre de contacto válido. Use solo letras, espacios, punto, guion o apóstrofo.";
      isValid = false;
    }

    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Ingrese un correo electrónico válido.";
      isValid = false;
    }

    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Ingrese un celular peruano válido de 9 dígitos que empiece con 9.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    try {
      const result = await onSave(formData);
      if (result.success) {
        setIsEditing(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Ocurrió un error al guardar los datos.",
        });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || "No se pudo actualizar el contacto.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      contactPerson: initialData.personaContacto || "",
      email: initialData.correo || "",
      phone: initialData.telefono || "",
    });
    setErrors({ contactPerson: "", email: "", phone: "" });
    setIsEditing(false);
  };

  const formatPhoneVisual = (phone: string) => {
    if (!phone) return "";
    const clean = phone.replace(/\D/g, '').substring(0, 9);
    const groups = clean.match(/(\d{1,3})/g);
    return groups ? groups.join(" ") : clean;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '').substring(0, 9);
    setFormData({ ...formData, phone: clean });
    if (errors.phone) setErrors({ ...errors, phone: "" });
  };

  return (
    <Card className="p-5 mt-6 border-primary/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-bold text-lg">Datos de contacto</h3>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Editar datos de contacto
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label>Persona de contacto</Label>
          <Input 
            value={isEditing ? formData.contactPerson : initialData.personaContacto || "No registrado"} 
            onChange={(e) => {
              setFormData({ ...formData, contactPerson: e.target.value });
              if (errors.contactPerson) setErrors({ ...errors, contactPerson: "" });
            }}
            readOnly={!isEditing}
            className={isEditing && errors.contactPerson ? "border-destructive" : ""}
            placeholder="Ej. Juan Pérez"
          />
          {isEditing && errors.contactPerson && <p className="text-destructive text-xs mt-1">{errors.contactPerson}</p>}
        </div>

        <div>
          <Label>Correo electrónico</Label>
          <Input 
            value={isEditing ? formData.email : initialData.correo || "No registrado"} 
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
            readOnly={!isEditing}
            type={isEditing ? "email" : "text"}
            className={isEditing && errors.email ? "border-destructive" : ""}
            placeholder="ejemplo@empresa.com"
          />
          {isEditing && errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label>Teléfono</Label>
          <div className="flex gap-2">
            <Input value="+51" readOnly className="w-16 bg-muted text-center" disabled={!isEditing && !initialData.telefono} />
            <Input 
              value={isEditing ? formData.phone : formatPhoneVisual(initialData.telefono || "")} 
              onChange={handlePhoneChange}
              readOnly={!isEditing}
              className={`flex-1 ${isEditing && errors.phone ? "border-destructive" : ""}`}
              placeholder="Ej. 912345678"
            />
          </div>
          {isEditing && errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar cambios"}</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
