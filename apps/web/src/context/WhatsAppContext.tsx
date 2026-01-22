'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProductInfo {
  name: string;
  sku: string;
}

interface WhatsAppContextType {
  productInfo: ProductInfo | null;
  setProductInfo: (info: ProductInfo | null) => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);

  return (
    <WhatsAppContext.Provider value={{ productInfo, setProductInfo }}>
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsApp() {
  const context = useContext(WhatsAppContext);
  if (context === undefined) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
}
