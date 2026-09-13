// src/hooks/useToast.js
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState({
    message: '',
    type: 'info',
    key: 0,
  });

  const showToast = useCallback((message, type = 'info') => {
    setToast((prev) => ({
      message,
      type,
      key: prev.key + 1, // fuerza re-render aunque sea el mismo mensaje
    }));
  }, []);

  const clearToast = useCallback(() => {
    setToast((prev) => ({ ...prev, message: '' }));
  }, []);

  return { toast, showToast, clearToast };
}