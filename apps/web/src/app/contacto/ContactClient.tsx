'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Settings {
  storeName: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: {
    mendoza?: {
      street: string;
      city: string;
      phone: string;
    };
    sanJuan?: {
      street: string;
      city: string;
      phone: string;
    };
  } | null;
  schedules: {
    weekdays?: string;
    saturday?: string;
  } | null;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  province: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  captcha?: string;
}

// Simple math captcha
function generateCaptcha(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `¿Cuánto es ${a} + ${b}?`, answer: a + b };
}

export default function ContactClientPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    province: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then((r) => r.json())
      .then((data) => setSettings(data.data))
      .catch(console.error);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'El formato del teléfono no es válido';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es requerido';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'El mensaje debe tener al menos 10 caracteres';
    }

    if (!captchaInput.trim()) {
      newErrors.captcha = 'Por favor complete la verificación';
    } else if (parseInt(captchaInput, 10) !== captcha.answer) {
      newErrors.captcha = 'La respuesta es incorrecta';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          captchaAnswer: captchaInput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      setSent(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        province: '',
        subject: '',
        message: '',
      });
      setCaptchaInput('');
      setCaptcha(generateCaptcha());
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Error al enviar el mensaje'
      );
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleProvinceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, province: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-katsuda-700">
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-katsuda-900 font-medium">Contacto</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-katsuda-900 via-katsuda-800 to-katsuda-700 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contactanos</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Estamos para ayudarte. Envianos tu consulta y te responderemos a la
            brevedad.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Envianos tu consulta
              </h2>

              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    ¡Mensaje enviado!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Gracias por contactarnos. Te responderemos a la brevedad.
                  </p>
                  <Button
                    onClick={() => setSent(false)}
                    variant="outline"
                    className="border-katsuda-700 text-katsuda-700 hover:bg-katsuda-50"
                  >
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-sm">{submitError}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Nombre completo <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Juan Pérez"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="juan@ejemplo.com"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="261 555-1234"
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm">{errors.phone}</p>
                      )}
                    </div>

                    {/* Province */}
                    <div className="space-y-2">
                      <Label htmlFor="province">Provincia</Label>
                      <Select
                        value={formData.province}
                        onValueChange={handleProvinceChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu provincia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mendoza">Mendoza</SelectItem>
                          <SelectItem value="san_juan">San Juan</SelectItem>
                          <SelectItem value="otra">Otra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Asunto</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="¿En qué podemos ayudarte?"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Mensaje <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Escribí tu consulta..."
                      rows={5}
                      className={errors.message ? 'border-red-500' : ''}
                    />
                    {errors.message && (
                      <p className="text-red-500 text-sm">{errors.message}</p>
                    )}
                  </div>

                  {/* Captcha */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-gray-700 mb-2 block">
                      Verificación de seguridad{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-900 font-medium">
                        {captcha.question}
                      </span>
                      <Input
                        type="number"
                        value={captchaInput}
                        onChange={(e) => {
                          setCaptchaInput(e.target.value);
                          if (errors.captcha) {
                            setErrors((prev) => ({
                              ...prev,
                              captcha: undefined,
                            }));
                          }
                        }}
                        placeholder="?"
                        className={`w-24 ${errors.captcha ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCaptcha(generateCaptcha());
                          setCaptchaInput('');
                        }}
                        className="text-sm text-katsuda-700 hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                    {errors.captcha && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.captcha}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-katsuda-700 hover:bg-katsuda-800 text-white py-3"
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Enviar mensaje
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            {/* Sucursal Mendoza */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-katsuda-700" />
                Sucursal Mendoza
              </h3>
              <div className="space-y-3 text-gray-600">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-gray-400" />
                  <span>
                    {settings?.address?.mendoza?.street ||
                      'Av. San Martín 1234, Ciudad'}
                    <br />
                    {settings?.address?.mendoza?.city || 'Mendoza'}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <a
                    href={`tel:${settings?.address?.mendoza?.phone || settings?.phone || '261-4234567'}`}
                    className="hover:text-katsuda-700"
                  >
                    {settings?.address?.mendoza?.phone ||
                      settings?.phone ||
                      '(261) 423-4567'}
                  </a>
                </p>
              </div>
            </div>

            {/* Sucursal San Juan */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-katsuda-700" />
                Sucursal San Juan
              </h3>
              <div className="space-y-3 text-gray-600">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-gray-400" />
                  <span>
                    {settings?.address?.sanJuan?.street ||
                      'Calle Laprida 567, Capital'}
                    <br />
                    {settings?.address?.sanJuan?.city || 'San Juan'}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <a
                    href={`tel:${settings?.address?.sanJuan?.phone || '264-4221234'}`}
                    className="hover:text-katsuda-700"
                  >
                    {settings?.address?.sanJuan?.phone || '(264) 422-1234'}
                  </a>
                </p>
              </div>
            </div>

            {/* Horarios */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-katsuda-700" />
                Horarios de atención
              </h3>
              <div className="space-y-2 text-gray-600">
                <p className="flex justify-between">
                  <span className="font-medium">Lunes a Viernes</span>
                  <span>{settings?.schedules?.weekdays || '8:00 - 18:00'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">Sábados</span>
                  <span>{settings?.schedules?.saturday || '9:00 - 13:00'}</span>
                </p>
                <p className="flex justify-between text-gray-400">
                  <span className="font-medium">Domingos</span>
                  <span>Cerrado</span>
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-katsuda-700" />
                Email
              </h3>
              <a
                href={`mailto:${settings?.email || 'ventas@katsuda.com.ar'}`}
                className="text-katsuda-700 hover:underline"
              >
                {settings?.email || 'ventas@katsuda.com.ar'}
              </a>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
              <h3 className="text-lg font-bold mb-2">¿Preferís WhatsApp?</h3>
              <p className="text-white/90 text-sm mb-4">
                Escribinos directamente y te respondemos al instante.
              </p>
              <a
                href={`https://wa.me/${(settings?.whatsapp || '5492614567890').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola! Quiero hacer una consulta')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Chatea con nosotros
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
