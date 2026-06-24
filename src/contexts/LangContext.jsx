'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  nl: {
    machines: 'Machines',
    myParts: 'Mijn onderdelen',
    cart: 'Winkelwagen',
    requests: 'Aanvragen',
    service: 'Service',
    profile: 'Profiel',
    logout: 'Uitloggen',
    serviceForMachine: 'Service voor een machine',
    serviceGeneral: 'Algemene service aanvraag',
    language: 'Taal',
  },
  en: {
    machines: 'Machines',
    myParts: 'My parts',
    cart: 'Cart',
    requests: 'Requests',
    service: 'Service',
    profile: 'Profile',
    logout: 'Log out',
    serviceForMachine: 'Service for a machine',
    serviceGeneral: 'General service request',
    language: 'Language',
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('nl');

  useEffect(() => {
    const saved = localStorage.getItem('synergy_lang');
    if (saved === 'nl' || saved === 'en') setLangState(saved);
  }, []);

  function setLang(code) {
    setLangState(code);
    localStorage.setItem('synergy_lang', code);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang moet binnen LangProvider gebruikt worden');
  return ctx;
}
