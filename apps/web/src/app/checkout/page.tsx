'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  Store,
  Building2,
  Loader2,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart, CartItem } from '@/context/CartContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
interface ContactData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface AddressData {
  street: string;
  number: string;
  floor: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
}

interface ShippingOption {
  available: boolean;
  price: number;
  freeShipping?: boolean;
  freeShippingMin?: number;
  estimatedDays?: string;
  message: string;
  locations?: string[];
}

interface ShippingData {
  method: 'pickup' | 'delivery';
  delivery?: ShippingOption;
  pickup?: ShippingOption;
  cost: number;
}

interface CheckoutFormData {
  contact: ContactData;
  address: AddressData;
  shipping: ShippingData;
  paymentMethod: 'transfer' | 'cash';
  notes: string;
}

interface OrderResponse {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  shipping: number;
  contact: {
    email: string;
    name: string;
    phone: string | null;
  };
  shippingAddress?: AddressData | null;
  items: {
    product: { name: string; sku: string };
    quantity: number;
    price: number;
    total: number;
  }[];
}

const STEPS = [
  { id: 1, title: 'Contacto', icon: User },
  { id: 2, title: 'Direccion', icon: MapPin },
  { id: 3, title: 'Envio', icon: Truck },
  { id: 4, title: 'Pago', icon: CreditCard },
  { id: 5, title: 'Confirmar', icon: CheckCircle },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Stepper component
function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Progreso del checkout" className="mb-8">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <li key={step.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isCompleted ? 'bg-katsuda-700 border-katsuda-700 text-white' : ''}
                    ${isActive ? 'border-katsuda-700 text-katsuda-700 bg-katsuda-50' : ''}
                    ${!isActive && !isCompleted ? 'border-gray-300 text-gray-400 bg-white' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium hidden sm:block
                    ${isActive || isCompleted ? 'text-katsuda-700' : 'text-gray-400'}
                  `}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`
                    absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2
                    ${isCompleted ? 'bg-katsuda-700' : 'bg-gray-200'}
                  `}
                  style={{ left: '55%', width: '90%' }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Order Summary Sidebar
function OrderSummary({
  cart,
  shippingCost,
  paymentMethod,
}: {
  cart: { items: CartItem[]; subtotal: number; transferSubtotal: number; itemCount: number } | null;
  shippingCost: number;
  paymentMethod: 'transfer' | 'cash';
}) {
  if (!cart) return null;

  const subtotal = paymentMethod === 'transfer' ? cart.transferSubtotal : cart.subtotal;
  const total = subtotal + shippingCost;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Resumen del pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                )}
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-katsuda-700 text-white text-xs rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.product.name}</p>
                <p className="text-xs text-gray-500">{item.product.sku}</p>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatPrice(
                  (paymentMethod === 'transfer' && item.product.transferPrice
                    ? item.product.transferPrice
                    : item.product.price) * item.quantity
                )}
              </p>
            </div>
          ))}
        </div>

        <hr />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal ({cart.itemCount} productos)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Envio</span>
            <span>
              {shippingCost === 0 ? (
                <span className="text-katsuda-600 font-medium">Gratis</span>
              ) : (
                formatPrice(shippingCost)
              )}
            </span>
          </div>
          {paymentMethod === 'transfer' && (
            <div className="flex justify-between text-katsuda-600">
              <span>Descuento transferencia</span>
              <span>-{formatPrice(cart.subtotal - cart.transferSubtotal)}</span>
            </div>
          )}
        </div>

        <hr />

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-katsuda-900">{formatPrice(total)}</span>
        </div>

        {paymentMethod === 'transfer' && (
          <p className="text-xs text-katsuda-600 bg-katsuda-50 p-2 rounded">
            Ahorrás {formatPrice(cart.subtotal - cart.transferSubtotal)} pagando con transferencia (9% OFF)
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Step 1: Contact Form
function ContactStep({
  data,
  onChange,
  errors,
}: {
  data: ContactData;
  onChange: (data: ContactData) => void;
  errors: Partial<Record<keyof ContactData, string>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Datos de contacto</h2>
        <p className="text-gray-600 text-sm">
          Ingresá tus datos para que podamos contactarte sobre tu pedido.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Nombre *</Label>
            <Input
              id="firstName"
              placeholder="Juan"
              value={data.firstName}
              onChange={(e) => onChange({ ...data, firstName: e.target.value })}
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">Apellido *</Label>
            <Input
              id="lastName"
              placeholder="Perez"
              value={data.lastName}
              onChange={(e) => onChange({ ...data, lastName: e.target.value })}
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="261 4123456"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
          />
          <p className="text-gray-500 text-xs mt-1">Opcional, pero recomendado para coordinar la entrega</p>
        </div>
      </div>
    </div>
  );
}

// Step 2: Address Form
function AddressStep({
  data,
  onChange,
  errors,
  shippingMethod,
}: {
  data: AddressData;
  onChange: (data: AddressData) => void;
  errors: Partial<Record<keyof AddressData, string>>;
  shippingMethod: 'pickup' | 'delivery';
}) {
  if (shippingMethod === 'pickup') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Retiro en sucursal</h2>
          <p className="text-gray-600 text-sm">
            Seleccionaste retiro en sucursal. No necesitamos tu dirección.
          </p>
        </div>

        <div className="bg-katsuda-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Store className="h-5 w-5 text-katsuda-700 mt-0.5" />
            <div>
              <p className="font-medium text-katsuda-900">Retiro gratis en sucursal</p>
              <p className="text-sm text-gray-600 mt-1">
                Te contactaremos cuando tu pedido esté listo para retirar.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="province">Provincia *</Label>
            <select
              id="province"
              value={data.province}
              onChange={(e) => onChange({ ...data, province: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Seleccionar provincia</option>
              <option value="Mendoza">Mendoza</option>
              <option value="San Juan">San Juan</option>
            </select>
            {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
          </div>
        </div>

        {data.province && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-katsuda-700 mt-0.5" />
                <div>
                  <p className="font-medium">
                    Sucursal {data.province}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.province === 'Mendoza'
                      ? 'Av. Las Heras 343, Ciudad, Mendoza'
                      : 'Av. Rawson 123 Sur, Capital, San Juan'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Lun a Vie: 9:00 - 18:00 | Sáb: 9:00 - 13:00
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Dirección de envío</h2>
        <p className="text-gray-600 text-sm">
          Ingresá la dirección donde querés recibir tu pedido.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label htmlFor="street">Calle *</Label>
            <Input
              id="street"
              placeholder="Av. San Martin"
              value={data.street}
              onChange={(e) => onChange({ ...data, street: e.target.value })}
              className={errors.street ? 'border-red-500' : ''}
            />
            {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
          </div>
          <div>
            <Label htmlFor="number">Número *</Label>
            <Input
              id="number"
              placeholder="1234"
              value={data.number}
              onChange={(e) => onChange({ ...data, number: e.target.value })}
              className={errors.number ? 'border-red-500' : ''}
            />
            {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="floor">Piso</Label>
            <Input
              id="floor"
              placeholder="3"
              value={data.floor}
              onChange={(e) => onChange({ ...data, floor: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="apartment">Depto</Label>
            <Input
              id="apartment"
              placeholder="A"
              value={data.apartment}
              onChange={(e) => onChange({ ...data, apartment: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Ciudad *</Label>
            <Input
              id="city"
              placeholder="Ciudad de Mendoza"
              value={data.city}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>
          <div>
            <Label htmlFor="postalCode">Código postal *</Label>
            <Input
              id="postalCode"
              placeholder="5500"
              value={data.postalCode}
              onChange={(e) => onChange({ ...data, postalCode: e.target.value })}
              className={errors.postalCode ? 'border-red-500' : ''}
            />
            {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="province">Provincia *</Label>
          <select
            id="province"
            value={data.province}
            onChange={(e) => onChange({ ...data, province: e.target.value })}
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.province ? 'border-red-500' : 'border-input'}`}
          >
            <option value="">Seleccionar provincia</option>
            <option value="Mendoza">Mendoza</option>
            <option value="San Juan">San Juan</option>
          </select>
          {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
        </div>
      </div>
    </div>
  );
}

