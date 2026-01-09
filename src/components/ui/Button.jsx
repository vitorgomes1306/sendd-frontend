import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  style = {},
  type = 'button',
  ...props 
}, ref) => {
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#2563eb', // blue-600
          color: 'white',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: '#e5e7eb', // gray-200
          color: '#111827', // gray-900
          border: 'none',
        };
      case 'danger':
        return {
          backgroundColor: '#dc2626', // red-600
          color: 'white',
          border: 'none',
        };
      case 'success':
        return {
          backgroundColor: '#16a34a', // green-600
          color: 'white',
          border: 'none',
        };
      case 'outline':
        return {
          backgroundColor: 'white',
          border: '1px solid #d1d5db', // gray-300
          color: '#374151', // gray-700
        };
      default:
        return {
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: '14px',
        };
      case 'md':
        return {
          padding: '8px 16px',
          fontSize: '14px',
        };
      case 'lg':
        return {
          padding: '12px 24px',
          fontSize: '16px',
        };
      default:
        return {
          padding: '8px 16px',
          fontSize: '14px',
        };
    }
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '8px',
    transition: 'all 0.2s',
    cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
    opacity: (disabled || loading) ? 0.5 : 1,
    outline: 'none',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      style={baseStyles}
      {...props}
    >
      {loading && (
        <Loader2 size={16} className="animate-spin mr-2" style={{ marginRight: '8px' }} />
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;