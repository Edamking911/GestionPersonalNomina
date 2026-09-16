// src/hooks/useDensity.js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'biometrico-density';

export const DENSITIES = [
  { id: 'comfortable', label: 'Cómoda',   icon: '🔍', zoom: 1.0 },
  { id: 'compact',     label: 'Compacta', icon: '🔎', zoom: 0.85 },
  { id: 'ultra',       label: 'Ultra',    icon: '🔬', zoom: 0.75 },
];

export function useDensity() {
  const [density, setDensity] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado && DENSITIES.some((d) => d.id === guardado)) {
        return guardado;
      }
    } catch {}
    return 'compact'; // default recomendado
  });

  // 🔄 Aplicar el zoom al <html> cada vez que cambia
  useEffect(() => {
    const current = DENSITIES.find((d) => d.id === density) || DENSITIES[1];
    document.documentElement.style.zoom = String(current.zoom);
    try {
      localStorage.setItem(STORAGE_KEY, density);
    } catch {}
  }, [density]);

  // ⏭️ Ciclo al siguiente nivel
  const cycleDensity = () => {
    const idx = DENSITIES.findIndex((d) => d.id === density);
    const next = DENSITIES[(idx + 1) % DENSITIES.length];
    setDensity(next.id);
  };

  const current = DENSITIES.find((d) => d.id === density) || DENSITIES[1];

  return { density, setDensity, cycleDensity, current, DENSITIES };
}