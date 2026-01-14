import { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import { useTheme } from '../../contexts/ThemeContext';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true
}) => {
  const { currentTheme } = useTheme();

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getWidth = () => {
    switch (size) {
      case 'sm': return '400px';
      case 'md': return '500px';
      case 'lg': return '800px';
      case 'xl': return '1000px';
      case 'full': return '95%';
      default: return '500px';
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      backgroundColor: currentTheme.cardBackground || 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      width: '100%',
      maxWidth: getWidth(),
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      color: currentTheme.textPrimary || '#111827'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: `1px solid ${currentTheme.border || '#e5e7eb'}`
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: currentTheme.textPrimary || '#111827',
      margin: 0
    },
    content: {
      padding: '24px',
      overflowY: 'auto',
      maxHeight: 'calc(90vh - 80px)',
      color: currentTheme.textPrimary || '#111827'
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      style={styles.overlay}
      onClick={handleOverlayClick}
    >
      <div style={styles.modal}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div style={styles.header}>
            {title && (
              <h2 style={styles.title}>{title}</h2>
            )}
            {showCloseButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                style={{ padding: '4px', minWidth: 'auto' }}
              >
                <X size={20} />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;