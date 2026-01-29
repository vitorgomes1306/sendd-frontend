import React, { createContext, useCallback, useContext, useState } from 'react';
import AlertToast from '../components/ui/AlertToast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({
    title,
    message,
    variant = 'info',
    durationMs = 5000
  }) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, {
      id,
      title,
      message,
      variant,
      durationMs
    }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div style={{
        position: 'fixed',
        zIndex: 9999, // Ensure it's on top of everything
        top: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-end',
        pointerEvents: 'none' // Let clicks pass through empty space
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <AlertToast
              open={true}
              title={toast.title}
              message={toast.message}
              variant={toast.variant}
              durationMs={toast.durationMs}
              onClose={() => removeToast(toast.id)}
              style={{
                position: 'relative', // Override fixed positioning
                top: 'auto',
                right: 'auto',
                width: '320px', // Standard width in stack
                maxWidth: '92vw'
              }}
            />
          </div>
        ))}
      </div>
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
