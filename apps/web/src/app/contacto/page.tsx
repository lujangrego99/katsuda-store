import { Metadata } from 'next';
import ContactClientPage from './ContactClient';

export const metadata: Metadata = {
  title: 'Contacto - Sucursales Mendoza y San Juan',
  description: 'Contactanos por teléfono, email o WhatsApp. Sucursales en Mendoza y San Juan. Horarios de atención: Lunes a Viernes 8:00 - 18:00, Sábados 9:00 - 13:00.',
  openGraph: {
    title: 'Contacto | Katsuda',
    description: 'Contactanos por teléfono, email o WhatsApp. Sucursales en Mendoza y San Juan.',
  },
};

export default function ContactoPage() {
  return <ContactClientPage />;
}
