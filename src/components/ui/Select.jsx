import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './Select.css';

const Select = ({
    value,
    onChange,
    options = [],
    placeholder = "Selecione...",
    label,
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue) => {
        if (onChange) {
            onChange({ target: { value: optionValue } }); // Mimic native event structure for compatibility
        }
        setIsOpen(false);
    };

    return (
        <div className={`custom-select-container ${className}`} ref={containerRef}>
            {label && <label className="block text-sm font-medium mb-1" style={{ color: 'var(--chat-text-secondary)' }}>{label}</label>}
            <div
                className={`custom-select-trigger ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    {selectedOption ? (
                        <>
                            {selectedOption.icon && <span className="option-icon flex-shrink-0">{selectedOption.icon}</span>}
                            <span className={selectedOption.className?.includes('text-') ? '' : ''}>{selectedOption.label}</span>
                        </>
                    ) : (
                        <span className="custom-select-placeholder" style={{ color: 'var(--chat-text-secondary)', opacity: 0.7 }}>{placeholder}</span>
                    )}
                </span>
                <ChevronDown size={16} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--chat-text-secondary)' }} />
            </div>

            {isOpen && (
                <div className="custom-select-dropdown">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`custom-select-option ${option.className || ''} ${value === option.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.icon && <span className="option-icon flex-shrink-0">{option.icon}</span>}
                            <span className="option-label flex-grow">{option.label}</span>
                            {value === option.value && <Check size={16} className="ml-auto" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Select;
