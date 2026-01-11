import React, { createContext, useCallback, useContext, useState } from 'react';
import AlertToast from '../components/ui/AlertToast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    open: false,
    title: '',
    message: '',
    variant: 'info',
    durationMs: 5000
  });

  const showToast = useCallback(({
    title,
    message,
    variant = 'info',
    durationMs = 5000
  }) => {
    setToast({
      open: true,
      title,
      message,
      variant,
      durationMs
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <AlertToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        variant={toast.variant}
        durationMs={toast.durationMs}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}
