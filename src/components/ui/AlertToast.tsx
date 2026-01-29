import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertToastProps {
  open: boolean;
  variant?: ToastVariant;
  title: string;
  message?: string;
  durationMs?: number; // default 5000
  onClose: () => void;
  style?: React.CSSProperties;
}

// Usando componentes Lucide React em vez de strings de ícones
const variantStyles: Record<ToastVariant, { barColor: string; borderColor: string; Icon: React.ElementType }> = {
  success: { barColor: '#16a34a', borderColor: '#bbf7d0', Icon: CheckCircle }, // green-600, green-200
  warning: { barColor: '#eab308', borderColor: '#fde047', Icon: AlertTriangle }, // yellow-500, yellow-200
  danger: { barColor: '#dc2626', borderColor: '#fecaca', Icon: XCircle }, // red-600, red-200
  info: { barColor: '#0f172a', borderColor: '#e2e8f0', Icon: Info }, // slate-900, slate-200
};

export default function AlertToast({ open, variant = 'info', title, message, durationMs = 5000, onClose, style }: AlertToastProps) {
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

  const defaultStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
    top: '16px',
    right: '16px',
    width: '92vw',
    maxWidth: '380px',
    ...style
  };

  return (
    <div style={defaultStyle}>
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
          <Icon size={24} color={barColor} className="flex-shrink-0" />

          <div style={{ flex: 1 }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: 900,
              color: '#0f172a', // slate-900
              margin: 0,
              lineHeight: '1.2',
              paddingRight: '16px' // Space for close button
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

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}