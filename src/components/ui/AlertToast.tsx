import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

type ToastVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertToastProps {
  open: boolean;
  variant?: ToastVariant;
  title: string;
  message?: string;
  durationMs?: number; // default 5000
  onClose: () => void;
}

// Usando componentes Lucide React em vez de strings de ícones
const variantStyles: Record<ToastVariant, { barColor: string; borderColor: string; Icon: React.ElementType }> = {
  success: { barColor: '#16a34a', borderColor: '#bbf7d0', Icon: CheckCircle }, // green-600, green-200
  warning: { barColor: '#eab308', borderColor: '#fde047', Icon: AlertTriangle }, // yellow-500, yellow-200
  danger: { barColor: '#dc2626', borderColor: '#fecaca', Icon: XCircle }, // red-600, red-200
  info: { barColor: '#0f172a', borderColor: '#e2e8f0', Icon: Info }, // slate-900, slate-200
};

export default function AlertToast({ open, variant = 'info', title, message, durationMs = 5000, onClose }: AlertToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [open, durationMs, onClose]);

  // Inject keyframes for progress animation if not present
  useEffect(() => {
    if (!document.getElementById('toast-keyframes')) {
      const style = document.createElement('style');
      style.id = 'toast-keyframes';
      style.innerHTML = `
        @keyframes toast-progress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!open) return null;

  // Fallback seguro se variant for inválido
  const safeVariant = variantStyles[variant] ? variant : 'info';
  const { barColor, borderColor, Icon } = variantStyles[safeVariant];

  return (
    <div style={{
      position: 'fixed',
      zIndex: 1000,
      top: '16px',
      right: '16px',
      width: '92vw',
      maxWidth: '380px',
    }}>
      <div style={{
        position: 'relative',
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        backgroundColor: 'white',
        padding: '16px',
        overflow: 'hidden'
      }}>
        {/* Progress Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '4px',
          backgroundColor: barColor,
          animationName: 'toast-progress',
          animationDuration: `${durationMs}ms`,
          animationTimingFunction: 'linear',
          animationFillMode: 'forwards',
          width: '100%'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* Icon (Lucide React) */}
          <Icon size={24} color={barColor} />
          
          <div>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: 900, 
              color: '#0f172a', // slate-900
              margin: 0,
              lineHeight: '1.2'
            }}>
              {title}
            </h4>
            {message && (
              <p style={{ 
                marginTop: '4px', 
                color: '#475569', // slate-600
                fontSize: '14px',
                margin: '4px 0 0 0'
              }}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}