// Step 3: Shipping Method
function ShippingStep({
  data,
  onChange,
  cartTotal,
  postalCode,
}: {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
  cartTotal: number;
  postalCode: string;
}) {
  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<{
    delivery?: ShippingOption;
    pickup?: ShippingOption;
  } | null>(null);

  // Use refs to avoid stale closures in useEffect
  const onChangeRef = useRef(onChange);
  const dataRef = useRef(data);
  onChangeRef.current = onChange;
  dataRef.current = data;

  useEffect(() => {
    if (postalCode && postalCode.length >= 4) {
      setLoading(true);
      fetch(`${API_URL}/api/shipping/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode, cartTotal }),
      })
        .then((r) => r.json())
        .then((result) => {
          if (result.data) {
            setShippingOptions({
              delivery: result.data.delivery,
              pickup: result.data.pickup,
            });
            // Update with actual costs
            const currentData = dataRef.current;
            const selectedCost = currentData.method === 'delivery'
              ? (result.data.delivery?.price || 0)
              : 0;
            onChangeRef.current({
              ...currentData,
              delivery: result.data.delivery,
              pickup: result.data.pickup,
              cost: selectedCost,
            });
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [postalCode, cartTotal]);

  const handleMethodChange = (method: 'pickup' | 'delivery') => {
    const cost = method === 'delivery'
      ? (shippingOptions?.delivery?.price || 0)
      : 0;
    onChange({
      ...data,
      method,
      cost,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Método de envío</h2>
        <p className="text-gray-600 text-sm">
          Elegí cómo querés recibir tu pedido.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-katsuda-700" />
          <span className="ml-2 text-gray-600">Calculando opciones de envío...</span>
        </div>
      ) : (
        <RadioGroup
          value={data.method}
          onValueChange={(value) => handleMethodChange(value as 'pickup' | 'delivery')}
          className="space-y-4"
        >
          {/* Retiro en sucursal */}
          <label
            className={`
              flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
              ${data.method === 'pickup' ? 'border-katsuda-700 bg-katsuda-50' : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-katsuda-700" />
                  <span className="font-medium">Retiro en sucursal</span>
                </div>
                <span className="font-bold text-katsuda-700">Gratis</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Retirá tu pedido en nuestra sucursal cuando esté listo.
              </p>
            </div>
          </label>

          {/* Envío a domicilio */}
          <label
            className={`
              flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
              ${data.method === 'delivery' ? 'border-katsuda-700 bg-katsuda-50' : 'border-gray-200 hover:border-gray-300'}
              ${!shippingOptions?.delivery?.available ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <RadioGroupItem
              value="delivery"
              id="delivery"
              className="mt-1"
              disabled={!shippingOptions?.delivery?.available}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-katsuda-700" />
                  <span className="font-medium">Envío a domicilio</span>
                </div>
                {shippingOptions?.delivery?.available && (
                  <span className="font-bold text-katsuda-700">
                    {shippingOptions.delivery.freeShipping
                      ? 'Gratis'
                      : formatPrice(shippingOptions.delivery.price)}
                  </span>
                )}
              </div>
              {shippingOptions?.delivery?.available ? (
                <>
                  <p className="text-sm text-gray-600 mt-1">
                    {shippingOptions.delivery.message}
                  </p>
                  {shippingOptions.delivery.estimatedDays && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tiempo estimado: {shippingOptions.delivery.estimatedDays} días hábiles
                    </p>
                  )}
                  {!shippingOptions.delivery.freeShipping && shippingOptions.delivery.freeShippingMin && (
                    <p className="text-xs text-katsuda-600 mt-1">
                      Envío gratis en compras mayores a {formatPrice(shippingOptions.delivery.freeShippingMin)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  No realizamos envíos a esta zona.
                </p>
              )}
            </div>
          </label>
        </RadioGroup>
      )}
    </div>
  );
}

// Step 4: Payment Method
function PaymentStep({
  paymentMethod,
  onChange,
  cart,
}: {
  paymentMethod: 'transfer' | 'cash';
  onChange: (method: 'transfer' | 'cash') => void;
  cart: { subtotal: number; transferSubtotal: number } | null;
}) {
  const savings = cart ? cart.subtotal - cart.transferSubtotal : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Método de pago</h2>
        <p className="text-gray-600 text-sm">
          Elegí cómo vas a pagar tu pedido.
        </p>
      </div>

      <RadioGroup
        value={paymentMethod}
        onValueChange={(value) => onChange(value as 'transfer' | 'cash')}
        className="space-y-4"
      >
        {/* Transferencia bancaria */}
        <label
          className={`
            flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
            ${paymentMethod === 'transfer' ? 'border-katsuda-700 bg-katsuda-50' : 'border-gray-200 hover:border-gray-300'}
          `}
        >
          <RadioGroupItem value="transfer" id="transfer" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-katsuda-700" />
                <span className="font-medium">Transferencia bancaria</span>
              </div>
              <span className="bg-katsuda-700 text-white text-xs px-2 py-1 rounded-full">
                9% OFF
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Realizá una transferencia a nuestra cuenta bancaria.
            </p>
            {cart && (
              <p className="text-sm text-katsuda-600 font-medium mt-2">
                Ahorrás {formatPrice(savings)} con este método
              </p>
            )}
          </div>
        </label>

        {/* Efectivo en local */}
        <label
          className={`
            flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
            ${paymentMethod === 'cash' ? 'border-katsuda-700 bg-katsuda-50' : 'border-gray-200 hover:border-gray-300'}
          `}
        >
          <RadioGroupItem value="cash" id="cash" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-katsuda-700" />
              <span className="font-medium">Efectivo en local</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Pagá en efectivo al retirar o recibir tu pedido.
            </p>
          </div>
        </label>
      </RadioGroup>

      {paymentMethod === 'transfer' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Datos para transferencia</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Banco:</strong> Banco Nación</p>
              <p><strong>CBU:</strong> 0110012340012345678901</p>
              <p><strong>Alias:</strong> KATSUDA.GRIFERIAS</p>
              <p><strong>Titular:</strong> Katsuda Distribuidora S.A.</p>
              <p><strong>CUIT:</strong> 30-12345678-9</p>
            </div>
            <p className="text-xs text-blue-700 mt-3">
              Una vez confirmado el pago, procesaremos tu pedido. Envianos el comprobante por WhatsApp para agilizar el proceso.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Step 5: Confirmation
function ConfirmationStep({
  formData,
  cart,
}: {
  formData: CheckoutFormData;
  cart: { items: CartItem[]; subtotal: number; transferSubtotal: number } | null;
}) {
  if (!cart) return null;

  const subtotal = formData.paymentMethod === 'transfer' ? cart.transferSubtotal : cart.subtotal;
  const total = subtotal + formData.shipping.cost;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Confirmar pedido</h2>
        <p className="text-gray-600 text-sm">
          Revisá los datos de tu pedido antes de confirmarlo.
        </p>
      </div>

      <div className="space-y-4">
        {/* Contact */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Datos de contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4 text-sm text-gray-600">
            <p><strong>{formData.contact.firstName} {formData.contact.lastName}</strong></p>
            <p>{formData.contact.email}</p>
            {formData.contact.phone && <p>{formData.contact.phone}</p>}
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {formData.shipping.method === 'pickup' ? 'Retiro en sucursal' : 'Envío a domicilio'}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4 text-sm text-gray-600">
            {formData.shipping.method === 'pickup' ? (
              <p>
                Sucursal {formData.address.province} - {formData.address.province === 'Mendoza'
                  ? 'Av. Las Heras 343'
                  : 'Av. Rawson 123 Sur'}
              </p>
            ) : (
              <>
                <p>{formData.address.street} {formData.address.number}</p>
                {(formData.address.floor || formData.address.apartment) && (
                  <p>Piso {formData.address.floor}, Depto {formData.address.apartment}</p>
                )}
                <p>{formData.address.city}, {formData.address.province}</p>
                <p>CP: {formData.address.postalCode}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Método de pago
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4 text-sm text-gray-600">
            <p>
              {formData.paymentMethod === 'transfer'
                ? 'Transferencia bancaria (9% OFF)'
                : 'Efectivo en local'}
            </p>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos ({cart.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            <div className="space-y-2">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-medium">
                    {formatPrice(
                      (formData.paymentMethod === 'transfer' && item.product.transferPrice
                        ? item.product.transferPrice
                        : item.product.price) * item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>
            <hr className="my-3" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span>{formData.shipping.cost === 0 ? 'Gratis' : formatPrice(formData.shipping.cost)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span className="text-katsuda-900">{formatPrice(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Success page after order
function OrderSuccess({ order }: { order: OrderResponse }) {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-katsuda-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-katsuda-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Pedido confirmado!
          </h1>
          <p className="text-gray-600">
            Gracias por tu compra. Te enviamos un email con los detalles.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Número de pedido</p>
              <p className="text-2xl font-bold text-katsuda-900">{order.orderNumber}</p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                  Pendiente de pago
                </span>
              </div>

              <hr />

              <div>
                <p className="font-medium mb-2">Productos</p>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-1">
                    <span className="text-gray-600">{item.quantity}x {item.product.name}</span>
                    <span>{formatPrice(Number(item.total))}</span>
                  </div>
                ))}
              </div>

              <hr />

              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span>{Number(order.shipping) === 0 ? 'Gratis' : formatPrice(Number(order.shipping))}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-katsuda-900">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.paymentMethod === 'transfer' && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 mb-2">Datos para transferencia</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Banco:</strong> Banco Nación</p>
                <p><strong>CBU:</strong> 0110012340012345678901</p>
                <p><strong>Alias:</strong> KATSUDA.GRIFERIAS</p>
                <p><strong>Titular:</strong> Katsuda Distribuidora S.A.</p>
              </div>
              <p className="text-xs text-blue-700 mt-3">
                Enviá el comprobante por WhatsApp al 261-4XXXXXX para confirmar tu pago.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">Volver al inicio</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/productos">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main checkout page
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading, clearCart, getSessionId } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CheckoutFormData>({
    contact: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
    address: {
      street: '',
      number: '',
      floor: '',
      apartment: '',
      city: '',
      province: '',
      postalCode: '',
    },
    shipping: {
      method: 'pickup',
      cost: 0,
    },
    paymentMethod: 'transfer',
    notes: '',
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0) && !order) {
      router.push('/carrito');
    }
  }, [cart, loading, router, order]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.contact.email) newErrors.email = 'El email es requerido';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
        newErrors.email = 'Email inválido';
      }
      if (!formData.contact.firstName) newErrors.firstName = 'El nombre es requerido';
      if (!formData.contact.lastName) newErrors.lastName = 'El apellido es requerido';
    }

    if (step === 2) {
      if (!formData.address.province) newErrors.province = 'La provincia es requerida';

      if (formData.shipping.method === 'delivery') {
        if (!formData.address.street) newErrors.street = 'La calle es requerida';
        if (!formData.address.number) newErrors.number = 'El número es requerido';
        if (!formData.address.city) newErrors.city = 'La ciudad es requerida';
        if (!formData.address.postalCode) newErrors.postalCode = 'El código postal es requerido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!cart) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const sessionId = getSessionId();
      const response = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          email: formData.contact.email,
          firstName: formData.contact.firstName,
          lastName: formData.contact.lastName,
          phone: formData.contact.phone,
          street: formData.address.street,
          number: formData.address.number,
          floor: formData.address.floor,
          apartment: formData.address.apartment,
          city: formData.address.city,
          province: formData.address.province,
          postalCode: formData.address.postalCode,
          shippingMethod: formData.shipping.method,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el pedido');
      }

      setOrder(result.data);
      clearCart();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error al procesar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  // Show success page if order was created
  if (order) {
    return <OrderSuccess order={order} />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-katsuda-700" />
      </div>
    );
  }

  // Empty cart redirect handled by useEffect
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">Tu carrito está vacío</p>
          <Button asChild className="mt-4">
            <Link href="/productos">Ver productos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back to cart */}
        <Link
          href="/carrito"
          className="inline-flex items-center text-gray-600 hover:text-katsuda-700 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Volver al carrito
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

        <Stepper currentStep={currentStep} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {currentStep === 1 && (
                  <ContactStep
                    data={formData.contact}
                    onChange={(contact) => setFormData({ ...formData, contact })}
                    errors={errors as Partial<Record<keyof ContactData, string>>}
                  />
                )}

                {currentStep === 2 && (
                  <AddressStep
                    data={formData.address}
                    onChange={(address) => setFormData({ ...formData, address })}
                    errors={errors as Partial<Record<keyof AddressData, string>>}
                    shippingMethod={formData.shipping.method}
                  />
                )}

                {currentStep === 3 && (
                  <ShippingStep
                    data={formData.shipping}
                    onChange={(shipping) => setFormData({ ...formData, shipping })}
                    cartTotal={formData.paymentMethod === 'transfer' ? cart.transferSubtotal : cart.subtotal}
                    postalCode={formData.address.postalCode}
                  />
                )}

                {currentStep === 4 && (
                  <PaymentStep
                    paymentMethod={formData.paymentMethod}
                    onChange={(paymentMethod) => setFormData({ ...formData, paymentMethod })}
                    cart={cart}
                  />
                )}

                {currentStep === 5 && (
                  <ConfirmationStep formData={formData} cart={cart} />
                )}

                {submitError && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {submitError}
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={currentStep === 1 ? 'invisible' : ''}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  {currentStep < 5 ? (
                    <Button onClick={handleNext}>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-katsuda-700 hover:bg-katsuda-800"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmar pedido
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              cart={cart}
              shippingCost={formData.shipping.cost}
              paymentMethod={formData.paymentMethod}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
